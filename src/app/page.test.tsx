import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SessionProvider } from "@/lib/session-context";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

import Home from "./page";

describe("Home", () => {
  it("renders the service name", () => {
    render(
      <SessionProvider>
        <Home />
      </SessionProvider>
    );
    expect(screen.getByText("Watch Your Nose")).toBeDefined();
  });

  it("체험 유형명을 노출하지 않는다", () => {
    render(
      <SessionProvider>
        <Home />
      </SessionProvider>
    );
    expect(screen.queryByText(/보이스피싱/)).toBeNull();
    expect(screen.queryByText(/사례선택/)).toBeNull();
    expect(screen.queryByText(/전세매물/)).toBeNull();
  });
});
