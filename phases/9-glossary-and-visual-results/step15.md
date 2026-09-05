# Step 15: result-page-visual-redesign

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ADR.md`의 ADR-016 (결과 페이지에 유형 라벨 노출은 허용됨)
- `/src/app/result/page.tsx` (전체)
- `/src/app/result/page.test.tsx` (전체) — 특히 상단의 `vi.mock("@/lib/scoring", () => ({ GRADE_LABELS, aggregateResults }))` 팩토리
- `/src/components/ui/ScoreGauge.tsx` (step13), `/src/components/ui/ScoreBarChart.tsx` (step14)
- `/src/lib/scoring.ts` — `describeGradeThresholds`(step12), `aggregateResults`, `GRADE_LABELS`
- `/src/components/ui/HighlightedText.tsx` — 문항별 리뷰 `explanation` 렌더에 계속 사용
- `/src/data/experience-types.ts` — `EXPERIENCE_TYPE_LABELS`

## 배경

"글이 너무 많고 그래프가 없다"는 피드백. 결과 페이지를 게이지 + 막대 그래프 중심으로 재구성하고, 문항별 리뷰의 텍스트를 압축한다. **이 step은 이 phase에서 가장 리스크가 크다** — `result/page.test.tsx`를 대폭 갱신해야 한다. 대응 방안 섹션의 불릿/링크 렌더는 step17에서 별도로 하므로, 이 step에서는 기존 대응 방안 섹션(`getRemediation` + `HighlightedText`)을 **그대로 둔다**.

## 작업

### 1. `src/app/result/page.tsx` 재구성

렌더 순서: **① 게이지 → ② 막대 그래프 → ③ 문항별 리뷰(압축) → ④ 대응 방안(기존 유지)**.

- **① 종합 점수 섹션**: 기존 `Mascot` + "종합 정답률" + `{roundedAverage}% {GRADE_LABELS[grade]}` 텍스트 블록을 `<ScoreGauge percent={roundedAverage} grade={grade} />`로 교체한다. `Mascot`은 유지할지 제거할지 재량이되, 유지한다면 게이지 옆에 작게 둔다. 게이지 아래(또는 `ScoreGauge` 내부, step13의 결정에 따름)에 `describeGradeThresholds()` 한 줄 캡션이 보이도록 한다. `describeGradeThresholds`를 이 페이지에서 호출한다면 아래 2번(테스트 mock) 조치가 반드시 필요하다.
- **② 유형별 막대**: 문항별 리뷰 섹션 위에 `<ScoreBarChart results={results} />`를 넣는다.
- **③ 문항별 리뷰 압축**:
  - "정답"/"오답" 텍스트 배지를 `✓`/`✗` 아이콘으로 바꾸고, 아이콘 옆에 `sr-only`(스크린리더 전용) 텍스트로 "정답"/"오답"을 남긴다.
  - `내 선택: {userChoice}` / `정답: {correctChoice}` 두 줄을 한 줄로 합친다: `내 선택 {userChoice} · 정답 {correctChoice}`.
  - `explanation`은 계속 `<HighlightedText text={result.explanation} />`로 렌더한다(변경 없음).
- **④ 대응 방안 섹션**: 이 step에서는 손대지 마라. `getRemediation(result.mistakeTag)` + `HighlightedText` 구조를 그대로 둔다(step17에서 불릿/링크로 바꾼다).

### 2. `src/app/result/page.test.tsx` 갱신

- `vi.mock("@/lib/scoring", ...)` 팩토리가 현재 `{ GRADE_LABELS, aggregateResults }`만 반환한다. `page.tsx`가 `describeGradeThresholds`를 호출하도록 바꾸면 이 mock에 `describeGradeThresholds: () => "80% 이상 안전 · 50~79% 주의 · 50% 미만 위험"`를 추가해야 한다. 추가하지 않으면 `describeGradeThresholds is not a function`으로 result 테스트가 전부 깨진다.
- 기존 "종합 정답률" 텍스트를 직접 assert하던 케이스는 `ScoreGauge`의 `role="img"` + `aria-label`(예: `getByRole("img", { name: /72.*주의/ })`) 검증으로 교체한다.
- 신규/갱신 케이스:
  - 완료된 4개 결과로 `ScoreBarChart`가 렌더되고, 각 유형 라벨(`EXPERIENCE_TYPE_LABELS`)과 `learningPhrase`가 보인다.
  - 게이지 `aria-label`에 평균 점수와 등급 라벨이 포함된다.
  - 등급 기준 문구(`describeGradeThresholds()` 결과의 일부, 예: "50% 미만 위험")가 화면에 보인다.
  - 문항별 리뷰에서 정답/오답이 `sr-only` 텍스트로라도 접근 가능하다.
- `completeResults()` 등 기존 픽스처 헬퍼는 최대한 재사용한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다. **`result/page.test.tsx` 전체 + 프로젝트 전체 테스트가 통과해야 한다.**
2. 체크리스트:
   - `describeGradeThresholds`를 `page.tsx`에서 호출한다면, `page.test.tsx`의 `vi.mock` 팩토리에 해당 함수가 추가돼 있는가?
   - 대응 방안 섹션(`getRemediation` 기반)을 이 step에서 건드리지 않았는가?
   - `npm run dev`로 `/result`를 열어(직접 접근 시 리다이렉트되면 세션을 한 번 완주한 뒤) 게이지·막대가 실제로 그려지고 모바일 폭에서 레이아웃이 깨지지 않는지 눈으로 확인했는가?
3. 결과에 따라 `phases/9-glossary-and-visual-results/index.json`의 `step: 15`를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 대응 방안 섹션(`getRemediation` + `HighlightedText`)을 이 step에서 수정하지 마라. 이유: 불릿/링크 재구조화는 step16(데이터) + step17(렌더)에서 다루며, 한 step에서 두 관심사를 섞으면 리스크가 커진다.
- `src/lib/scoring.ts`를 수정하지 마라. 이유: step12에서 이미 함수가 추가됐다. 이 step은 그걸 소비만 한다.
- 문항별 리뷰에서 `explanation` 텍스트를 잘라내거나 요약하지 마라. 이유: 왜 그게 정답인지 설명하는 핵심 콘텐츠다. 압축 대상은 배지/선택 표기이지 설명 본문이 아니다.
- 기존 테스트를 (갱신이 명시된 `result/page.test.tsx` 외에는) 깨뜨리지 마라.
