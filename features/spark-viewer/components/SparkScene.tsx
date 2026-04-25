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
import { useEffect, useRef, useState } from "react";
import { SplatLoader, SplatMesh } from "@sparkjsdev/spark";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

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
  position: THREE.Vector3;
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

export type PlacementObjectDetail = {
  productName: string;
  modelNumber: string;
  companyName: string;
  rentalCostLabel: string;
};

export type AssetItem = {
  detail: PlacementObjectDetail;
  id: string;
  name: string;
  previewSrc: string;
  src: string;
  targetSize: number;
  type: "glb";
};

export type ViewerLoadingState = {
  active: boolean;
  mode: "busy" | "progress";
  progress: number;
  stage: string;
  detail: string;
};

type CompassState = {
  heading: string;
  pitchDeg: number;
  rotationDeg: number;
};

type ObjectInteractionMode = "idle" | "selected" | "moving" | "rotating";
type DetailVisibility = "hidden" | "visible";

type PlacementObjectUserData = {
  detail?: PlacementObjectDetail;
  detailVisibility?: DetailVisibility;
  dispose?: () => void;
  interactionMode?: ObjectInteractionMode;
  selectable?: boolean;
  selectionIndicator?: THREE.Object3D;
};

type DetailPopupState = {
  detail: PlacementObjectDetail;
  screenX: number;
  screenY: number;
};

export const SAMPLE_OBJECT_TRANSFER_TYPE = "application/x-spark-sample-object";
export const ASSET_ITEM_TRANSFER_TYPE = "application/x-spark-asset-item";
const SPARK_ASSET_URL = "https://pub-1d838c816462442a90bd803fa63dbda2.r2.dev/ply/3sdgs_room.ksplat";
// const SPARK_ASSET_URL = "/3sdgs_room.ksplat";
// `SplatMesh.initialized` completes before Spark auto-inserts its renderer,
// performs the first deferred update, and finishes the initial sort pass, so
// the first visually valid frame can lag behind data initialization.
const INITIAL_RENDER_WARMUP_PASSES = 6;
const INITIAL_RENDER_WARMUP_DELAY_MS = 300;

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

export const ASSET_ITEMS: AssetItem[] = [
  {
    id: "arm-chair",
    name: "Arm Chair",
    detail: {
      productName: "Arm Chair",
      modelNumber: "AC-2K",
      companyName: "Junichi Furniture Rental",
      rentalCostLabel: "¥12,000 / month",
    },
    src: "https://pub-1d838c816462442a90bd803fa63dbda2.r2.dev/objects/arm_chair_2k.glb",
    previewSrc: "/asset/arm_chair_2k.jpg",
    targetSize: 0.68,
    type: "glb",
  },
  {
    id: "chinese-sofa",
    name: "Chinese Sofa",
    detail: {
      productName: "Chinese Sofa",
      modelNumber: "CS-2K",
      companyName: "Junichi Furniture Rental",
      rentalCostLabel: "¥28,000 / month",
    },
    src: "https://pub-1d838c816462442a90bd803fa63dbda2.r2.dev/objects/chinese_sofa_2k.glb",
    previewSrc: "/asset/chinese_sofa_2k.jpg",
    targetSize: 1.05,
    type: "glb",
  },
  {
    id: "clock",
    name: "Clock",
    detail: {
      productName: "Clock",
      modelNumber: "CLK-2K",
      companyName: "Junichi Props Rental",
      rentalCostLabel: "¥4,500 / month",
    },
    src: "https://pub-1d838c816462442a90bd803fa63dbda2.r2.dev/objects/cloc_2k.glb",
    previewSrc: "/asset/cloc_2k.jpg",
    targetSize: 0.36,
    type: "glb",
  },
  {
    id: "jug",
    name: "Jug",
    detail: {
      productName: "Jug",
      modelNumber: "JUG-2K",
      companyName: "Junichi Props Rental",
      rentalCostLabel: "¥3,200 / month",
    },
    src: "https://pub-1d838c816462442a90bd803fa63dbda2.r2.dev/objects/jug_2k.glb",
    previewSrc: "/asset/jug_2k.jpg",
    targetSize: 0.26,
    type: "glb",
  },
  {
    id: "ottoman",
    name: "Ottoman",
    detail: {
      productName: "Ottoman",
      modelNumber: "OTM-2K",
      companyName: "Junichi Furniture Rental",
      rentalCostLabel: "¥8,000 / month",
    },
    src: "https://pub-1d838c816462442a90bd803fa63dbda2.r2.dev/objects/Ottoman_2k.glb",
    previewSrc: "/asset/Ottoman_2k.jpg",
    targetSize: 0.46,
    type: "glb",
  },
  {
    id: "painted-wooden-stool",
    name: "Painted Wooden Stool",
    detail: {
      productName: "Painted Wooden Stool",
      modelNumber: "PWS-2K",
      companyName: "Junichi Furniture Rental",
      rentalCostLabel: "¥5,400 / month",
    },
    src: "https://pub-1d838c816462442a90bd803fa63dbda2.r2.dev/objects/painted_wooden_stool_2k.glb",
    previewSrc: "/asset/painted_wooden_stool_2k.jpg",
    targetSize: 0.42,
    type: "glb",
  },
  {
    id: "sofa",
    name: "Sofa",
    detail: {
      productName: "Sofa",
      modelNumber: "SF-2K",
      companyName: "Junichi Furniture Rental",
      rentalCostLabel: "¥26,000 / month",
    },
    src: "https://pub-1d838c816462442a90bd803fa63dbda2.r2.dev/objects/sofa_2k.glb",
    previewSrc: "/asset/sofa_2k.jpg",
    targetSize: 1.13,
    type: "glb",
  },
  {
    id: "steel-frame",
    name: "Steel Frame",
    detail: {
      productName: "Steel Frame",
      modelNumber: "STF-2K",
      companyName: "Junichi Display Systems",
      rentalCostLabel: "¥15,000 / month",
    },
    src: "https://pub-1d838c816462442a90bd803fa63dbda2.r2.dev/objects/steel_frame_2k.glb",
    previewSrc: "/asset/steel_frame_2k.jpg",
    targetSize: 0.9,
    type: "glb",
  },
];

