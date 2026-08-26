import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Mascot } from "./Mascot";

describe("Mascot", () => {
  it("renders a decorative mascot image", () => {
    const { container } = render(<Mascot />);
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img).toHaveAttribute("aria-hidden", "true");
  });
});
