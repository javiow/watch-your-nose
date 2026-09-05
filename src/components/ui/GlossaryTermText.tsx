import { Fragment, type ReactNode } from "react";
import { resolveGlossaryKey } from "@/data/glossary";
import { TermTooltip } from "./TermTooltip";

const TERM_MARKER = /\{\{term:([^}|]+?)(?:\|([^}]+))?\}\}/g;

interface GlossaryTermTextProps {
  /** {{term:용어키}} 또는 {{term:용어키|표시텍스트}} 마커가 섞인 문장 */
  text: string;
}

/**
 * 체험 콘텐츠 문자열의 {{term:...}} 마커를 탭 가능한 용어 설명(TermTooltip)으로
 * 치환한다. HighlightedText와 같은 방식으로 직접 파싱하며 dangerouslySetInnerHTML을
 * 쓰지 않는다. 사전에 없는 키는 조용히 표시 텍스트만 남긴다(작성자 오타 방어).
 */
export function GlossaryTermText({ text }: GlossaryTermTextProps) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  TERM_MARKER.lastIndex = 0;
  while ((match = TERM_MARKER.exec(text)) !== null) {
    const [full, rawKey, displayOverride] = match;

    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>
      );
    }

    const termKey = rawKey.trim();
    const display = displayOverride ?? termKey;
    const entry = resolveGlossaryKey(termKey);

    nodes.push(
      entry ? (
        <TermTooltip key={key++} term={display} definition={entry.definition} />
      ) : (
        <Fragment key={key++}>{display}</Fragment>
      )
    );

    lastIndex = match.index + full.length;
  }

  if (lastIndex < text.length) {
    nodes.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }

  return <>{nodes}</>;
}
