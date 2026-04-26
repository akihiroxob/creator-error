"use client";

import { CompassHud } from "@/features/spark-viewer/components/CompassHud";
import { MovementControlsHud } from "@/features/spark-viewer/components/MovementControlsHud";
import { useViewerUiStore } from "@/features/spark-viewer/stores/viewerUiStore";

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
  const { compass, joystickOffset } = useViewerUiStore();

  return (
    <div className="contents">
      <CompassHud compass={compass} />
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
