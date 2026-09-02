"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BLINK_HOLD_MS,
  BLINK_MAX_MS,
  BLINK_MIN_MS,
  OCCASIONAL_LOOK_EVERY,
  OCCASIONAL_LOOK_MS,
  REACTION_SETTLE_MS,
  REACTION_SURPRISE_MS,
  type MascotExpression,
} from "@/lib/mascot-frames";
import { useReducedMotion } from "@/lib/useReducedMotion";

interface UseMascotExpressionOptions {
  /** idle 루프 + 포인터/hover/포커스 반응 활성화. 기본 true. */
  enabled?: boolean;
  /** idle 상태에서 보여줄 기본 표정. 기본 "idle". */
  baseExpression?: MascotExpression;
  /** 지정 시 그 값을 그대로 반환하는 제어 모드 — 타이머를 일절 걸지 않는다. */
  controlledExpression?: MascotExpression;
}

interface MascotBindHandlers {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onPointerDown: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

interface UseMascotExpressionResult {
  expression: MascotExpression;
  isReducedMotion: boolean;
  react: (kind?: "surprised") => void;
  bind: MascotBindHandlers;
}

const NOOP = () => {};
const NOOP_BIND: MascotBindHandlers = {
  onMouseEnter: NOOP,
  onMouseLeave: NOOP,
  onPointerDown: NOOP,
  onFocus: NOOP,
  onBlur: NOOP,
};

type Timer = ReturnType<typeof setTimeout>;

/**
 * 마스코트의 현재 표정을 관리하는 상태 머신.
 *
 * - idle 루프: 랜덤 간격마다 눈 깜빡임(blink), 매 N번째는 sleepy.
 * - 트리거(react / hover / press / focus): surprised → worried → base 로 복귀.
 * - `controlledExpression` 지정 또는 reduced-motion / `enabled:false` 이면
 *   타이머 없이 정적 표정만 반환한다.
 */
export function useMascotExpression(
  options: UseMascotExpressionOptions = {},
): UseMascotExpressionResult {
  const { enabled = true, baseExpression = "idle", controlledExpression } =
    options;

  const isReducedMotion = useReducedMotion();
  const active = !controlledExpression && enabled && !isReducedMotion;

  const [expression, setExpression] = useState<MascotExpression>(
    controlledExpression ?? baseExpression,
  );
  // settle 이후 idle 루프를 다시 돌리기 위한 트리거.
  const [resumeNonce, setResumeNonce] = useState(0);

  const idleTimer = useRef<Timer | null>(null);
  const reactionTimer = useRef<Timer | null>(null);
  const settleTimer = useRef<Timer | null>(null);
  const idleTick = useRef(0);

  const baseRef = useRef(baseExpression);
  baseRef.current = baseExpression;

  const clearIdle = useCallback(() => {
    if (idleTimer.current !== null) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
  }, []);

  const clearReaction = useCallback(() => {
    if (reactionTimer.current !== null) {
      clearTimeout(reactionTimer.current);
      reactionTimer.current = null;
    }
    if (settleTimer.current !== null) {
      clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
  }, []);

  // 제어 모드: controlledExpression을 그대로 반영.
  useEffect(() => {
    if (controlledExpression) {
      setExpression(controlledExpression);
    }
  }, [controlledExpression]);

  // 비활성(제어/− reduced-motion/enabled:false): base 표정으로 고정.
  useEffect(() => {
    if (!active && !controlledExpression) {
      setExpression(baseExpression);
    }
  }, [active, controlledExpression, baseExpression]);

  // idle 루프.
  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    const scheduleNext = () => {
      const delay =
        BLINK_MIN_MS + Math.random() * (BLINK_MAX_MS - BLINK_MIN_MS);
      idleTimer.current = setTimeout(() => {
        if (cancelled) return;
        idleTick.current += 1;
        const look = idleTick.current % OCCASIONAL_LOOK_EVERY === 0;
        setExpression(look ? "sleepy" : "blink");
        idleTimer.current = setTimeout(
          () => {
            if (cancelled) return;
            setExpression(baseRef.current);
            scheduleNext();
          },
          look ? OCCASIONAL_LOOK_MS : BLINK_HOLD_MS,
        );
      }, delay);
    };

    setExpression(baseRef.current);
    scheduleNext();

    return () => {
      cancelled = true;
      clearIdle();
    };
  }, [active, resumeNonce, clearIdle]);

  // 언마운트 시 모든 타이머 정리.
  useEffect(() => {
    return () => {
      clearIdle();
      clearReaction();
    };
  }, [clearIdle, clearReaction]);

  const react = useCallback(() => {
    if (!active) return;
    clearIdle();
    clearReaction();
    setExpression("surprised");
    reactionTimer.current = setTimeout(() => {
      setExpression("worried");
      settleTimer.current = setTimeout(() => {
        setExpression(baseRef.current);
        setResumeNonce((n) => n + 1);
      }, REACTION_SETTLE_MS);
    }, REACTION_SURPRISE_MS);
  }, [active, clearIdle, clearReaction]);

  // hover/포커스 해제: 반응 중이면 settle을 앞당긴다(딱딱한 즉시 복귀는 피한다).
  const settleEarly = useCallback(() => {
    if (!active) return;
    if (reactionTimer.current === null && settleTimer.current === null) return;
    clearReaction();
    setExpression("worried");
    settleTimer.current = setTimeout(() => {
      setExpression(baseRef.current);
      setResumeNonce((n) => n + 1);
    }, Math.round(REACTION_SETTLE_MS / 2));
  }, [active, clearReaction]);

  const bind = useMemo<MascotBindHandlers>(() => {
    if (!active) return NOOP_BIND;
    return {
      onMouseEnter: react,
      onMouseLeave: settleEarly,
      onPointerDown: react,
      onFocus: react,
      onBlur: settleEarly,
    };
  }, [active, react, settleEarly]);

  return { expression, isReducedMotion, react, bind };
}
