import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReducedMotion } from "./useReducedMotion";

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  vi.restoreAllMocks();
});

describe("useReducedMotion", () => {
  it("matchMedia가 matches: false를 반환하면 false를 반환한다", () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia;

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("matchMedia가 matches: true를 반환하면 effect 이후 true를 반환한다", () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia;

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("change 리스너가 호출되면 값이 갱신된다", () => {
    let changeListener: ((event: { matches: boolean }) => void) | undefined;
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn((_event: string, listener: () => void) => {
        changeListener = listener;
      }),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia;

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      changeListener?.({ matches: true });
    });
    expect(result.current).toBe(true);
  });

  it("window.matchMedia가 없어도 throw 없이 false를 반환한다", () => {
    // @ts-expect-error - 미지원 환경 시뮬레이션
    window.matchMedia = undefined;

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("unmount 시 removeEventListener가 호출된다", () => {
    const removeEventListener = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener,
    }) as unknown as typeof window.matchMedia;

    const { unmount } = renderHook(() => useReducedMotion());
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function)
    );
  });

  it("레거시 addListener/removeListener만 있는 환경도 지원한다", () => {
    const addListener = vi.fn();
    const removeListener = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addListener,
      removeListener,
    }) as unknown as typeof window.matchMedia;

    const { result, unmount } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
    expect(addListener).toHaveBeenCalled();
    unmount();
    expect(removeListener).toHaveBeenCalled();
  });
});
