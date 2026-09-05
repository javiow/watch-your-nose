# Step 14: score-bar-chart-component

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/src/types/experience.ts`의 `ModuleResult`(`typeId`, `score`, `grade`, `isCorrect` 등), `Grade`
- `/src/data/experience-types.ts` — `EXPERIENCE_TYPE_LABELS`(결과 페이지 전용 유형명)
- `/src/data/experience-format.ts` (step7) — `EXPERIENCE_FORMAT`(icon, learningPhrase)
- `/src/lib/scoring.ts` — `computeGrade`
- `/src/components/experiences/jeonse/HouseDialogPanel.tsx`의 `statusClassFor` — caution amber 관례

## 배경

결과 페이지에서 4개 체험의 점수를 막대 그래프로 비교해 보여준다. **이 컴포넌트가 기존 계획의 "오늘 배운 것" 문단 섹션을 대체한다** — 별도 카드/문단 없이, 각 막대 행의 짧은 캡션(`EXPERIENCE_FORMAT[typeId].learningPhrase`, 예: "전화 판단력")으로 학습 포인트를 압축한다.

## 작업

`src/components/ui/ScoreBarChart.tsx`를 신규 생성한다.

```ts
import type { ModuleResult } from "@/types/experience";

interface ScoreBarChartProps {
  results: ModuleResult[];
}

export function ScoreBarChart({ results }: ScoreBarChartProps): JSX.Element
```

구현 요구사항:

- `results`를 순회하며 한 행씩 렌더. 각 행:
  - `EXPERIENCE_FORMAT[result.typeId].icon` (aria-hidden)
  - `EXPERIENCE_TYPE_LABELS[result.typeId]` (유형명 — 결과 페이지이므로 허용)
  - `EXPERIENCE_FORMAT[result.typeId].learningPhrase` (옅은 톤 캡션)
  - 가로 막대: 트랙(`bg-surface-muted`) + 채움(`width: ${Math.round(result.score)}%`), 채움 색은 `result.grade`(없으면 `computeGrade(result.score)`)에 따라 safe/caution/danger. 색은 `data-grade` 속성 + CSS 방식(step13과 동일 관례).
  - 우측에 점수 숫자(`Math.round(result.score)`), `font-variant-numeric: tabular-nums`.
- 행 접근성: 각 행을 `aria-label`로 "유형명, 점수 N점" 요약을 제공하거나, 점수 숫자를 시각 텍스트로 노출(스크린리더가 읽을 수 있게).
- 새 색상 값은 caution amber 외 하드코딩 금지.

TDD로 먼저 `src/components/ui/ScoreBarChart.test.tsx`를 작성한다. `ModuleResult` 픽스처는 `src/data/remediation.test.ts`의 `makeResult` 스타일을 참고해 만든다. 최소한:

- 4개 `results`를 주면 4개 행이 렌더되고, 각 행에 해당 `EXPERIENCE_TYPE_LABELS` 값과 `EXPERIENCE_FORMAT[...].learningPhrase`가 보인다.
- `score=100`인 행의 막대 채움 인라인 스타일 `width`가 `"100%"`다.
- `score=30`인 행은 `data-grade="danger"`, `score=92`인 행은 `data-grade="safe"`다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 차트 라이브러리를 추가하지 않았는가?
   - `src/app/result/page.tsx`를 수정하지 않았는가? (그건 step15)
3. 결과에 따라 `phases/9-glossary-and-visual-results/index.json`의 `step: 14`를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 차트 라이브러리를 추가하지 마라.
- `src/app/result/page.tsx`를 수정하지 마라. 이유: 통합은 step15.
- 별도의 "오늘 배운 것" 문단 섹션 컴포넌트를 만들지 마라. 이유: 그 역할은 이 막대 그래프의 `learningPhrase` 캡션이 대신한다(텍스트 축소 목적).
- 기존 테스트를 깨뜨리지 마라.
