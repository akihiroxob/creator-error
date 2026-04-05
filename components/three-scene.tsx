"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SplatMesh } from "@sparkjsdev/spark";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const ASSETS = {
  glb: {
    label: "room_edit.glb",
    url: "/api/assets/room_edit.glb",
    note: "glTF 2.0 の標準3Dモデル"
  },
  ply: {
    label: "3sdgs_room.ply",
    url: "/api/assets/3sdgs_room.ply",
    note: "Postshot由来の Gaussian Splatting 系 PLY"
  }
} as const;

type AssetMode = keyof typeof ASSETS;

function frameObject(camera: THREE.PerspectiveCamera, controls: OrbitControls, object: THREE.Object3D) {
  const box =
    object instanceof SplatMesh ? object.getBoundingBox() : new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z);

  if (!Number.isFinite(maxSize) || maxSize <= 0) {
    return;
  }

  const fitHeightDistance = maxSize / (2 * Math.tan((camera.fov * Math.PI) / 360));
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = 1.25 * Math.max(fitHeightDistance, fitWidthDistance);

  camera.near = Math.max(distance / 100, 0.01);
  camera.far = distance * 100;
  camera.position.set(center.x + distance * 0.65, center.y + distance * 0.35, center.z + distance);
  camera.updateProjectionMatrix();
  camera.lookAt(center);

  controls.target.copy(center);
  controls.update();
}

export function ThreeScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<AssetMode>("glb");
  const [status, setStatus] = useState("モデルを読み込み中...");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#09111f");
    scene.fog = new THREE.Fog("#09111f", 4, 13);

    const camera = new THREE.PerspectiveCamera(
      55,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.3, 4.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.9, 0);

    const ambientLight = new THREE.AmbientLight("#cfe7ff", 1.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight("#f7fbff", 2.2);
    directionalLight.position.set(4, 6, 3);
    scene.add(directionalLight);

    const grid = new THREE.GridHelper(8, 16, "#4f77a8", "#28405e");
    grid.position.y = -0.001;
    scene.add(grid);

    const gltfLoader = new GLTFLoader();
    let activeObject: THREE.Object3D | null = null;
    let disposed = false;

    const clock = new THREE.Clock();

    const onResize = () => {
      if (!mount) {
        return;
      }

      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    const disposeObject = (object: THREE.Object3D) => {
      if (object instanceof SplatMesh) {
        object.dispose();
        return;
      }

      object.traverse((child) => {
        if (!(child instanceof THREE.Mesh || child instanceof THREE.Points)) {
          return;
        }

        child.geometry.dispose();

        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose());
        } else {
          child.material.dispose();
        }
      });
    };

    const loadAsset = async () => {
      setStatus(`${ASSETS[mode].label} を読み込み中...`);

      try {
        let nextObject: THREE.Object3D;

        if (mode === "glb") {
          const gltf = await gltfLoader.loadAsync(ASSETS.glb.url);
          nextObject = gltf.scene;
          nextObject.name = ASSETS.glb.label;
        } else {
          const splatMesh = new SplatMesh({
            url: ASSETS.ply.url
          });
          nextObject = await splatMesh.initialized;
          nextObject.name = ASSETS.ply.label;
        }

        if (disposed) {
          disposeObject(nextObject);
          return;
        }

        if (activeObject) {
          scene.remove(activeObject);
          disposeObject(activeObject);
        }

        activeObject = nextObject;
        scene.add(nextObject);
        frameObject(camera, controls, nextObject);

        if (mode === "ply") {
          const splatCount =
            nextObject instanceof SplatMesh ? nextObject.packedSplats.numSplats : 0;
          setStatus(`${ASSETS.ply.label} を表示中 (${splatCount.toLocaleString()} splats)`);
        } else {
          setStatus(`${ASSETS.glb.label} を表示中`);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "不明なエラーで読み込みに失敗しました";
        setStatus(`読み込み失敗: ${message}`);
      }
    };

    const animate = () => {
      clock.getElapsedTime();
      controls.update();
      renderer.render(scene, camera);
    };

    window.addEventListener("resize", onResize);
    renderer.setAnimationLoop(animate);
    void loadAsset();

    return () => {
      disposed = true;
      window.removeEventListener("resize", onResize);
      renderer.setAnimationLoop(null);
      controls.dispose();

      if (activeObject) {
        disposeObject(activeObject);
      }

      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [mode]);

  return (
    <div className="viewer-stack">
      <div className="viewer-toolbar">
        <div className="viewer-toggle" role="tablist" aria-label="Viewer Assets">
          {(Object.keys(ASSETS) as AssetMode[]).map((assetMode) => (
            <button
              aria-selected={mode === assetMode}
              className={mode === assetMode ? "viewer-tab is-active" : "viewer-tab"}
              key={assetMode}
              onClick={() => setMode(assetMode)}
              role="tab"
              type="button"
            >
              {ASSETS[assetMode].label}
            </button>
          ))}
        </div>
        <p className="viewer-status">{status}</p>
        <p className="viewer-note">{ASSETS[mode].note}</p>
      </div>
      <div className="three-mount" ref={mountRef} />
    </div>
  );
}
