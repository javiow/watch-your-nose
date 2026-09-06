# Step 4: case-investigation-review-payload

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` (특히 "TDD", "체험 유형/다음 단계 사전 노출 금지")
- `/docs/ADR.md`의 ADR-003 (Context만), ADR-004 (유형 사전 비공개·플러그인), ADR-010 (부동산 사기 조사 게임 6개 케이스)
- `/src/types/experience.ts` (전체) — step0의 `ReviewItem` / `MissedSignal` / `ModuleResult` 신규 필드; `CaseInvestigationContent`(L232-254), `CaseEvidenceDefinition { pattern, importance, description }`(L164-168), `CaseHiddenTruth.explanation`(L229), `CaseEndingOption`(L219-223), `CaseFinalDecision`(L214-217)
- `/src/components/experiences/CaseInvestigationExperience.tsx` (전체) — `buildExplanation`(L62-83), `handleDecision`(L147-179)에서 `setPendingResult({...})`(L168-178), `DECISION_LABELS`(L39-43), `phase` state(L89)
- `/src/components/experiences/CaseInvestigationExperience.test.tsx` (전체) — `gatingFixture` 픽스처, `goToDecision()` 계열 헬퍼, explanation 관련 어서션(예: `hiddenTruth.explanation` 앞 20자 포함)
- `/src/lib/scoring.ts` — `computeCaseInvestigationScore` → `CaseInvestigationScoreBreakdown`(특히 `missedRiskPatterns`), `getBestEndingOption`
- `/src/data/case-investigation.ts` — `evidenceDefinitions[].description`, `hiddenTruth.explanation`, `endingOptions[].comment`

## 배경

`CaseInvestigationExperience`는 조사(investigating) 후 **단일 최종 판단**(`SAFE_TO_PROCEED` / `NEED_MORE_VERIFICATION` / `STOP_CONTRACT`)을 내린다.

현재 `buildExplanation`(L62-83)은 `content.hiddenTruth.explanation` 뒤에
`` ` **놓친 위험 신호: ${missedDescriptions.join(", ")}.**` `` 를 붙이고, 마지막에 최선 결말의 `comment`를 잇는다. 결과 페이지에서 그 `**…**` 조각이 볼드 덩어리로 보인다.

이 step은 놓친 신호를 `missedSignals` 배열로 빼고 `reviewItems` 1행을 채운다. `explanation`은 `hiddenTruth.explanation`(내부 `\n\n` 유지) + 최선 결말 `comment`만 남긴다.

**이 step 범위 밖(건드리지 마라):** 단계 간 "이전" 이동은 step7, 판단 단계 요약 패널(`DecisionRecapPanel`)은 step8이다.

## 작업

### `src/components/experiences/CaseInvestigationExperience.tsx`

1. **`buildExplanation`(L62-83) 재작성**:
   - `content.hiddenTruth.explanation` + `" "` + `bestOptionComment` 만 반환한다.
   - `explanation += " **놓친 위험 신호: …**"` 블록(대략 L69-80)을 **삭제**한다.
   - `breakdown` 인자가 더 이상 필요 없으면 시그니처에서 빼고 호출부(`handleDecision`)도 같이 정리한다. 필요하면 남겨도 된다 — 판단은 재량. 단 미사용 인자로 lint 경고가 나면 안 된다.

2. **신규 순수 함수** `buildMissedSignals(content: CaseInvestigationContent, breakdown: CaseInvestigationScoreBreakdown): MissedSignal[]`:
   - `breakdown.missedRiskPatterns`를 순회하며 `content.evidenceDefinitions.find((d) => d.pattern === p)?.description` 를 구하고, truthy만 남긴다.
   - 각각 `{ title: description }` — `evidenceDefinitions`의 `description`은 이미 한 줄 요약이므로 `title`에 넣고 `description` / `source`는 생략한다.

3. **`handleDecision`의 `setPendingResult({...})`**(L168-178)에 필드 추가(기존 필드 유지). `breakdown`과 `bestOption`은 이미 이 함수 스코프에 있다:
   ```ts
   reviewItems: [
     {
       label: "이 계약 판단",
       userVerdict: DECISION_LABELS[decision],
       correctVerdict: DECISION_LABELS[bestOption.decision],
       isCorrect,
       detail: isCorrect ? undefined : content.hiddenTruth.explanation,
     },
   ],
   missedSignals: isCorrect ? undefined : buildMissedSignals(content, breakdown),
   ```

### 지켜야 할 핵심 규칙

- `evidenceDefinitions[].importance`(1 | 2)를 **절대** 결과에 노출하지 마라 — "핵심/참고" 라벨 비노출은 이 phase 전체에서 지킨다.
- 스포일러 필드(`content.title`, `hiddenTruth.fraudType`)를 `ModuleResult` 어디에도 넣지 마라.
- `src/lib/scoring.ts`(`computeCaseInvestigationScore` / `getBestEndingOption`)는 읽기만 하고 수정하지 마라 — 채점 로직 불변.
- `phase` state / `setPhase` 호출 / 브리핑·investigating·decision 렌더 블록의 **구조를 바꾸지 마라.** 이 step은 `ModuleResult` 페이로드만 손댄다.

### `src/components/experiences/CaseInvestigationExperience.test.tsx` 갱신

- **신규**: 판단 확정 후 `result.reviewItems` 길이 1,
  `userVerdict === DECISION_LABELS[선택한 decision]`, `correctVerdict === DECISION_LABELS[bestOption.decision]`.
- **신규**: 오답(비최선 판단) 시 `result.missedSignals`의 `title` 목록이 `breakdown.missedRiskPatterns`에 대응하는 `evidenceDefinitions[].description`과 일치.
- 기존 "explanation이 `hiddenTruth.explanation` 앞부분을 포함"(있다면) 유지 + **신규**: `result.explanation`에 문자열 `"**놓친 위험 신호"`가 없다.
- `gatingFixture` 등 픽스처가 신규 필드 없이도 컴파일되는지 확인(신규 필드는 optional).

## Acceptance Criteria

> 메모리 절약: 전체 Next 빌드 / 전체 테스트 대신 **타입체크 + 린트 + 이 step 관련 테스트만** 실행한다. 전체 `npm run build && npm test`는 phase 종료 후 운영자가 한 번 돌린다.

```bash
npx tsc --noEmit
npm run lint
npx vitest run src/components/experiences/CaseInvestigationExperience.test.tsx
```

## 검증 절차

1. 위 AC 커맨드를 실행한다. **위 타입체크·린트·관련 테스트가 모두 통과해야 한다.**
2. 아키텍처 체크리스트:
   - 수정 파일이 `CaseInvestigationExperience.tsx` + 그 test 둘뿐인가? (`scoring.ts` 무수정)
   - `buildExplanation` 결과에 `**` 조각이 없는가?
   - `importance` / 스포일러 필드가 `ModuleResult`로 새지 않는가?
   - `phase` / `setPhase` / 렌더 블록 구조가 그대로인가?
3. 결과에 따라 `phases/11-review-breakdown-and-phase-nav/index.json`의 `step: 4`를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

`summary`에 `buildMissedSignals` 시그니처, `reviewItems` 1행 매핑, 그리고 "phase 이동/요약 패널은 step7·step8" 이라는 사실을 적어라.

## 금지사항

- `src/lib/scoring.ts`를 수정하지 마라. 이유: 채점 로직은 이번 phase에서 불변이고, 이 step은 결과 표현만 바꾼다.
- `phase` state, `setPhase` 호출, briefing/investigating/decision 렌더 블록의 구조를 바꾸지 마라. 이유: 단계 이동은 step7, 요약 패널은 step8이다. 여기서 손대면 그 두 step과 충돌한다.
- `evidenceDefinitions[].importance`나 `content.title` / `hiddenTruth.fraudType`를 노출하지 마라. 이유: ADR-004 유형 비공개 + 스포일러 방지.
- 다른 체험 컴포넌트를 건드리지 마라. 이유: 각각 step1·step2·step3.
- `src/app/result/page.tsx`를 수정하지 마라. 이유: 배선은 step6.
