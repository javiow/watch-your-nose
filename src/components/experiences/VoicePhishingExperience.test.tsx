import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { VoicePhishingScenario } from "@/types/experience";
import { VoicePhishingExperience } from "./VoicePhishingExperience";

const normalScenario: VoicePhishingScenario = {
  id: "normal-test",
  isNormalCase: true,
  category: "정상금융확인형",
  startNodeId: "n1",
  nodes: [
    {
      id: "n1",
      speaker: "상담원",
      line: "본인 확인 차 전화드렸습니다.",
      choices: [
        { id: "confirm", text: "확인해준다", next: "n2", risk: "safe" },
        { id: "refuse-hangup", text: "전화를 끊는다", risk: "danger" },
      ],
    },
    {
      id: "n2",
      speaker: "상담원",
      line: "감사합니다. 통화를 마칩니다.",
      choices: [{ id: "end-call", text: "통화를 마친다", risk: "safe" }],
    },
  ],
};

const scamScenario: VoicePhishingScenario = {
  id: "scam-test",
  isNormalCase: false,
  category: "대출빙자형",
  startNodeId: "s1",
  nodes: [
    {
      id: "s1",
      speaker: "발신자",
      line: "대출 상담을 도와드립니다.",
      choices: [
        { id: "listen-more", text: "더 들어본다", next: "s2", risk: "safe" },
        { id: "refuse-hangup", text: "전화를 끊는다", risk: "safe" },
      ],
    },
    {
      id: "s2",
      speaker: "발신자",
      line: "개인정보를 알려주세요.",
      choices: [
        { id: "comply", text: "정보를 알려준다", risk: "danger" },
        { id: "refuse-suspicious", text: "전화를 끊는다", risk: "safe" },
      ],
    },
  ],
};

const cautionScamScenario: VoicePhishingScenario = {
  id: "scam-caution-test",
  isNormalCase: false,
  category: "대출빙자형",
  startNodeId: "c1",
  nodes: [
    {
      id: "c1",
      speaker: "발신자",
      line: "대출 상담을 도와드립니다.",
      choices: [
        { id: "listen-more", text: "더 들어본다", next: "c2", risk: "safe" },
        { id: "refuse-hangup", text: "전화를 끊는다", risk: "safe" },
      ],
    },
    {
      id: "c2",
      speaker: "발신자",
      line: "성함과 생년월일을 확인해주세요.",
      choices: [
        {
          id: "vague-answer",
          text: "대수롭지 않게 대충 알려준다",
          next: "c3",
          risk: "caution",
        },
        { id: "refuse-suspicious", text: "전화를 끊는다", risk: "safe" },
      ],
    },
    {
      id: "c3",
      speaker: "발신자",
      line: "계좌 비밀번호도 알려주세요.",
      choices: [
        { id: "comply", text: "정보를 알려준다", risk: "danger" },
        { id: "refuse-suspicious-2", text: "전화를 끊는다", risk: "safe" },
      ],
    },
  ],
};

const danglingScenario: VoicePhishingScenario = {
  id: "dangling-test",
  isNormalCase: false,
  category: "대출빙자형",
  startNodeId: "d1",
  nodes: [
    {
      id: "d1",
      speaker: "발신자",
      line: "테스트 대사",
      choices: [
        {
          id: "go-nowhere",
          text: "다음으로",
          next: "does-not-exist",
          risk: "safe",
        },
      ],
    },
  ],
};

function advanceAllTimers() {
  act(() => {
    vi.advanceTimersByTime(3000);
  });
}