type SparkSceneProps = {
  onLoadingStateChange?: (state: ViewerLoadingState) => void;
};

function attachSelectionIndicator(group: THREE.Group, radius: number) {
  const indicator = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.72, radius, 48),
    new THREE.MeshBasicMaterial({
      color: "#38bdf8",
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
    }),
  );
  indicator.rotation.x = -Math.PI / 2;
  indicator.position.y = 0.02;
  indicator.visible = false;
  group.add(indicator);
  const userData = group.userData as PlacementObjectUserData;
  userData.selectionIndicator = indicator;
}

function setObjectSelected(object: THREE.Object3D | null, selected: boolean) {
  if (!object) {
    return;
  }

  const indicator = (object.userData as PlacementObjectUserData).selectionIndicator;
  if (indicator instanceof THREE.Object3D) {
    indicator.visible = selected;
  }
}

function resolveDetailVisibility(interactionMode: ObjectInteractionMode): DetailVisibility {
  return interactionMode === "selected" ? "visible" : "hidden";
}

function setObjectInteractionMode(
  object: THREE.Object3D | null,
  interactionMode: ObjectInteractionMode,
) {
  if (!object) {
    return;
  }

  const userData = object.userData as PlacementObjectUserData;
  userData.interactionMode = interactionMode;
  userData.detailVisibility = resolveDetailVisibility(interactionMode);
}

function getObjectDetail(object: THREE.Object3D | null) {
  if (!object) {
    return null;
  }

  return ((object.userData as PlacementObjectUserData).detail ??
    null) as PlacementObjectDetail | null;
}

function shouldShowObjectDetail(object: THREE.Object3D | null) {
  if (!object) {
    return false;
  }

  const userData = object.userData as PlacementObjectUserData;
  return userData.detailVisibility === "visible" && !!userData.detail;
}

function getObjectPopupAnchor(object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) {
    return object.getWorldPosition(new THREE.Vector3());
  }

  const anchor = box.getCenter(new THREE.Vector3());
  anchor.y = box.max.y + Math.max(box.getSize(new THREE.Vector3()).y * 0.04, 0.04);
  return anchor;
}

