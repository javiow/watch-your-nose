import { describe, expect, it } from "vitest";
import type { Grade } from "@/types/experience";
import type { MascotExpression } from "./mascot-frames";
import {
  BLINK_HOLD_MS,
  BLINK_MAX_MS,
  BLINK_MIN_MS,
  GRADE_EXPRESSION,
  MASCOT_FRAME_FILES,
  MASCOT_FRAME_SRC,
  OCCASIONAL_LOOK_EVERY,
  OCCASIONAL_LOOK_MS,
  REACTION_SETTLE_MS,
  REACTION_SURPRISE_MS,
} from "./mascot-frames";

const EXPRESSIONS: MascotExpression[] = [
  "idle",
  "blink",
  "surprised",
  "worried",
  "sleepy",
  "relieved",
  "sad",
];

describe("MASCOT_FRAME_SRC", () => {
  it("7개 표정 키를 모두 가진다", () => {
    expect(Object.keys(MASCOT_FRAME_SRC).sort()).toEqual([...EXPRESSIONS].sort());
    expect(Object.keys(MASCOT_FRAME_SRC)).toHaveLength(7);
  });

  it("모든 값이 /mascot/ 로 시작하고 .webp 로 끝난다", () => {
    for (const src of Object.values(MASCOT_FRAME_SRC)) {
      expect(src.startsWith("/mascot/")).toBe(true);
      expect(src.endsWith(".webp")).toBe(true);
    }
  });

  it("각 표정이 step1 산출물 파일명과 일치한다", () => {
    expect(MASCOT_FRAME_SRC.idle).toBe("/mascot/idle.webp");
    expect(MASCOT_FRAME_SRC.blink).toBe("/mascot/blink.webp");
    expect(MASCOT_FRAME_SRC.surprised).toBe("/mascot/surprised.webp");
    expect(MASCOT_FRAME_SRC.worried).toBe("/mascot/worried.webp");
    expect(MASCOT_FRAME_SRC.sleepy).toBe("/mascot/sleepy.webp");
    expect(MASCOT_FRAME_SRC.sad).toBe("/mascot/sad.webp");
  });

  it("relieved 는 웃는 소스 프레임이 없어 blink 파일을 재사용한다 (ADR-013)", () => {
    expect(MASCOT_FRAME_SRC.relieved).toBe("/mascot/blink.webp");
    expect(MASCOT_FRAME_SRC.relieved).toBe(MASCOT_FRAME_SRC.blink);
  });
});

describe("MASCOT_FRAME_FILES", () => {
  it("중복 없는 배열이다", () => {
    expect(new Set(MASCOT_FRAME_FILES).size).toBe(MASCOT_FRAME_FILES.length);
  });

  it("길이가 6이다 (relieved/blink 공유)", () => {
    expect(MASCOT_FRAME_FILES).toHaveLength(6);
  });

  it("MASCOT_FRAME_SRC 의 모든 값을 포함한다", () => {
    for (const src of Object.values(MASCOT_FRAME_SRC)) {
      expect(MASCOT_FRAME_FILES).toContain(src);
    }
  });
});

describe("GRADE_EXPRESSION", () => {
  it("정확히 safe/caution/danger 3개 키를 가진다", () => {
    expect(Object.keys(GRADE_EXPRESSION).sort()).toEqual(
      (["safe", "caution", "danger"] as Grade[]).sort()
    );
  });

  it("각 값이 유효한 MascotExpression 이다", () => {
    for (const expression of Object.values(GRADE_EXPRESSION)) {
      expect(EXPRESSIONS).toContain(expression);
    }
  });

  it("등급별 표정 매핑이 ADR-013 과 일치한다", () => {
    expect(GRADE_EXPRESSION.safe).toBe("relieved");
    expect(GRADE_EXPRESSION.caution).toBe("worried");
    expect(GRADE_EXPRESSION.danger).toBe("sad");
  });
});

describe("모션 타이밍 상수", () => {
  const constants = {
    BLINK_MIN_MS,
    BLINK_MAX_MS,
    BLINK_HOLD_MS,
    OCCASIONAL_LOOK_EVERY,
    OCCASIONAL_LOOK_MS,
    REACTION_SURPRISE_MS,
    REACTION_SETTLE_MS,
  };

  it("모두 양의 정수다", () => {
    for (const value of Object.values(constants)) {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThan(0);
    }
  });

  it("BLINK_MIN_MS < BLINK_MAX_MS", () => {
    expect(BLINK_MIN_MS).toBeLessThan(BLINK_MAX_MS);
  });
});
