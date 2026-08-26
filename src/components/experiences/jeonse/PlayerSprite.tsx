"use client";

import { useEffect, useRef } from "react";
import { buildPlayerGrid, PLAYER_COLS, PLAYER_PALETTE, PLAYER_ROWS, type Facing } from "./sprites";

interface PlayerSpriteProps {
  facing: Facing;
  width: number;
  height: number;
}

export function PlayerSprite({ facing, width, height }: PlayerSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const mirror = facing === "right";
    const grid = buildPlayerGrid(mirror ? "left" : facing);
    const cell = Math.min(canvas.width / PLAYER_COLS, canvas.height / PLAYER_ROWS);
    const offsetX = (canvas.width - cell * PLAYER_COLS) / 2;
    const offsetY = canvas.height - cell * PLAYER_ROWS;

    ctx.save();
    if (mirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    for (let y = 0; y < PLAYER_ROWS; y++) {
      for (let x = 0; x < PLAYER_COLS; x++) {
        const key = grid[y][x];
        if (key === " ") continue;
        const color = PLAYER_PALETTE[key];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(
          Math.round(offsetX + x * cell),
          Math.round(offsetY + y * cell),
          Math.ceil(cell),
          Math.ceil(cell)
        );
      }
    }
    ctx.restore();
  }, [facing, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, display: "block", imageRendering: "pixelated" }}
    />
  );
}
