"use client";

import type * as THREE from "three";

import type { PlacementObjectDetail } from "@/components/viewer/types";

export type InputState = {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  faster: boolean;
};

export type OrientationState = {
  yaw: number;
  pitch: number;
};

export type StartingView = {
  moveSpeed: number;
  pitch: number;
  position: THREE.Vector3;
  radius: number;
  target: THREE.Vector3;
  yaw: number;
};

export type SampleObject = {
  id: string;
  name: string;
  description: string;
  color: string;
  shape: "box" | "cylinder";
  size: [number, number, number];
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

export type ObjectInteractionMode = "idle" | "selected" | "moving" | "rotating";
export type DetailVisibility = "hidden" | "visible";

export type PlacementObjectUserData = {
  detail?: PlacementObjectDetail;
  detailVisibility?: DetailVisibility;
  dispose?: () => void;
  originalMaterial?: THREE.Material | THREE.Material[];
  interactionMode?: ObjectInteractionMode;
  selectable?: boolean;
  selectionIndicator?: THREE.Object3D;
};

export type MovementControlKey = keyof Pick<
  InputState,
  "forward" | "back" | "left" | "right" | "up" | "down"
>;

export type SparkSceneProps = {
  onLoadingStateChange?: (state: ViewerLoadingState) => void;
  soundEnabled?: boolean;
  showCollisionMesh?: boolean;
};
