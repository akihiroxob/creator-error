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

export function getObjectWorldBoundingBox(object: THREE.Object3D) {
  object.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(object);
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

export function alignCameraHeightToCollisionBounds(
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  bounds: THREE.Box3,
) {
  const size = bounds.getSize(new THREE.Vector3());
  const floorY = bounds.min.y;
  const ceilingY = bounds.max.y;
  const desiredEyeHeight = THREE.MathUtils.clamp(size.y * 0.1, 1.1, 1.75);
  const desiredY = THREE.MathUtils.clamp(
    floorY + desiredEyeHeight,
    floorY + 0.95,
    ceilingY - 0.2,
  );
  const deltaY = desiredY - camera.position.y;
  camera.position.y = desiredY;
  target.y += deltaY;

  const horizontalDirection = target.clone().sub(camera.position);
  horizontalDirection.y = 0;
  if (horizontalDirection.lengthSq() > 0) {
    horizontalDirection.normalize();
    const forwardNudge = THREE.MathUtils.clamp(Math.min(size.x, size.z) * 0.08, 0.2, 0.75);
    camera.position.addScaledVector(horizontalDirection, forwardNudge);
    target.addScaledVector(horizontalDirection, forwardNudge);
  }

  const insetX = THREE.MathUtils.clamp(size.x * 0.08, 0.2, 0.8);
  const insetZ = THREE.MathUtils.clamp(size.z * 0.08, 0.2, 0.8);
  camera.position.x = THREE.MathUtils.clamp(camera.position.x, bounds.min.x + insetX, bounds.max.x - insetX);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, bounds.min.z + insetZ, bounds.max.z - insetZ);

  camera.lookAt(target);
  return {
    ceilingY,
    desiredY,
    floorY,
  };
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
  const horizontalSpan = Math.max(size.x, size.z);
  const horizontalDepth = Math.min(size.x, size.z);
  const isInteriorLike =
    size.y >= 1.6 && horizontalDepth >= 1.6 && horizontalSpan / Math.max(size.y, 0.01) >= 1.15;
  const farPlane = Math.max(maxSize * 20, 100);
  camera.near = 0.01;
  camera.far = farPlane;
  camera.up.set(0, 1, 0);

  if (isInteriorLike) {
    const dominantHorizontalAxis = size.x >= size.z ? "x" : "z";
    const horizontalInsetX = Math.max(size.x * 0.18, 0.4);
    const horizontalInsetZ = Math.max(size.z * 0.18, 0.4);
    const eyeHeight = THREE.MathUtils.clamp(size.y * 0.12, 0.6, 1.4);
    const headroom = Math.max(size.y * 0.02, 0);
    const minimumInteriorY = box.min.y + Math.max(size.y * 0.04, 0.16);
    const lookDownOffset = Math.max(size.y * 0.03, 0.05);
    const initialRaise = THREE.MathUtils.clamp(Math.max(maxSize * 0.025, 0.14), 0.14, 0.32);
    const startOffset =
      dominantHorizontalAxis === "x" ? Math.max(size.x * 0.16, 0.8) : Math.max(size.z * 0.16, 0.8);
    const northLookOffset = Math.max(size.z * 0.08, 0.45);
    const extraLift = THREE.MathUtils.clamp(size.y * 0.72, 2.2, 4.8);
    const forwardNudge =
      dominantHorizontalAxis === "x"
        ? THREE.MathUtils.clamp(size.z * 0.06, 0.18, 0.65)
        : THREE.MathUtils.clamp(size.z * 0.08, 0.24, 0.9);

    start.y = THREE.MathUtils.clamp(
      Math.max(box.min.y + eyeHeight + initialRaise + extraLift, minimumInteriorY),
      box.min.y + 1.2,
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
    start.z = THREE.MathUtils.clamp(
      start.z - forwardNudge,
      box.min.z + horizontalInsetZ,
      box.max.z - horizontalInsetZ,
    );
    target.z = THREE.MathUtils.clamp(
      target.z - forwardNudge,
      box.min.z + horizontalInsetZ,
      box.max.z - horizontalInsetZ,
    );
  } else {
    const radius = Math.max(size.length() * 0.5, maxSize * 0.5, 0.5);
    const fitOffset = radius / Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
    const startDirection = new THREE.Vector3(-0.85, 0.35, 1).normalize();
    const framingDistance = Math.max(fitOffset * 1.15, radius * 1.8, 1.25);
    const verticalBias = THREE.MathUtils.clamp(size.y * 0.12, 0.1, radius * 0.45);

    target.copy(center);
    target.y = center.y + verticalBias;
    start.copy(center).addScaledVector(startDirection, framingDistance);
    start.y = center.y + verticalBias + framingDistance * 0.12;
    if (start.y < box.min.y + 0.2) {
      start.y = box.min.y + 0.2;
    }
    if (target.y > box.max.y) {
      target.y = box.max.y;
    }
  }

  camera.position.copy(start);
  camera.lookAt(target);
  orientation.setFromQuaternion(camera.quaternion, "YXZ");
  camera.updateProjectionMatrix();
  return {
    moveSpeed: Math.max(maxSize * 0.2, isInteriorLike ? 0.35 : 0.2),
    pitch: orientation.x,
    position: start.clone(),
    radius: Math.max(camera.position.distanceTo(target), 0.1),
    target,
    yaw: orientation.y,
  };
}
