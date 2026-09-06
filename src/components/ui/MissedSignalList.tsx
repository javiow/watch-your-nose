import type { ReactNode } from "react";
import type { MissedSignal } from "@/types/experience";
import { renderInlineMarkup } from "./inline-markup";

interface MissedSignalListProps {
  signals: MissedSignal[];
}

/**
 * 결과 페이지 "놓친 위험 신호" 불릿 목록. 신호마다 굵은 제목 한 줄 +
 * (있으면) 평문 설명 + (있으면) 별도 출처 줄. 제목만 <strong>으로 감싼다
 * — 문장 전체 볼드 방지가 목적이다. 신호가 없으면 아무것도 렌더하지 않는다.
 * title·description은 팀이 채운 정적 콘텐츠라 {{term:...}}·** 마커가 섞일 수 있어
 * renderInlineMarkup으로 치환한다(리터럴 노출 방지).
 */
export function MissedSignalList({ signals }: MissedSignalListProps): ReactNode {
  if (signals.length === 0) return null;

  return (
    <ul className="space-y-3">
      {signals.map((signal, i) => (
        <li key={i} className="space-y-1">
          <p>
            <strong className="font-semibold text-foreground">
              {renderInlineMarkup(signal.title)}
            </strong>
          </p>
          {signal.description && (
            <p className="text-sm text-muted">
              {renderInlineMarkup(signal.description)}
            </p>
          )}
          {signal.source && (
            <p className="text-xs text-subtle">(출처: {signal.source})</p>
          )}
        </li>
      ))}
    </ul>
  );
}
