"use client";

import { useEffect, useRef } from "react";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ViewerHud } from "@/components/viewer/ViewerHud";
import type {
  CompassState,
  JoystickVector,
  PlacementObjectDetail,
} from "@/components/viewer/types";
import {
  ASSET_ITEM_TRANSFER_TYPE,
  COLLISION_ASSET_URL,
  COLLISION_MESH_ROTATION,
  INITIAL_RENDER_WARMUP_DELAY_MS,
  INITIAL_RENDER_WARMUP_PASSES,
  POSITIONAL_AUDIO_SOURCES,
  SAMPLE_OBJECT_TRANSFER_TYPE,
  SPARK_ASSET_URL,
} from "@/components/viewer/sceneConstants";
import {
  collectCollisionMeshes,
  collidesWithRoom,
  createAudioMarker,
  createPlacedAssetPlaceholder,
  createPlacedGlbAsset,
  createPlacedObject,
  disposeObject3D,
  getObjectDetail,
  getObjectPopupAnchor,
  getWorldBoundingBox,
  prepareStartingView,
  projectWorldPointToScreen,
  setObjectInteractionMode,
  setObjectSelected,
  shouldShowObjectDetail,
  toCompassState,
} from "@/components/viewer/sceneHelpers";
import { useViewerUiStore } from "@/stores/viewerUiStore";
import type {
  AssetItem,
  InputState,
  MovementControlKey,
  OrientationState,
  SparkSceneProps,
  ViewerLoadingState,
} from "@/components/viewer/sceneTypes";

export type { ViewerLoadingState } from "@/components/viewer/sceneTypes";

