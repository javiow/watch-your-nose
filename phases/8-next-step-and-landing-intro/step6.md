# Step 6: result-page-content-labels

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ADR.md`의 ADR-016
- `/docs/PRD.md`의 "핵심 기능" 9번 항목
- `/src/data/experience-types.ts` (step1에서 생성됨) — `EXPERIENCE_TYPE_LABELS: Record<ExperienceTypeId, string>`
- `/src/app/result/page.tsx` (전체)
- `/src/app/result/page.test.tsx` (전체)
- `/src/lib/registry.ts`의 `EXPERIENCE_MODULES` (결과 배열 길이 = 4인 이유 확인용)

## 배경

`/result`의 "문항별 리뷰"는 각 항목에 `{index + 1}번`만 보여주고 어떤 체험 유형이었는지는 보여주지 않는다(`result.typeId`는 React `key`로만 쓰이고 화면에 노출되지 않는다). "대응 방안"도 마찬가지다. 이 step에서는 두 섹션 모두에 `EXPERIENCE_TYPE_LABELS[result.typeId]` 라벨을 추가한다. 콘텐츠별 개별 제목(`CaseInvestigationContent.title` 등)은 스포일러라 계속 렌더링 금지 — 이 step에서 보여주는 건 **유형** 라벨뿐이다.

## 작업

### `src/app/result/page.tsx`

- `import { EXPERIENCE_TYPE_LABELS } from "@/data/experience-types";`를 추가한다.
- "문항별 리뷰" 리스트 아이템(현재 `{index + 1}번`을 렌더하는 `<p>`) 옆에 `EXPERIENCE_TYPE_LABELS[result.typeId]`를 함께 표시한다. 예: `{index + 1}번 · {EXPERIENCE_TYPE_LABELS[result.typeId]}` 형태로, 기존 "정답"/"오답" 배지와 같은 줄 또는 바로 아래에 자연스럽게 배치한다(기존 Tailwind 톤 유지).
- "대응 방안" 리스트 아이템에도 같은 방식으로 `EXPERIENCE_TYPE_LABELS[result.typeId]` 라벨을 추가해, `getRemediation(result.mistakeTag)` 텍스트 위나 옆에 작은 라벨/배지로 보여준다.

### `src/app/result/page.test.tsx` 갱신

지금 `completeResults()` 픽스처는 4개 결과 전부 `typeId: "voice-phishing"`으로 고정돼 있다. 4개 유형이 실제로 섞이도록 픽스처를 보강한다 — 예를 들어 `EXPERIENCE_MODULES`를 순회하며 각 모듈의 `typeId`를 하나씩 배정하거나, 함수 인자로 typeId 배열을 받게 고친다(기존 `completeResults()` 시그니처를 쓰는 다른 테스트가 깨지지 않게 기본 동작은 유지하거나 호출부를 함께 갱신하라).

새/갱신 테스트로 최소 아래를 검증한다:

- 문항별 리뷰의 각 항목에 `EXPERIENCE_TYPE_LABELS`의 4개 라벨(`"보이스피싱"`/`"케이스 조사"`/`"전세매물"`/`"사기 판별 카드"`)이 각각 노출된다.
- 오답 결과(`isCorrect: false`, `mistakeTag` 지정)를 하나 이상 포함한 픽스처로, "대응 방안" 섹션의 해당 항목에도 그 결과의 유형 라벨이 함께 노출된다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `CaseInvestigationContent.title` 등 스포일러 필드를 결과 페이지에 새로 노출하지 않았는가?
   - `EXPERIENCE_TYPE_LABELS`를 `src/app/page.tsx`나 세션 진행 화면에 잘못 import하지 않았는가(결과 페이지 전용)?
3. 결과에 따라 `phases/8-next-step-and-landing-intro/index.json`의 `step: 6`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `src/components/experiences/*`, `src/app/session/page.tsx`를 수정하지 마라. 이유: 이 step은 결과 페이지 렌더링만 다룬다.
- 콘텐츠별 개별 제목/카테고리(스포일러 필드)를 새로 노출하지 마라 — 이 step은 유형 라벨만 추가한다.
- 기존 테스트를 깨뜨리지 마라.
