import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ModuleResult } from "@/types/experience";
import type { PlayerInfo } from "@/types/player";
import { SessionProvider, useSession } from "./session-context";

const sampleResult: ModuleResult = {
  typeId: "voice-phishing",
  contentId: "c1",
  score: 100,
  grade: "safe",
  userChoice: "a",
  correctChoice: "a",
  isCorrect: true,
  explanation: "설명",
};

const samplePlayerInfo: PlayerInfo = {
  ageGroup: "20대",
  job: "직장인",
  gender: "여성",
};

function TestConsumer() {
  const { sessionPlan, results, addResult, resetSession, playerInfo, setPlayerInfo } =
    useSession();
  return (
    <div>
      <span data-testid="plan-length">{sessionPlan.length}</span>
      <span data-testid="results-length">{results.length}</span>
      <span data-testid="player-info">
        {playerInfo ? JSON.stringify(playerInfo) : "null"}
      </span>
      <button onClick={() => addResult(sampleResult)}>add</button>
      <button onClick={() => resetSession()}>reset</button>
      <button onClick={() => setPlayerInfo(samplePlayerInfo)}>
        set-player-info
      </button>
    </div>
  );
}

describe("SessionProvider", () => {
  it("results가 빈 배열로 시작하고 addResult로 누적된다", () => {
    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>
    );
    expect(screen.getByTestId("results-length").textContent).toBe("0");
    fireEvent.click(screen.getByText("add"));
    expect(screen.getByTestId("results-length").textContent).toBe("1");
  });

  it("resetSession 호출 시 results가 초기화된다", () => {
    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>
    );
    fireEvent.click(screen.getByText("add"));
    fireEvent.click(screen.getByText("add"));
    expect(screen.getByTestId("results-length").textContent).toBe("2");
    fireEvent.click(screen.getByText("reset"));
    expect(screen.getByTestId("results-length").textContent).toBe("0");
  });

  it("setPlayerInfo를 호출하면 playerInfo가 갱신된다", () => {
    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>
    );
    expect(screen.getByTestId("player-info").textContent).toBe("null");
    fireEvent.click(screen.getByText("set-player-info"));
    expect(screen.getByTestId("player-info").textContent).toBe(
      JSON.stringify(samplePlayerInfo)
    );
  });

  it("setPlayerInfo 호출 후 resetSession()을 호출해도 playerInfo는 유지된다", () => {
    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>
    );
    fireEvent.click(screen.getByText("set-player-info"));
    expect(screen.getByTestId("player-info").textContent).toBe(
      JSON.stringify(samplePlayerInfo)
    );
    fireEvent.click(screen.getByText("reset"));
    expect(screen.getByTestId("player-info").textContent).toBe(
      JSON.stringify(samplePlayerInfo)
    );
  });

  it("SessionProvider 밖에서 useSession을 사용하면 에러를 던진다", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    function Bare() {
      useSession();
      return null;
    }
    expect(() => render(<Bare />)).toThrow();
    consoleErrorSpy.mockRestore();
  });
});
