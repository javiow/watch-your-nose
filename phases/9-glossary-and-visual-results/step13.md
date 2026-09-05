# Step 13: score-gauge-component

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` — "라이브러리 추가 없이" 원칙(차트도 직접 구현)
- `/src/lib/scoring.ts` — `Grade` 타입, `computeGrade`, `GRADE_LABELS`, `describeGradeThresholds`(step12에서 추가됨)
- `/src/app/globals.css` — `--safe`(#2f9e52), `--danger`(#e5484d) 토큰. caution 색은 정의돼 있지 않다.
- `/src/components/experiences/jeonse/HouseDialogPanel.tsx`의 `statusClassFor` — "주의" 상태에 `amber-500`/`amber-600`를 쓰는 기존 관례. 게이지의 caution 색도 이 관례를 따른다.

## 배경

결과 페이지의 종합 점수를 텍스트 대신 원형 게이지(도넛)로 보여준다는 피드백 결정. 차트 라이브러리는 쓰지 않고 SVG로 직접 그린다. 이 step은 컴포넌트만 만든다 — 결과 페이지 적용은 step15.

## 작업

`src/components/ui/ScoreGauge.tsx`를 신규 생성한다.

```ts
import type { Grade } from "@/types/experience";

interface ScoreGaugeProps {
  percent: number; // 0~100 (반올림된 정수를 받는다고 가정)
  grade: Grade;
}

export function ScoreGauge({ percent, grade }: ScoreGaugeProps): JSX.Element
```

구현 요구사항:

- SVG 링 2개: 배경 트랙(전체 원)과 점수만큼 채운 호(`stroke-dasharray`/`stroke-dashoffset`). 원 둘레 = `2 * Math.PI * r`, `dashoffset = circumference * (1 - percent / 100)`. 시작점이 12시 방향이 되도록 `transform="rotate(-90 cx cy)"`.
- 중앙에 `{percent}%`와 `GRADE_LABELS[grade]`를 텍스트로 표시.
- 등급별 색: `safe` → `--safe` 토큰, `danger` → `--danger` 토큰, `caution` → amber(예: `#d97706` 또는 Tailwind `amber-600`, `HouseDialogPanel`의 "주의" 색과 톤을 맞춘다). 색 전환은 SVG 요소에 `data-grade={grade}` 속성을 주고 CSS에서 `[data-grade="..."]` 선택자로 처리하는 방식을 권장(JS로 색을 계산해 인라인 스타일에 넣지 마라).
- 접근성: 장식용 `<svg>` 자체 또는 내부 도형은 `aria-hidden`으로 두고, 게이지를 감싸는 컨테이너에 `role="img"` + `aria-label={`종합 점수 ${percent}퍼센트, ${GRADE_LABELS[grade]} 등급`}`.
- `describeGradeThresholds()` 결과는 이 컴포넌트가 직접 렌더해도 되고(게이지 하단 한 줄 캡션), step15에서 결과 페이지가 렌더하도록 남겨도 된다 — 둘 중 하나를 택하고 그 결정을 `summary`에 적어라.
- 새 색상 값은 caution amber 외에는 하드코딩하지 마라.
- `prefers-reduced-motion`을 존중하라(호 채움에 애니메이션을 넣는다면 reduced-motion에서는 즉시 표시).

TDD로 먼저 `src/components/ui/ScoreGauge.test.tsx`를 작성해 레드 상태를 확인한 뒤 구현한다. 최소한:

- `percent=72, grade="caution"`으로 렌더 시 `role="img"` 요소의 `aria-label`에 "72"와 "주의"가 포함된다.
- `grade`별로 `data-grade` 속성값이 `"safe"`/`"caution"`/`"danger"`로 바뀐다.
- `percent=100`일 때와 `percent=0`일 때 크래시 없이 렌더된다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 차트/게이지 라이브러리를 `package.json`에 추가하지 않았는가?
   - `src/app/result/page.tsx`를 수정하지 않았는가? (그건 step15)
   - 색 전환이 CSS 토큰/`data-grade` 기반인가(JS 인라인 색 계산이 아닌가)?
3. 결과에 따라 `phases/9-glossary-and-visual-results/index.json`의 `step: 13`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약 + describeGradeThresholds 렌더 위치 결정"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 차트 라이브러리(recharts, chart.js, d3 등)를 추가하지 마라. 이유: CLAUDE.md의 정적/무의존성 원칙.
- `src/app/result/page.tsx`를 수정하지 마라. 이유: 결과 페이지 통합은 step15.
- 기존 테스트를 깨뜨리지 마라.
