# Step 5: fraud-judgment-defer-complete

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ADR.md`의 ADR-016
- `/src/components/ui/NextStepButton.tsx` (step0에서 생성됨) — props: `onClick`, `label?`, `disabled?`
- `/src/components/experiences/FraudJudgmentExperience.tsx` (전체)
- `/src/components/experiences/FraudJudgmentExperience.test.tsx` (전체)
- `/src/types/experience.ts`의 `ModuleResult`

## 배경

지금 `FraudJudgmentExperience`는 4번째(마지막) 카드에 답하는 순간 `handleAnswer` 안에서 `onComplete`를 곧바로 호출한다. 이 step에서는 그 타이밍만 바꾼다: 마지막 카드 판정이 끝나면 결과를 계산해 로컬 state에 저장만 하고, 화면에 나타나는 "다음으로 넘어가기" 버튼을 사용자가 눌러야만 `onComplete`가 호출되게 한다.

1~3번째 카드에서 다음 카드로 넘어가는 흐름(`currentIndex + 1 < content.length` 분기)은 이번 변경과 무관하다 — 그대로 둔다. `session/page.tsx`도 이 step에서 건드리지 않는다.

## 작업

### `src/components/experiences/FraudJudgmentExperience.tsx`

- `pendingResult: ModuleResult | null` state를 추가한다.
- `handleAnswer` 안, 마지막 카드 분기(`currentIndex + 1 < content.length`가 거짓이 되는 경우)에서 `onComplete({...})` 호출을 `setPendingResult({...})`로 바꾼다(전달 객체 내용은 그대로 유지). `locked`/`lockedRef`는 그대로 `true`로 남겨 "사기예요"/"정상이에요" 버튼이 계속 비활성 상태를 유지하게 한다.
- `pendingResult`가 있을 때만 `onComplete(pendingResult)`를 호출하는 핸들러를 추가하고, 중복 클릭 가드를 둔다.
- JSX: 현재 마지막에 렌더되는 "사기예요"/"정상이에요" 버튼 영역 아래에, `pendingResult`가 채워지면 `<NextStepButton onClick={...} />`을 추가로 렌더한다. 마지막 카드의 `title`/`content`는 그대로 화면에 남아 있어야 한다. 정답/오답이나 점수, `source`/`explanation`은 노출하지 않는다(이미 있는 "체험 중에는 source/explanation 비노출" 규칙 유지).

### `src/components/experiences/FraudJudgmentExperience.test.tsx` 갱신

아래 테스트들은 4번째 카드 답변 직후 `onComplete` 관련 값을 바로 확인하므로, 그 사이에 "다음으로 넘어가기" 버튼 클릭을 추가해야 한다(테스트 제목 기준):

- "카드 4장을 모두 답해야 onComplete가 호출된다" — 4번째 답변 직후에는 `onComplete`가 **아직 호출되지 않았음**을 확인하도록 마지막 단언을 바꾸고(`expect(onComplete).not.toHaveBeenCalled()`), 그다음 `"다음으로 넘어가기"` 버튼을 클릭해야 `onComplete`가 1회 호출됨을 확인하는 단언을 추가한다. 테스트 제목도 이 새 동작에 맞게 다듬는다(예: "카드 4장을 모두 답한 뒤 다음으로 넘어가기를 눌러야 onComplete가 호출된다").
- "4장 전부 정답이면 isCorrect: true, mistakeTag는 undefined다"
- "사기 카드를 정상으로 오판하면 missed-scam-signal이 우선된다 (혼합 오답)"
- "정상 카드만 사기로 오판하면 false-alarmed-safe-case다"
- "onComplete에 전달된 결과의 contentId는 4장의 id를 정렬해 이어붙인 값이다"
- "오답이 있으면 explanation에 해당 카드의 title과 출처가 포함된다"

위 6개는 `answerAll([...])` 호출 다음, `onComplete.mock.calls[0][0]`을 읽기 전에 `fireEvent.click(screen.getByText("다음으로 넘어가기"))`를 추가하라.

"마지막 카드 답변 이후 버튼을 다시 클릭해도 onComplete는 1회만 호출된다"는 `answerAll(...)` 직후의 `expect(onComplete).toHaveBeenCalledTimes(1)`을 `toHaveBeenCalledTimes(0)`으로 바꾸고, 그다음 "다음으로 넘어가기" 버튼을 클릭해 1이 되는 것을 확인한 뒤, 이미 있는 "사기예요"/"정상이에요" 재클릭 검증(여전히 비활성 상태라 아무 효과 없음)에 더해 "다음으로 넘어가기" 버튼을 한 번 더 클릭해도 여전히 1회임을 확인하도록 확장한다.

새 테스트는 추가하지 않아도 되지만(이미 위 수정으로 커버됨), 원한다면 "마지막 카드 답변 직후에는 다음으로 넘어가기 버튼이 나타난다" 수준의 렌더 확인 테스트를 추가해도 좋다.

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
   - 1~3번째 카드에서 다음 카드로 넘어가는 흐름은 그대로인가?
   - "다음으로 넘어가기" 화면에 `source`/`explanation`/정답/점수가 노출되지 않는가?
3. 결과에 따라 `phases/8-next-step-and-landing-intro/index.json`의 `step: 5`를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `src/app/session/page.tsx`, `src/lib/session-context.tsx`를 수정하지 마라. 이유: 오케스트레이션 계약은 그대로 유지된다.
- "다음으로 넘어가기" 화면에 `source`/`explanation`/`isCorrect`/`score`를 노출하지 마라.
- `src/components/experiences/VoicePhishingExperience.tsx`, `CaseInvestigationExperience.tsx`, `JeonseExperience.tsx`를 수정하지 마라. 이유: 각각 step2, step3, step4에서 개별적으로 다룬다.
- 기존 테스트를 깨뜨리지 마라 (위에 나열되지 않은 테스트는 그대로 통과해야 한다).
