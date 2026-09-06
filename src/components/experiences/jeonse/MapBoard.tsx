"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { JeonseHouse } from "@/types/experience";
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
import { HouseDialogPanel } from "./HouseDialogPanel";
import { HouseSprite } from "./HouseSprite";
import { PlayerSprite } from "./PlayerSprite";
import type { Facing } from "./sprites";
import { FormatBadge } from "@/components/ui/FormatBadge";
import { EXPERIENCE_FORMAT } from "@/data/experience-format";

const PLAYER_SPRITE_WIDTH = 26;
const PLAYER_SPRITE_HEIGHT = 32;

const DPAD_ROTATION: Record<"up" | "down" | "left" | "right", number> = {
  up: 0,
  right: 90,
  down: 180,
  left: 270,
};

function DirectionIcon({ dir }: { dir: "up" | "down" | "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      aria-hidden="true"
      className="pointer-events-none select-none"
      style={{ transform: `rotate(${DPAD_ROTATION[dir]}deg)` }}
    >
      <path d="M12 4 L20 18 L4 18 Z" fill="currentColor" />
    </svg>
  );
}

function blocked(x: number, y: number): boolean {
  return LAYOUT.some(
    (l) => x + PLAYER_SIZE > l.x && x < l.x + HOUSE_WIDTH && y + PLAYER_SIZE > l.y && y < l.y + HOUSE_HEIGHT
  );
}

interface MapBoardProps {
  houses: JeonseHouse[];
  answers: Record<number, boolean>;
  onAnswer: (index: number, risky: boolean) => void;
  hintUsedIndex: number | null;
  onUseHint: (index: number) => void;
}

