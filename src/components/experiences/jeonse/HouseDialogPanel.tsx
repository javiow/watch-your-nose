"use client";

import { useState } from "react";
import type { JeonseFieldStatus, JeonseHouse } from "@/types/experience";

function statusClassFor(status: JeonseFieldStatus): string {
  if (status === "위험") return "border-red-500/60 text-red-400";
  if (status === "주의") return "border-amber-500/60 text-amber-400";
  return "border-neutral-700 text-neutral-500";
}

interface HouseDialogPanelProps {
  house: JeonseHouse;
  answered: boolean;
  onAnswer: (risky: boolean) => void;
  onClose: () => void;
}

export function HouseDialogPanel({ house, answered, onAnswer, onClose }: HouseDialogPanelProps) {
  const [confirmed, setConfirmed] = useState(answered);

  if (!confirmed) {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
        <div className="w-full max-w-md rounded-lg border border-neutral-800 bg-[#141414] p-6">
          <p className="text-xs uppercase tracking-wide text-neutral-500">{house.addr}</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{house.name}</h2>
          <p className="mt-4 text-sm text-neutral-300">서류를 확인하려면 확인을 눌러주세요.</p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setConfirmed(true)}
              className="min-h-11 rounded-lg bg-blue-500 px-5 text-sm font-medium text-white transition-colors hover:bg-blue-400"
            >
              확인
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-lg border border-neutral-700 px-5 text-sm text-neutral-300 transition-colors hover:bg-neutral-800"
            >
              나중에
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (answered) {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
        <div className="w-full max-w-md rounded-lg border border-neutral-800 bg-[#141414] p-6">
          <p className="text-sm text-neutral-300">판정을 기록했습니다. 다음 집으로 이동하세요.</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 min-h-11 rounded-lg bg-blue-500 px-5 text-sm font-medium text-white transition-colors hover:bg-blue-400"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-neutral-800 bg-[#141414]">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-800 p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">{house.addr}</p>
            <h2 className="mt-1 text-lg font-semibold text-white">{house.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 shrink-0 rounded-lg border border-neutral-700 px-4 text-sm text-neutral-300 transition-colors hover:bg-neutral-800"
          >
            닫기
          </button>
        </div>

        <div
          className={`grid divide-x divide-neutral-800 border-b border-neutral-800 ${
            house.monthlyRent ? "grid-cols-4" : "grid-cols-3"
          }`}
        >
          <div className="p-4">
            <p className="text-[10px] uppercase tracking-wide text-neutral-500">보증금</p>
            <p className="mt-1 text-lg font-bold text-white">{house.deposit}</p>
          </div>
          {house.monthlyRent && (
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">월세</p>
              <p className="mt-1 text-lg font-bold text-white">{house.monthlyRent}</p>
            </div>
          )}
          <div className="p-4">
            <p className="text-[10px] uppercase tracking-wide text-neutral-500">시세</p>
            <p className="mt-1 text-lg font-bold text-white">{house.market}</p>
          </div>
          <div className="p-4">
            <p className="text-[10px] uppercase tracking-wide text-neutral-500">전세가율</p>
            <p className="mt-1 text-lg font-bold text-white">{house.ratio}</p>
          </div>
        </div>

        <div className="divide-y divide-neutral-800 px-5">
          {house.fields.map(([label, value, status]) => (
            <div key={label} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-neutral-400">{label}</p>
                <span
                  className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${statusClassFor(status)}`}
                >
                  {status}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-neutral-300">{value}</p>
            </div>
          ))}
        </div>

        <div className="p-5">
          <p className="text-base font-semibold text-white">이 집, 위험 신호가 있습니까?</p>
          <p className="mt-1 text-xs text-neutral-500">
            O — 위험 있음 (계약 보류) · X — 위험 없음 (계약 가능)
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => onAnswer(true)}
              className="min-h-11 flex-1 rounded-lg bg-red-500 px-4 text-sm font-medium text-white transition-colors hover:bg-red-400"
            >
              O — 위험 있음
            </button>
            <button
              type="button"
              onClick={() => onAnswer(false)}
              className="min-h-11 flex-1 rounded-lg bg-green-600 px-4 text-sm font-medium text-white transition-colors hover:bg-green-500"
            >
              X — 위험 없음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
