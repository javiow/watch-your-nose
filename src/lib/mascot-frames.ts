import type { Grade } from "@/types/experience";

// 마스코트 표정 → 이미지 경로 / 등급 → 표정 / 모션 타이밍 상수만 담는 순수 데이터 모듈.
// React / next/image / window / 타이머를 import 하지 않는다 (step5 훅·step6 컴포넌트가 참조).

export type MascotExpression =
  | "idle"
  | "blink"
  | "surprised"
  | "worried"
  | "sleepy"
  | "relieved"
  | "sad";

export const MASCOT_FRAME_SRC: Record<MascotExpression, string> = {
  idle: "/mascot/idle.webp",
  blink: "/mascot/blink.webp",
  surprised: "/mascot/surprised.webp",
  worried: "/mascot/worried.webp",
  sleepy: "/mascot/sleepy.webp",
  // 웃는 소스 프레임이 없어 감은 눈(blink) 프레임 재사용 — ADR-013.
  relieved: "/mascot/blink.webp",
  sad: "/mascot/sad.webp",
};

// 프리로드용 — 중복 제거한 실제 파일 6개.
export const MASCOT_FRAME_FILES: string[] = [
  ...new Set(Object.values(MASCOT_FRAME_SRC)),
];

// 결과 페이지 종합 등급 → 정적 마스코트 표정 (ADR-013).
export const GRADE_EXPRESSION: Record<Grade, MascotExpression> = {
  safe: "relieved",
  caution: "worried",
  danger: "sad",
};

// 모션 타이밍 상수 (step5 훅과 그 테스트가 import — 하드코딩 금지).
export const BLINK_MIN_MS = 3200;
export const BLINK_MAX_MS = 6000;
export const BLINK_HOLD_MS = 140;
export const OCCASIONAL_LOOK_EVERY = 4; // 매 N번째 idle 틱마다 "sleepy"
export const OCCASIONAL_LOOK_MS = 900;
export const REACTION_SURPRISE_MS = 550; // surprised → worried 까지
export const REACTION_SETTLE_MS = 1100; // worried → baseExpression 까지
