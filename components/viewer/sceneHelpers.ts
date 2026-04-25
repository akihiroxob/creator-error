"use client";

import { SplatMesh } from "@sparkjsdev/spark";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import type { CompassState, PlacementObjectDetail } from "@/components/viewer/types";
import {
  CAMERA_COLLISION_HEIGHT,
  CAMERA_COLLISION_RADIUS,
} from "@/components/viewer/sceneConstants";
import type {
  AssetItem,
  DetailVisibility,
  ObjectInteractionMode,
  PlacementObjectUserData,
  SampleObject,
  StartingView,
} from "@/components/viewer/sceneTypes";

export function attachSelectionIndicator(group: THREE.Group, radius: number) {
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

export function setObjectSelected(object: THREE.Object3D | null, selected: boolean) {
  if (!object) return;
  const indicator = (object.userData as PlacementObjectUserData).selectionIndicator;
  if (indicator instanceof THREE.Object3D) indicator.visible = selected;
}

export function resolveDetailVisibility(
  interactionMode: ObjectInteractionMode,
): DetailVisibility {
  return interactionMode === "selected" ? "visible" : "hidden";
}

export function setObjectInteractionMode(
  object: THREE.Object3D | null,
  interactionMode: ObjectInteractionMode,
) {
  if (!object) return;
  const userData = object.userData as PlacementObjectUserData;
  userData.interactionMode = interactionMode;
  userData.detailVisibility = resolveDetailVisibility(interactionMode);
}

export function getObjectDetail(object: THREE.Object3D | null) {
  if (!object) return null;
  return ((object.userData as PlacementObjectUserData).detail ??
    null) as PlacementObjectDetail | null;
}

export function shouldShowObjectDetail(object: THREE.Object3D | null) {
  if (!object) return false;
  const userData = object.userData as PlacementObjectUserData;
  return userData.detailVisibility === "visible" && !!userData.detail;
}

export function getObjectPopupAnchor(object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return object.getWorldPosition(new THREE.Vector3());
  const anchor = box.getCenter(new THREE.Vector3());
  anchor.y = box.max.y + Math.max(box.getSize(new THREE.Vector3()).y * 0.04, 0.04);
  return anchor;
}

export function projectWorldPointToScreen(
  point: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
  container: HTMLElement,
) {
  const projected = point.clone().project(camera);
  if (projected.z < -1 || projected.z > 1) return null;
  const bounds = container.getBoundingClientRect();
  return {
    screenX: ((projected.x + 1) / 2) * bounds.width,
    screenY: ((1 - projected.y) / 2) * bounds.height,
  };
}

export function createPlacedObject(sample: SampleObject) {
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
    if (markerMaterial instanceof THREE.Material) markerMaterial.dispose();
    if (selectionIndicator) {
      selectionIndicator.geometry.dispose();
      const selectionMaterial = selectionIndicator.material;
      if (selectionMaterial instanceof THREE.Material) selectionMaterial.dispose();
    }
  };
  return group;
}

export function orientPlacedObject(group: THREE.Object3D, camera: THREE.PerspectiveCamera) {
  const facing = new THREE.Vector3();
  camera.getWorldDirection(facing);
  facing.y = 0;
  if (facing.lengthSq() === 0) facing.set(0, 0, -1);
  group.rotation.y = Math.atan2(facing.x, facing.z) + Math.PI;
}

export function disposeObject3D(root: THREE.Object3D) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = mesh.material;
    if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
    else if (material instanceof THREE.Material) material.dispose();
  });
}

export function createPlacedAssetPlaceholder(asset: AssetItem, camera: THREE.PerspectiveCamera) {
  const group = new THREE.Group();
  const width = 1.4;
  const height = 1;
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshBasicMaterial({ color: "#dbeafe", side: THREE.DoubleSide });
  const panel = new THREE.Mesh(geometry, material);
  panel.position.y = height / 2;
  group.add(panel);
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.08, height + 0.08, 0.05),
    new THREE.MeshStandardMaterial({ color: "#0f172a", roughness: 0.6, metalness: 0.15 }),
  );
  frame.position.set(0, height / 2, -0.03);
  group.add(frame);
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.16, 0.08, 24),
    new THREE.MeshStandardMaterial({ color: "#334155", roughness: 0.75, metalness: 0.1 }),
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

export async function createPlacedGlbAsset(asset: AssetItem, camera: THREE.PerspectiveCamera) {
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
  userData.dispose = () => disposeObject3D(group);
  return group;
}

export function getWorldBoundingBox(object: SplatMesh) {
  object.updateMatrixWorld(true);
  return object.getBoundingBox().clone().applyMatrix4(object.matrixWorld);
}

export function collectCollisionMeshes(object: THREE.Object3D) {
  const meshes: THREE.Mesh[] = [];
  const debugMaterial = new THREE.MeshBasicMaterial({
    color: "#38bdf8",
    transparent: true,
    opacity: 0.24,
    wireframe: true,
    depthWrite: false,
  });
  object.updateMatrixWorld(true);
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const userData = child.userData as PlacementObjectUserData;
    userData.originalMaterial = child.material;
    child.material = debugMaterial;
    meshes.push(child);
  });
  return meshes;
}

export function collidesWithRoom(
  currentPosition: THREE.Vector3,
  nextPosition: THREE.Vector3,
  collisionMeshes: THREE.Mesh[],
) {
  if (collisionMeshes.length === 0) return false;
  const delta = nextPosition.clone().sub(currentPosition);
  const distance = delta.length();
  if (distance <= 0) return false;
  const direction = delta.divideScalar(distance);
  const side = new THREE.Vector3(-direction.z, 0, direction.x);
  if (side.lengthSq() > 0) side.normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const raycaster = new THREE.Raycaster();
  raycaster.near = 0;
  raycaster.far = distance + CAMERA_COLLISION_RADIUS;
  const origins = [
    currentPosition,
    currentPosition.clone().addScaledVector(side, CAMERA_COLLISION_RADIUS),
    currentPosition.clone().addScaledVector(side, -CAMERA_COLLISION_RADIUS),
    currentPosition.clone().addScaledVector(up, CAMERA_COLLISION_HEIGHT * 0.35),
    currentPosition.clone().addScaledVector(up, -CAMERA_COLLISION_HEIGHT * 0.35),
  ];
  return origins.some((origin) => {
    raycaster.set(origin, direction);
    return raycaster.intersectObjects(collisionMeshes, false).length > 0;
  });
}

export function createAudioMarker(name: string) {
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 16, 12),
    new THREE.MeshBasicMaterial({
      color: name === "stream" ? "#38bdf8" : "#facc15",
      transparent: true,
      opacity: 0.82,
    }),
  );
  marker.name = `audio-marker-${name}`;
  return marker;
}

export function toCompassState(direction: THREE.Vector3): CompassState {
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

export function prepareStartingView(
  camera: THREE.PerspectiveCamera,
  object: SplatMesh,
): StartingView {
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
    start.z = THREE.MathUtils.clamp(start.z, box.min.z + horizontalInsetZ, box.max.z - horizontalInsetZ);
  } else {
    start.z = THREE.MathUtils.clamp(
      center.z - startOffset,
      box.min.z + horizontalInsetZ,
      box.max.z - horizontalInsetZ,
    );
    start.x = THREE.MathUtils.clamp(start.x, box.min.x + horizontalInsetX, box.max.x - horizontalInsetX);
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
