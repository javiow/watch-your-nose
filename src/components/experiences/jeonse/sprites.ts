import type { JeonseBuildingType } from "@/types/experience";

/** 팔레트 키 한 글자 = 픽셀 한 칸. " "는 투명. */
type Cell = string;

export const SPRITE_COLS = 20;
export const SPRITE_ROWS = 24;

interface TypeConfig {
  roofStyle: "gable" | "flat";
  roofRows: number;
  floors: number;
  windowCols: number;
  wallInset: number;
  narrowWindows?: boolean;
  chimney?: boolean;
  palette: Record<string, string>;
}

/**
 * 건물 타입별 실루엣 파라미터. 실제 픽셀은 buildGrid()가 절차적으로 채운다 —
 * 타입마다 지붕 모양/창문 배열/색만 다르고 risky(정답) 값과는 무관하다(스포일러 방지).
 */
const CONFIG: Record<JeonseBuildingType, TypeConfig> = {
  다가구주택: {
    roofStyle: "gable",
    roofRows: 8,
    floors: 3,
    windowCols: 3,
    wallInset: 1,
    palette: {
      W: "#e8dcc0",
      w: "#d8c9a0",
      R: "#b3532a",
      r: "#8f3f1e",
      E: "#5a2712",
      G: "#7fa8b8",
      f: "#3a3a3a",
      D: "#5c7a52",
      d: "#2e3a28",
    },
  },
  아파트: {
    roofStyle: "flat",
    roofRows: 3,
    floors: 4,
    windowCols: 3,
    wallInset: 1,
    palette: {
      W: "#cfd6d9",
      w: "#b7c0c4",
      R: "#5b6266",
      r: "#4a5054",
      E: "#3a3f42",
      G: "#8fc1d9",
      f: "#33393c",
      D: "#4a5a63",
      d: "#262e31",
    },
  },
  오피스텔: {
    roofStyle: "flat",
    roofRows: 3,
    floors: 5,
    windowCols: 2,
    wallInset: 4,
    narrowWindows: true,
    palette: {
      W: "#8aa0ad",
      w: "#79939f",
      R: "#41505a",
      r: "#33404a",
      E: "#25303a",
      G: "#bfe0ec",
      f: "#2b3338",
      D: "#3c4a52",
      d: "#1f2529",
    },
  },
  빌라: {
    roofStyle: "flat",
    roofRows: 2,
    floors: 3,
    windowCols: 3,
    wallInset: 1,
    palette: {
      W: "#b06a4a",
      w: "#8f5138",
      R: "#6b6b63",
      r: "#54544e",
      E: "#3a3a34",
      G: "#9fc7c9",
      f: "#33302a",
      D: "#4a3d2c",
      d: "#241d15",
    },
  },
  단독주택: {
    roofStyle: "gable",
    roofRows: 9,
    floors: 2,
    windowCols: 2,
    wallInset: 3,
    chimney: true,
    palette: {
      W: "#eddca0",
      w: "#ddc888",
      R: "#7a4a2b",
      r: "#5a341c",
      E: "#3a2110",
      G: "#a7c9d8",
      f: "#3a3020",
      D: "#6b4226",
      d: "#3a2313",
      C: "#8a4a3a",
    },
  },
};

function emptyGrid(): Cell[][] {
  return Array.from({ length: SPRITE_ROWS }, () => Array<Cell>(SPRITE_COLS).fill(" "));
}

