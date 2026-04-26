"use client";

import * as THREE from "three";

import type { CompassState } from "@/features/spark-viewer/uiTypes";

type CompassHudProps = {
  compass: CompassState;
};

export function CompassHud({ compass }: CompassHudProps) {
  return (
    <div className="pointer-events-none absolute right-4 bottom-4 z-[1] min-h-0 w-[120px] max-w-[calc(100vw-32px)] rounded-[18px] bg-[rgba(8,17,30,0.7)] px-[14px] py-3 text-[rgba(255,255,255,0.92)] backdrop-blur-[10px]">
      <div
        aria-label={`現在の向き ${compass.heading}`}
        className="relative mx-auto h-[92px] w-[92px] rounded-full border border-[rgba(125,211,252,0.28)] bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.14),rgba(15,23,42,0.2)_60%,rgba(15,23,42,0.5)_100%)]"
      >
        <div className="absolute top-3 right-[-28px] bottom-3 w-3 overflow-hidden rounded-full border border-[rgba(125,211,252,0.24)] bg-[rgba(15,23,42,0.82)]">
          <div className="absolute top-1/2 right-px left-px h-px bg-[rgba(226,232,240,0.24)]" />
          <div
            className="absolute right-px left-px h-[10px] -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#7dd3fc_0%,#38bdf8_100%)] shadow-[0_0_12px_rgba(56,189,248,0.45)]"
            style={{
              top: `${50 - THREE.MathUtils.clamp(compass.pitchDeg / 90, -1, 1) * 44}%`,
            }}
          />
        </div>
        <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-50">
          N
        </span>
        <span className="absolute top-1/2 right-2 -translate-y-1/2 text-[11px] font-medium text-[rgba(226,232,240,0.68)]">
          E
        </span>
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] font-medium text-[rgba(226,232,240,0.68)]">
          S
        </span>
        <span className="absolute top-1/2 left-2 -translate-y-1/2 text-[11px] font-medium text-[rgba(226,232,240,0.68)]">
          W
        </span>
        <div
          className="absolute inset-[18px] transition-transform duration-120 ease-out"
          style={{ transform: `rotate(${compass.rotationDeg}deg)` }}
        >
          <div className="absolute top-0.5 left-1/2 h-8 w-0.5 origin-bottom -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,#38bdf8_0%,rgba(56,189,248,0.12)_100%)]" />
          <div className="absolute top-[-2px] left-1/2 h-0 w-0 -translate-x-1/2 border-r-[6px] border-l-[6px] border-b-[12px] border-r-transparent border-l-transparent border-b-[#38bdf8]" />
        </div>
        <div className="absolute top-1/2 left-1/2 h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e2e8f0]" />
      </div>
    </div>
  );
}
