"use client";

import { useRef } from "react";
import { Mascot } from "@/components/ui/Mascot";
import { StartButton } from "@/components/ui/StartButton";

/**
 * 히어로 주변을 떠다니는 장식용 "가짜 스캠 알림" 문구.
 * 일반적인 스캠 톤이되 체험 유형명이나 다음 단계는 절대 드러내지 않는다
 * (ADR-004, page.test.tsx 유형명 비노출 원칙).
 */
export const HERO_CARDS: readonly string[] = [
  "[Web발신] 해외에서 로그인 시도가 감지되었습니다",
  "부재중 전화 3통 · 지금 확인해 주세요",
  "《혜택 도착》 고객님만을 위한 안내입니다",
  "송금이 완료되지 않았습니다 · 링크에서 인증하세요",
];

const CARD_FLOAT = ["card-float-a", "card-float-b", "card-float-c"];
const CARD_POSITION = [
  "left-1 top-4 sm:-left-10",
  "right-1 top-0 sm:-right-12",
  "bottom-16 left-0 sm:-left-14",
  "bottom-6 right-0 sm:-right-10",
];

export function LandingHero() {
  const stageRef = useRef<HTMLDivElement>(null);

  return (
    <section className="hero-bg hero-grain relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-20 text-center">
      <div ref={stageRef} className="relative flex flex-col items-center gap-8">
        {HERO_CARDS.map((text, i) => (
          <div
            key={text}
            data-hero-card=""
            aria-hidden="true"
            className={`pointer-events-none absolute hidden max-w-[15rem] select-none rounded-xl border border-border bg-surface/95 px-3 py-2 text-left text-xs leading-snug text-muted shadow-sm sm:block ${
              CARD_FLOAT[i % CARD_FLOAT.length]
            } ${CARD_POSITION[i]}`}
          >
            <span className="mb-0.5 block text-[10px] font-medium text-subtle">
              알림
            </span>
            {text}
          </div>
        ))}

        <Mascot
          interactive
          priority
          proximityRef={stageRef}
          className="h-52 w-52 sm:h-64 sm:w-64"
        />

        <div className="space-y-3">
          <p className="text-sm font-medium text-accent">Watch Your Nose</p>
          <h1 className="text-6xl font-bold tracking-tight text-foreground sm:text-7xl">코심코심</h1>
          <p className="text-base text-muted">
            나는 절대 안 속아? 그 자신감, 지금 바로 확인해보자.
          </p>
        </div>

        <div className="cta-pulse rounded-xl">
          <StartButton />
        </div>
      </div>

      <a
        href="#how-it-works"
        aria-label="더 알아보기"
        className="scroll-cue absolute bottom-6 text-2xl leading-none text-subtle"
      >
        ⌄
      </a>
    </section>
  );
}
