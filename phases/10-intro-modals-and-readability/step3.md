# Step 3: wire-intro-voice-phishing-fraud-judgment

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ADR.md`의 ADR-004 (체험 전 유형 비노출), ADR-006 (보이스피싱만 채팅형), ADR-015 (사기 판별 4장 집계), ADR-016 ("다음으로 넘어가기" 버튼)
- `/src/components/ui/IntroDialog.tsx` (step2에서 신규) + 그 `summary`
- `/src/data/experience-intro.ts` (step1에서 신규)
- `/src/data/experience-format.ts` — `EXPERIENCE_FORMAT`
- `/src/components/experiences/VoicePhishingExperience.tsx` (전체) — 특히 `const [started, setStarted]` 게이트(`if (!started)` 반환부)와 `useEffect(..., [started])`(대화 노출 타이머가 `started` 가드 뒤에서만 도는 구조)
- `/src/components/experiences/VoicePhishingExperience.test.tsx` (전체) — `start()` 헬퍼 패턴
- `/src/components/experiences/FraudJudgmentExperience.tsx` (전체) — `if (!started)` 게이트, 타이머 없음
- `/src/components/experiences/FraudJudgmentExperience.test.tsx` (전체) — `start()` 헬퍼

## 배경

`VoicePhishingExperience`와 `FraudJudgmentExperience`는 둘 다 `if (!started)`일 때 `FormatBadge` + `<p>{hint}</p>` + 시작 버튼만 렌더하는 동일 패턴이다. 이 인라인 시작 화면을 step2의 `IntroDialog`(`mode="gate"`)로 교체한다. 두 컴포넌트가 구조가 같아 한 step에서 함께 처리한다.

시작 후 화면에는 "안내 다시 보기" 어포던스를 추가해, 진행 중에도 `IntroDialog`(`mode="help"`)로 상황을 다시 볼 수 있게 한다.

## 작업

### 1. `VoicePhishingExperience.tsx`

- `if (!started)` 반환 블록을 다음으로 교체:
  ```tsx
  <IntroDialog
    mode="gate"
    format={EXPERIENCE_FORMAT["voice-phishing"]}
    intro={EXPERIENCE_INTRO["voice-phishing"]}
    confirmLabel="통화 시작"
    onConfirm={() => setStarted(true)}
  />
  ```
- `started` state와 `useEffect(..., [started])` 가드는 **그대로 둔다**. `!started` 동안에는 대화 노출 타이머가 돌면 안 되며, 지금도 그 구조다.
- `started === true`인 본문(대화 화면) 어딘가에 "안내 다시 보기" 버튼을 추가한다:
  - `const [showHelp, setShowHelp] = useState(false)`
  - 버튼 클릭 → `setShowHelp(true)`
  - `showHelp && <IntroDialog mode="help" format={...} intro={...} confirmLabel="통화 시작" onDismiss={() => setShowHelp(false)} />`
  - 버튼 위치·문구는 재량이되 대화 흐름을 가리지 않게 한다(예: 상단 우측 작은 텍스트 버튼 "안내 다시 보기").

### 2. `FraudJudgmentExperience.tsx`

- 동일하게 `if (!started)` 블록을 `<IntroDialog mode="gate" ... confirmLabel="판정 시작" onConfirm={() => setStarted(true)} />`로 교체.
- 카드 화면에 "안내 다시 보기" → `mode="help"` `IntroDialog` 추가(동일 패턴).

### 3. 테스트 갱신

**`VoicePhishingExperience.test.tsx`:**
- `start()` 헬퍼가 지금 시작 버튼("통화 시작")을 클릭한다면 그대로 동작한다 — 버튼 라벨을 바꾸지 않았으므로. 단 시작 화면이 이제 `role="dialog"` 안에 있으므로, 시작 화면을 검사하는 기존 케이스에 `getByRole("dialog")` 확인을 넣거나, 최소한 깨지지 않게 셀렉터를 조정한다.
- 신규: 마운트 직후 `role="dialog"`가 보이고 `situation` 텍스트 일부가 노출된다. 확인 버튼 클릭 후 dialog가 사라지고 대화 화면이 나타난다.
- 신규: 대화 화면에서 "안내 다시 보기" 클릭 → `role="dialog"` 재등장, 닫기 → 사라짐, 대화 상태는 유지된다.

**`FraudJudgmentExperience.test.tsx`:** 위와 같은 방식으로 갱신(라벨 "판정 시작").

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다. **`VoicePhishingExperience.test.tsx`, `FraudJudgmentExperience.test.tsx` 전체 + 프로젝트 전체가 통과해야 한다.**
2. `npm run dev`로 세션을 진행해 두 체험의 시작 시 모달이 뜨고, 확인해야 시작되며, 진행 중 "안내 다시 보기"가 동작하는지 눈으로 확인한다. 모달·본문에 사기 유형명이 없는지 확인한다.
3. 체크리스트:
   - `started` 가드와 `useEffect` 의존성 배열을 바꾸지 않았는가? (보이스피싱 타이머가 모달 뒤에서 돌면 안 됨)
   - 시작 버튼 라벨("통화 시작"/"판정 시작")을 유지했는가?
   - `onComplete` 호출 시점(ADR-016: "다음으로 넘어가기" 버튼)에 영향이 없는가?
4. 결과에 따라 `phases/10-intro-modals-and-readability/index.json`의 `step: 3`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `VoicePhishingExperience`의 대화 노출 타이머(`useEffect`)를 `started` 가드 밖으로 옮기거나 의존성 배열을 바꾸지 마라. 이유: 모달이 떠 있는 동안 대화가 진행돼버린다.
- 시작 버튼 라벨을 바꾸지 마라. 이유: 여러 테스트의 `start()` 헬퍼가 라벨로 버튼을 찾는다.
- `CaseInvestigationExperience` / `JeonseExperience`를 이 step에서 건드리지 마라. 이유: step4/step5에서 각각 다룬다(전세는 리스크가 커서 분리).
- 갱신이 명시된 두 테스트 파일 외의 테스트를 깨뜨리지 마라.
