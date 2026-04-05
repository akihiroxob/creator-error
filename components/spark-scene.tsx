"use client";

import { useEffect, useRef, useState } from "react";
import { SplatMesh } from "@sparkjsdev/spark";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

function frameObject(camera: THREE.PerspectiveCamera, controls: OrbitControls, object: SplatMesh) {
  const box = object.getBoundingBox();
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z);

  if (!Number.isFinite(maxSize) || maxSize <= 0) {
    return;
  }

  const fitHeightDistance = maxSize / (2 * Math.tan((camera.fov * Math.PI) / 360));
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = 1.2 * Math.max(fitHeightDistance, fitWidthDistance);

  camera.near = Math.max(distance / 100, 0.01);
  camera.far = distance * 100;
  camera.position.set(center.x + distance * 0.55, center.y + distance * 0.25, center.z + distance);
  camera.lookAt(center);
  camera.updateProjectionMatrix();

  controls.target.copy(center);
  controls.update();
}

export function SparkScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState("Spark を読み込み中...");

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#08111e");

    const camera = new THREE.PerspectiveCamera(
      55,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(1);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;

    let splatMesh: SplatMesh | null = null;
    let disposed = false;

    const renderFrame = () => {
      renderer.render(scene, camera);
    };

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderFrame();
    };

    controls.addEventListener("change", renderFrame);
    window.addEventListener("resize", onResize);

    void (async () => {
      try {
        setStatus("Spark で 3sdgs_room.ply を読み込み中...");

        splatMesh = await new SplatMesh({
          url: "/api/assets/3sdgs_room.ply"
        }).initialized;

        if (disposed) {
          splatMesh.dispose();
          return;
        }

        scene.add(splatMesh);
        frameObject(camera, controls, splatMesh);
        renderFrame();
        setStatus(`Spark: ${splatMesh.packedSplats.numSplats.toLocaleString()} splats`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "不明なエラーで読み込みに失敗しました";
        setStatus(`読み込み失敗: ${message}`);
      }
    })();

    return () => {
      disposed = true;
      window.removeEventListener("resize", onResize);
      controls.removeEventListener("change", renderFrame);
      controls.dispose();
      splatMesh?.dispose();
      renderer.dispose();

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="viewer-stack">
      <div className="viewer-toolbar">
        <p className="viewer-status">{status}</p>
        <p className="viewer-note">
          `antialias: false` と `pixelRatio: 1` の軽量設定で `PLY` を Spark に直接読ませています
        </p>
      </div>
      <div className="three-mount" ref={mountRef} />
    </div>
  );
}
