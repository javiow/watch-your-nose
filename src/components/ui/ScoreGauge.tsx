import type { Grade } from "@/types/experience";
import { GRADE_LABELS } from "@/lib/scoring";

interface ScoreGaugeProps {
  /** 0~100 (반올림된 정수) */
  percent: number;
  grade: Grade;
}

const R = 62;
const CIRCUMFERENCE = 2 * Math.PI * R;

const ARC_COLOR: Record<Grade, string> = {
  safe: "var(--color-safe)",
  caution: "#d97706",
  danger: "var(--color-danger)",
};

/**
 * 종합 점수를 원형(도넛) 게이지로 보여준다. 차트 라이브러리 없이 SVG stroke-dasharray로 그린다.
 * 색은 data-grade 속성 + CSS 토큰으로 정한다.
 */
export function ScoreGauge({ percent, grade }: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const dashOffset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div
      role="img"
      aria-label={`종합 점수 ${clamped}퍼센트, ${GRADE_LABELS[grade]} 등급`}
      className="inline-flex flex-col items-center gap-1"
    >
      <svg
        data-grade={grade}
        width="150"
        height="150"
        viewBox="0 0 150 150"
        aria-hidden="true"
      >
        <circle
          cx="75"
          cy="75"
          r={R}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="14"
        />
        <circle
          cx="75"
          cy="75"
          r={R}
          fill="none"
          stroke={ARC_COLOR[grade]}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 75 75)"
        />
        <text
          x="75"
          y="70"
          textAnchor="middle"
          fill="var(--color-foreground)"
          style={{ font: "600 30px ui-monospace, monospace" }}
        >
          {clamped}%
        </text>
        <text
          x="75"
          y="96"
          textAnchor="middle"
          fill={ARC_COLOR[grade]}
          style={{ font: "600 14px inherit" }}
        >
          {GRADE_LABELS[grade]}
        </text>
      </svg>
    </div>
  );
}
