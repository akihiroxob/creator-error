"use client";

import { useEffect, useRef, useState } from "react";
import { SplatLoader, SplatMesh } from "@sparkjsdev/spark";
import * as THREE from "three";

type InputState = {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  faster: boolean;
};

type OrientationState = {
  yaw: number;
  pitch: number;
};

type StartingView = {
  moveSpeed: number;
  pitch: number;
  radius: number;
  target: THREE.Vector3;
  yaw: number;
};

type SampleObject = {
  id: string;
  name: string;
  description: string;
  color: string;
  shape: "box" | "cylinder";
  size: [number, number, number];
};

export type ViewerLoadingState = {
  active: boolean;
  progress: number;
  stage: string;
  detail: string;
};

export const SAMPLE_OBJECT_TRANSFER_TYPE = "application/x-spark-sample-object";
const SPARK_ASSET_URL = "/3sdgs_room.ply";

export const SAMPLE_OBJECTS: SampleObject[] = [
  {
    id: "storage-box",
    name: "Storage Box",
    description: "小型の箱。角の確認用。",
    color: "#f97316",
    shape: "box",
    size: [0.55, 0.55, 0.55],
  },
  {
    id: "display-pillar",
    name: "Display Pillar",
    description: "縦長シリンダー。高さの確認用。",
    color: "#22c55e",
    shape: "cylinder",
    size: [0.28, 1.2, 0.28],
  },
  {
    id: "bench-block",
    name: "Bench Block",
    description: "横長ブロック。通路の見え方確認用。",
    color: "#38bdf8",
    shape: "box",
    size: [1.2, 0.38, 0.45],
  },
];

type SparkSceneProps = {
  onLoadingStateChange?: (state: ViewerLoadingState) => void;
};

function createPlacedObject(sample: SampleObject) {
  const [width, height, depth] = sample.size;
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: sample.color,
    roughness: 0.45,
    metalness: 0.08,
  });
  const accentMaterial = new THREE.MeshBasicMaterial({
    color: sample.color,
    wireframe: true,
    transparent: true,
    opacity: 0.18,
  });

  const geometry =
    sample.shape === "cylinder"
      ? new THREE.CylinderGeometry(width, depth, height, 24)
      : new THREE.BoxGeometry(width, height, depth);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = height / 2;
  group.add(mesh);

  const silhouette = new THREE.Mesh(geometry.clone(), accentMaterial);
  silhouette.position.copy(mesh.position);
  silhouette.scale.setScalar(1.03);
  group.add(silhouette);

  const marker = new THREE.Mesh(
    new THREE.RingGeometry(Math.max(width, depth) * 0.45, Math.max(width, depth) * 0.66, 40),
    new THREE.MeshBasicMaterial({
      color: sample.color,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    }),
  );
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = 0.015;
  group.add(marker);

  group.userData.dispose = () => {
    geometry.dispose();
    silhouette.geometry.dispose();
    marker.geometry.dispose();
    material.dispose();
    accentMaterial.dispose();
    const markerMaterial = marker.material;
    if (markerMaterial instanceof THREE.Material) {
      markerMaterial.dispose();
    }
  };

  return group;
}

function getWorldBoundingBox(object: SplatMesh) {
  object.updateMatrixWorld(true);
  return object.getBoundingBox().clone().applyMatrix4(object.matrixWorld);
}

function prepareStartingView(camera: THREE.PerspectiveCamera, object: SplatMesh) {
  const box = getWorldBoundingBox(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z, 0);
  const orientation = new THREE.Euler(0, 0, 0, "YXZ");

  if (!Number.isFinite(maxSize) || maxSize <= 0) {
    camera.near = 0.01;
    camera.far = Math.max(size.length() * 3, 50);
    camera.position.copy(center);
    camera.up.set(0, 1, 0);
    const target = center.clone().add(new THREE.Vector3(0, 0, -1));
    camera.lookAt(target);
    orientation.setFromQuaternion(camera.quaternion, "YXZ");
    camera.updateProjectionMatrix();
    return {
      moveSpeed: 1,
      pitch: orientation.x,
      radius: 1,
      target,
      yaw: orientation.y,
    };
  }

  const start = center.clone();
  const target = center.clone();
  const farPlane = Math.max(maxSize * 20, 100);
  const dominantHorizontalAxis = size.x >= size.z ? "x" : "z";
  const lookOffset = Math.max(maxSize * 0.08, 0.35);

  camera.near = 0.01;
  camera.far = farPlane;
  camera.up.set(0, 1, 0);

  if (dominantHorizontalAxis === "x") {
    target.x += lookOffset;
  } else {
    target.z += lookOffset;
  }

  camera.position.copy(start);
  camera.lookAt(target);
  orientation.setFromQuaternion(camera.quaternion, "YXZ");
  camera.updateProjectionMatrix();

  return {
    moveSpeed: Math.max(maxSize * 0.2, 0.35),
    pitch: orientation.x,
    radius: camera.position.distanceTo(target),
    target,
    yaw: orientation.y,
  };
}

