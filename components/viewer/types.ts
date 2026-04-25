"use client";

export type PlacementObjectDetail = {
  productName: string;
  modelNumber: string;
  companyName: string;
  rentalCostLabel: string;
};

export type CompassState = {
  heading: string;
  pitchDeg: number;
  rotationDeg: number;
};

export type DetailPopupState = {
  detail: PlacementObjectDetail;
  screenX: number;
  screenY: number;
};

export type JoystickVector = {
  x: number;
  y: number;
};

export type ViewerUiState = {
  compass: CompassState;
  detailPopup: DetailPopupState | null;
  dropHint: string;
  isDraggingOver: boolean;
  joystickOffset: JoystickVector;
  status: string;
};
