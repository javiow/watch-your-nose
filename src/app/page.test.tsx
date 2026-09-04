import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SessionProvider } from "@/lib/session-context";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

import Home from "./page";

function renderHome() {
  return render(
    <SessionProvider>
      <Home />
    </SessionProvider>
  );
}

describe("Home", () => {
  it("renders the service name", () => {
    renderHome();
    expect(screen.getByText("Watch Your Nose")).toBeDefined();
  });

  it("헤드라인을 보여준다", () => {
    renderHome();
    expect(screen.getByText("코심코심")).toBeDefined();
  });

  it("체험 유형명을 노출하지 않는다", () => {
    renderHome();
    expect(screen.queryByText(/보이스피싱/)).toBeNull();
    expect(screen.queryByText(/사례선택/)).toBeNull();
    expect(screen.queryByText(/전세매물/)).toBeNull();
  });
});
