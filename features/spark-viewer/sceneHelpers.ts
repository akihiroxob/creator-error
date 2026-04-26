"use client";

import { SplatMesh } from "@sparkjsdev/spark";
import * as THREE from "three";

import {
  CAMERA_COLLISION_HEIGHT,
  CAMERA_COLLISION_RADIUS,
} from "@/features/spark-viewer/sceneConstants";
import type { CompassState } from "@/features/spark-viewer/uiTypes";
import type { StartingView } from "@/features/spark-viewer/sceneTypes";

export function disposeObject3D(root: THREE.Object3D) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = mesh.material;
    if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
    else if (material instanceof THREE.Material) material.dispose();
  });
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
