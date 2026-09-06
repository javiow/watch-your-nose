# Step 7: case-investigation-phase-nav

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` (특히 "체험 유형 목록/다음 단계 사전 노출 금지" — 단, 이미 지나온 이전 단계로 되돌아가는 것은 여기에 해당하지 않는다)
- `/docs/ADR.md`의 ADR-003 (세션 상태는 React Context만, 새로고침 시 처음부터 재시작이 의도), ADR-010 (부동산 사기 조사 게임)
- `/src/components/experiences/CaseInvestigationExperience.tsx` (전체) — **step4에서 `buildExplanation` / `handleDecision`이 이미 수정된 상태**. `type Phase = "briefing" | "investigating" | "decision"`(L32), `phase` state(L89) 및 로컬 state 전체(L89-106: `points`, `completedInvestigationIds`, `openDocumentId`, `registeredEvidence`, `chatLog`, `selectedDecision`, `confirmed`, `pendingResult`, `nextStepSubmittedRef`), briefing 렌더(L188-218), investigating 렌더(L220-442, 하단 바 L431-439), decision 렌더(L444-483), `handleNextStep`(L181-186), `handleDecision`(L147-179, `if (confirmed) return`)
- `/src/components/experiences/CaseInvestigationExperience.test.tsx` (전체) — `gatingFixture` 계열 픽스처, investigating/decision까지 진행하는 헬퍼(예: `startInvestigating()`, `goToDecision()`), 스포일러 비노출·안내 재열람·조사 카운트 테스트
- `/src/components/ui/IntroDialog.tsx` — `mode="gate"`(확인 버튼만, Esc/오버레이 무력화) / `mode="help"`(닫기)
- `/src/components/ui/NextStepButton.tsx`

## 배경

계약 사기 체험은 `phase` state로 3단계(briefing 현재상황 → investigating 정보확인 → decision 판단)를 **전진 전용**으로만 진행한다. 사용자 피드백: *"정보 확인할 때 지금 무슨 상황인지 다시 보고 싶고, 판단하기 전에 파악한 정보를 다시 보고 싶다."*

이 step은 **단계 간 "이전" 이동**을 넣는다. 모든 state가 컴포넌트 로컬 `useState`이므로 `setPhase`로 왕복해도 값은 보존된다(evidence / chatLog / points / completedInvestigationIds 등). 다만 decision을 벗어날 때는 낡은 판단 결과가 제출되지 않도록 판단 관련 state만 초기화한다.

**이 step 범위 밖:** 판단 단계 요약 패널(`DecisionRecapPanel`)은 step8이다.

## 작업

### `src/components/experiences/CaseInvestigationExperience.tsx`

1. `const visitedInvestigatingRef = useRef(false)` 추가. investigating에 처음/다시 진입시키는 모든 경로에서 `visitedInvestigatingRef.current = true`로 세팅한다:
   - briefing 게이트 `IntroDialog`의 `onConfirm` (`setPhase("investigating")` 하는 곳)
   - briefing의 "조사로 돌아가기" 버튼 (아래 3번)
   - decision → investigating 뒤로가기 (아래 4번)

2. **investigating 하단 바**(현재 L431-439, `flex justify-end`에 `판단하기` 하나):
   - 컨테이너를 `flex justify-between gap-3`로 바꾼다.
   - 좌측: `<button type="button" className={outlineButtonClass} onClick={() => setPhase("briefing")}>이전</button>`
   - 우측: 기존 `판단하기` 버튼 그대로 (`setPhase("decision")`).

3. **briefing 렌더 블록**(L188-218):
   - `visitedInvestigatingRef.current === true`(= 되돌아온 경우)이면 하단의 `<IntroDialog mode="gate" … onConfirm={() => setPhase("investigating")} />`를 렌더하지 않고, 대신 시나리오 카드 아래에 인라인 버튼
     `<button type="button" className={primaryButtonClass} onClick={() => setPhase("investigating")}>조사로 돌아가기</button>` 를 렌더한다.
   - `false`(최초 진입)이면 기존 `IntroDialog mode="gate"` 그대로.

4. **decision 렌더 블록**(L444-483) 최상단(“이제 판단을 내려주세요” 카드보다 앞)에:
   ```tsx
   {!confirmed && (
     <div className="flex justify-start">
       <button type="button" className={outlineButtonClass} onClick={handleBackToInvestigating}>
         이전
       </button>
     </div>
   )}
   ```
   `handleBackToInvestigating`:
   ```ts
   const handleBackToInvestigating = () => {
     setSelectedDecision(null);
     setPendingResult(null);
     visitedInvestigatingRef.current = true;
     setPhase("investigating");
   };
   ```
   `nextStepSubmittedRef`는 건드리지 않는다(false 유지).

5. `confirmed === true`(= `handleNextStep`에서 "다음으로 넘어가기" 클릭 후, L184)이면 decision의 "이전" 버튼을 렌더하지 않는다(위 `!confirmed` 가드). 확정 후에는 이탈 불가.

### 지켜야 할 핵심 규칙

- **decision → investigating 뒤로가기 시 반드시 `selectedDecision`과 `pendingResult`를 `null`로 초기화한다.** 이유: 사용자가 증거를 더 등록/변경하고 돌아오면, 이전 state로 계산된 `pendingResult`를 그대로 제출할 경우 점수가 실제 조사 상태와 어긋난다. 판단 화면에서 결정을 다시 눌러 `handleDecision`이 새로 계산하게 한다.
- `phase` 외 다른 state(`points`, `registeredEvidence`, `chatLog`, `completedInvestigationIds`, `openDocumentId`)는 뒤로가기 시 **초기화하지 마라** — 왕복해도 조사 진척이 유지되는 것이 요구사항이다.
- `handleDecision`의 `if (confirmed) return`(L148)은 그대로 둔다.
- 세션 Context에 아무것도 저장하지 마라 (ADR-003). 모든 단계 state는 컴포넌트 로컬로 유지한다.

### `src/components/experiences/CaseInvestigationExperience.test.tsx` 갱신

- **신규**: investigating → "이전" → briefing: 시나리오 설명 텍스트가 다시 보이고, `role="dialog"`(IntroDialog)가 **다시 뜨지 않으며**, "조사로 돌아가기" 버튼이 있다. 클릭 → investigating 복귀, "등록된 증거 N건" 카운트가 뒤로가기 전과 동일.
- **신규**: decision에서 판단 하나 선택 → "이전": investigating 화면 복귀, "다음으로 넘어가기" 버튼이 사라진다(= `pendingResult` 초기화됨). 다시 "판단하기" → 결정 선택 시 정상 동작.
- **신규**: "다음으로 넘어가기"로 확정한 뒤 `screen.queryByRole("button", { name: "이전" })`이 `null`이고, 판단 버튼이 disabled다(기존 테스트 유지).
- 기존 스포일러 비노출 / "안내 다시 보기" 재열람 / 조사 카운트 테스트는 그대로 통과해야 한다.

## Acceptance Criteria

> 메모리 절약: 전체 Next 빌드 / 전체 테스트 대신 **타입체크 + 린트 + 이 step 관련 테스트만** 실행한다. 전체 `npm run build && npm test`는 phase 종료 후 운영자가 한 번 돌린다.

```bash
npx tsc --noEmit
npm run lint
npx vitest run src/components/experiences/CaseInvestigationExperience.test.tsx
```

## 검증 절차

1. 위 AC 커맨드를 실행한다. **위 타입체크·린트·관련 테스트가 모두 통과해야 한다.**
2. (선택, 자동 실행 세션에서는 생략 — `npm run dev`는 종료되지 않으므로 실행하지 마라) 로컬 육안 확인 시 `npm run dev`로 계약 사기 케이스를 진행: 브리핑 → 조사 시작 → 증거 등록 + NPC 질문 → 판단하기 → decision에서 "이전" → investigating(증거·채팅 유지 확인) → 판단하기 → 결정 → "다음으로 넘어가기" → "이전" 버튼이 사라짐.
3. 체크리스트:
   - 뒤로가기가 `points` / `registeredEvidence` / `chatLog` / `completedInvestigationIds`를 초기화하지 않는가?
   - decision 이탈 시 `selectedDecision` / `pendingResult`만 `null`이 되는가?
   - `confirmed` 이후 "이전"이 숨겨지는가?
   - 세션 Context를 쓰지 않았는가?
   - briefing 재진입 시 `IntroDialog`가 다시 뜨지 않고 "조사로 돌아가기" 버튼이 나오는가?
4. 결과에 따라 `phases/11-review-breakdown-and-phase-nav/index.json`의 `step: 7`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

`summary`에 `visitedInvestigatingRef` 도입, 세 렌더 블록의 "이전"/"조사로 돌아가기" 버튼 위치, `handleBackToInvestigating`이 `selectedDecision`/`pendingResult`를 초기화한다는 사실을 적어라(step8이 decision 블록에 요약 패널을 추가할 때 참조한다).

## 금지사항

- 뒤로가기에서 `points` / `registeredEvidence` / `chatLog` / `completedInvestigationIds` / `openDocumentId`를 리셋하지 마라. 이유: 왕복해도 조사 진척이 유지되는 것이 이 step의 목적이다.
- decision → investigating 뒤로가기에서 `selectedDecision` / `pendingResult`를 남겨두지 마라. 이유: 낡은 state로 계산된 점수가 제출될 수 있다.
- `confirmed` 이후 어떤 뒤로가기도 허용하지 마라. 이유: 결과가 이미 `onComplete`로 나갔다.
- step4에서 바꾼 `buildExplanation` / `handleDecision`의 `reviewItems` / `missedSignals` 로직을 되돌리지 마라.
- `DecisionRecapPanel`(요약 패널)을 이 step에서 만들지 마라. 이유: step8이다.
- `src/components/ui/IntroDialog.tsx` 자체를 수정하지 마라. 이유: 다른 3개 체험이 공유한다.
- 세션 Context / localStorage에 단계 state를 저장하지 마라 (ADR-003).
