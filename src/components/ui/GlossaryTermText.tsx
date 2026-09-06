import type { ReactNode } from "react";
import { renderInlineMarkup } from "./inline-markup";

interface GlossaryTermTextProps {
  /** {{term:용어키}} 또는 {{term:용어키|표시텍스트}} 마커가 섞인 문장 */
  text: string;
}

/**
 * 체험 콘텐츠 문자열의 {{term:...}} 마커를 탭 가능한 용어 설명(TermTooltip)으로
 * 치환한다. 파싱은 renderInlineMarkup에 위임하며(dangerouslySetInnerHTML 미사용),
 * 사전에 없는 키는 조용히 표시 텍스트만 남긴다(작성자 오타 방어).
 */
export function GlossaryTermText({ text }: GlossaryTermTextProps): ReactNode {
  return <>{renderInlineMarkup(text)}</>;
}
