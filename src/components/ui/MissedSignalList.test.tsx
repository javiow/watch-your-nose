import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MissedSignal } from "@/types/experience";
import { MissedSignalList } from "./MissedSignalList";

describe("MissedSignalList", () => {
  it("각 signal의 title만 strong으로 감싸고 description은 일반 텍스트다", () => {
    const signals: MissedSignal[] = [
      { title: "선입금 요구", description: "선입금은 대표적 위험 신호입니다." },
      { title: "대리인 계좌", description: "명의 불일치 계좌로 송금 요구." },
    ];
    const { container } = render(<MissedSignalList signals={signals} />);
    const strongs = container.querySelectorAll("strong");
    expect(strongs).toHaveLength(signals.length);
    expect(strongs[0].textContent).toBe("선입금 요구");
    expect(container.textContent).toContain("선입금은 대표적 위험 신호입니다.");
    expect(strongs[0].textContent).not.toContain("위험 신호입니다");
  });

  it("title·description의 {{term:...}}·** 마커를 리터럴로 노출하지 않고 치환한다", () => {
    const signals: MissedSignal[] = [
      {
        title: "{{term:신탁등기|신탁 등기}} 발견",
        description: "**신탁회사 동의서**가 누락됨",
      },
    ];
    const { container } = render(<MissedSignalList signals={signals} />);
    expect(container.textContent).not.toContain("{{term:");
    expect(container.textContent).not.toContain("**");
    expect(container.textContent).toContain("신탁 등기");
    expect(container.textContent).toContain("신탁회사 동의서");
  });

  it("source가 있으면 (출처: …) 줄이 나오고 없으면 안 나온다", () => {
    const { container: withSource } = render(
      <MissedSignalList signals={[{ title: "A", source: "경찰청" }]} />
    );
    expect(withSource.textContent).toContain("(출처: 경찰청)");

    const { container: noSource } = render(
      <MissedSignalList signals={[{ title: "A" }]} />
    );
    expect(noSource.textContent).not.toContain("(출처:");
  });

  it("description이 없으면 빈 p를 만들지 않는다", () => {
    const { container } = render(<MissedSignalList signals={[{ title: "A" }]} />);
    expect(container.querySelectorAll("p")).toHaveLength(1);
  });

  it("빈 배열이면 아무것도 렌더하지 않는다", () => {
    const { container } = render(<MissedSignalList signals={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
