import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HouseSprite } from "./HouseSprite";

describe("HouseSprite", () => {
  it("주어진 크기의 canvas를 렌더링한다", () => {
    const { container } = render(<HouseSprite type="아파트" width={140} height={96} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    expect(canvas?.style.width).toBe("140px");
    expect(canvas?.style.height).toBe("96px");
  });
});
