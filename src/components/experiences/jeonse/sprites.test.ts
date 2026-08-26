import { describe, expect, it } from "vitest";
import type { JeonseBuildingType } from "@/types/experience";
import {
  buildGrid,
  buildPlayerGrid,
  PLAYER_COLS,
  PLAYER_PALETTE,
  PLAYER_ROWS,
  SPRITE_COLS,
  SPRITE_ROWS,
} from "./sprites";

const BUILDING_TYPES: JeonseBuildingType[] = [
  "다가구주택",
  "아파트",
  "오피스텔",
  "빌라",
  "단독주택",
];

describe("buildGrid", () => {
  it.each(BUILDING_TYPES)(
    "%s 타입에 대해 SPRITE_ROWS x SPRITE_COLS 크기의 그리드를 만든다",
    (type) => {
      const { grid, palette } = buildGrid(type);
      expect(grid.length).toBe(SPRITE_ROWS);
      for (const row of grid) {
        expect(row.length).toBe(SPRITE_COLS);
      }
      expect(Object.keys(palette).length).toBeGreaterThan(0);
    }
  );
});

describe("buildPlayerGrid", () => {
  it.each(["down", "up", "left"] as const)(
    "%s 방향에 대해 PLAYER_ROWS x PLAYER_COLS 크기의 그리드를 만든다",
    (direction) => {
      const grid = buildPlayerGrid(direction);
      expect(grid.length).toBe(PLAYER_ROWS);
      for (const row of grid) {
        expect(row.length).toBe(PLAYER_COLS);
      }
    }
  );

  it("PLAYER_PALETTE에 정의된 색상 키만 사용한다", () => {
    const grid = buildPlayerGrid("down");
    const usedKeys = new Set(grid.flat().filter((cell) => cell !== " "));
    for (const key of usedKeys) {
      expect(PLAYER_PALETTE[key]).toBeDefined();
    }
  });
});
