"use client";

import { useEffect, useId, useRef } from "react";
import type { ExperienceFormatMeta } from "@/data/experience-format";
import type { ExperienceIntroMeta } from "@/data/experience-intro";
import { FormatBadge } from "./FormatBadge";
import { Prose } from "./Prose";

interface IntroDialogProps {
  format: ExperienceFormatMeta;
  intro: ExperienceIntroMeta;
  /** 확인 버튼 라벨 (예: "통화 시작", "조사 시작", "점검 시작", "판정 시작") */
  confirmLabel: string;
  onConfirm: () => void;
  onDismiss?: () => void;
  /** "gate": 시작 전 필수 안내(Esc·바깥 클릭으로 안 닫힘). "help": 진행 중 재열람. */
  mode?: "gate" | "help";
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * 체험 시작 전(그리고 진행 중 "안내 다시 보기") 상황·할 일을 보여주는 공용 모달.
 * mode="gate"에서는 확인 버튼을 눌러야만 넘어간다 — Esc·오버레이 클릭으로 닫히지 않는다.
 */
export function IntroDialog({
  format,
  intro,
  confirmLabel,
  onConfirm,
  onDismiss,
  mode = "gate",
}: IntroDialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    primaryRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (mode === "help") onDismiss?.();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [mode, onDismiss]);

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4"
      onClick={mode === "help" ? () => onDismiss?.() : undefined}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-lg border border-border bg-surface p-6"
      >
        <FormatBadge format={format} />

        <h2 id={titleId} className="text-lg font-semibold text-foreground">
          잠깐, 상황을 확인하세요
        </h2>

        <Prose text={intro.situation} />

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted">이번에 할 일</p>
          <ol className="flex flex-col gap-1.5">
            {intro.task.map((step, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted">
                <span aria-hidden="true" className="font-medium text-accent">
                  {i + 1}.
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-2 flex justify-end">
          {mode === "gate" ? (
            <button
              ref={primaryRef}
              type="button"
              onClick={onConfirm}
              className="min-h-11 rounded-xl bg-accent px-6 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              {confirmLabel}
            </button>
          ) : (
            <button
              ref={primaryRef}
              type="button"
              onClick={() => onDismiss?.()}
              className="min-h-11 rounded-xl border border-border px-6 text-sm text-muted transition-colors hover:bg-surface-muted"
            >
              닫기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
