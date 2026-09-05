import type { Grade, ModuleResult } from "@/types/experience";
import { computeGrade } from "@/lib/scoring";
import { EXPERIENCE_TYPE_LABELS } from "@/data/experience-types";
import { EXPERIENCE_FORMAT } from "@/data/experience-format";

interface ScoreBarChartProps {
  results: ModuleResult[];
}

const BAR_COLOR: Record<Grade, string> = {
  safe: "var(--color-safe)",
  caution: "#d97706",
  danger: "var(--color-danger)",
};

/**
 * 체험 유형별 점수를 가로 막대로 비교한다. 각 행의 짧은 캡션(learningPhrase)이
 * "이 체험에서 무엇을 연습했는지"를 문장 없이 압축해 보여준다.
 */
export function ScoreBarChart({ results }: ScoreBarChartProps) {
  return (
    <ul className="flex flex-col gap-4">
      {results.map((result, index) => {
        const score = Math.round(result.score);
        const grade = computeGrade(score);
        const format = EXPERIENCE_FORMAT[result.typeId];
        return (
          <li
            key={`${result.typeId}-${result.contentId}-${index}`}
            data-grade={grade}
            className="grid grid-cols-[1.5rem_1fr_2.5rem] items-center gap-x-3"
          >
            <span aria-hidden="true" className="text-center text-base">
              {format.icon}
            </span>
            <div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-semibold text-foreground">
                  {EXPERIENCE_TYPE_LABELS[result.typeId]}
                </span>
                <span className="text-subtle">{format.learningPhrase}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-muted">
                <div
                  data-bar-fill
                  className="h-full rounded-full"
                  style={{ width: `${score}%`, background: BAR_COLOR[grade] }}
                />
              </div>
            </div>
            <span className="text-right text-sm text-muted [font-variant-numeric:tabular-nums]">
              {score}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
