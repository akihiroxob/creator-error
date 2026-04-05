"use client";

import { useEffect, useRef, useState } from "react";
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import * as THREE from "three";

const SCENE_ROTATION = [1, 0, 0, 0] as const;
const MOVEMENT_KEYS = new Set([
  "w",
  "a",
  "s",
  "d",
  " ",
  "Shift"
]);

function placeInteriorCamera(viewer: any) {
  const splatMesh = viewer.getSplatMesh?.();

  if (!splatMesh) {
    return null;
  }

  const splatCount = splatMesh.getSplatCount?.() ?? 0;

  if (splatCount <= 0) {
    return null;
  }

  const box = new THREE.Box3();
  const center = new THREE.Vector3();
  const temp = new THREE.Vector3();
  const step = Math.max(1, Math.ceil(splatCount / 5000));

  for (let index = 0; index < splatCount; index += step) {
    splatMesh.getSplatCenter(index, temp);
    box.expandByPoint(temp);
  }

  if (box.isEmpty()) {
    return null;
  }

  box.getCenter(center);

  const size = box.getSize(new THREE.Vector3());
  const camera = viewer.camera;

  if (!camera || size.lengthSq() <= 0) {
    return null;
  }

  const eyeHeight = box.min.y + size.y * 0.42;
  const cameraPosition = new THREE.Vector3(
    center.x,
    eyeHeight,
    center.z + size.z * 0.18
  );
  const lookAt = new THREE.Vector3(
    center.x,
    eyeHeight,
    center.z - size.z * 0.28
  );

  camera.near = 0.03;
  camera.far = Math.max(size.length() * 3, 50);
  camera.position.copy(cameraPosition);
  camera.up.set(0, 1, 0);
  camera.lookAt(lookAt);
  camera.updateProjectionMatrix();

  viewer.forceRenderNextFrame?.();
  viewer.update?.();
  viewer.render?.();

  return {
    target: lookAt.clone(),
    moveSpeed: Math.max(size.length() * 0.0035, 0.02),
    turnSpeed: Math.PI / 180
  };
}

function updateNavigation(
  viewer: any,
  target: THREE.Vector3,
  keys: Set<string>,
  moveSpeed: number
) {
  const camera = viewer.camera;

  if (!camera) {
    return;
  }

  const forward = target.clone().sub(camera.position).setY(0);

  if (forward.lengthSq() === 0) {
    forward.set(0, 0, -1);
  } else {
    forward.normalize();
  }

  const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
  const movement = new THREE.Vector3();

  if (keys.has("w")) {
    movement.add(forward);
  }

  if (keys.has("s")) {
    movement.sub(forward);
  }

  if (keys.has("d")) {
    movement.add(right);
  }

  if (keys.has("a")) {
    movement.sub(right);
  }

  if (keys.has(" ")) {
    movement.y += 1;
  }

  if (keys.has("Shift")) {
    movement.y -= 1;
  }

  let changed = false;

  if (movement.lengthSq() > 0) {
    movement.normalize().multiplyScalar(moveSpeed);
    camera.position.add(movement);
    target.add(movement);
    changed = true;
  }

  if (!changed) {
    return;
  }

  camera.lookAt(target);
  camera.updateProjectionMatrix();
  viewer.forceRenderNextFrame?.();
  viewer.update?.();
  viewer.render?.();
}

