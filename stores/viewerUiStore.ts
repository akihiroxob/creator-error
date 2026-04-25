"use client";

import { create } from "zustand";

import type {
  CompassState,
  DetailPopupState,
  JoystickVector,
  ViewerUiState,
} from "@/components/viewer/types";

type Updater<T> = T | ((current: T) => T);

type ViewerUiActions = {
  reset: () => void;
  setCompass: (next: Updater<CompassState>) => void;
  setDetailPopup: (next: Updater<DetailPopupState | null>) => void;
  setDropHint: (dropHint: string) => void;
  setIsDraggingOver: (isDraggingOver: boolean) => void;
  setJoystickOffset: (joystickOffset: JoystickVector) => void;
  setStatus: (status: string) => void;
};

type ViewerUiStore = ViewerUiState & ViewerUiActions;

const initialState: ViewerUiState = {
  compass: {
    heading: "N",
    pitchDeg: 0,
    rotationDeg: 0,
  },
  detailPopup: null,
  dropHint: "",
  isDraggingOver: false,
  joystickOffset: { x: 0, y: 0 },
  status: "Spark を読み込み中...",
};

const resolveUpdater = <T,>(current: T, next: Updater<T>) =>
  typeof next === "function" ? (next as (value: T) => T)(current) : next;

export const useViewerUiStore = create<ViewerUiStore>()((set) => ({
  ...initialState,
  reset: () => set(initialState),
  setCompass: (next) =>
    set((state) => ({
      compass: resolveUpdater(state.compass, next),
    })),
  setDetailPopup: (next) =>
    set((state) => ({
      detailPopup: resolveUpdater(state.detailPopup, next),
    })),
  setDropHint: (dropHint) => set({ dropHint }),
  setIsDraggingOver: (isDraggingOver) => set({ isDraggingOver }),
  setJoystickOffset: (joystickOffset) => set({ joystickOffset }),
  setStatus: (status) => set({ status }),
}));
