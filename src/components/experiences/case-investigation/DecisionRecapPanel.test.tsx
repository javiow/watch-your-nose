import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CaseInvestigationContent } from "@/types/experience";
import { DecisionRecapPanel } from "./DecisionRecapPanel";

const scenario: CaseInvestigationContent["scenario"] = {
  description: "시세보다 싼 전세 매물을 소개받았다.",
  propertyLocation: "서울시 관악구",
  propertyPriceDescription: "전세 2억",
  brokerLine: "집주인이 급해서 싸게 내놨어요.",
  speakerLabel: "중개사",
  goal: "계약해도 되는지 판단하라.",
};

describe("DecisionRecapPanel", () => {
  it("상황 요약(설명·화자·인용·목표)을 렌더한다", () => {
    const { container } = render(
      <DecisionRecapPanel scenario={scenario} confirmedInfo={[]} npcAnswers={[]} />
    );
    expect(container.textContent).toContain("시세보다 싼 전세 매물을 소개받았다.");
    expect(container.textContent).toContain("중개사");
    expect(container.textContent).toContain("집주인이 급해서 싸게 내놨어요.");
    expect(container.textContent).toContain("계약해도 되는지 판단하라.");
  });

  it("기본으로 펼쳐진 details와 '상황 다시 보기' summary를 가진다", () => {
    const { container } = render(
      <DecisionRecapPanel scenario={scenario} confirmedInfo={[]} npcAnswers={[]} />
    );
    const details = container.querySelector("details")!;
    expect(details).not.toBeNull();
    expect(details.hasAttribute("open")).toBe(true);
    expect(container.querySelector("summary")!.textContent).toBe("상황 다시 보기");
  });

  it("confirmedInfo 항목을 나열하고, 없으면 안내 문구를 보여준다", () => {
    const { container: withInfo } = render(
      <DecisionRecapPanel
        scenario={scenario}
        confirmedInfo={["근저당 과다", "명의 불일치"]}
        npcAnswers={[]}
      />
    );
    expect(withInfo.textContent).toContain("근저당 과다");
    expect(withInfo.textContent).toContain("명의 불일치");

    const { container: empty } = render(
      <DecisionRecapPanel scenario={scenario} confirmedInfo={[]} npcAnswers={[]} />
    );
    expect(empty.textContent).toContain("등록한 증거가 없습니다.");
  });

  it("npcAnswers를 '질문 → 답변' 형태로 나열하고, 없으면 안내 문구를 보여준다", () => {
    const { container: withQa } = render(
      <DecisionRecapPanel
        scenario={scenario}
        confirmedInfo={[]}
        npcAnswers={[{ question: "등기부 봤어요?", answer: "네, 깨끗합니다." }]}
      />
    );
    expect(withQa.textContent).toContain("등기부 봤어요?");
    expect(withQa.textContent).toContain("네, 깨끗합니다.");

    const { container: empty } = render(
      <DecisionRecapPanel scenario={scenario} confirmedInfo={[]} npcAnswers={[]} />
    );
    expect(empty.textContent).toContain("물어본 질문이 없습니다.");
  });
});
