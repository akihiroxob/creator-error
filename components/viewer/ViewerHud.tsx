"use client";

import { CompassHud } from "@/components/viewer/CompassHud";
import { DetailPopupHud } from "@/components/viewer/DetailPopupHud";
import { MovementControlsHud } from "@/components/viewer/MovementControlsHud";
import { StatusHud } from "@/components/viewer/StatusHud";
import { useViewerUiStore } from "@/stores/viewerUiStore";

type MovementControlKey = "forward" | "back" | "left" | "right" | "up" | "down";

type ViewerHudProps = {
  endMovementControl: (key: MovementControlKey) => void;
  onJoystickPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onJoystickPointerLeave: (event: React.PointerEvent<HTMLDivElement>) => void;
  onJoystickPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onJoystickPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  setMovementControl: (key: MovementControlKey, active: boolean) => void;
};

export function ViewerHud({
  endMovementControl,
  onJoystickPointerDown,
  onJoystickPointerLeave,
  onJoystickPointerMove,
  onJoystickPointerUp,
  setMovementControl,
}: ViewerHudProps) {
  const { compass, detailPopup, dropHint, isDraggingOver, joystickOffset, status } =
    useViewerUiStore();

  return (
    <div className="contents">
      <div
        className={`pointer-events-none absolute inset-4 z-[1] rounded-[24px] transition-[border-color,background] duration-120 ease-out ${
          isDraggingOver
            ? "border border-[rgba(125,211,252,0.7)] bg-[rgba(14,165,233,0.08)]"
            : "border border-transparent bg-transparent"
        }`}
      />
      <CompassHud compass={compass} />
      <DetailPopupHud detailPopup={detailPopup} />
      {/* <StatusHud status={status} dropHint={dropHint} /> */}
      <MovementControlsHud
        joystickOffset={joystickOffset}
        onJoystickPointerDown={onJoystickPointerDown}
        onJoystickPointerMove={onJoystickPointerMove}
        onJoystickPointerUp={onJoystickPointerUp}
        onJoystickPointerLeave={onJoystickPointerLeave}
        setMovementControl={setMovementControl}
        endMovementControl={endMovementControl}
      />
    </div>
  );
}
