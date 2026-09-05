import { Fragment, type ReactNode } from "react";
import { resolveGlossaryKey } from "@/data/glossary";
import { TermTooltip } from "./TermTooltip";

// 한 문자열을 한 번만 순회하며 다음 두 마커를 처리한다:
//   - {{term:key}}            → resolveGlossaryKey(key)로 정의를 찾아 <TermTooltip>
//   - {{term:key|표시텍스트}}  → 표시텍스트로 <TermTooltip>, 정의 없으면 표시텍스트만
//   - **강조**                → <strong className="font-semibold text-foreground">
// 마커가 겹치지 않는다고 가정한다(현재 콘텐츠 규칙). 미존재 glossary key는
// 표시 텍스트(또는 key)를 그대로 둔다. dangerouslySetInnerHTML은 쓰지 않는다.
const INLINE_MARKUP = /\{\{term:([^}|]+?)(?:\|([^}]+))?\}\}|\*\*(.+?)\*\*/g;

/**
 * `**강조**`와 `{{term:key|label}}`를 단일 패스로 처리하는 인라인 토크나이저.
 * HighlightedText(강조)와 GlossaryTermText(용어)의 공통 구현으로, 두 컴포넌트는
 * 이제 이 함수를 감싸는 얇은 래퍼다.
 */
export function renderInlineMarkup(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  INLINE_MARKUP.lastIndex = 0;
  while ((match = INLINE_MARKUP.exec(text)) !== null) {
    const [full, rawKey, displayOverride, strongText] = match;

    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>
      );
    }

    if (strongText !== undefined) {
      nodes.push(
        <strong key={key++} className="font-semibold text-foreground">
          {strongText}
        </strong>
      );
    } else {
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
    }

    lastIndex = match.index + full.length;
  }

  if (lastIndex < text.length) {
    nodes.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }

  return <>{nodes}</>;
}
