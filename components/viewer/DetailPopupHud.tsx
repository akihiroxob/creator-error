"use client";

import type { DetailPopupState } from "@/components/viewer/types";

type DetailPopupHudProps = {
  detailPopup: DetailPopupState | null;
};

export function DetailPopupHud({ detailPopup }: DetailPopupHudProps) {
  if (!detailPopup) return null;

  return (
    <div
      className="pointer-events-none absolute z-[2] w-[240px] -translate-x-1/2 translate-y-[calc(-100%-2px)] rounded-2xl border border-[rgba(125,211,252,0.28)] bg-[linear-gradient(180deg,rgba(8,17,30,0.94)_0%,rgba(15,23,42,0.9)_100%)] px-[14px] py-3 text-slate-50 shadow-[0_14px_40px_rgba(2,6,23,0.35)] backdrop-blur-[10px]"
      style={{ left: detailPopup.screenX, top: detailPopup.screenY }}
    >
      <div className="text-[10px] uppercase tracking-[0.14em] text-[rgba(125,211,252,0.82)]">
        Selected Asset
      </div>
      <div className="mt-1.5 text-base font-bold leading-[1.25]">
        {detailPopup.detail.productName}
      </div>
      <div className="mt-1 text-xs text-[rgba(226,232,240,0.8)]">
        型番 {detailPopup.detail.modelNumber}
      </div>
      <div className="mt-2.5 grid gap-2 text-xs leading-[1.45]">
        <div>
          <div className="text-[rgba(148,163,184,0.9)]">提供会社</div>
          <div>{detailPopup.detail.companyName}</div>
        </div>
        <div>
          <div className="text-[rgba(148,163,184,0.9)]">レンタル費用</div>
          <div>{detailPopup.detail.rentalCostLabel}</div>
        </div>
      </div>
      <div className="absolute bottom-[-10px] left-1/2 h-[18px] w-[18px] -translate-x-1/2 rotate-45 border-r border-b border-[rgba(125,211,252,0.28)] bg-[rgba(15,23,42,0.92)]" />
    </div>
  );
}