export function GaussianScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState("GaussianSplats3D を読み込み中...");

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return;
    }

    let disposed = false;
    let viewer: any = null;
    let navigationTarget: THREE.Vector3 | null = null;
    let moveSpeed = 0.03;
    const pressedKeys = new Set<string>();
    let movementFrame = 0;
    let isDragging = false;
    let yaw = 0;
    let pitch = 0;
    let radius = 1;
    let lastPointerX = 0;
    let lastPointerY = 0;

    const waitForRenderableScene = async () => {
      for (let attempt = 0; attempt < 120; attempt += 1) {
        if (disposed || viewer?.splatRenderReady) {
          return;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 50));
      }
    };

    const tickMovement = () => {
      movementFrame = window.requestAnimationFrame(tickMovement);

      if (!viewer || !navigationTarget || pressedKeys.size === 0) {
        return;
      }

      updateNavigation(viewer, navigationTarget, pressedKeys, moveSpeed);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!MOVEMENT_KEYS.has(event.key)) {
        return;
      }

      pressedKeys.add(event.key);
      event.preventDefault();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (!MOVEMENT_KEYS.has(event.key)) {
        return;
      }

      pressedKeys.delete(event.key);
    };

    const syncCameraDirection = () => {
      if (!viewer?.camera || !navigationTarget) {
        return;
      }

      const direction = new THREE.Vector3(
        Math.sin(yaw) * Math.cos(pitch),
        Math.sin(pitch),
        -Math.cos(yaw) * Math.cos(pitch)
      ).normalize();

      navigationTarget.copy(viewer.camera.position).add(direction.multiplyScalar(radius));
      viewer.camera.lookAt(navigationTarget);
      viewer.camera.updateProjectionMatrix();
      viewer.forceRenderNextFrame?.();
      viewer.update?.();
      viewer.render?.();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }

      isDragging = true;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      mount.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!isDragging || !viewer?.camera || !navigationTarget) {
        return;
      }

      const deltaX = event.clientX - lastPointerX;
      const deltaY = event.clientY - lastPointerY;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;

      yaw += deltaX * 0.0035;
      pitch = THREE.MathUtils.clamp(pitch - deltaY * 0.0025, -Math.PI / 2.2, Math.PI / 2.2);
      syncCameraDirection();
    };

    const stopDragging = (event?: PointerEvent) => {
      isDragging = false;

      if (event) {
        mount.releasePointerCapture?.(event.pointerId);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    mount.addEventListener("pointerdown", onPointerDown);
    mount.addEventListener("pointermove", onPointerMove);
    mount.addEventListener("pointerup", stopDragging);
    mount.addEventListener("pointerleave", stopDragging);
    mount.addEventListener("pointercancel", stopDragging);
    movementFrame = window.requestAnimationFrame(tickMovement);

    void (async () => {
      try {
        setStatus("GaussianSplats3D で 3sdgs_room.ksplat を読み込み中...");

        viewer = new GaussianSplats3D.Viewer({
          rootElement: mount,
          selfDrivenMode: true,
          useBuiltInControls: false,
          ignoreDevicePixelRatio: true,
          gpuAcceleratedSort: false,
          enableSIMDInSort: true,
          sharedMemoryForWorkers: false,
          integerBasedSort: false,
          halfPrecisionCovariancesOnGPU: true,
          dynamicScene: false,
          renderMode: GaussianSplats3D.RenderMode.Always,
          sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
          antialiased: false,
          sphericalHarmonicsDegree: 0,
          enableOptionalEffects: false,
          logLevel: GaussianSplats3D.LogLevel.None,
          cameraUp: [0, 1, 0],
          initialCameraPosition: [3, 2, 4],
          initialCameraLookAt: [0, 0.5, 0]
        });

        await viewer.addSplatScene("/api/assets/3sdgs_room.ksplat", {
          format: GaussianSplats3D.SceneFormat.KSplat,
          showLoadingUI: false,
          rotation: SCENE_ROTATION
        });

        if (disposed) {
          viewer.stop();
          viewer.dispose();
          return;
        }

        viewer.start();
        await waitForRenderableScene();
        const navigation = placeInteriorCamera(viewer);
        navigationTarget = navigation?.target ?? null;
        moveSpeed = navigation?.moveSpeed ?? moveSpeed;
        if (navigationTarget) {
          const initialDirection = navigationTarget.clone().sub(viewer.camera.position).normalize();
          radius = viewer.camera.position.distanceTo(navigationTarget);
          yaw = Math.atan2(initialDirection.x, -initialDirection.z);
          pitch = Math.asin(initialDirection.y);
        }
        const splatCount = viewer.getSplatMesh?.()?.getSplatCount?.() ?? 0;
        setStatus(
          `GaussianSplats3D: interior move enabled (${splatCount.toLocaleString()} splats)`
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "不明なエラーで読み込みに失敗しました";
        setStatus(`読み込み失敗: ${message}`);
      }
    })();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(movementFrame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      mount.removeEventListener("pointerdown", onPointerDown);
      mount.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("pointerup", stopDragging);
      mount.removeEventListener("pointerleave", stopDragging);
      mount.removeEventListener("pointercancel", stopDragging);

      if (viewer) {
        viewer.stop();
        viewer.dispose();
      }
    };
  }, []);

  return (
    <div className="viewer-stack">
      <div className="viewer-toolbar">
        <p className="viewer-status">{status}</p>
        <p className="viewer-note">
          `WASD` で水平移動、`Space` / `Shift` で上下、左ドラッグで視点回転できます
        </p>
      </div>
      <div className="three-mount" ref={mountRef} />
    </div>
  );
}
