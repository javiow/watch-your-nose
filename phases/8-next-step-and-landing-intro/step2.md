# Step 2: voice-phishing-defer-complete

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ADR.md`의 ADR-016
- `/src/components/ui/NextStepButton.tsx` (step0에서 생성됨) — props: `onClick`, `label?`, `disabled?`
- `/src/components/experiences/VoicePhishingExperience.tsx` (전체)
- `/src/components/experiences/VoicePhishingExperience.test.tsx` (전체)
- `/src/types/experience.ts`의 `ModuleResult`, `ExperienceComponentProps`

이전 step에서 만들어진 `NextStepButton`의 정확한 props를 확인한 뒤 작업하라.

## 배경

지금 `VoicePhishingExperience`는 대화가 끝나는 마지막 선택지를 클릭하면(`finishScenario` 호출) 600ms 타이머 뒤 `onComplete`를 곧바로 호출해 부모(`session/page.tsx`)가 즉시 다음 체험 유형으로 넘긴다. 이 step에서는 그 타이밍만 바꾼다: 타이머가 끝나면 결과를 계산해 로컬 state에 저장만 하고, 화면에 남는 "다음으로 넘어가기" 버튼을 사용자가 눌러야만 `onComplete`가 호출되게 한다.

**대화 중간의 선택(다음 노드로 이어지는 선택지)은 이번 변경과 무관하다** — 지금처럼 선택 즉시 다음 대사가 이어진다. 이번 변경은 오직 "대화가 끝나는 마지막 선택지를 눌렀을 때"에만 적용된다.

`session/page.tsx`의 `handleComplete`는 이 step에서 건드리지 않는다 — `onComplete`가 "한 번 호출된다"는 계약은 그대로이고, 호출 시점만 컴포넌트 내부에서 늦춰지는 것뿐이다.

## 작업

### `src/components/experiences/VoicePhishingExperience.tsx`

- `pendingResult: ModuleResult | null` state를 추가한다.
- `finishScenario`의 `addTimer(() => { onComplete({...}); }, 600)` 블록에서, `onComplete(...)` 호출을 `setPendingResult({...})`로 바꾼다(전달하는 객체 내용은 그대로 유지).
- `handleNextStep` 같은 핸들러를 만들어 `pendingResult`가 있을 때만 `onComplete(pendingResult)`를 호출하고, 중복 클릭으로 `onComplete`가 두 번 불리지 않도록 로컬 플래그(예: `submitted` state 또는 `useRef`)로 가드한다 — 기존 `pathRisks`/`timers` 같은 `useRef` 가드 패턴을 참고하라.
- JSX: 채팅 로그(`history.map(...)`)와 `TypingIndicator` 아래, `choicesReady && currentNode`로 선택지를 렌더하던 자리에 — `pendingResult`가 채워지면 `choicesReady`는 이미 `false`이므로 선택지 대신 `<NextStepButton onClick={handleNextStep} />`이 나타나도록 조건부 렌더를 추가한다. 마지막 대화 내용(`history`)은 그대로 화면에 남아 있어야 한다.

### `src/components/experiences/VoicePhishingExperience.test.tsx` 갱신

지금 이 파일의 테스트 중, "마지막(더 이상 `next`가 없는) 선택지를 클릭하고 `advanceAllTimers()`를 호출한 뒤 곧바로 `onComplete`가 호출됐는지 단언"하는 테스트들은 이제 버튼을 먼저 눌러야 한다. 해당 테스트는 다음과 같다(테스트 제목 기준):

- "정상 케이스에서 거절을 선택하면 오답(blind-refusal)으로 채점된다"
- "정상 케이스에서 정상적으로 응대를 이어가면 정답으로 채점된다"
- "사기 케이스에서 거절 선택 시 정답으로 채점된다"
- "사기 케이스에서 거절하지 않고 응하면 오답(fell-for-scam)으로 채점된다"
- "중간에 caution 선택을 거쳐도 결국 거절하면 정답이지만 100점 미만으로 채점된다"
- "caution 없이 바로 거절하면 100점으로 채점된다"
- "next 참조가 존재하지 않는 노드를 가리키면 크래시 없이 시나리오를 종료 처리한다"
- "같은 선택지를 연속으로 빠르게 두 번 클릭해도 onComplete가 중복 호출되지 않는다"

각 테스트에서 마지막 선택지 클릭 + `advanceAllTimers()` 다음, `onComplete` 관련 단언 전에 `fireEvent.click(screen.getByText("다음으로 넘어가기"))`를 추가하라(이 텍스트는 `NextStepButton`의 기본 라벨이다).

"선택지 클릭 시 다음 버튼 없이 즉시 진행된다"(중간 대사로 넘어가는 케이스, `next: "n2"`가 있는 선택지)와 "선택 직후에도 정답/오답 피드백을 보여주지 않는다"는 시나리오 종료가 아니므로 **수정하지 않는다**.

새 테스트를 최소 1개 추가한다: 마지막 선택지 클릭 + `advanceAllTimers()` 직후에는 `onComplete`가 아직 호출되지 않고 `"다음으로 넘어가기"` 버튼이 나타나며, 그 버튼을 클릭해야 `onComplete`가 호출됨을 검증한다. 또한 그 버튼을 빠르게 두 번 클릭해도 `onComplete`가 1회만 호출되는지도 검증한다(레드 상태로 먼저 작성 후 구현).

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
   - 대화 중간(비-종료) 선택지 클릭 시 여전히 버튼 없이 즉시 다음 대사로 넘어가는가?
   - `ExperienceComponentProps.onComplete`는 여전히 시나리오당 정확히 1회만 호출되는가?
3. 결과에 따라 `phases/8-next-step-and-landing-intro/index.json`의 `step: 2`를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `src/app/session/page.tsx`, `src/lib/session-context.tsx`를 수정하지 마라. 이유: 오케스트레이션 계약(`onComplete` 1회 호출)은 그대로 유지되며, 변경은 이 컴포넌트 내부로 한정한다.
- 대화 중간 선택지 진행 방식(즉시 다음 대사)을 바꾸지 마라. 이유: 이번 변경은 "시나리오 종료 시점"에만 적용된다.
- `src/components/experiences/CaseInvestigationExperience.tsx`, `JeonseExperience.tsx`, `FraudJudgmentExperience.tsx`를 수정하지 마라. 이유: 각각 step3~5에서 개별적으로 다룬다.
- 기존 테스트를 깨뜨리지 마라 (위에 나열되지 않은 테스트는 그대로 통과해야 한다).