export function buildGrid(type: JeonseBuildingType): { grid: Cell[][]; palette: Record<string, string> } {
  const cfg = CONFIG[type];
  const grid = emptyGrid();
  const left = cfg.wallInset;
  const right = SPRITE_COLS - 1 - cfg.wallInset;
  const wallWidth = right - left + 1;
  const wallTop = cfg.roofRows;
  const wallBottom = SPRITE_ROWS - 1;
  const doorRows = 4;

  for (let y = wallTop; y <= wallBottom; y++) {
    for (let x = left; x <= right; x++) {
      grid[y][x] = x >= right - 1 ? "w" : "W";
    }
  }

  if (cfg.roofStyle === "flat") {
    for (let ry = 0; ry < cfg.roofRows; ry++) {
      const ledge = ry === 0 ? 1 : 0;
      for (let x = left - ledge; x <= right + ledge; x++) {
        if (x < 0 || x >= SPRITE_COLS) continue;
        grid[ry][x] = ry === cfg.roofRows - 1 ? "E" : x >= right - 1 ? "r" : "R";
      }
    }
  } else {
    const centerX = (left + right) / 2;
    for (let ry = 0; ry < cfg.roofRows; ry++) {
      const t = ry / (cfg.roofRows - 1);
      const halfWidth = Math.max(1, Math.round(((wallWidth + 2) / 2) * t));
      const xs = Math.round(centerX - halfWidth);
      const xe = Math.round(centerX + halfWidth);
      for (let x = xs; x <= xe; x++) {
        if (x < 0 || x >= SPRITE_COLS) continue;
        const isEdge = x === xs || x === xe || ry === cfg.roofRows - 1;
        grid[ry][x] = isEdge ? "E" : x > centerX ? "r" : "R";
      }
    }
  }

  if (cfg.chimney) {
    const cx = right - 2;
    for (let y = Math.max(0, cfg.roofRows - 6); y < cfg.roofRows - 2; y++) {
      grid[y][cx] = "C";
      grid[y][cx + 1] = "C";
    }
  }

  const winTop = wallTop + 1;
  const winBottom = wallBottom - doorRows - 1;
  const usableRows = winBottom - winTop + 1;
  const floorGap = Math.max(2, Math.floor(usableRows / cfg.floors));
  const colGap = Math.max(2, Math.floor((wallWidth - 2) / cfg.windowCols));

  for (let fl = 0; fl < cfg.floors; fl++) {
    const y0 = winTop + fl * floorGap;
    if (y0 + 1 > winBottom) break;
    for (let c = 0; c < cfg.windowCols; c++) {
      const x0 = left + 1 + c * colGap;
      const ww = cfg.narrowWindows ? Math.max(2, colGap - 1) : Math.max(2, colGap - 2);
      const wh = cfg.narrowWindows ? Math.max(2, floorGap - 1) : Math.min(2, floorGap - 1);
      for (let yy = y0; yy < y0 + wh; yy++) {
        for (let xx = x0; xx < x0 + ww; xx++) {
          if (xx > right - 1 || yy > winBottom) continue;
          const border = xx === x0 || xx === x0 + ww - 1 || yy === y0 || yy === y0 + wh - 1;
          grid[yy][xx] = border ? "f" : "G";
        }
      }
    }
  }

  const doorWidth = Math.min(4, wallWidth - 2);
  const dx0 = Math.round((left + right) / 2 - doorWidth / 2);
  const dy0 = wallBottom - doorRows + 1;
  for (let y = dy0; y <= wallBottom; y++) {
    for (let x = dx0; x < dx0 + doorWidth; x++) {
      const border = x === dx0 || x === dx0 + doorWidth - 1 || y === dy0;
      grid[y][x] = border ? "d" : "D";
    }
  }

  return { grid, palette: cfg.palette };
}

/** 플레이어 캐릭터 스프라이트 (아오오니풍 도트 캐릭터). */
export type Facing = "down" | "up" | "left" | "right";

export const PLAYER_COLS = 12;
export const PLAYER_ROWS = 16;

export const PLAYER_PALETTE: Record<string, string> = {
  H: "#c0432a",
  h: "#8f2e1c",
  S: "#f0c9a0",
  C: "#f5efe0",
  c: "#d9d0ba",
  B: "#7a6a52",
  b: "#5c4d38",
  P: "#3a3a42",
  p: "#2a2a30",
  O: "#241f1a",
};

function emptyPlayerGrid(): Cell[][] {
  return Array.from({ length: PLAYER_ROWS }, () => Array<Cell>(PLAYER_COLS).fill(" "));
}

/** "right"는 별도 그리드 없이 "left"를 좌우 반전해서 그린다(PlayerSprite에서 처리). */
export function buildPlayerGrid(direction: Exclude<Facing, "right">): Cell[][] {
  const grid = emptyPlayerGrid();

  for (let y = 1; y <= 6; y++) {
    for (let x = 3; x <= 8; x++) {
      if ((y === 1 || y === 6) && (x === 3 || x === 8)) continue;
      grid[y][x] = "S";
    }
  }

  if (direction === "down") {
    for (let x = 3; x <= 8; x++) grid[1][x] = "H";
    for (let x = 3; x <= 8; x++) grid[2][x] = "H";
    grid[3][3] = "H";
    grid[3][8] = "H";
    grid[4][3] = "H";
    grid[4][8] = "H";
  } else if (direction === "up") {
    for (let y = 1; y <= 6; y++) {
      for (let x = 3; x <= 8; x++) grid[y][x] = "H";
    }
    for (let x = 3; x <= 8; x++) grid[6][x] = "h";
  } else {
    for (let y = 1; y <= 6; y++) {
      for (let x = 6; x <= 8; x++) grid[y][x] = "H";
    }
    for (let x = 3; x <= 5; x++) grid[1][x] = "H";
  }

  for (let y = 7; y <= 11; y++) {
    for (let x = 3; x <= 8; x++) {
      grid[y][x] = x === 3 || x === 8 ? "c" : "C";
    }
  }

  if (direction === "up") {
    for (let y = 7; y <= 10; y++) {
      for (let x = 4; x <= 7; x++) grid[y][x] = "B";
    }
  } else if (direction === "down") {
    grid[7][3] = "b";
    grid[7][8] = "b";
  } else {
    for (let y = 7; y <= 10; y++) {
      grid[y][7] = "B";
      grid[y][8] = "B";
    }
  }

  for (let y = 12; y <= 15; y++) {
    for (let x = 4; x <= 7; x++) {
      if (y === 15) {
        grid[y][x] = "O";
        continue;
      }
      grid[y][x] = x === 4 || x === 7 ? "p" : "P";
    }
  }

  return grid;
}
