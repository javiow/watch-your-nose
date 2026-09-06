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
// 모바일(<640px)에서는 스테이지(마스코트+헤드라인+버튼) 내부와 겹치지 않도록
// 스테이지 바깥 위/아래 여백에 배치하고, sm: 이상에서는 기존 데스크톱 위치를 그대로 되돌린다.
const CARD_POSITION = [
  "-top-16 left-2 sm:top-4 sm:left-1 sm:-left-10",
  "-top-20 right-2 sm:top-0 sm:right-1 sm:-right-12",
  "-bottom-16 left-2 sm:bottom-16 sm:left-0 sm:-left-14",
  "-bottom-20 right-2 sm:bottom-6 sm:right-0 sm:-right-10",
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
            className={`pointer-events-none absolute max-w-[9.5rem] select-none rounded-xl border border-border bg-surface/95 px-3 py-2 text-left text-xs leading-snug text-muted shadow-sm sm:max-w-[15rem] ${
              CARD_FLOAT[i % CARD_FLOAT.length]
            } ${CARD_POSITION[i]}`}
          >
            <span className="mb-0.5 block text-[10px] font-medium text-subtle">
              알림
            </span>
            {text}
          </div>
        ))}

        <div className="flex flex-col items-center gap-2">
          <Mascot
            interactive
            priority
            proximityRef={stageRef}
            className="h-52 w-52 sm:h-64 sm:w-64"
          />
          <span className="rounded-full border border-border bg-surface/90 px-3 py-1 text-xs font-medium text-muted">
            코심이
          </span>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-accent">Watch Your Nose</p>
          <h1 className="text-6xl font-bold tracking-tight text-foreground sm:text-7xl">코심코심</h1>
          <p className="text-base text-muted">
            눈 뜨고 코 베이지 않도록, 다양한 금융 사기를 미리 겪어보는 학습 서비스.
          </p>
          <p className="text-sm text-subtle">
            서울로 갓 상경한 코심이가 &ldquo;코 조심, 코 조심&rdquo; 되뇌며 사기 수법을 익히는 이야기예요.
          </p>
        </div>

        <div className="cta-pulse rounded-xl">
          <StartButton />
        </div>
      </div>
    </section>
  );
}
