import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IntroDialog } from "./IntroDialog";
import type { ExperienceFormatMeta } from "@/data/experience-format";
import type { ExperienceIntroMeta } from "@/data/experience-intro";

const format: ExperienceFormatMeta = {
  icon: "📞",
  formatLabel: "전화 통화",
  hint: "듣고 바로 답해보세요",
  learningPhrase: "전화 판단력",
};

const intro: ExperienceIntroMeta = {
  situation: "첫 문단입니다. **핵심** 강조.\n\n둘째 문단입니다.",
  task: ["첫째 할 일", "둘째 할 일", "셋째 할 일"],
};

describe("IntroDialog", () => {
  it("FormatBadge, situation 문단, 모든 task를 렌더한다", () => {
    render(
      <IntroDialog
        format={format}
        intro={intro}
        confirmLabel="통화 시작"
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText("전화 통화")).toBeInTheDocument();
    expect(screen.getByText(/첫 문단입니다/)).toBeInTheDocument();
    expect(screen.getByText(/둘째 문단입니다/)).toBeInTheDocument();
    for (const step of intro.task) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
  });

  it("situation의 \\n\\n는 복수 <p>로, **는 <strong>으로 렌더된다", () => {
    const { container } = render(
      <IntroDialog
        format={format}
        intro={intro}
        confirmLabel="통화 시작"
        onConfirm={vi.fn()}
      />
    );
    expect(container.querySelectorAll("p").length).toBeGreaterThanOrEqual(2);
    expect(container.querySelector("strong")?.textContent).toBe("핵심");
  });

  it("role=dialog + aria-modal=true, aria-labelledby가 실제 제목을 가리킨다", () => {
    render(
      <IntroDialog
        format={format}
        intro={intro}
        confirmLabel="통화 시작"
        onConfirm={vi.fn()}
      />
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    const labelledby = dialog.getAttribute("aria-labelledby");
    expect(labelledby).toBeTruthy();
    expect(document.getElementById(labelledby as string)?.textContent?.length).toBeGreaterThan(0);
  });

  it('mode="gate": 확인 버튼 클릭 시 onConfirm 1회, Esc는 무반응, 닫기 버튼 없음', () => {
    const onConfirm = vi.fn();
    const onDismiss = vi.fn();
    render(
      <IntroDialog
        mode="gate"
        format={format}
        intro={intro}
        confirmLabel="통화 시작"
        onConfirm={onConfirm}
        onDismiss={onDismiss}
      />
    );
    expect(screen.queryByRole("button", { name: "닫기" })).toBeNull();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "통화 시작" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('mode="help": 닫기 버튼과 Esc가 onDismiss를 호출한다', () => {
    const onDismiss = vi.fn();
    render(
      <IntroDialog
        mode="help"
        format={format}
        intro={intro}
        confirmLabel="통화 시작"
        onConfirm={vi.fn()}
        onDismiss={onDismiss}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  it("마운트 시 포커스가 모달 내부로 이동한다", () => {
    render(
      <IntroDialog
        format={format}
        intro={intro}
        confirmLabel="통화 시작"
        onConfirm={vi.fn()}
      />
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
  });
});
