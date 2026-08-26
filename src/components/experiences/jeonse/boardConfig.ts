export interface BoardLayoutSlot {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export const LAYOUT: BoardLayoutSlot[] = [
  { x: 44, y: 30, dx: 114, dy: 168 },
  { x: 284, y: 30, dx: 354, dy: 168 },
  { x: 524, y: 30, dx: 594, dy: 168 },
  { x: 164, y: 296, dx: 234, dy: 288 },
  { x: 404, y: 296, dx: 474, dy: 288 },
];

export const HOUSE_WIDTH = 140;
export const HOUSE_HEIGHT = 130;
export const BOARD_WIDTH = 720;
export const BOARD_HEIGHT = 470;
export const PLAYER_SIZE = 22;
export const PLAYER_SPEED = 4.4;
export const START_POS = { x: 340, y: 224 };
