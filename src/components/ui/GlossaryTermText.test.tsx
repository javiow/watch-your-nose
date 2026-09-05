import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GlossaryTermText } from "./GlossaryTermText";
import { GLOSSARY_TERMS } from "@/data/glossary";

describe("GlossaryTermText", () => {
  it("마커가 없는 문장은 그대로 렌더한다", () => {
    render(<GlossaryTermText text="평범한 문장입니다." />);
    expect(screen.getByText("평범한 문장입니다.")).toBeDefined();
  });

  it("{{term:근저당권}} 마커는 용어 텍스트 + (?) 버튼으로 렌더된다", () => {
    render(<GlossaryTermText text="등기부에 {{term:근저당권}}이 있습니다." />);
    expect(screen.getByText("근저당권")).toBeDefined();
    expect(screen.getByRole("button")).toBeDefined();
  });

  it("마커가 두 개면 (?) 버튼이 두 개 렌더된다", () => {
    render(
      <GlossaryTermText text="{{term:근저당권}}과 {{term:전세가율}}을 확인하세요." />
    );
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("표시 텍스트 오버라이드: {{term:근저당권|근저당}}은 '근저당'으로 보이고 정의는 근저당권 것이다", () => {
    render(<GlossaryTermText text="과도한 {{term:근저당권|근저당}}은 위험합니다." />);
    expect(screen.getByText("근저당")).toBeDefined();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(GLOSSARY_TERMS["근저당권"].definition)).toBeDefined();
  });

  it("사전에 없는 키는 크래시 없이 표시 텍스트만 렌더하고 버튼은 없다", () => {
    render(<GlossaryTermText text="{{term:없는용어}} 입니다." />);
    expect(screen.getByText(/없는용어/)).toBeDefined();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
