import type { ReactNode } from "react";
import type { CaseInvestigationContent } from "@/types/experience";
import { Prose } from "@/components/ui/Prose";

interface DecisionRecapPanelProps {
  scenario: CaseInvestigationContent["scenario"];
  /** 등록한 증거의 description 목록 (importance는 넣지 않는다). */
  confirmedInfo: string[];
  npcAnswers: { question: string; answer: string }[];
}

/**
 * 판단(decision) 단계 상단의 접이식 요약 패널. 현재 상황, 확인한 정보(등록한 증거),
 * NPC 문답을 한자리에서 다시 보여준다. 스포일러(hiddenTruth·endingOptions.comment 등)와
 * 증거 중요도(핵심/참고)는 절대 넣지 않는다. 네이티브 <details open>으로 접힘/펼침 처리.
 */
export function DecisionRecapPanel({
  scenario,
  confirmedInfo,
  npcAnswers,
}: DecisionRecapPanelProps): ReactNode {
  return (
    <details
      open
      className="rounded-xl border border-border bg-surface p-4 shadow-sm"
    >
      <summary className="cursor-pointer text-sm font-medium text-muted">
        상황 다시 보기
      </summary>
      <div className="mt-3 space-y-4">
        <Prose text={scenario.description} size="sm" />
        <p className="text-sm text-subtle">
          {scenario.propertyLocation} · {scenario.propertyPriceDescription}
        </p>
        <div className="rounded-xl border border-border bg-surface-muted p-3">
          <p className="text-sm font-medium text-muted">{scenario.speakerLabel}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            &ldquo;{scenario.brokerLine}&rdquo;
          </p>
        </div>
        <p className="text-sm font-medium text-muted">{scenario.goal}</p>

        <div className="space-y-1">
          <p className="text-xs font-medium text-subtle">확인한 정보</p>
          {confirmedInfo.length > 0 ? (
            <ul className="space-y-1">
              {confirmedInfo.map((info, i) => (
                <li key={i} className="text-sm text-muted">
                  {info}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-subtle">등록한 증거가 없습니다.</p>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-subtle">
            {scenario.speakerLabel} 답변
          </p>
          {npcAnswers.length > 0 ? (
            <ul className="space-y-1">
              {npcAnswers.map((qa, i) => (
                <li key={i} className="text-sm text-muted">
                  「{qa.question}」 → {qa.answer}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-subtle">물어본 질문이 없습니다.</p>
          )}
        </div>
      </div>
    </details>
  );
}