export function SparkScene({
  onLoadingStateChange,
  soundEnabled = false,
  showCollisionMesh = false,
}: SparkSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const collisionRoomRef = useRef<THREE.Object3D | null>(null);
  const positionalAudioRef = useRef<THREE.PositionalAudio[]>([]);
  const worldBoundsRef = useRef<THREE.Box3 | null>(null);
  const placementLayerRef = useRef<THREE.Group | null>(null);
  const placementPlaneYRef = useRef(0);
  const requestRenderRef = useRef<() => void>(() => {});
  const inputStateRef = useRef<InputState>({
    forward: false,
    back: false,
    left: false,
    right: false,
    up: false,
    down: false,
    faster: false,
  });
  const movementJoystickRef = useRef<JoystickVector>({ x: 0, y: 0 });
  const raycasterRef = useRef(new THREE.Raycaster());
  const showCollisionMeshRef = useRef(false);
  const loadingPhaseRankRef = useRef(0);
  const selectedObjectRef = useRef<THREE.Object3D | null>(null);
  const setCompass = useViewerUiStore((state) => state.setCompass);
  const setDetailPopup = useViewerUiStore((state) => state.setDetailPopup);
  const setDropHint = useViewerUiStore((state) => state.setDropHint);
  const setIsDraggingOver = useViewerUiStore((state) => state.setIsDraggingOver);
  const setJoystickOffset = useViewerUiStore((state) => state.setJoystickOffset);
  const setStatus = useViewerUiStore((state) => state.setStatus);
  const resetViewerUi = useViewerUiStore((state) => state.reset);

  useEffect(() => {
    showCollisionMeshRef.current = showCollisionMesh;
    const collisionRoom = collisionRoomRef.current;
    if (!collisionRoom) {
      return;
    }

    collisionRoom.visible = showCollisionMesh;
    requestRenderRef.current();
  }, [showCollisionMesh]);

  useEffect(() => {
    for (const audio of positionalAudioRef.current) {
      if (soundEnabled) {
        if (!audio.isPlaying && audio.buffer) {
          audio.play();
        }
      } else if (audio.isPlaying) {
        audio.pause();
      }
    }
  }, [soundEnabled]);

  const reportLoadingState = (state: ViewerLoadingState) => {
    const nextRank = state.active ? (state.mode === "progress" ? 1 : 2) : 3;
    const currentRank = loadingPhaseRankRef.current;

    if (nextRank < currentRank) {
      return;
    }

    loadingPhaseRankRef.current = nextRank;
    onLoadingStateChange?.({
      ...state,
      progress: THREE.MathUtils.clamp(Math.round(state.progress), 0, 100),
    });
  };

  const setMovementControl = (key: MovementControlKey, active: boolean) => {
    inputStateRef.current[key] = active;
    requestRenderRef.current();
  };

  const endMovementControl = (key: MovementControlKey) => {
    setMovementControl(key, false);
  };

  const setMovementJoystick = (next: JoystickVector) => {
    movementJoystickRef.current = next;
    setJoystickOffset(next);
    requestRenderRef.current();
  };

  const resetMovementJoystick = () => {
    setMovementJoystick({ x: 0, y: 0 });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#08111e");

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    cameraRef.current = camera;
    const audioListener = new THREE.AudioListener();
    camera.add(audioListener);

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(1);
    renderer.setSize(width, height);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.cursor = "grab";
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight("#ffffff", 0.9));
    const keyLight = new THREE.DirectionalLight("#ffffff", 0.8);
    keyLight.position.set(5, 9, 3);
    scene.add(keyLight);

    const placementLayer = new THREE.Group();
    placementLayerRef.current = placementLayer;
    scene.add(placementLayer);

    const input = inputStateRef.current;
    input.forward = false;
    input.back = false;
    input.left = false;
    input.right = false;
    input.up = false;
    input.down = false;
    input.faster = false;

    const orientation: OrientationState = {
      yaw: 0,
      pitch: 0,
    };

    const euler = new THREE.Euler(0, 0, 0, "YXZ");
    const forwardVector = new THREE.Vector3();
    const rightVector = new THREE.Vector3();
    const movement = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const lookTarget = new THREE.Vector3();
    const clock = new THREE.Clock();
    const lookSensitivity = 0.0032;

    let moveSpeed = 1;
    let lookRadius = 1;
    let dragging = false;
    let movingSelectedObject = false;
    let pendingObjectSelection: THREE.Object3D | null = null;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let pointerDownX = 0;
    let pointerDownY = 0;
    let renderRequested = true;
    let disposed = false;
    let splatMesh: SplatMesh | null = null;
    let collisionRoom: THREE.Object3D | null = null;
    let collisionMeshes: THREE.Mesh[] = [];
    const audioObjects: THREE.Object3D[] = [];
    const dragThresholdPx = 6;
    const onPointerLeave = () => {
      if (dragging) {
        renderer.domElement.style.cursor = "grab";
      }
    };

    const requestRender = () => {
      renderRequested = true;
    };
    requestRenderRef.current = requestRender;

    const sparkRenderer = new SparkRenderer({
      renderer,
      onDirty: requestRender,
    });
    scene.add(sparkRenderer);

    const getPointerOnPlacementPlane = (clientX: number, clientY: number) => {
      const containerBounds = container.getBoundingClientRect();
      if (containerBounds.width <= 0 || containerBounds.height <= 0) {
        return null;
      }

      const pointer = new THREE.Vector2(
        ((clientX - containerBounds.left) / containerBounds.width) * 2 - 1,
        -((clientY - containerBounds.top) / containerBounds.height) * 2 + 1,
      );
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -placementPlaneYRef.current);
      const hitPoint = new THREE.Vector3();
      raycasterRef.current.setFromCamera(pointer, camera);

      if (!raycasterRef.current.ray.intersectPlane(plane, hitPoint)) {
        return null;
      }

      return hitPoint;
    };

    const findPlacedObjectAtPointer = (clientX: number, clientY: number) => {
      const containerBounds = container.getBoundingClientRect();
      if (containerBounds.width <= 0 || containerBounds.height <= 0) {
        return null;
      }

      const pointer = new THREE.Vector2(
        ((clientX - containerBounds.left) / containerBounds.width) * 2 - 1,
        -((clientY - containerBounds.top) / containerBounds.height) * 2 + 1,
      );
      raycasterRef.current.setFromCamera(pointer, camera);
      const intersections = raycasterRef.current.intersectObjects(placementLayer.children, true);

      for (const intersection of intersections) {
        let current: THREE.Object3D | null = intersection.object;
        while (current && current.parent !== placementLayer) {
          current = current.parent;
        }
        if (current?.userData.selectable) {
          return current;
        }
      }

      return null;
    };

    const applyOrientation = () => {
      orientation.pitch = THREE.MathUtils.clamp(
        orientation.pitch,
        -Math.PI / 2 + 0.01,
        Math.PI / 2 - 0.01,
      );
      direction
        .set(
          Math.sin(orientation.yaw) * Math.cos(orientation.pitch),
          Math.sin(orientation.pitch),
          -Math.cos(orientation.yaw) * Math.cos(orientation.pitch),
        )
        .normalize();
      lookTarget.copy(camera.position).addScaledVector(direction, lookRadius);
      euler.set(orientation.pitch, orientation.yaw, 0);
      camera.quaternion.setFromEuler(euler);
      camera.lookAt(lookTarget);
      const nextCompass = toCompassState(direction);
      setCompass((current) => {
        if (
          current.heading === nextCompass.heading &&
          Math.abs(current.pitchDeg - nextCompass.pitchDeg) < 0.5 &&
          Math.abs(current.rotationDeg - nextCompass.rotationDeg) < 0.5
        ) {
          return current;
        }

        return nextCompass;
      });
    };

    const renderFrame = () => {
      renderer.render(scene, camera);
    };

    const updateDetailPopup = () => {
      const selectedObject = selectedObjectRef.current;
      if (!container || !camera || !shouldShowObjectDetail(selectedObject)) {
        setDetailPopup((current) => (current ? null : current));
        return;
      }
      if (!selectedObject) {
        setDetailPopup((current) => (current ? null : current));
        return;
      }

      const detail = getObjectDetail(selectedObject);
      if (!detail) {
        setDetailPopup((current) => (current ? null : current));
        return;
      }

      const projected = projectWorldPointToScreen(
        getObjectPopupAnchor(selectedObject),
        camera,
        container,
      );

      if (!projected) {
        setDetailPopup((current) => (current ? null : current));
        return;
      }

      setDetailPopup((current) => {
        if (
          current &&
          current.detail === detail &&
          Math.abs(current.screenX - projected.screenX) < 0.5 &&
          Math.abs(current.screenY - projected.screenY) < 0.5
        ) {
          return current;
        }

        return {
          detail,
          screenX: projected.screenX,
          screenY: projected.screenY,
        };
      });
    };

    const onResize = () => {
      const nextWidth = container.clientWidth;
      const nextHeight = container.clientHeight;

      if (nextWidth <= 0 || nextHeight <= 0) {
        return;
      }

      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
      requestRender();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }

      const hitPlacedObject = findPlacedObjectAtPointer(event.clientX, event.clientY);
      if (hitPlacedObject) {
        setObjectSelected(selectedObjectRef.current, false);
        setObjectInteractionMode(selectedObjectRef.current, "idle");
        selectedObjectRef.current = hitPlacedObject;
        setObjectSelected(hitPlacedObject, true);
        setObjectInteractionMode(hitPlacedObject, "selected");
        pendingObjectSelection = hitPlacedObject;
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
        pointerDownX = event.clientX;
        pointerDownY = event.clientY;
        renderer.domElement.style.cursor = "move";
        renderer.domElement.setPointerCapture(event.pointerId);
        requestRender();
        setStatus("オブジェクトを選択しました");
        setDropHint("選択中: クリックで詳細表示 / ドラッグで移動 / Shift+ドラッグ or [ ] で回転");
        return;
      }

      if (selectedObjectRef.current) {
        setObjectSelected(selectedObjectRef.current, false);
        setObjectInteractionMode(selectedObjectRef.current, "idle");
        selectedObjectRef.current = null;
        requestRender();
      }

      dragging = true;
      pendingObjectSelection = null;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      pointerDownX = event.clientX;
      pointerDownY = event.clientY;
      renderer.domElement.style.cursor = "grabbing";
      renderer.domElement.setPointerCapture(event.pointerId);
      requestRender();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pendingObjectSelection && !movingSelectedObject) {
        const movedBeyondThreshold =
          Math.abs(event.clientX - pointerDownX) > dragThresholdPx ||
          Math.abs(event.clientY - pointerDownY) > dragThresholdPx;

        if (movedBeyondThreshold) {
          movingSelectedObject = true;
          setObjectInteractionMode(pendingObjectSelection, event.shiftKey ? "rotating" : "moving");
          setDetailPopup(null);
        }
      }

      if (movingSelectedObject) {
        const selectedObject = selectedObjectRef.current;
        const worldBounds = worldBoundsRef.current;
        const deltaX = event.clientX - lastPointerX;
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;

        if (!selectedObject) {
          return;
        }

        if (event.shiftKey) {
          setObjectInteractionMode(selectedObject, "rotating");
          selectedObject.rotation.y += deltaX * 0.01;
          requestRender();
          return;
        }

        setObjectInteractionMode(selectedObject, "moving");
        const hitPoint = getPointerOnPlacementPlane(event.clientX, event.clientY);

        if (!worldBounds || !hitPoint) {
          return;
        }

        hitPoint.x = THREE.MathUtils.clamp(
          hitPoint.x,
          worldBounds.min.x + 0.35,
          worldBounds.max.x - 0.35,
        );
        hitPoint.z = THREE.MathUtils.clamp(
          hitPoint.z,
          worldBounds.min.z + 0.35,
          worldBounds.max.z - 0.35,
        );
        hitPoint.y = placementPlaneYRef.current;
        selectedObject.position.copy(hitPoint);
        requestRender();
        return;
      }

      if (!dragging) {
        return;
      }

      const deltaX = event.clientX - lastPointerX;
      const deltaY = event.clientY - lastPointerY;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;

      orientation.yaw -= deltaX * lookSensitivity;
      orientation.pitch += deltaY * lookSensitivity;
      applyOrientation();
      requestRender();
    };

    const endDrag = (event: PointerEvent) => {
      if (movingSelectedObject) {
        setObjectInteractionMode(selectedObjectRef.current, "selected");
        movingSelectedObject = false;
        pendingObjectSelection = null;
        renderer.domElement.style.cursor = "grab";
        if (renderer.domElement.hasPointerCapture(event.pointerId)) {
          renderer.domElement.releasePointerCapture(event.pointerId);
        }
        setStatus("オブジェクト位置を更新しました");
        return;
      }

      if (pendingObjectSelection) {
        setObjectInteractionMode(pendingObjectSelection, "selected");
        pendingObjectSelection = null;
        renderer.domElement.style.cursor = "grab";
        if (renderer.domElement.hasPointerCapture(event.pointerId)) {
          renderer.domElement.releasePointerCapture(event.pointerId);
        }
        requestRender();
        setStatus("オブジェクト詳細を表示します");
        return;
      }

      dragging = false;
      renderer.domElement.style.cursor = "grab";
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const selectedObject = selectedObjectRef.current;

      if (selectedObject && (event.code === "BracketLeft" || event.code === "BracketRight")) {
        setObjectInteractionMode(selectedObject, "rotating");
        setDetailPopup(null);
        selectedObject.rotation.y +=
          event.code === "BracketLeft"
            ? THREE.MathUtils.degToRad(12)
            : -THREE.MathUtils.degToRad(12);
        event.preventDefault();
        requestRender();
        setStatus("オブジェクト角度を更新しました");
        setDropHint("選択中: ドラッグで移動 / Shift+ドラッグ or [ ] で回転");
        return;
      }

      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          input.forward = true;
          break;
        case "KeyS":
        case "ArrowDown":
          input.back = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          input.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          input.right = true;
          break;
        case "KeyQ":
          input.down = true;
          break;
        case "KeyE":
        case "Space":
          input.up = true;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          input.faster = true;
          break;
        default:
          return;
      }

      event.preventDefault();
      requestRender();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          input.forward = false;
          break;
        case "KeyS":
        case "ArrowDown":
          input.back = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          input.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          input.right = false;
          break;
        case "KeyQ":
          input.down = false;
          break;
        case "KeyE":
        case "Space":
          input.up = false;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          input.faster = false;
          break;
        default:
          return;
      }

      event.preventDefault();
    };

    const clearInput = () => {
      dragging = false;
      movingSelectedObject = false;
      pendingObjectSelection = null;
      setObjectInteractionMode(selectedObjectRef.current, "selected");
      renderer.domElement.style.cursor = "grab";
      input.forward = false;
      input.back = false;
      input.left = false;
      input.right = false;
      input.up = false;
      input.down = false;
      input.faster = false;
      resetMovementJoystick();
    };

    const updateMovement = (deltaSeconds: number) => {
      if (!deltaSeconds) {
        return false;
      }

      let moved = false;

      forwardVector.set(0, 0, -1).applyQuaternion(camera.quaternion);
      forwardVector.y = 0;
      if (forwardVector.lengthSq() > 0) {
        forwardVector.normalize();
      }

      rightVector.set(1, 0, 0).applyQuaternion(camera.quaternion);
      rightVector.y = 0;
      if (rightVector.lengthSq() > 0) {
        rightVector.normalize();
      }

      movement.set(0, 0, 0);
      if (input.forward) movement.add(forwardVector);
      if (input.back) movement.addScaledVector(forwardVector, -1);
      if (input.right) movement.add(rightVector);
      if (input.left) movement.addScaledVector(rightVector, -1);
      if (input.up) movement.y += 1;
      if (input.down) movement.y -= 1;
      if (movementJoystickRef.current.y !== 0) {
        movement.addScaledVector(forwardVector, -movementJoystickRef.current.y);
      }
      if (movementJoystickRef.current.x !== 0) {
        movement.addScaledVector(rightVector, movementJoystickRef.current.x);
      }

      if (movement.lengthSq() > 0) {
        movement.normalize();
        const speed = moveSpeed * (input.faster ? 2.4 : 1);
        const delta = movement.clone().multiplyScalar(speed * deltaSeconds);
        const nextPosition = camera.position.clone().add(delta);
        const resolvedPosition = camera.position.clone();

        nextPosition.copy(camera.position).add(new THREE.Vector3(delta.x, 0, 0));
        if (!collidesWithRoom(camera.position, nextPosition, collisionMeshes)) {
          resolvedPosition.x = nextPosition.x;
        }

        nextPosition.copy(resolvedPosition).add(new THREE.Vector3(0, delta.y, 0));
        if (!collidesWithRoom(resolvedPosition, nextPosition, collisionMeshes)) {
          resolvedPosition.y = nextPosition.y;
        }

        nextPosition.copy(resolvedPosition).add(new THREE.Vector3(0, 0, delta.z));
        if (!collidesWithRoom(resolvedPosition, nextPosition, collisionMeshes)) {
          resolvedPosition.z = nextPosition.z;
        }

        const actualDelta = resolvedPosition.sub(camera.position);
        camera.position.add(actualDelta);
        lookTarget.add(actualDelta);
        camera.lookAt(lookTarget);
        moved = actualDelta.lengthSq() > 0;
      }

      return moved;
    };

    const animate = () => {
      if (disposed) {
        return;
      }

      const deltaSeconds = clock.getDelta();
      const needsMovement = updateMovement(deltaSeconds);

      if (needsMovement || renderRequested) {
        renderRequested = false;
        renderFrame();
        updateDetailPopup();
      }

      requestAnimationFrame(animate);
    };

    const delay = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
      });

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearInput);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", endDrag);
    renderer.domElement.addEventListener("pointercancel", endDrag);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);

    void (async () => {
      try {
        loadingPhaseRankRef.current = 0;
        setStatus("Spark で 3sdgs_room.ply を読み込み中...");
        reportLoadingState({
          active: true,
          mode: "progress",
          progress: 0,
          stage: "ダウンロード中",
          detail: "PLY アセットを取得しています",
        });

        const mesh = new SplatMesh({
          url: SPARK_ASSET_URL,
          onProgress: (event) => {
            const total = event.total && event.total > 0 ? event.total : event.loaded || 1;
            const ratio = total > 0 ? event.loaded / total : 0;
            const percent = Math.min(100, Math.max(0, ratio * 100));

            reportLoadingState({
              active: true,
              mode: "progress",
              progress: percent,
              stage: "ダウンロード中",
              detail: `PLY アセットを取得しています`,
            });

            if (percent >= 100) {
              reportLoadingState({
                active: true,
                mode: "busy",
                progress: 100,
                stage: "読み込み中",
                detail: "PLY データをメッシュへ変換しています",
              });
            }
          },
        });

        splatMesh = await mesh.initialized;

        if (disposed) {
          splatMesh.dispose();
          return;
        }

        reportLoadingState({
          active: true,
          mode: "busy",
          progress: 100,
          stage: "描画中",
          detail: "シーンと初期カメラを確定しています",
        });

        splatMesh.rotation.z = Math.PI;
        splatMesh.updateMatrixWorld(true);
        scene.add(splatMesh);

        const startingView = prepareStartingView(camera, splatMesh);
        const worldBounds = getWorldBoundingBox(splatMesh);
        worldBoundsRef.current = worldBounds;
        placementPlaneYRef.current =
          worldBounds.min.y + Math.max(worldBounds.getSize(new THREE.Vector3()).y * 0.025, 0.08);
        moveSpeed = startingView.moveSpeed;
        lookRadius = Math.max(startingView.radius, 0.1);
        lookTarget.copy(startingView.target);
        orientation.yaw = startingView.yaw;
        orientation.pitch = startingView.pitch;
        applyOrientation();

        if (disposed) {
          return;
        }

        reportLoadingState({
          active: true,
          mode: "busy",
          progress: 100,
          stage: "衝突判定を準備中",
          detail: "部屋メッシュを読み込んでいます",
        });

        const collisionGltf = await new GLTFLoader().loadAsync(COLLISION_ASSET_URL);

        if (disposed) {
          disposeObject3D(collisionGltf.scene);
          return;
        }

        collisionRoom = collisionGltf.scene;
        collisionRoom.rotation.copy(COLLISION_MESH_ROTATION);
        collisionRoom.updateMatrixWorld(true);
        collisionMeshes = collectCollisionMeshes(collisionRoom);
        collisionRoom.visible = showCollisionMeshRef.current;
        collisionRoomRef.current = collisionRoom;
        scene.add(collisionRoom);

        if (disposed) {
          return;
        }

        const audioLoader = new THREE.AudioLoader();
        const roomCenter = worldBounds.getCenter(new THREE.Vector3());
        const roomSize = worldBounds.getSize(new THREE.Vector3());
        const audioEntries = await Promise.all(
          POSITIONAL_AUDIO_SOURCES.map(async (source) => {
            const buffer = await audioLoader.loadAsync(source.url);
            return { buffer, source };
          }),
        );

        if (disposed) {
          return;
        }

        for (const { buffer, source } of audioEntries) {
          const holder = new THREE.Object3D();
          holder.name = `audio-source-${source.name}`;
          holder.position
            .copy(roomCenter)
            .add(
              new THREE.Vector3(
                source.worldOffset.x * roomSize.x * 0.32,
                source.worldOffset.y,
                source.worldOffset.z * roomSize.z * 0.32,
              ),
            );

          const audio = new THREE.PositionalAudio(audioListener);
          audio.setBuffer(buffer);
          audio.setLoop(source.loop);
          audio.setVolume(source.volume);
          audio.setRefDistance(source.refDistance);
          audio.setMaxDistance(source.maxDistance);
          audio.setRolloffFactor(source.rolloffFactor);
          holder.add(audio);
          holder.add(createAudioMarker(source.name));
          scene.add(holder);
          audioObjects.push(holder);
          positionalAudioRef.current.push(audio);

          if (soundEnabled && !audio.isPlaying) {
            audio.play();
          }
        }

        setStatus(`Spark: ${splatMesh.context.splats.getNumSplats().toLocaleString()} splats`);
        reportLoadingState({
          active: true,
          mode: "busy",
          progress: 100,
          stage: "描画中",
          detail: "初回表示を待っています",
        });

        // This warmup is a temporary guard until loading completion is tied to a
        // render-backed signal rather than elapsed time. See
        // docs/spark-initial-render-investigation.md for the async stages we are
        // currently waiting out here.
        for (let pass = 1; pass <= INITIAL_RENDER_WARMUP_PASSES; pass += 1) {
          if (disposed) {
            return;
          }

          requestRender();
          reportLoadingState({
            active: true,
            mode: "busy",
            progress: 100,
            stage: "描画中",
            detail: `初回表示を待っています${".".repeat(pass % 4)}`,
          });
          await delay(INITIAL_RENDER_WARMUP_DELAY_MS);
        }

        if (disposed) {
          return;
        }

        reportLoadingState({
          active: false,
          mode: "busy",
          progress: 100,
          stage: "完了",
          detail: "ビューアの準備が完了しました",
        });
      } catch (error) {
        if (disposed) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "不明なエラーで読み込みに失敗しました";
        setStatus(`読み込み失敗: ${message}`);
        reportLoadingState({
          active: false,
          mode: "busy",
          progress: 100,
          stage: "エラー",
          detail: message,
        });
      }
    })();

    animate();

    return () => {
      disposed = true;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearInput);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", endDrag);
      renderer.domElement.removeEventListener("pointercancel", endDrag);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      placementLayer.children.forEach((child) => {
        const dispose = child.userData.dispose;
        if (typeof dispose === "function") {
          dispose();
        }
      });
      for (const audio of positionalAudioRef.current) {
        if (audio.isPlaying) {
          audio.stop();
        }
        audio.disconnect();
      }
      positionalAudioRef.current = [];
      for (const object of audioObjects) {
        scene.remove(object);
      }
      splatMesh?.dispose();
      if (collisionRoom) {
        disposeObject3D(collisionRoom);
      }
      renderer.dispose();
      placementLayerRef.current = null;
      worldBoundsRef.current = null;
      cameraRef.current = null;
      collisionRoomRef.current = null;
      requestRenderRef.current = () => {};
      setDetailPopup(null);
      resetViewerUi();
      reportLoadingState({
        active: false,
        mode: "busy",
        progress: 100,
        stage: "停止",
        detail: "ビューアを終了しました",
      });

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-0 w-full overflow-hidden rounded-[24px] bg-[#08111e]"
    >
      <ViewerHud
        onJoystickPointerDown={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          const radius = bounds.width * 0.5;
          const knobRadius = 26;
          const centerX = bounds.left + bounds.width * 0.5;
          const centerY = bounds.top + bounds.height * 0.5;
          const rawX = event.clientX - centerX;
          const rawY = event.clientY - centerY;
          const maxDistance = Math.max(radius - knobRadius, 1);
          const distance = Math.hypot(rawX, rawY);
          const scale = distance > maxDistance ? maxDistance / distance : 1;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          setMovementJoystick({
            x: (rawX * scale) / maxDistance,
            y: (rawY * scale) / maxDistance,
          });
        }}
        onJoystickPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
            return;
          }
          const bounds = event.currentTarget.getBoundingClientRect();
          const radius = bounds.width * 0.5;
          const knobRadius = 26;
          const centerX = bounds.left + bounds.width * 0.5;
          const centerY = bounds.top + bounds.height * 0.5;
          const rawX = event.clientX - centerX;
          const rawY = event.clientY - centerY;
          const maxDistance = Math.max(radius - knobRadius, 1);
          const distance = Math.hypot(rawX, rawY);
          const scale = distance > maxDistance ? maxDistance / distance : 1;
          setMovementJoystick({
            x: (rawX * scale) / maxDistance,
            y: (rawY * scale) / maxDistance,
          });
        }}
        onJoystickPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          resetMovementJoystick();
        }}
        onJoystickPointerLeave={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            return;
          }
          resetMovementJoystick();
        }}
        setMovementControl={setMovementControl}
        endMovementControl={endMovementControl}
      />
    </div>
  );
}
