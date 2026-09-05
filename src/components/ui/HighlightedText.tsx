import type { ReactNode } from "react";
import { renderInlineMarkup } from "./inline-markup";

interface HighlightedTextProps {
  /** 일반 문장 안에서 **이렇게** 감싼 부분만 강조해서 렌더한다. */
  text: string;
}

/**
 * 문항별 리뷰·대응 방안처럼 긴 설명 문장에서, 체험자가 실제로 기억해야 할
 * 핵심 부분만 강조하기 위한 컴포넌트. 파싱은 renderInlineMarkup에 위임하며,
 * 기존 호출부는 `**`만 쓰던 문자열을 넘기므로 동작 차이가 없다.
 */
export function HighlightedText({ text }: HighlightedTextProps): ReactNode {
  return <>{renderInlineMarkup(text)}</>;
}
