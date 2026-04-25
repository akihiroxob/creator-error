"use client";

type StatusHudProps = {
  dropHint: string;
  status: string;
};

export function StatusHud({ dropHint, status }: StatusHudProps) {
  return (
    <div className="pointer-events-none absolute right-4 bottom-4 left-4 z-[1] max-w-[min(560px,calc(100vw-32px))] rounded-xl bg-[rgba(8,17,30,0.65)] px-3 py-2.5 text-xs leading-[1.5] tracking-[0.01em] text-[rgba(255,255,255,0.9)] backdrop-blur-[8px]">
      <div>{status}</div>
      <div className="opacity-75">
        Mobile joystick or W/A/S/D move · Q down · E up · drag to look · click object to select
        · drag to move · Shift+drag or [ ] rotate
      </div>
      <div className="opacity-75">{dropHint}</div>
    </div>
  );
}
