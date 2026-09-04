import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ModuleResult } from "@/types/experience";

const pushMock = vi.fn();
const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}));

// 실제 SessionProvider와 동일하게 results를 진짜 useState로 관리하는 가짜
// useSession. session/page.tsx가 addResult로 예약한 results 갱신을 이 훅이
// 리렌더에 반영하고, 그 갱신을 관찰하는 session/page.tsx의 useEffect가
// /result로 이동시키는 흐름 전체를 검증하기 위해 mock으로도 실제 상태를 쓴다.
vi.mock("@/lib/session-context", () => ({
  useSession: () => {
    const [results, setResults] = useState<ModuleResult[]>([]);
    return {
      sessionPlan: [{ typeId: "voice-phishing" }, { typeId: "jeonse" }],
      results,
      addResult: (result: ModuleResult) =>
        setResults((prev) => [...prev, result]),
      resetSession: vi.fn(),
      playerInfo: { ageRange: "20대", job: "학생", gender: "여성" },
      setPlayerInfo: vi.fn(),
      difficulty: "easy",
      setDifficulty: vi.fn(),
    };
  },
}));

const fakeResult1: ModuleResult = {
  typeId: "voice-phishing",
  contentId: "c1",
  score: 100,
  grade: "safe",
  userChoice: "a",
  correctChoice: "a",
  isCorrect: true,
  explanation: "설명1",
};
const fakeResult2: ModuleResult = {
  typeId: "jeonse",
  contentId: "c2",
  score: 100,
  grade: "safe",
  userChoice: "b",
  correctChoice: "b",
  isCorrect: true,
  explanation: "설명2",
};

vi.mock("@/lib/registry", () => ({
  EXPERIENCE_MODULES: [
    {
      typeId: "voice-phishing",
      contentPool: [{}],
      pickRandomContent: () => ({}),
      Component: ({ onComplete }: { onComplete: (r: ModuleResult) => void }) => (
        <button type="button" onClick={() => onComplete(fakeResult1)}>
          모듈1 완료
        </button>
      ),
    },
    {
      typeId: "jeonse",
      contentPool: [{}],
      pickRandomContent: () => ({}),
      Component: ({ onComplete }: { onComplete: (r: ModuleResult) => void }) => (
        <button type="button" onClick={() => onComplete(fakeResult2)}>
          모듈2 완료
        </button>
      ),
    },
  ],
}));

import SessionPage from "./page";

afterEach(() => {
  vi.clearAllMocks();
});

describe("SessionPage", () => {
  it("마지막 유형이 아니면 다음 단계로 넘어가고 /result로 이동하지 않는다", () => {
    render(<SessionPage />);

    fireEvent.click(screen.getByText("모듈1 완료"));

    expect(screen.getByText("모듈2 완료")).toBeDefined();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("마지막 유형까지 완료하면 /result로 이동한다", () => {
    render(<SessionPage />);

    fireEvent.click(screen.getByText("모듈1 완료"));
    fireEvent.click(screen.getByText("모듈2 완료"));

    expect(pushMock).toHaveBeenCalledWith("/result");
    expect(pushMock).toHaveBeenCalledTimes(1);
  });
});
