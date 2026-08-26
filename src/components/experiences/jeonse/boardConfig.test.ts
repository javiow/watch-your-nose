import { describe, expect, it } from "vitest";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  HOUSE_HEIGHT,
  HOUSE_WIDTH,
  LAYOUT,
  PLAYER_SIZE,
  PLAYER_SPEED,
  START_POS,
} from "./boardConfig";

describe("boardConfig", () => {
  it("LAYOUT은 정확히 5개의 슬롯을 가진다", () => {
    expect(LAYOUT.length).toBe(5);
  });

  it("각 슬롯은 보드 범위 안에 위치한다", () => {
    for (const slot of LAYOUT) {
      expect(slot.x).toBeGreaterThanOrEqual(0);
      expect(slot.y).toBeGreaterThanOrEqual(0);
      expect(slot.x + HOUSE_WIDTH).toBeLessThanOrEqual(BOARD_WIDTH);
      expect(slot.y + HOUSE_HEIGHT).toBeLessThanOrEqual(BOARD_HEIGHT);
    }
  });

  it("플레이어 시작 위치는 보드 범위 안이다", () => {
    expect(START_POS.x).toBeGreaterThanOrEqual(0);
    expect(START_POS.x + PLAYER_SIZE).toBeLessThanOrEqual(BOARD_WIDTH);
    expect(START_POS.y).toBeGreaterThanOrEqual(0);
    expect(START_POS.y + PLAYER_SIZE).toBeLessThanOrEqual(BOARD_HEIGHT);
  });

  it("이동 속도는 양수다", () => {
    expect(PLAYER_SPEED).toBeGreaterThan(0);
  });
});
