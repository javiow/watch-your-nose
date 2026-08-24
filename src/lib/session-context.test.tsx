import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ModuleResult } from "@/types/experience";
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

function TestConsumer() {
  const { sessionPlan, results, addResult, resetSession } = useSession();
  return (
    <div>
      <span data-testid="plan-length">{sessionPlan.length}</span>
      <span data-testid="results-length">{results.length}</span>
      <button onClick={() => addResult(sampleResult)}>add</button>
      <button onClick={() => resetSession()}>reset</button>
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
