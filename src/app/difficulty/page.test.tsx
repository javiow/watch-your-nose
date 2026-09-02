import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PlayerInfo } from "@/types/player";

const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

const setDifficulty = vi.fn();
let mockPlayerInfo: PlayerInfo | null = null;

vi.mock("@/lib/session-context", () => ({
  useSession: () => ({
    playerInfo: mockPlayerInfo,
    setDifficulty,
  }),
}));

import DifficultyPage from "./page";

const samplePlayerInfo: PlayerInfo = {
  ageGroup: "20대",
  job: "직장인",
  gender: "여성",
};

afterEach(() => {
  push.mockClear();
  replace.mockClear();
  setDifficulty.mockClear();
  mockPlayerInfo = null;
});

describe("DifficultyPage", () => {
  it("playerInfo가 null이면 router.replace('/')로 돌려보낸다", () => {
    mockPlayerInfo = null;
    render(<DifficultyPage />);
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("playerInfo가 있으면 카드 선택 + 시작하기로 setDifficulty와 router.push('/session')를 호출한다", () => {
    mockPlayerInfo = samplePlayerInfo;
    render(<DifficultyPage />);

    fireEvent.click(screen.getByRole("button", { name: /어려움/ }));
    fireEvent.click(screen.getByRole("button", { name: "시작하기" }));

    expect(setDifficulty).toHaveBeenCalledTimes(1);
    expect(setDifficulty).toHaveBeenCalledWith("hard");
    expect(push).toHaveBeenCalledWith("/session");
    expect(replace).not.toHaveBeenCalled();
  });
});
