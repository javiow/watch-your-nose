"use client";

import { useState } from "react";
import type { JeonseFieldStatus, JeonseHouse } from "@/types/experience";

function statusClassFor(status: JeonseFieldStatus): string {
  if (status === "위험") return "border-danger/60 text-danger";
  if (status === "주의") return "border-amber-500/60 text-amber-600";
  return "border-border text-subtle";
}

export interface HouseDialogPanelProps {
  house: JeonseHouse;
  answered: boolean;
  answer?: boolean; // answered일 때만 의미 있음: true=O(위험 있음) 선택, false=X(위험 없음) 선택
  onAnswer: (risky: boolean) => void;
  onClose: () => void;
  hintRevealed: boolean;
  hintAvailable: boolean;
  onUseHint: () => void;
}

export function HouseDialogPanel({
  house,
  answered,
  answer,
  onAnswer,
  onClose,
  hintRevealed,
  hintAvailable,
  onUseHint,
}: HouseDialogPanelProps) {
  const [confirmed, setConfirmed] = useState(answered);

  if (!confirmed) {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
        <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6">
          <p className="text-xs uppercase tracking-wide text-subtle">{house.addr}</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">{house.name}</h2>
          <p className="mt-4 text-sm text-muted">서류를 확인하려면 확인을 눌러주세요.</p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setConfirmed(true)}
              className="min-h-11 rounded-lg bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              확인
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-lg border border-border px-5 text-sm text-muted transition-colors hover:bg-surface-muted"
            >
              나중에
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-surface">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-subtle">{house.addr}</p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">{house.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 shrink-0 rounded-lg border border-border px-4 text-sm text-muted transition-colors hover:bg-surface-muted"
          >
            닫기
          </button>
        </div>

        <div
          className={`grid divide-x divide-border border-b border-border ${
            house.monthlyRent ? "grid-cols-4" : "grid-cols-3"
          }`}
        >
          <div className="p-4">
            <p className="text-[10px] uppercase tracking-wide text-subtle">보증금</p>
            <p className="mt-1 text-lg font-bold text-foreground">{house.deposit}</p>
          </div>
          {house.monthlyRent && (
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-wide text-subtle">월세</p>
              <p className="mt-1 text-lg font-bold text-foreground">{house.monthlyRent}</p>
            </div>
          )}
          <div className="p-4">
            <p className="text-[10px] uppercase tracking-wide text-subtle">시세</p>
            <p className="mt-1 text-lg font-bold text-foreground">{house.market}</p>
          </div>
          <div className="p-4">
            <p className="text-[10px] uppercase tracking-wide text-subtle">전세가율</p>
            <p className="mt-1 text-lg font-bold text-foreground">{house.ratio}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <p className="text-xs text-subtle">
            {hintRevealed
              ? "힌트로 이 집의 서류 상태를 확인했습니다."
              : hintAvailable
                ? "서류 상태(정상/주의/위험)는 가려져 있습니다. 세션당 1회, 힌트로 모두 확인할 수 있습니다."
                : "힌트를 이미 다른 매물에서 사용했습니다."}
          </p>
          {!answered && !hintRevealed && (
            <button
              type="button"
              onClick={onUseHint}
              disabled={!hintAvailable}
              className="min-h-11 shrink-0 rounded-lg border border-accent/60 px-4 text-sm font-medium text-accent transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:border-border disabled:text-subtle disabled:hover:bg-transparent"
            >
              힌트 사용
            </button>
          )}
        </div>

        <div className="divide-y divide-border px-5">
          {house.fields.map(([label, value, status]) => (
            <div key={label} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-muted">{label}</p>
                {hintRevealed && (
                  <span
                    className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${statusClassFor(status)}`}
                  >
                    {status}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted">{value}</p>
            </div>
          ))}
        </div>

        {answered ? (
          <div className="p-5">
            <p className="text-base font-semibold text-foreground">당신의 판정</p>
            <p className="mt-1 text-sm text-muted">
              {answer ? "O — 위험 있음 (계약 보류)" : "X — 위험 없음 (계약 가능)"}
            </p>
          </div>
        ) : (
          <div className="p-5">
            <p className="text-base font-semibold text-foreground">이 집, 위험 신호가 있습니까?</p>
            <p className="mt-1 text-xs text-subtle">
              O — 위험 있음 (계약 보류) · X — 위험 없음 (계약 가능)
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => onAnswer(true)}
                className="min-h-11 flex-1 rounded-lg bg-danger px-4 text-sm font-medium text-white transition-colors hover:brightness-95"
              >
                O — 위험 있음
              </button>
              <button
                type="button"
                onClick={() => onAnswer(false)}
                className="min-h-11 flex-1 rounded-lg bg-safe px-4 text-sm font-medium text-white transition-colors hover:brightness-95"
              >
                X — 위험 없음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
