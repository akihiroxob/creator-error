"use client";

export type CompassState = {
  heading: string;
  pitchDeg: number;
  rotationDeg: number;
};

export type JoystickVector = {
  x: number;
  y: number;
};

export type ViewerUiState = {
  compass: CompassState;
  joystickOffset: JoystickVector;
  status: string;
};
