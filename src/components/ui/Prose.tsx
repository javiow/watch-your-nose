import type { ReactNode } from "react";
import { renderInlineMarkup } from "./inline-markup";

interface ProseProps {
  /** string이면 /\n{2,}/로 split, 배열이면 그대로 문단 목록으로 사용 */
  text: string | string[];
  /** 기본 "sm" */
  size?: "sm" | "base";
  /** 컨테이너에 덧붙임 */
  className?: string;
  /** 기본 "div" */
  as?: "div" | "section";
}

/**
 * 개행 없는 단일 문자열 본문을 문단 배열로 쪼개 문단마다 <p>로 렌더하고
 * 문단 간 여백을 준다. 첫 줄 들여쓰기는 넣지 않는다(문단 분리 + 여백 방식).
 */
export function Prose({
  text,
  size = "sm",
  className,
  as = "div",
}: ProseProps): ReactNode {
  const paragraphs = (Array.isArray(text) ? text : text.split(/\n{2,}/))
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  if (paragraphs.length === 0) return null;

  const Container = as;
  const containerClassName = [
    "max-w-prose space-y-3 leading-relaxed text-muted",
    size === "base" ? "text-base" : "text-sm",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Container className={containerClassName}>
      {paragraphs.map((paragraph, i) => (
        <p key={i}>{renderInlineMarkup(paragraph)}</p>
      ))}
    </Container>
  );
}