function projectWorldPointToScreen(
  point: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
  container: HTMLElement,
) {
  const projected = point.clone().project(camera);
  if (projected.z < -1 || projected.z > 1) {
    return null;
  }

  const bounds = container.getBoundingClientRect();
  return {
    screenX: ((projected.x + 1) / 2) * bounds.width,
    screenY: ((1 - projected.y) / 2) * bounds.height,
  };
}

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
  attachSelectionIndicator(group, Math.max(width, depth) * 0.92);
  const userData = group.userData as PlacementObjectUserData;
  userData.selectable = true;
  userData.interactionMode = "idle";
  userData.detailVisibility = "hidden";

  userData.dispose = () => {
    const selectionIndicator = userData.selectionIndicator as THREE.Mesh | undefined;
    geometry.dispose();
    silhouette.geometry.dispose();
    marker.geometry.dispose();
    material.dispose();
    accentMaterial.dispose();
    const markerMaterial = marker.material;
    if (markerMaterial instanceof THREE.Material) {
      markerMaterial.dispose();
    }
    if (selectionIndicator) {
      selectionIndicator.geometry.dispose();
      const selectionMaterial = selectionIndicator.material;
      if (selectionMaterial instanceof THREE.Material) {
        selectionMaterial.dispose();
      }
    }
  };

  return group;
}

function orientPlacedObject(group: THREE.Object3D, camera: THREE.PerspectiveCamera) {
  const facing = new THREE.Vector3();
  camera.getWorldDirection(facing);
  facing.y = 0;
  if (facing.lengthSq() === 0) {
    facing.set(0, 0, -1);
  }
  group.rotation.y = Math.atan2(facing.x, facing.z) + Math.PI;
}

function disposeObject3D(root: THREE.Object3D) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    const material = mesh.material;
    if (Array.isArray(material)) {
      material.forEach((entry) => entry.dispose());
    } else if (material instanceof THREE.Material) {
      material.dispose();
    }
  });
}

function createPlacedAssetPlaceholder(asset: AssetItem, camera: THREE.PerspectiveCamera) {
  const group = new THREE.Group();
  const width = 1.4;
  const height = 1;
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshBasicMaterial({
    color: "#dbeafe",
    side: THREE.DoubleSide,
  });
  const panel = new THREE.Mesh(geometry, material);
  panel.position.y = height / 2;
  group.add(panel);

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.08, height + 0.08, 0.05),
    new THREE.MeshStandardMaterial({
      color: "#0f172a",
      roughness: 0.6,
      metalness: 0.15,
    }),
  );
  frame.position.set(0, height / 2, -0.03);
  group.add(frame);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.16, 0.08, 24),
    new THREE.MeshStandardMaterial({
      color: "#334155",
      roughness: 0.75,
      metalness: 0.1,
    }),
  );
  base.position.y = 0.04;
  group.add(base);

  orientPlacedObject(group, camera);

  const loader = new THREE.TextureLoader();
  let texture: THREE.Texture | null = null;
  void loader.load(
    asset.previewSrc,
    (loaded) => {
      texture = loaded;
      texture.colorSpace = THREE.SRGBColorSpace;
      material.map = texture;
      material.needsUpdate = true;
    },
    undefined,
    () => {
      material.color.set("#fca5a5");
    },
  );

  group.userData.dispose = () => {
    const userData = group.userData as PlacementObjectUserData;
    geometry.dispose();
    panel.material.dispose();
    frame.geometry.dispose();
    frame.material.dispose();
    base.geometry.dispose();
    base.material.dispose();
    texture?.dispose();
    userData.detailVisibility = "hidden";
  };

  return group;
}

async function createPlacedGlbAsset(asset: AssetItem, camera: THREE.PerspectiveCamera) {
  const group = new THREE.Group();
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(asset.src);
  const model = gltf.scene;
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const largestSide = Math.max(size.x, size.y, size.z, 0.001);
  const scale = asset.targetSize / largestSide;

  model.position.sub(center);
  model.scale.setScalar(scale);
  const scaledBox = new THREE.Box3().setFromObject(model);
  model.position.y -= scaledBox.min.y;

  group.add(model);
  const scaledSize = scaledBox.getSize(new THREE.Vector3());
  attachSelectionIndicator(group, Math.max(scaledSize.x, scaledSize.z, 0.45) * 0.58);
  orientPlacedObject(group, camera);
  const userData = group.userData as PlacementObjectUserData;
  userData.detail = asset.detail;
  userData.detailVisibility = "hidden";
  userData.interactionMode = "idle";
  userData.selectable = true;
  userData.dispose = () => {
    disposeObject3D(group);
  };
  return group;
}

