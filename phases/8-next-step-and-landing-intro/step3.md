# Step 3: case-investigation-defer-complete

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ADR.md`의 ADR-016
- `/src/components/ui/NextStepButton.tsx` (step0에서 생성됨) — props: `onClick`, `label?`, `disabled?`
- `/src/components/experiences/CaseInvestigationExperience.tsx` (전체)
- `/src/components/experiences/CaseInvestigationExperience.test.tsx` (전체)
- `/src/types/experience.ts`의 `ModuleResult`

## 배경

지금 `CaseInvestigationExperience`는 `phase === "decision"` 화면에서 "계약을 진행한다"/"추가로 확인한 뒤 결정한다"/"계약을 중단한다" 중 하나를 클릭하면 `handleDecision`이 결과를 계산해 `onComplete`를 곧바로 호출한다(버튼 자체는 `decisionLocked`로 비활성화됨). 이 step에서는 그 타이밍만 바꾼다: 클릭 시 결과는 계산해 로컬 state에 저장만 하고, 화면에 새로 나타나는 "다음으로 넘어가기" 버튼을 사용자가 눌러야만 `onComplete`가 호출되게 한다.

브리핑/조사 단계(`phase === "briefing" | "investigating"`)의 내부 진행 방식(조사 시작·문서 열람·NPC 질문·"판단하기" 버튼)은 이번 변경과 무관하다 — 그대로 둔다. `session/page.tsx`도 이 step에서 건드리지 않는다.

## 작업

### `src/components/experiences/CaseInvestigationExperience.tsx`

- `pendingResult: ModuleResult | null` state를 추가한다.
- `handleDecision` 안에서 `onComplete({...})` 호출을 `setPendingResult({...})`로 바꾼다(전달 객체 내용은 그대로 유지). `lockedRef`/`decisionLocked` 가드는 그대로 둔다.
- `pendingResult`가 있을 때만 `onComplete(pendingResult)`를 호출하는 핸들러를 추가하고, 중복 클릭으로 `onComplete`가 두 번 불리지 않도록 가드한다.
- JSX: `decision` 단계 화면(현재 391~424번째 줄, "이제 판단을 내려주세요." 안내 + 3개 결정 버튼)에서, `pendingResult`가 채워지면 3개 결정 버튼 영역 아래(또는 대신)에 "판단을 등록했습니다" 같은 짧은 확인 문구와 `<NextStepButton onClick={...} />`을 렌더한다. 정답/오답 여부나 점수는 여기서 노출하지 않는다(다른 유형과 동일한 "결과 페이지에서만 공개" 원칙, `CLAUDE.md`/PRD 4번 항목).

### `src/components/experiences/CaseInvestigationExperience.test.tsx` 갱신

지금 이 파일에서 결정 버튼 클릭 직후 `onComplete` 관련 값을 바로 읽는 테스트들은 이제 그 사이에 "다음으로 넘어가기" 버튼 클릭을 추가해야 한다. 해당 테스트는 다음과 같다(테스트 제목 기준):

- "최종 판단 버튼 클릭 시 onComplete가 정확히 1회 호출되고 연속 클릭해도 1회만 호출된다" — 결정 버튼 연속 클릭 검증은 그대로 두되, 그 뒤에 `"다음으로 넘어가기"` 버튼을 연속 클릭해도 `onComplete`가 1회만 호출되는지도 함께 검증하도록 확장한다.
- "JEONSE_001에서 최고점이 아닌 결정을 선택하면 오답이고 missed-realestate-investigation-signal 태그가 붙는다"
- "JEONSE_001에서 최고점 결정을 선택하면 정답이고 mistakeTag가 없다"
- "BUNYANG_005에서 최고점(SAFE_TO_PROCEED)이 아닌 결정을 선택하면 false-alarmed-safe-case 태그가 붙는다"
- "onComplete로 전달된 explanation에 hiddenTruth.explanation의 일부가 포함된다"
- "result.typeId와 contentId가 올바르다"

각 테스트에서 결정 버튼(`fireEvent.click(screen.getByText("계약을 진행한다"))` 등) 클릭 다음, `onComplete.mock.calls[0][0]`을 읽기 전에 `fireEvent.click(screen.getByText("다음으로 넘어가기"))`를 추가하라.

새 테스트를 최소 1개 추가한다: 결정 버튼을 클릭한 직후에는 `onComplete`가 아직 호출되지 않고 `"다음으로 넘어가기"` 버튼이 화면에 나타남을 검증한다(레드 상태로 먼저 작성 후 구현).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `session/page.tsx`를 수정하지 않았는가?
   - 브리핑/조사 단계(조사 시작, 문서 열람, NPC 질문, "판단하기") 동작은 그대로인가?
   - "다음으로 넘어가기" 화면에 정답/오답/점수가 노출되지 않는가?
3. 결과에 따라 `phases/8-next-step-and-landing-intro/index.json`의 `step: 3`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `src/app/session/page.tsx`, `src/lib/session-context.tsx`를 수정하지 마라. 이유: 오케스트레이션 계약은 그대로 유지된다.
- "다음으로 넘어가기" 확인 화면에 `isCorrect`/`score`/정답 텍스트를 노출하지 마라. 이유: 정답/오답 피드백은 결과 페이지(`/result`)에서만 공개한다는 원칙을 유지해야 한다.
- `src/components/experiences/VoicePhishingExperience.tsx`, `JeonseExperience.tsx`, `FraudJudgmentExperience.tsx`를 수정하지 마라. 이유: 각각 step2, step4, step5에서 개별적으로 다룬다.
- 기존 테스트를 깨뜨리지 마라 (위에 나열되지 않은 테스트는 그대로 통과해야 한다).
