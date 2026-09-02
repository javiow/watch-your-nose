"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import {
  MASCOT_FRAME_FILES,
  MASCOT_FRAME_SRC,
  type MascotExpression,
} from "@/lib/mascot-frames";
import { useMascotExpression } from "@/lib/useMascotExpression";

interface MascotProps {
  /** 프레임 박스 크기 등 (하위 호환). */
  className?: string;
  /** 제어 모드 — 이 표정으로 고정하고 idle 루프/트리거를 끈다. */
  expression?: MascotExpression;
  /** idle 루프 + hover/press/focus 반응 활성화. 기본 false. */
  interactive?: boolean;
  /** CSS bob + pop-in 래퍼. 기본값 = interactive. */
  float?: boolean;
  /** 커서 근접 감지 대상(조상) 요소. */
  proximityRef?: { readonly current: HTMLElement | null };
  /** 근접 반응 반경(px). 기본 140. */
  proximityRadius?: number;
  /** idle 프레임에 next/image priority 부여. 기본값 = interactive. */
  priority?: boolean;
}

const IDLE_SRC = MASCOT_FRAME_SRC.idle;

export function Mascot({
  className,
  expression,
  interactive = false,
  float,
  proximityRef,
  proximityRadius = 140,
  priority,
}: MascotProps) {
  const useFloat = float ?? interactive;
  const usePriority = priority ?? interactive;
  const controlled = expression !== undefined;
  const enabled = interactive && !controlled;

  const {
    expression: liveExpression,
    isReducedMotion,
    react,
    bind,
  } = useMascotExpression({ enabled, controlledExpression: expression });

  const active = expression ?? liveExpression;
  const activeSrc = MASCOT_FRAME_SRC[active];

  const boxRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!enabled || isReducedMotion) return;
    if (typeof window === "undefined" || typeof PointerEvent === "undefined") {
      return;
    }
    const target = proximityRef?.current;
    if (!target) return;

    const onMove = (event: PointerEvent) => {
      const box = boxRef.current?.getBoundingClientRect();
      if (!box) return;
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      if (Math.hypot(event.clientX - cx, event.clientY - cy) <= proximityRadius) {
        react();
      }
    };

    target.addEventListener("pointermove", onMove);
    return () => target.removeEventListener("pointermove", onMove);
  }, [enabled, isReducedMotion, proximityRef, proximityRadius, react]);

  const wrapperClass = [
    "relative inline-block",
    useFloat ? "mascot-bob mascot-pop-in" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      ref={boxRef}
      aria-hidden="true"
      data-expression={active}
      className={wrapperClass}
      {...(enabled ? bind : {})}
    >
      {MASCOT_FRAME_FILES.map((src) => {
        const isActive = src === activeSrc;
        const isPriorityFrame = usePriority && src === IDLE_SRC;
        return (
          <Image
            key={src}
            src={src}
            alt=""
            aria-hidden="true"
            fill
            sizes="(max-width: 640px) 60vw, 320px"
            priority={isPriorityFrame}
            loading={isPriorityFrame ? undefined : "eager"}
            data-active={isActive ? "true" : "false"}
            className={`mascot-frame object-contain ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          />
        );
      })}
    </span>
  );
}
