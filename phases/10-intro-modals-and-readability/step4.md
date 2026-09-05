# Step 4: wire-intro-case-investigation

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ADR.md`의 ADR-004, ADR-010 (부동산 사기 조사 게임 6케이스), ADR-016
- `/src/components/ui/IntroDialog.tsx` (step2) + 그 `summary`
- `/src/data/experience-intro.ts` (step1)
- `/src/components/experiences/CaseInvestigationExperience.tsx` (전체) — 특히 `type Phase = "briefing" | "investigating" | "decision"` 와 `if (phase === "briefing")` 블록. 이 블록은 `FormatBadge` + 시나리오 카드(`content.scenario.propertyLocation`, `speakerLabel` + `brokerLine`, `description`, `goal`, `조사 예산 {content.initialPoints}P`) + "조사 시작" 버튼을 렌더한다.
- `/src/components/experiences/CaseInvestigationExperience.test.tsx` (전체) — 특히 라인 108~126 부근의 스포일러 비노출 테스트(`content.title`, `hiddenTruth.explanation`, `endingOptions[].comment`는 브리핑에서 렌더 안 됨 / `propertyLocation`은 렌더됨), 그리고 `startInvestigating()` 헬퍼(`getByText("조사 시작")` 클릭)

## 배경

`CaseInvestigationExperience`의 `briefing` 단계에 시작 전 `IntroDialog`(`mode="gate"`)를 얹는다. 이 체험은 이미 시나리오별 브리핑 카드가 있으므로, **그 카드는 그대로 두고** 그 위에 모달을 띄운다. 확인을 누르면 `phase`가 `"investigating"`으로 넘어간다.

step2의 모달이 담는 것은 "포인트 경제가 어떻게 돌아가는지"를 포함한 일반 안내(`EXPERIENCE_INTRO["case-investigation"]`)이고, 브리핑 카드가 담는 것은 이 케이스의 구체 상황(위치·중개사 멘트·목표)이다. 둘은 역할이 다르므로 공존시킨다.

## 작업

### 1. `CaseInvestigationExperience.tsx`

- `phase === "briefing"` 렌더에서, 기존 `FormatBadge` + 시나리오 카드 + "조사 시작" 버튼 구조를 유지하되, 그 위에 겹쳐 `IntroDialog`를 렌더한다:
  ```tsx
  <IntroDialog
    mode="gate"
    format={EXPERIENCE_FORMAT["case-investigation"]}
    intro={EXPERIENCE_INTRO["case-investigation"]}
    confirmLabel="조사 시작"
    onConfirm={() => setPhase("investigating")}
  />
  ```
  구현 형태(브리핑 카드를 모달 뒤 배경으로 두든, 모달 확인 후 카드를 잠깐 보여주고 별도 "조사 시작"을 다시 누르게 하든)는 재량. **단 최종적으로 `investigating`으로 가는 경로에 "조사 시작"이라는 정확한 텍스트의 버튼이 최소 1개 존재해야 한다**(아래 테스트 이유 참조). 가장 단순한 방법은 모달의 `confirmLabel`을 `"조사 시작"`으로 두고 기존 카드의 버튼은 제거하는 것.
- `investigating` 단계 헤더 근처에 "안내 다시 보기" 버튼 + `showHelp` state + `mode="help"` `IntroDialog`를 추가(step3와 동일 패턴).

### 2. `CaseInvestigationExperience.test.tsx` 갱신

- `startInvestigating()` 헬퍼: 여전히 `getByText("조사 시작")`을 클릭해서 `investigating`으로 갈 수 있어야 한다. 모달의 확인 버튼 라벨을 `"조사 시작"`으로 두면 헬퍼 수정이 최소화된다. 모달과 카드 양쪽에 같은 텍스트가 있으면 `getAllByText("조사 시작")[0]` 등으로 조정.
- 스포일러 비노출 테스트(라인 108~126 부근)는 **계속 통과해야 한다**: `content.title`, `hiddenTruth.explanation`, `endingOptions[].comment`는 브리핑/모달 어디에도 렌더되지 않는다. `propertyLocation`은 계속 어딘가에 렌더된다(모달 뒤 카드 또는 investigating 진입 후). 필요하면 이 테스트의 "언제 확인하는지" 타이밍만 조정하되 **어서션 자체(무엇이 안 보여야 하는지)는 약화하지 마라.**
- 신규: 마운트 직후 `role="dialog"`가 보이고 `EXPERIENCE_INTRO["case-investigation"].situation`의 일부(예: "예산" 관련 문구)가 노출된다.
- 신규: investigating 단계에서 "안내 다시 보기" → `role="dialog"` 재등장 → 닫기 → 사라짐.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다. **`CaseInvestigationExperience.test.tsx` 전체 + 프로젝트 전체가 통과해야 한다.**
2. `npm run dev`로 케이스 조사 체험 진입 → 모달이 뜨고 포인트/예산 설명이 보이는지, 확인 후 investigating으로 가는지, "안내 다시 보기"가 동작하는지 확인한다.
3. 체크리스트:
   - `content.title` / `hiddenTruth.explanation` / `endingOptions[].comment`가 여전히 체험 중 노출되지 않는가? (ADR-004)
   - `investigating`/`decision` 단계 로직과 `onComplete` 시점을 바꾸지 않았는가?
4. 결과에 따라 `phases/10-intro-modals-and-readability/index.json`의 `step: 4`를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 스포일러 비노출 테스트의 어서션을 약화하거나 삭제하지 마라. 이유: `title`/`hiddenTruth.explanation`/`comment`는 정답을 암시하므로 체험 중 노출 금지(ADR-004). 타이밍 조정은 되지만 "안 보인다"는 검증은 유지한다.
- `investigating` 단계의 조사 목록·문서·NPC 로직을 이 step에서 손대지 마라. 이유: 그건 step6/step7 범위다.
- 시나리오 카드의 문구(`content.scenario.*`)를 요약·수정하지 마라. 이유: 데이터 카피 정리는 step12에서 한다.
- 갱신이 명시된 테스트 파일 외의 테스트를 깨뜨리지 마라.
