interface HighlightedTextProps {
  /** 일반 문장 안에서 **이렇게** 감싼 부분만 강조해서 렌더한다. */
  text: string;
}

/**
 * 문항별 리뷰·대응 방안처럼 긴 설명 문장에서, 체험자가 실제로 기억해야 할
 * 핵심 부분만 강조하기 위한 컴포넌트. 문장 전체를 굵게/배경색으로 바꾸는
 * 대신, 콘텐츠 작성 시점에 `**핵심 부분**`으로 표시해둔 구간만 <strong>으로
 * 렌더하고 나머지는 일반 텍스트로 남긴다.
 */
export function HighlightedText({ text }: HighlightedTextProps) {
  const parts = text.split(/\*\*(.+?)\*\*/g);

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-foreground">
            {part}
          </strong>
        ) : (
          part
        )
      )}
    </>
  );
}
