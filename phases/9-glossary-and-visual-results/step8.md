# Step 8: format-badge-component

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/src/data/experience-format.ts` (step7) — `ExperienceFormatMeta` 타입
- `/src/components/ui/StartButton.tsx` — 기존 공용 UI 컴포넌트 스타일 톤 참고

## 배경

`experience-format.ts`의 데이터를 화면에 보여줄 pill 형태의 배지 컴포넌트가 필요하다. 이 step은 컴포넌트만 만든다 — 실제 체험 화면에 부착하는 것은 step9~11이다.

## 작업

`src/components/ui/FormatBadge.tsx`를 신규 생성한다.

```ts
import type { ExperienceFormatMeta } from "@/data/experience-format";

interface FormatBadgeProps {
  format: ExperienceFormatMeta;
}

export function FormatBadge({ format }: FormatBadgeProps): JSX.Element
```

- `icon`은 장식용이므로 `aria-hidden="true"`를 준다.
- `formatLabel`은 굵게, `hint`는 옅은 톤(`text-subtle`)으로 함께 보여주는 pill(`rounded-full`) 형태.
- 새 색상 값을 하드코딩하지 말고 기존 토큰(`bg-surface-muted`, `border-border`, `text-muted`, `text-subtle`)만 쓴다.

TDD로 먼저 `src/components/ui/FormatBadge.test.tsx`를 작성해 레드 상태를 확인한 뒤 구현한다. 최소한 아래를 검증한다:

- `format.formatLabel`과 `format.hint` 텍스트가 렌더된다.
- `format.icon`을 감싼 엘리먼트에 `aria-hidden="true"`가 있다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `src/components/experiences/`, `src/app/` 아래 어떤 파일도 이 step에서 수정하지 않았는가?
3. 결과에 따라 `phases/9-glossary-and-visual-results/index.json`의 `step: 8`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `src/components/experiences/` 아래 파일을 수정하지 마라. 이유: 실제 부착은 step9~11의 작업이다.
- 기존 테스트를 깨뜨리지 마라.