function getWorldBoundingBox(object: SplatMesh) {
  object.updateMatrixWorld(true);
  return object.getBoundingBox().clone().applyMatrix4(object.matrixWorld);
}

function toCompassState(direction: THREE.Vector3): CompassState {
  const normalizedHeading = THREE.MathUtils.euclideanModulo(
    THREE.MathUtils.radToDeg(Math.atan2(direction.x, -direction.z)),
    360,
  );
  const headings = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(normalizedHeading / 45) % headings.length;

  return {
    heading: headings[index],
    pitchDeg: THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(direction.y, -1, 1))),
    rotationDeg: normalizedHeading,
  };
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
      position: camera.position.clone(),
      radius: 1,
      target,
      yaw: orientation.y,
    };
  }

  const start = center.clone();
  const target = center.clone();
  const farPlane = Math.max(maxSize * 20, 100);
  const dominantHorizontalAxis = size.x >= size.z ? "x" : "z";
  const horizontalInsetX = Math.max(size.x * 0.18, 0.4);
  const horizontalInsetZ = Math.max(size.z * 0.18, 0.4);
  const eyeHeight = THREE.MathUtils.clamp(size.y * 0.07, 0.22, 0.95);
  const headroom = Math.max(size.y * 0.12, 0.35);
  const minimumInteriorY = box.min.y + Math.max(size.y * 0.04, 0.16);
  const lookDownOffset = Math.max(size.y * 0.03, 0.05);
  const initialRaise = THREE.MathUtils.clamp(Math.max(maxSize * 0.025, 0.14), 0.14, 0.32);
  const startOffset =
    dominantHorizontalAxis === "x" ? Math.max(size.x * 0.16, 0.8) : Math.max(size.z * 0.16, 0.8);
  const northLookOffset = Math.max(size.z * 0.08, 0.45);

  camera.near = 0.01;
  camera.far = farPlane;
  camera.up.set(0, 1, 0);

  start.y = THREE.MathUtils.clamp(
    Math.max(box.min.y + eyeHeight + initialRaise, minimumInteriorY),
    box.min.y + 0.35,
    box.max.y - headroom,
  );
  target.y = start.y - lookDownOffset;

  if (dominantHorizontalAxis === "x") {
    start.x = THREE.MathUtils.clamp(
      center.x - startOffset,
      box.min.x + horizontalInsetX,
      box.max.x - horizontalInsetX,
    );
    target.x = start.x;
    start.z = THREE.MathUtils.clamp(
      start.z,
      box.min.z + horizontalInsetZ,
      box.max.z - horizontalInsetZ,
    );
  } else {
    start.z = THREE.MathUtils.clamp(
      center.z - startOffset,
      box.min.z + horizontalInsetZ,
      box.max.z - horizontalInsetZ,
    );
    start.x = THREE.MathUtils.clamp(
      start.x,
      box.min.x + horizontalInsetX,
      box.max.x - horizontalInsetX,
    );
  }

  target.z = THREE.MathUtils.clamp(
    start.z - northLookOffset,
    box.min.z + horizontalInsetZ,
    box.max.z - horizontalInsetZ,
  );

  camera.position.copy(start);
  camera.lookAt(target);
  orientation.setFromQuaternion(camera.quaternion, "YXZ");
  camera.updateProjectionMatrix();

  return {
    moveSpeed: Math.max(maxSize * 0.2, 0.35),
    pitch: orientation.x,
    position: start.clone(),
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
        const loader = new SplatLoader();
        setStatus("Spark で 3sdgs_room.ply を読み込み中...");
        reportLoadingState({
          active: true,
          mode: "progress",
          progress: 0,
          stage: "ダウンロード中",
          detail: "PLY アセットを取得しています",
        });

        const packedSplats = await loader.loadAsync(SPARK_ASSET_URL, (event) => {
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
        });

        if (disposed) {
          packedSplats.dispose();
          return;
        }

        splatMesh = await new SplatMesh({
          packedSplats,
        }).initialized;

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
