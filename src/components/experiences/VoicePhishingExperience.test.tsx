import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { VoicePhishingScenario } from "@/types/experience";
import { VoicePhishingExperience } from "./VoicePhishingExperience";

const normalScenario: VoicePhishingScenario = {
  id: "normal-test",
  isNormalCase: true,
  startNodeId: "n1",
  nodes: [
    {
      id: "n1",
      speaker: "상담원",
      line: "본인 확인 차 전화드렸습니다.",
      choices: [
        { id: "confirm", text: "확인해준다", next: "n2" },
        { id: "refuse-hangup", text: "전화를 끊는다" },
      ],
    },
    {
      id: "n2",
      speaker: "상담원",
      line: "감사합니다. 통화를 마칩니다.",
      choices: [{ id: "end-call", text: "통화를 마친다" }],
    },
  ],
};

const scamScenario: VoicePhishingScenario = {
  id: "scam-test",
  isNormalCase: false,
  startNodeId: "s1",
  nodes: [
    {
      id: "s1",
      speaker: "발신자",
      line: "대출 상담을 도와드립니다.",
      choices: [
        { id: "listen-more", text: "더 들어본다", next: "s2" },
        { id: "refuse-hangup", text: "전화를 끊는다" },
      ],
    },
    {
      id: "s2",
      speaker: "발신자",
      line: "개인정보를 알려주세요.",
      choices: [
        { id: "comply", text: "정보를 알려준다" },
        { id: "refuse-suspicious", text: "전화를 끊는다" },
      ],
    },
  ],
};

const danglingScenario: VoicePhishingScenario = {
  id: "dangling-test",
  isNormalCase: false,
  startNodeId: "d1",
  nodes: [
    {
      id: "d1",
      speaker: "발신자",
      line: "테스트 대사",
      choices: [{ id: "go-nowhere", text: "다음으로", next: "does-not-exist" }],
    },
  ],
};

describe("VoicePhishingExperience", () => {
  it("선택 전에는 다음 버튼이 비활성화된다", () => {
    render(
      <VoicePhishingExperience content={normalScenario} onComplete={vi.fn()} />
    );
    expect(screen.getByText("다음")).toBeDisabled();
  });

  it("선택 직후 정답/오답 피드백을 보여주지 않는다", () => {
    render(
      <VoicePhishingExperience content={normalScenario} onComplete={vi.fn()} />
    );
    fireEvent.click(screen.getByText("전화를 끊는다"));
    expect(screen.getByText("다음")).not.toBeDisabled();
    expect(screen.queryByText(/정답/)).toBeNull();
    expect(screen.queryByText(/오답/)).toBeNull();
  });

  it("정상 케이스에서 거절을 선택하면 오답(blind-refusal)으로 채점된다", () => {
    const onComplete = vi.fn();
    render(
      <VoicePhishingExperience content={normalScenario} onComplete={onComplete} />
    );
    fireEvent.click(screen.getByText("전화를 끊는다"));
    fireEvent.click(screen.getByText("다음"));

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
    fireEvent.click(screen.getByText("확인해준다"));
    fireEvent.click(screen.getByText("다음"));

    expect(screen.getByText("감사합니다. 통화를 마칩니다.")).toBeDefined();

    fireEvent.click(screen.getByText("통화를 마친다"));
    fireEvent.click(screen.getByText("다음"));

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
    fireEvent.click(screen.getByText("더 들어본다"));
    fireEvent.click(screen.getByText("다음"));
    fireEvent.click(screen.getByText("전화를 끊는다"));
    fireEvent.click(screen.getByText("다음"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0];
    expect(result.isCorrect).toBe(true);
    expect(result.mistakeTag).toBeUndefined();
  });

  it("사기 케이스에서 거절하지 않고 정보를 제공하면 오답으로 채점된다", () => {
    const onComplete = vi.fn();
    render(
      <VoicePhishingExperience content={scamScenario} onComplete={onComplete} />
    );
    fireEvent.click(screen.getByText("더 들어본다"));
    fireEvent.click(screen.getByText("다음"));
    fireEvent.click(screen.getByText("정보를 알려준다"));
    fireEvent.click(screen.getByText("다음"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0];
    expect(result.isCorrect).toBe(false);
    expect(result.mistakeTag).toBe("blind-refusal");
  });

  it("next 참조가 존재하지 않는 노드를 가리키면 크래시 없이 시나리오를 종료 처리한다", () => {
    const onComplete = vi.fn();
    render(
      <VoicePhishingExperience content={danglingScenario} onComplete={onComplete} />
    );
    fireEvent.click(screen.getByText("다음으로"));
    expect(() => fireEvent.click(screen.getByText("다음"))).not.toThrow();

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