export function MapBoard({ houses, answers, onAnswer, hintUsedIndex, onUseHint }: MapBoardProps) {
  const posRef = useRef({ ...START_POS });
  const [renderPos, setRenderPos] = useState(START_POS);
  const facingRef = useRef<Facing>("down");
  const [facing, setFacing] = useState<Facing>("down");
  const keysRef = useRef<Record<string, boolean>>({});
  const activeIndexRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndexState] = useState<number | null>(null);
  const boardWrapRef = useRef<HTMLDivElement>(null);
  const [boardScale, setBoardScale] = useState(1);

  function dpadPress(key: string) {
    return (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      keysRef.current[key] = true;
    };
  }

  function dpadRelease(key: string) {
    return () => {
      keysRef.current[key] = false;
    };
  }

  function setActive(i: number | null) {
    activeIndexRef.current = i;
    setActiveIndexState(i);
  }

  function enter(i: number) {
    if (activeIndexRef.current !== null) return;
    keysRef.current = {};
    setActive(i);
  }

  function closeDialog() {
    const i = activeIndexRef.current;
    if (i === null) return;
    const l = LAYOUT[i];
    const doorAboveHouse = l.dy < l.y;
    const y = doorAboveHouse ? l.dy - 40 : l.dy + 40;
    const nextPos = {
      x: l.dx - PLAYER_SIZE / 2,
      y: Math.max(2, Math.min(BOARD_HEIGHT - PLAYER_SIZE - 2, y)),
    };
    posRef.current = nextPos;
    setRenderPos(nextPos);
    setActive(null);
  }

  useEffect(() => {
    function checkDoor() {
      const cx = posRef.current.x + PLAYER_SIZE / 2;
      const cy = posRef.current.y + PLAYER_SIZE / 2;
      LAYOUT.forEach((l, i) => {
        if (Math.abs(cx - l.dx) < 30 && Math.abs(cy - l.dy) < 30) enter(i);
      });
    }

    function step() {
      if (activeIndexRef.current !== null) return;
      const k = keysRef.current;
      let dx = 0;
      let dy = 0;
      if (k.arrowleft || k.a) dx -= PLAYER_SPEED;
      if (k.arrowright || k.d) dx += PLAYER_SPEED;
      if (k.arrowup || k.w) dy -= PLAYER_SPEED;
      if (k.arrowdown || k.s) dy += PLAYER_SPEED;
      if (!dx && !dy) return;
      const nextFacing: Facing = dy !== 0 ? (dy > 0 ? "down" : "up") : dx > 0 ? "right" : "left";
      if (nextFacing !== facingRef.current) {
        facingRef.current = nextFacing;
        setFacing(nextFacing);
      }
      const { x, y } = posRef.current;
      const nx = Math.max(2, Math.min(BOARD_WIDTH - PLAYER_SIZE - 2, x + dx));
      const ny = Math.max(2, Math.min(BOARD_HEIGHT - PLAYER_SIZE - 2, y + dy));
      const next = { x, y };
      if (!blocked(nx, y)) next.x = nx;
      if (!blocked(next.x, ny)) next.y = ny;
      posRef.current = next;
      setRenderPos(next);
      checkDoor();
    }

    function onKeyDown(e: KeyboardEvent) {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(k)) {
        keysRef.current[k] = true;
        if (k.startsWith("arrow")) e.preventDefault();
      }
      if (k === "escape") closeDialog();
    }

    function onKeyUp(e: KeyboardEvent) {
      keysRef.current[e.key.toLowerCase()] = false;
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    let raf: number | undefined;
    if (typeof requestAnimationFrame === "function") {
      raf = requestAnimationFrame(function loop() {
        step();
        raf = requestAnimationFrame(loop);
      });
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (raf !== undefined && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(raf);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const el = boardWrapRef.current;
    if (!el) return;
    function update() {
      const w = el!.clientWidth;
      setBoardScale(w > 0 ? Math.min(1, w / BOARD_WIDTH) : 1);
    }
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const answeredCount = Object.keys(answers).length;
  const activeHouse = activeIndex === null ? null : houses[activeIndex];

  return (
    <div className="space-y-6">
      <FormatBadge format={EXPERIENCE_FORMAT["jeonse"]} />
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">골목을 돌며 매물을 점검하세요</h1>
          <div className="max-w-prose space-y-2 text-xs leading-relaxed text-muted">
            <p>
              <strong className="text-foreground">매물을 클릭하면 바로 서류가 열립니다.</strong> 원하면
              방향키(WASD)로 골목을 걸어 붉은 문 앞에 서도 됩니다.
            </p>
            <p>
              서류를 읽고 위험 신호가 있으면 O, 없으면 X로 판정하세요. 서류의 위험도 표시는 가려져
              있고, <strong className="text-foreground">힌트는 매물 전체에서 딱 1번</strong> 쓸 수 있습니다.
            </p>
          </div>
        </div>
        <p className="shrink-0 text-sm text-subtle">
          점검 {answeredCount} / {houses.length}
        </p>
      </div>

      <p className="flex flex-wrap gap-4 text-xs text-subtle">
        <span>집을 클릭하면 입장</span>
        <span>붉은 문에 서면 자동 입장</span>
        <span>방향키 / WASD — 이동</span>
      </p>

      <div ref={boardWrapRef} style={{ width: "100%", maxWidth: BOARD_WIDTH, height: BOARD_HEIGHT * boardScale }}>
        <div
          className="relative select-none overflow-hidden rounded-lg border border-border bg-surface-muted"
          style={{
            width: BOARD_WIDTH,
            height: BOARD_HEIGHT,
            transform: `scale(${boardScale})`,
            transformOrigin: "top left",
          }}
        >
          {houses.map((house, i) => {
            const l = LAYOUT[i];
            const done = answers[i] !== undefined;
            return (
              <div key={house.id} style={{ position: "absolute", left: l.x, top: l.y, width: HOUSE_WIDTH }}>
                <button
                  type="button"
                  aria-label={`${house.short} 입장`}
                  onClick={() => enter(i)}
                  className="block w-full border-2 border-border bg-surface text-left text-foreground"
                  style={{ height: HOUSE_HEIGHT }}
                >
                  <div style={{ height: HOUSE_HEIGHT - 34, position: "relative" }}>
                    <HouseSprite type={house.buildingType} width={HOUSE_WIDTH} height={HOUSE_HEIGHT - 34} />
                    {done && <div className="absolute inset-0 bg-black/40" />}
                  </div>
                  <div className="flex h-[34px] items-center justify-between gap-2 border-t-2 border-border px-2">
                    <span className="min-w-0 truncate text-[11px] text-muted">{house.short}</span>
                    <span
                      className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide ${
                        done ? "border-muted text-muted" : "border-border text-subtle"
                      }`}
                    >
                      {done ? "완료" : "미점검"}
                    </span>
                  </div>
                </button>
                <div
                  style={{
                    position: "absolute",
                    left: l.dx - l.x - 13,
                    top: l.dy - l.y - 4,
                    width: 26,
                    height: 8,
                  }}
                  className="bg-accent"
                />
              </div>
            );
          })}

          <div
            style={{
              position: "absolute",
              left: renderPos.x + PLAYER_SIZE / 2 - PLAYER_SPRITE_WIDTH / 2,
              top: renderPos.y + PLAYER_SIZE - PLAYER_SPRITE_HEIGHT,
              width: PLAYER_SPRITE_WIDTH,
              height: PLAYER_SPRITE_HEIGHT,
              zIndex: 5,
            }}
          >
            <PlayerSprite facing={facing} width={PLAYER_SPRITE_WIDTH} height={PLAYER_SPRITE_HEIGHT} />
          </div>
        </div>
      </div>

      <div className="grid w-40 select-none grid-cols-3 gap-2">
        <button
          type="button"
          aria-label="위로 이동"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          className="col-start-2 flex min-h-11 select-none touch-none items-center justify-center rounded-lg border border-border bg-surface text-muted"
          onPointerDown={dpadPress("arrowup")}
          onPointerUp={dpadRelease("arrowup")}
          onPointerCancel={dpadRelease("arrowup")}
          onPointerLeave={dpadRelease("arrowup")}
        >
          <DirectionIcon dir="up" />
        </button>
        <button
          type="button"
          aria-label="왼쪽으로 이동"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          className="col-start-1 row-start-2 flex min-h-11 select-none touch-none items-center justify-center rounded-lg border border-border bg-surface text-muted"
          onPointerDown={dpadPress("arrowleft")}
          onPointerUp={dpadRelease("arrowleft")}
          onPointerCancel={dpadRelease("arrowleft")}
          onPointerLeave={dpadRelease("arrowleft")}
        >
          <DirectionIcon dir="left" />
        </button>
        <button
          type="button"
          aria-label="오른쪽으로 이동"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          className="col-start-3 row-start-2 flex min-h-11 select-none touch-none items-center justify-center rounded-lg border border-border bg-surface text-muted"
          onPointerDown={dpadPress("arrowright")}
          onPointerUp={dpadRelease("arrowright")}
          onPointerCancel={dpadRelease("arrowright")}
          onPointerLeave={dpadRelease("arrowright")}
        >
          <DirectionIcon dir="right" />
        </button>
        <button
          type="button"
          aria-label="아래로 이동"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          className="col-start-2 row-start-3 flex min-h-11 select-none touch-none items-center justify-center rounded-lg border border-border bg-surface text-muted"
          onPointerDown={dpadPress("arrowdown")}
          onPointerUp={dpadRelease("arrowdown")}
          onPointerCancel={dpadRelease("arrowdown")}
          onPointerLeave={dpadRelease("arrowdown")}
        >
          <DirectionIcon dir="down" />
        </button>
      </div>

      <div className="space-y-2">
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${(answeredCount / houses.length) * 100}%` }}
          />
        </div>
        <ul className="divide-y divide-border border-t border-border">
          {houses.map((house, i) => {
            const answer = answers[i];
            const done = answer !== undefined;
            return (
              <li key={house.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="truncate text-muted">{house.short}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded border px-2 py-0.5 text-xs ${
                      done ? "border-muted text-muted" : "border-border text-subtle"
                    }`}
                  >
                    {done ? "완료" : "미점검"}
                  </span>
                  {done && (
                    <span
                      className={`rounded border px-2 py-0.5 text-xs font-semibold ${
                        answer ? "border-danger/60 text-danger" : "border-safe/60 text-safe"
                      }`}
                    >
                      내 판정 · {answer ? "O — 위험 있음" : "X — 위험 없음"}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {activeIndex !== null && activeHouse && (
        <HouseDialogPanel
          key={activeIndex}
          house={activeHouse}
          answered={answers[activeIndex] !== undefined}
          answer={answers[activeIndex]}
          onAnswer={(risky) => onAnswer(activeIndex, risky)}
          onClose={closeDialog}
          hintRevealed={hintUsedIndex === activeIndex}
          hintAvailable={hintUsedIndex === null}
          onUseHint={() => onUseHint(activeIndex)}
        />
      )}
    </div>
  );
}
