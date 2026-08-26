import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlayerSprite } from "./PlayerSprite";

describe("PlayerSprite", () => {
  it("주어진 크기의 canvas를 렌더링한다", () => {
    const { container } = render(<PlayerSprite facing="down" width={26} height={32} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    expect(canvas?.style.width).toBe("26px");
    expect(canvas?.style.height).toBe("32px");
  });
});
