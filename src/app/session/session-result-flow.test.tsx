import { useEffect, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ModuleResult } from "@/types/experience";

/**
 * 세션 → 결과 페이지 인수인계를 "진짜 SessionProvider" 하나를 공유한 채
 * 검증한다. 개별 페이지 테스트는 useSession을 고정 mock으로 대체해서,
 * "세션을 막 끝내고 넘어온 ResultPage가 완료된 세션을 완료로 인식하는가"를
 * 한 번도 실제로 확인하지 않는다 — 그 사각지대가 이 파일의 대상이다.
 */

const pushMock = vi.fn();
const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}));

const TYPE_IDS: ModuleResult["typeId"][] = [
  "voice-phishing",
  "case-investigation",
  "jeonse",
  "fraud-judgment",
];

vi.mock("@/lib/registry", () => {
  const ids = [
    "voice-phishing",
    "case-investigation",
    "jeonse",
    "fraud-judgment",
  ] as const;
  const makeResult = (typeId: string, i: number): ModuleResult => ({
    typeId: typeId as ModuleResult["typeId"],
    contentId: `c${i}`,
    score: 100,
    grade: "safe",
    userChoice: "a",
    correctChoice: "a",
    isCorrect: true,
    explanation: `설명 ${i}`,
  });
  const EXPERIENCE_MODULES = ids.map((typeId, i) => ({
    typeId,
    contentPool: [{}],
    pickRandomContent: () => ({}),
    Component: ({ onComplete }: { onComplete: (r: ModuleResult) => void }) => (
      <button type="button" onClick={() => onComplete(makeResult(typeId, i))}>
        {`${typeId} 완료`}
      </button>
    ),
  }));
  return {
    EXPERIENCE_MODULES,
    pickSessionPlan: (modules = EXPERIENCE_MODULES) =>
      modules.map((m: { typeId: string }) => ({ typeId: m.typeId })),
    pickByDifficulty: (pool: unknown[]) => pool[0],
  };
});

// scoring은 실제 구현을 쓴다(결과 페이지가 진짜 데이터로 렌더되는지 보려는 것).

import { SessionProvider, useSession } from "@/lib/session-context";
import SessionPage from "./page";
import ResultPage from "@/app/result/page";

/**
 * 실제 라우터처럼 동작하는 얇은 하네스: 기본은 SessionPage를 렌더하고,
 * router.push/replace가 불리면 그 경로로 "이동"한다. SessionProvider는
 * 이 하네스 바깥에 있으므로 results 상태가 그대로 넘어간다 — 실제 앱에서
 * layout의 SessionProvider가 페이지 전환에도 유지되는 것과 같다.
 */
function RoutedApp() {
  const [path, setPath] = useState("/session");
  pushMock.mockImplementation((to: string) => setPath(to));
  replaceMock.mockImplementation((to: string) => setPath(to));

  if (path === "/result") return <ResultPage />;
  if (path === "/") return <div>홈으로 튕김</div>;
  return <SessionPage />;
}

/** playerInfo/difficulty를 먼저 채운 뒤에야 라우팅을 시작한다. */
function TestHost() {
  const { setPlayerInfo, setDifficulty } = useSession();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setPlayerInfo({ ageGroup: "20대", job: "직장인", gender: "선택 안 함" });
    setDifficulty("easy");
    setReady(true);
  }, [setPlayerInfo, setDifficulty]);
  return ready ? <RoutedApp /> : null;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("세션 → 결과 인수인계", () => {
  it("4개 유형을 모두 끝내면 결과 페이지가 뜨고 홈으로 튕기지 않는다", () => {
    render(
      <SessionProvider>
        <TestHost />
      </SessionProvider>,
    );

    for (const typeId of TYPE_IDS) {
      fireEvent.click(screen.getByText(`${typeId} 완료`));
    }

    expect(pushMock).toHaveBeenCalledWith("/result");
    expect(screen.queryByText("홈으로 튕김")).toBeNull();
    expect(screen.getByRole("heading", { name: /결과/ })).toBeDefined();
    expect(screen.getByText(/종합 정답률/)).toBeDefined();
  });
});
