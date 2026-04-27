"use client";

import * as THREE from "three";

export const SPARK_ASSET_URL =
  "https://pub-1d838c816462442a90bd803fa63dbda2.r2.dev/ply/demo/room5_clean.spz";
export const COLLISION_ASSET_URL =
  "https://pub-1d838c816462442a90bd803fa63dbda2.r2.dev/ply/demo/remesh.glb";
// export const SPARK_ASSET_URL = "/asset/room5_clean.spz";
// export const COLLISION_ASSET_URL = "/asset/remesh.glb";
export const INITIAL_RENDER_WARMUP_PASSES = 6;
export const INITIAL_RENDER_WARMUP_DELAY_MS = 300;
export const CAMERA_COLLISION_RADIUS = 0.22;
export const CAMERA_COLLISION_HEIGHT = 1.45;
export const SPLAT_MESH_ROTATION = new THREE.Euler(0, 0, Math.PI, "XYZ");
export const COLLISION_MESH_ROTATION = new THREE.Euler(-Math.PI / 2, 0, Math.PI, "XYZ");
export const POSITIONAL_AUDIO_SOURCES = [
  {
    loop: true,
    maxDistance: 5.8,
    name: "stream",
    refDistance: 0.9,
    rolloffFactor: 1.7,
    // url: "/asset/sample.mp3",
    url: "https://pub-1d838c816462442a90bd803fa63dbda2.r2.dev/sound/demo/sample.mp3",
    volume: 0.85,
    worldOffset: new THREE.Vector3(-0.95, 0.85, -1.25),
  },
] as const;
