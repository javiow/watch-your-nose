"use client";

import { useEffect, useId, useRef, useState } from "react";

interface TermTooltipProps {
  /** 화면에 보이는 용어 표시 텍스트 */
  term: string;
  /** 탭하면 뜨는 짧은 정의 */
  definition: string;
}

/**
 * 체험 콘텐츠 안의 전문 용어 옆에 붙는 (?) 버튼. 탭/클릭하면 짧은 정의가 뜨고,
 * 바깥을 탭하거나 Esc를 누르면 닫힌다. 호버 전제의 tooltip이 아니라 탭으로 열고
 * 유지하는 toggletip 패턴이므로 role="tooltip" 대신 aria-expanded/-controls를 쓴다.
 */
export function TermTooltip({ term, definition }: TermTooltipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <span ref={rootRef} className="relative inline">
      {term}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={popoverId}
        aria-label={`${term} 뜻풀이 ${open ? "닫기" : "보기"}`}
        onClick={() => setOpen((prev) => !prev)}
        className="mx-0.5 inline-flex h-[1.15em] w-[1.15em] -translate-y-[0.15em] items-center justify-center rounded-full border border-subtle p-1 align-middle text-[0.7em] leading-none text-subtle transition-colors hover:border-accent hover:text-accent"
      >
        ?
      </button>
      {open && (
        <span
          id={popoverId}
          role="note"
          aria-live="polite"
          className="absolute left-0 top-[calc(100%+4px)] z-30 block w-56 max-w-[80vw] rounded-lg border border-border bg-surface p-3 text-xs font-normal leading-relaxed text-muted shadow-md"
        >
          {definition}
        </span>
      )}
    </span>
  );
}
