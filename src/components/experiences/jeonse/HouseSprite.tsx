"use client";

import { useEffect, useRef } from "react";
import type { JeonseBuildingType } from "@/types/experience";
import { buildGrid, SPRITE_COLS, SPRITE_ROWS } from "./sprites";

interface HouseSpriteProps {
  type: JeonseBuildingType;
  width: number;
  height: number;
}

export function HouseSprite({ type, width, height }: HouseSpriteProps) {
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

    const { grid, palette } = buildGrid(type);
    const cell = Math.min(canvas.width / SPRITE_COLS, canvas.height / SPRITE_ROWS);
    const offsetX = (canvas.width - cell * SPRITE_COLS) / 2;
    const offsetY = canvas.height - cell * SPRITE_ROWS;

    for (let y = 0; y < SPRITE_ROWS; y++) {
      for (let x = 0; x < SPRITE_COLS; x++) {
        const key = grid[y][x];
        if (key === " ") continue;
        const color = palette[key];
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
  }, [type, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, display: "block", imageRendering: "pixelated" }}
    />
  );
}