describe("VoicePhishingExperience", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("마운트 직후에는 타이핑 인디케이터만 보이다가, 딜레이 이후 말풍선과 선택지가 나타난다", () => {
    render(
      <VoicePhishingExperience content={normalScenario} onComplete={vi.fn()} />
    );

    expect(screen.getByTestId("typing-indicator")).toBeDefined();
    expect(screen.queryByText("본인 확인 차 전화드렸습니다.")).toBeNull();
    expect(screen.queryByText("확인해준다")).toBeNull();

    advanceAllTimers();

    expect(screen.queryByTestId("typing-indicator")).toBeNull();
    expect(screen.getByText("본인 확인 차 전화드렸습니다.")).toBeDefined();
    expect(screen.getByText("확인해준다")).toBeDefined();
  });

  it("선택지 클릭 시 다음 버튼 없이 즉시 진행된다", () => {
    render(
      <VoicePhishingExperience content={normalScenario} onComplete={vi.fn()} />
    );
    advanceAllTimers();

    fireEvent.click(screen.getByText("확인해준다"));

    expect(screen.getByText("확인해준다")).toBeDefined();
    expect(screen.queryByText("다음")).toBeNull();

    advanceAllTimers();

    expect(screen.getByText("감사합니다. 통화를 마칩니다.")).toBeDefined();
  });

  it("선택 직후에도 정답/오답 피드백을 보여주지 않는다", () => {
    render(
      <VoicePhishingExperience content={normalScenario} onComplete={vi.fn()} />
    );
    advanceAllTimers();

    fireEvent.click(screen.getByText("전화를 끊는다"));

    expect(screen.queryByText(/정답/)).toBeNull();
    expect(screen.queryByText(/오답/)).toBeNull();
  });

  it("정상 케이스에서 거절을 선택하면 오답(blind-refusal)으로 채점된다", () => {
    const onComplete = vi.fn();
    render(
      <VoicePhishingExperience content={normalScenario} onComplete={onComplete} />
    );
    advanceAllTimers();

    fireEvent.click(screen.getByText("전화를 끊는다"));
    advanceAllTimers();

    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("다음으로 넘어가기"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0];
    expect(result.typeId).toBe("voice-phishing");
    expect(result.contentId).toBe("normal-test");
    expect(result.isCorrect).toBe(false);
    expect(result.mistakeTag).toBe("blind-refusal");
  });

  it("정상 케이스에서 정상적으로 응대를 이어가면 정답으로 채점된다", () => {
    const onComplete = vi.fn();
    render(
      <VoicePhishingExperience content={normalScenario} onComplete={onComplete} />
    );
    advanceAllTimers();

    fireEvent.click(screen.getByText("확인해준다"));
    advanceAllTimers();

    expect(screen.getByText("감사합니다. 통화를 마칩니다.")).toBeDefined();

    fireEvent.click(screen.getByText("통화를 마친다"));
    advanceAllTimers();

    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("다음으로 넘어가기"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0];
    expect(result.isCorrect).toBe(true);
    expect(result.mistakeTag).toBeUndefined();
  });

  it("사기 케이스에서 거절 선택 시 정답으로 채점된다", () => {
    const onComplete = vi.fn();
    render(
      <VoicePhishingExperience content={scamScenario} onComplete={onComplete} />
    );
    advanceAllTimers();

    fireEvent.click(screen.getByText("더 들어본다"));
    advanceAllTimers();

    fireEvent.click(screen.getByText("전화를 끊는다"));
    advanceAllTimers();

    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("다음으로 넘어가기"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0];
    expect(result.isCorrect).toBe(true);
    expect(result.mistakeTag).toBeUndefined();
  });

  it("사기 케이스에서 거절하지 않고 응하면 오답(fell-for-scam)으로 채점된다", () => {
    const onComplete = vi.fn();
    render(
      <VoicePhishingExperience content={scamScenario} onComplete={onComplete} />
    );
    advanceAllTimers();

    fireEvent.click(screen.getByText("더 들어본다"));
    advanceAllTimers();

    fireEvent.click(screen.getByText("정보를 알려준다"));
    advanceAllTimers();

    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("다음으로 넘어가기"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0];
    expect(result.isCorrect).toBe(false);
    expect(result.mistakeTag).toBe("fell-for-scam");
  });

  it("중간에 caution 선택을 거쳐도 결국 거절하면 정답이지만 100점 미만으로 채점된다", () => {
    const onComplete = vi.fn();
    render(
      <VoicePhishingExperience
        content={cautionScamScenario}
        onComplete={onComplete}
      />
    );
    advanceAllTimers();

    fireEvent.click(screen.getByText("더 들어본다"));
    advanceAllTimers();

    fireEvent.click(screen.getByText("대수롭지 않게 대충 알려준다"));
    advanceAllTimers();

    fireEvent.click(screen.getByText("전화를 끊는다"));
    advanceAllTimers();

    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("다음으로 넘어가기"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0];
    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(80);
    expect(result.mistakeTag).toBeUndefined();
  });

  it("caution 없이 바로 거절하면 100점으로 채점된다", () => {
    const onComplete = vi.fn();
    render(
      <VoicePhishingExperience
        content={cautionScamScenario}
        onComplete={onComplete}
      />
    );
    advanceAllTimers();

    fireEvent.click(screen.getByText("전화를 끊는다"));
    advanceAllTimers();

    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("다음으로 넘어가기"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0];
    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(100);
  });

  it("next 참조가 존재하지 않는 노드를 가리키면 크래시 없이 시나리오를 종료 처리한다", () => {
    const onComplete = vi.fn();
    render(
      <VoicePhishingExperience content={danglingScenario} onComplete={onComplete} />
    );
    advanceAllTimers();

    expect(() => {
      fireEvent.click(screen.getByText("다음으로"));
      advanceAllTimers();
    }).not.toThrow();

    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("다음으로 넘어가기"));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("spokenText가 있으면 버튼에는 text가, 채팅 말풍선에는 spokenText가 노출된다", () => {
    const scenarioWithSpokenText: VoicePhishingScenario = {
      id: "spoken-text-test",
      isNormalCase: true,
      category: "정상금융확인형",
      startNodeId: "n1",
      nodes: [
        {
          id: "n1",
          speaker: "상담원",
          line: "본인 확인 차 전화드렸습니다.",
          choices: [
            {
              id: "confirm",
              text: "본인 확인 절차임을 이해하고 알려준다",
              spokenText: "네, 알려드릴게요.",
              risk: "safe",
            },
          ],
        },
      ],
    };

    render(
      <VoicePhishingExperience
        content={scenarioWithSpokenText}
        onComplete={vi.fn()}
      />
    );
    advanceAllTimers();

    expect(screen.getByText("본인 확인 절차임을 이해하고 알려준다")).toBeDefined();
    expect(screen.queryByText("네, 알려드릴게요.")).toBeNull();

    fireEvent.click(screen.getByText("본인 확인 절차임을 이해하고 알려준다"));

    expect(screen.getByText("네, 알려드릴게요.")).toBeDefined();
    expect(
      screen.queryByText("본인 확인 절차임을 이해하고 알려준다")
    ).toBeNull();
  });

  it("같은 선택지를 연속으로 빠르게 두 번 클릭해도 onComplete가 중복 호출되지 않는다", () => {
    const onComplete = vi.fn();
    render(
      <VoicePhishingExperience content={normalScenario} onComplete={onComplete} />
    );
    advanceAllTimers();

    const choiceButton = screen.getByText("전화를 끊는다");
    act(() => {
      fireEvent.click(choiceButton);
      fireEvent.click(choiceButton);
    });

    advanceAllTimers();

    expect(onComplete).not.toHaveBeenCalled();

    const nextButton = screen.getByText("다음으로 넘어가기");
    act(() => {
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("마지막 대사 이후에는 곧바로 onComplete가 호출되지 않고, 다음으로 넘어가기 버튼을 눌러야 호출된다", () => {
    const onComplete = vi.fn();
    render(
      <VoicePhishingExperience content={normalScenario} onComplete={onComplete} />
    );
    advanceAllTimers();

    fireEvent.click(screen.getByText("전화를 끊는다"));
    advanceAllTimers();

    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByText("다음으로 넘어가기")).toBeDefined();

    fireEvent.click(screen.getByText("다음으로 넘어가기"));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