export function SparkScene({ onLoadingStateChange }: SparkSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const worldBoundsRef = useRef<THREE.Box3 | null>(null);
  const placementLayerRef = useRef<THREE.Group | null>(null);
  const placementPlaneYRef = useRef(0);
  const requestRenderRef = useRef<() => void>(() => {});
  const raycasterRef = useRef(new THREE.Raycaster());
  const [status, setStatus] = useState("Spark を読み込み中...");
  const [dropHint, setDropHint] = useState("サイドメニューから部屋へドラッグして配置");
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const reportLoadingState = (state: ViewerLoadingState) => {
    onLoadingStateChange?.({
      ...state,
      progress: THREE.MathUtils.clamp(Math.round(state.progress), 0, 100),
    });
  };

  const placeSampleObject = (sampleId: string, clientX: number, clientY: number) => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    const placementLayer = placementLayerRef.current;
    const worldBounds = worldBoundsRef.current;

    if (!container || !camera || !placementLayer || !worldBounds) {
      return;
    }

    const sample = SAMPLE_OBJECTS.find((item) => item.id === sampleId);
    if (!sample) {
      return;
    }

    const bounds = container.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) {
      return;
    }

    const pointer = new THREE.Vector2(
      ((clientX - bounds.left) / bounds.width) * 2 - 1,
      -((clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -placementPlaneYRef.current);
    const hitPoint = new THREE.Vector3();
    raycasterRef.current.setFromCamera(pointer, camera);

    if (!raycasterRef.current.ray.intersectPlane(plane, hitPoint)) {
      return;
    }

    const [width, , depth] = sample.size;
    const marginX = width * 0.55;
    const marginZ = depth * 0.55;
    hitPoint.x = THREE.MathUtils.clamp(
      hitPoint.x,
      worldBounds.min.x + marginX,
      worldBounds.max.x - marginX,
    );
    hitPoint.z = THREE.MathUtils.clamp(
      hitPoint.z,
      worldBounds.min.z + marginZ,
      worldBounds.max.z - marginZ,
    );
    hitPoint.y = placementPlaneYRef.current;

    const placedObject = createPlacedObject(sample);
    placedObject.position.copy(hitPoint);
    placementLayer.add(placedObject);
    requestRenderRef.current();

    setStatus(`${sample.name} を配置しました`);
    setDropHint("別のサンプルもドラッグして配置できます");
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

    const input: InputState = {
      forward: false,
      back: false,
      left: false,
      right: false,
      up: false,
      down: false,
      faster: false,
    };

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
    let lastPointerX = 0;
    let lastPointerY = 0;
    let renderRequested = true;
    let disposed = false;
    let splatMesh: SplatMesh | null = null;
    const onPointerLeave = () => {
      if (dragging) {
        renderer.domElement.style.cursor = "grab";
      }
    };

    const requestRender = () => {
      renderRequested = true;
    };
    requestRenderRef.current = requestRender;

    const applyOrientation = () => {
      orientation.pitch = THREE.MathUtils.clamp(
        orientation.pitch,
        -Math.PI / 2 + 0.01,
        Math.PI / 2 - 0.01,
      );
      direction.set(
        Math.sin(orientation.yaw) * Math.cos(orientation.pitch),
        Math.sin(orientation.pitch),
        -Math.cos(orientation.yaw) * Math.cos(orientation.pitch),
      ).normalize();
      lookTarget.copy(camera.position).addScaledVector(direction, lookRadius);
      euler.set(orientation.pitch, orientation.yaw, 0);
      camera.quaternion.setFromEuler(euler);
      camera.lookAt(lookTarget);
    };

    const renderFrame = () => {
      renderer.render(scene, camera);
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

      dragging = true;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      renderer.domElement.style.cursor = "grabbing";
      renderer.domElement.setPointerCapture(event.pointerId);
      requestRender();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) {
        return;
      }

      const deltaX = event.clientX - lastPointerX;
      const deltaY = event.clientY - lastPointerY;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;

      orientation.yaw += deltaX * lookSensitivity;
      orientation.pitch += deltaY * lookSensitivity;
      applyOrientation();
      requestRender();
    };

    const endDrag = (event: PointerEvent) => {
      dragging = false;
      renderer.domElement.style.cursor = "grab";
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
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
      renderer.domElement.style.cursor = "grab";
      input.forward = false;
      input.back = false;
      input.left = false;
      input.right = false;
      input.up = false;
      input.down = false;
      input.faster = false;
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

      if (movement.lengthSq() > 0) {
        movement.normalize();
        const speed = moveSpeed * (input.faster ? 2.4 : 1);
        camera.position.addScaledVector(movement, speed * deltaSeconds);
        lookTarget.addScaledVector(movement, speed * deltaSeconds);
        camera.lookAt(lookTarget);
        moved = true;
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
      }

      requestAnimationFrame(animate);
    };

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
        const loader = new SplatLoader();
        setStatus("Spark で 3sdgs_room.ply を読み込み中...");
        reportLoadingState({
          active: true,
          progress: 24,
          stage: "ダウンロード中",
          detail: "PLY アセットを取得しています",
        });

        const packedSplats = await loader.loadAsync(SPARK_ASSET_URL, (event) => {
          const total = event.total && event.total > 0 ? event.total : event.loaded || 1;
          const ratio = total > 0 ? event.loaded / total : 0;
          reportLoadingState({
            active: true,
            progress: 24 + ratio * 46,
            stage: "ダウンロード中",
            detail: `${Math.round(ratio * 100)}% 受信済み`,
          });
        });

        if (disposed) {
          packedSplats.dispose();
          return;
        }

        reportLoadingState({
          active: true,
          progress: 78,
          stage: "読み込み中",
          detail: "ksplat データをメッシュへ変換しています",
        });

        splatMesh = await new SplatMesh({
          packedSplats,
        }).initialized;

        if (disposed) {
          splatMesh.dispose();
          return;
        }

        reportLoadingState({
          active: true,
          progress: 92,
          stage: "描画中",
          detail: "シーンと初期カメラを確定しています",
        });

        splatMesh.rotation.x = -Math.PI / 2;
        scene.add(splatMesh);

        const startingView = prepareStartingView(camera, splatMesh);
        const worldBounds = getWorldBoundingBox(splatMesh);
        worldBoundsRef.current = worldBounds;
        placementPlaneYRef.current =
          worldBounds.min.y + Math.max(worldBounds.getSize(new THREE.Vector3()).y * 0.02, 0.02);
        moveSpeed = startingView.moveSpeed;
        lookRadius = Math.max(startingView.radius, 0.1);
        lookTarget.copy(startingView.target);
        orientation.yaw = startingView.yaw;
        orientation.pitch = startingView.pitch;
        applyOrientation();

        if (disposed) {
          return;
        }

        requestRender();
        setStatus(`Spark: ${splatMesh.packedSplats.numSplats.toLocaleString()} splats`);
        reportLoadingState({
          active: false,
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
      splatMesh?.dispose();
      renderer.dispose();
      placementLayerRef.current = null;
      worldBoundsRef.current = null;
      cameraRef.current = null;
      requestRenderRef.current = () => {};
      reportLoadingState({
        active: false,
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
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes(SAMPLE_OBJECT_TRANSFER_TYPE)) {
          return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        if (!isDraggingOver) {
          setIsDraggingOver(true);
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsDraggingOver(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        const sampleId = event.dataTransfer.getData(SAMPLE_OBJECT_TRANSFER_TYPE);
        setIsDraggingOver(false);
        if (!sampleId) {
          return;
        }

        placeSampleObject(sampleId, event.clientX, event.clientY);
      }}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        background: "#08111e",
        borderRadius: 24,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 16,
          zIndex: 1,
          borderRadius: 24,
          border: isDraggingOver ? "1px solid rgba(125, 211, 252, 0.7)" : "1px solid transparent",
          background: isDraggingOver ? "rgba(14, 165, 233, 0.08)" : "transparent",
          pointerEvents: "none",
          transition: "border-color 120ms ease, background 120ms ease",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 16,
          bottom: 16,
          zIndex: 1,
          maxWidth: "min(560px, calc(100vw - 32px))",
          padding: "10px 12px",
          borderRadius: 12,
          background: "rgba(8, 17, 30, 0.65)",
          color: "rgba(255, 255, 255, 0.9)",
          fontSize: 12,
          lineHeight: 1.5,
          letterSpacing: "0.01em",
          pointerEvents: "none",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <div>{status}</div>
        <div style={{ opacity: 0.75 }}>
          W/A/S/D move · drag to look · Q/E or Space to rise/fall · Shift to sprint
        </div>
        <div style={{ opacity: 0.75 }}>{dropHint}</div>
      </div>
    </div>
  );
}
