"use client";

import * as THREE from "three";

// export const SPARK_ASSET_URL =
// "https://pub-1d838c816462442a90bd803fa63dbda2.r2.dev/ply/3sdgs_room.ksplat";
// export const COLLISION_ASSET_URL =
// "https://pub-1d838c816462442a90bd803fa63dbda2.r2.dev/ply/room_edit.glb";
export const SPARK_ASSET_URL = "/asset/3sdgs_room.ksplat";
export const COLLISION_ASSET_URL = "/asset/room_edit.glb";
export const INITIAL_RENDER_WARMUP_PASSES = 6;
export const INITIAL_RENDER_WARMUP_DELAY_MS = 300;
export const CAMERA_COLLISION_RADIUS = 0.22;
export const CAMERA_COLLISION_HEIGHT = 1.45;
export const COLLISION_MESH_ROTATION = new THREE.Euler(-Math.PI / 2, 0, Math.PI, "XYZ");
export const POSITIONAL_AUDIO_SOURCES = [
  {
    loop: true,
    maxDistance: 5.8,
    name: "stream",
    refDistance: 0.9,
    rolloffFactor: 1.7,
    url: "/asset/track1.mp3",
    volume: 0.85,
    worldOffset: new THREE.Vector3(-0.95, 0.85, -1.25),
  },
  // {
  //   loop: true,
  //   maxDistance: 4.8,
  //   name: "chime",
  //   refDistance: 0.75,
  //   rolloffFactor: 1.9,
  //   url: "/asset/chime.wav",
  //   volume: 0.58,
  //   worldOffset: new THREE.Vector3(0.95, 1.05, 1.15),
  // },
] as const;
