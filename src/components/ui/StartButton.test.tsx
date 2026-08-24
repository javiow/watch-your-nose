import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const replaceMock = vi.fn();
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}));

const resetSessionMock = vi.fn();
vi.mock("@/lib/session-context", () => ({
  useSession: () => ({ resetSession: resetSessionMock }),
}));

import { StartButton } from "./StartButton";

describe("StartButton", () => {
  it("클릭 시 세션을 초기화하고 /session으로 이동한다", () => {
    render(<StartButton />);
    fireEvent.click(screen.getByText("시작하기"));

    expect(resetSessionMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith("/session");
  });
});
