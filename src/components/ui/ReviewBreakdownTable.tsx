import type { ReactNode } from "react";
import type { ReviewItem } from "@/types/experience";

interface ReviewBreakdownTableProps {
  items: ReviewItem[];
}

/**
 * 결과 페이지 "문항별 리뷰"의 O/X 표. 카드/매물마다 한 행으로
 * 내 판단 · 정답 · 정오를 보여준다. 항목이 없으면 아무것도 렌더하지 않는다.
 * page.test.tsx가 리뷰 문항을 <li>로 세므로 표는 반드시 <table>로 렌더한다.
 */
export function ReviewBreakdownTable({ items }: ReviewBreakdownTableProps): ReactNode {
  if (items.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-subtle">
            <th className="py-1 pr-3 text-left font-medium">항목</th>
            <th className="py-1 pr-3 text-left font-medium">내 판단</th>
            <th className="py-1 pr-3 text-left font-medium">정답</th>
            <th className="py-1 text-left font-medium">결과</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td className="border-t border-border py-2 pr-3 text-muted">
                {item.label}
              </td>
              <td className="border-t border-border py-2 pr-3 text-subtle">
                {item.userVerdict}
              </td>
              <td className="border-t border-border py-2 pr-3 text-subtle">
                {item.correctVerdict}
              </td>
              <td className="border-t border-border py-2">
                <span
                  aria-hidden="true"
                  className={item.isCorrect ? "text-safe" : "text-danger"}
                >
                  {item.isCorrect ? "✓" : "✗"}
                </span>
                <span className="sr-only">{item.isCorrect ? "정답" : "오답"}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
