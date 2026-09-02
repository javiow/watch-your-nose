import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BLINK_HOLD_MS,
  BLINK_MAX_MS,
  BLINK_MIN_MS,
  REACTION_SETTLE_MS,
  REACTION_SURPRISE_MS,
} from "@/lib/mascot-frames";
import { useMascotExpression } from "@/lib/useMascotExpression";

// idle 루프 간격을 결정적으로 만들기 위해 Math.random을 고정한다.
// delay = BLINK_MIN_MS + rand * (BLINK_MAX_MS - BLINK_MIN_MS)
const FIXED_RANDOM = 0.5;
const IDLE_DELAY_MS = BLINK_MIN_MS + FIXED_RANDOM * (BLINK_MAX_MS - BLINK_MIN_MS);

function stubMatchMedia(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

describe("useMascotExpression", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(FIXED_RANDOM);
    stubMatchMedia(false);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("마운트 직후에는 idle 표정이다", () => {
    const { result } = renderHook(() => useMascotExpression());
    expect(result.current.expression).toBe("idle");
  });

  it("idle 루프가 눈을 깜빡였다가 base 표정으로 돌아온다", () => {
    const { result } = renderHook(() => useMascotExpression());

    act(() => {
      vi.advanceTimersByTime(IDLE_DELAY_MS);
    });
    expect(result.current.expression).toBe("blink");

    act(() => {
      vi.advanceTimersByTime(BLINK_HOLD_MS);
    });
    expect(result.current.expression).toBe("idle");
  });

  it("react()는 surprised → worried → base 순으로 진행한다", () => {
    const { result } = renderHook(() => useMascotExpression());

    act(() => {
      result.current.react();
    });
    expect(result.current.expression).toBe("surprised");

    act(() => {
      vi.advanceTimersByTime(REACTION_SURPRISE_MS);
    });
    expect(result.current.expression).toBe("worried");

    act(() => {
      vi.advanceTimersByTime(REACTION_SETTLE_MS);
    });
    expect(result.current.expression).toBe("idle");
  });

  it("settle 전에 다시 react()하면 surprised가 유지되고 타이머가 리셋된다", () => {
    const { result } = renderHook(() => useMascotExpression());

    act(() => {
      result.current.react();
    });
    act(() => {
      vi.advanceTimersByTime(REACTION_SURPRISE_MS / 2);
    });
    act(() => {
      result.current.react();
    });
    // 첫 react 기준으로는 SURPRISE_MS가 지났지만 두 번째 react가 타이머를 리셋했다.
    act(() => {
      vi.advanceTimersByTime(REACTION_SURPRISE_MS / 2);
    });
    expect(result.current.expression).toBe("surprised");

    act(() => {
      vi.advanceTimersByTime(REACTION_SURPRISE_MS / 2);
    });
    expect(result.current.expression).toBe("worried");
  });

  it("prefers-reduced-motion이면 base 표정에 고정되고 타이머를 걸지 않는다", () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useMascotExpression());

    expect(result.current.isReducedMotion).toBe(true);
    expect(result.current.expression).toBe("idle");
    expect(vi.getTimerCount()).toBe(0);

    act(() => {
      result.current.react();
    });
    expect(result.current.expression).toBe("idle");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("enabled:false면 base 표정에 고정되고 타이머가 없다", () => {
    const { result } = renderHook(() =>
      useMascotExpression({ enabled: false }),
    );
    expect(result.current.expression).toBe("idle");
    expect(vi.getTimerCount()).toBe(0);

    act(() => {
      vi.advanceTimersByTime(BLINK_MAX_MS * 2);
    });
    expect(result.current.expression).toBe("idle");
  });

  it("controlledExpression이 주어지면 항상 그 값을 반환하고 react()를 무시한다", () => {
    const { result } = renderHook(() =>
      useMascotExpression({ controlledExpression: "sad" }),
    );
    expect(result.current.expression).toBe("sad");
    expect(vi.getTimerCount()).toBe(0);

    act(() => {
      result.current.react();
      vi.advanceTimersByTime(REACTION_SURPRISE_MS + REACTION_SETTLE_MS);
    });
    expect(result.current.expression).toBe("sad");
  });

  it("baseExpression을 바꾸면 idle 복귀 지점이 그 표정이 된다", () => {
    const { result } = renderHook(() =>
      useMascotExpression({ baseExpression: "relieved" }),
    );
    expect(result.current.expression).toBe("relieved");

    act(() => {
      vi.advanceTimersByTime(IDLE_DELAY_MS);
    });
    expect(result.current.expression).toBe("blink");

    act(() => {
      vi.advanceTimersByTime(BLINK_HOLD_MS);
    });
    expect(result.current.expression).toBe("relieved");
  });

  it("bind 핸들러(onMouseEnter)로도 반응이 트리거된다", () => {
    const { result } = renderHook(() => useMascotExpression());
    act(() => {
      result.current.bind.onMouseEnter();
    });
    expect(result.current.expression).toBe("surprised");
  });

  it("언마운트 후 대기 중인 타이머가 남지 않는다", () => {
    const { result, unmount } = renderHook(() => useMascotExpression());
    act(() => {
      result.current.react();
    });
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
