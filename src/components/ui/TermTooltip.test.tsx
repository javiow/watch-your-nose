import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TermTooltip } from "./TermTooltip";

const DEF = "돈을 못 갚으면 집이 경매로 넘어갈 수 있게 은행이 걸어둔 담보.";

describe("TermTooltip", () => {
  it("초기에는 정의가 화면에 없다", () => {
    render(<TermTooltip term="근저당권" definition={DEF} />);
    expect(screen.getByText("근저당권")).toBeDefined();
    expect(screen.queryByText(DEF)).toBeNull();
  });

  it("(?) 버튼을 클릭하면 정의가 나타나고, 다시 클릭하면 사라진다", () => {
    render(<TermTooltip term="근저당권" definition={DEF} />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(screen.getByText(DEF)).toBeDefined();
    fireEvent.click(btn);
    expect(screen.queryByText(DEF)).toBeNull();
  });

  it("aria-expanded가 열림/닫힘에 따라 바뀐다", () => {
    render(<TermTooltip term="근저당권" definition={DEF} />);
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
  });

  it("바깥을 pointerdown하면 닫힌다", () => {
    render(
      <div>
        <TermTooltip term="근저당권" definition={DEF} />
        <span data-testid="outside">바깥</span>
      </div>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(DEF)).toBeDefined();
    fireEvent.pointerDown(screen.getByTestId("outside"));
    expect(screen.queryByText(DEF)).toBeNull();
  });

  it("Escape를 누르면 닫힌다", () => {
    render(<TermTooltip term="근저당권" definition={DEF} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(DEF)).toBeDefined();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText(DEF)).toBeNull();
  });

  it("팝오버 내부를 pointerdown해도 닫히지 않는다", () => {
    render(<TermTooltip term="근저당권" definition={DEF} />);
    fireEvent.click(screen.getByRole("button"));
    const pop = screen.getByText(DEF);
    fireEvent.pointerDown(pop);
    expect(screen.getByText(DEF)).toBeDefined();
  });
});
