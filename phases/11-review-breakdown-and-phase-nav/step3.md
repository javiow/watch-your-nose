# Step 3: voice-phishing-review-payload

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` (특히 "모든 체험 콘텐츠는 피해자 관점(방어)만", "TDD")
- `/docs/ADR.md`의 ADR-003 (세션 상태는 React Context만), ADR-006 (보이스피싱만 채팅형 UI)
- `/src/types/experience.ts` (전체) — **step0에서 추가된 `ReviewItem`, `MissedSignal`, `ModuleResult.reviewItems?` / `.missedSignals?`**
- `/src/components/experiences/VoicePhishingExperience.tsx` (전체) — `buildExplanation`(L37-56, 이미 평문 + 구 단위 `**핵심구**` 강조), `finishScenario`(L110-140)에서 `setPendingResult({...})`(L122-138), `pathRisks` ref
- `/src/components/experiences/VoicePhishingExperience.test.tsx` (전체) — 시나리오 완주 헬퍼, 기존 `explanation` 관련 어서션
- `/src/lib/scoring.ts` — `computeVoicePhishingScore`, `computeGrade`

## 배경

`VoicePhishingExperience`는 분기 대화를 따라가다 **단일 경로로** 끝난다(카드처럼 여러 판정을 하는 구조가 아니다). `buildExplanation`(L37-56)은 이미 짧은 평문 문장 + 구(phrase) 단위 `**핵심구**` 강조만 쓴다 — 이건 "이렇게 대응하세요" 카피와 같은 의도된 패턴이므로 **그대로 둔다.** 사용자 피드백의 "문장 전체 볼드"는 사기판별·전세매물에만 해당한다.

다만 결과 페이지의 문항별 O/X 표를 4개 체험에서 일관되게 보여주려면 이 체험도 **1행짜리** `reviewItems`를 채워야 한다.

## 작업

### `src/components/experiences/VoicePhishingExperience.tsx`

1. `buildExplanation`은 **수정하지 않는다.**

2. `finishScenario`(L110-140)에서, `correctChoice`에 쓰는 문자열 리터럴을 지역 상수로 뽑는다(중복 제거):
   ```ts
   const correctChoiceText = content.isNormalCase
     ? "정상적으로 응대를 이어간다"
     : "의심스러운 요청을 거절하고 전화를 끊는다";
   ```
   `setPendingResult`의 `correctChoice`는 이 상수를 쓰고, 아래 `reviewItems`도 같은 상수를 쓴다.

3. `setPendingResult({...})`에 필드 추가(기존 `typeId`/`contentId`/`score`/`grade`/`userChoice`/`correctChoice`/`isCorrect`/`explanation`/`mistakeTag`는 그대로):
   ```ts
   reviewItems: [
     {
       label: "이 전화 대응",
       userVerdict: choice.text,          // 사용자가 마지막에 고른 선택지 텍스트
       correctVerdict: correctChoiceText,
       isCorrect,
       detail: isCorrect ? undefined : explanation,
     },
   ],
   ```
   - `missedSignals`는 **넣지 않는다**(`undefined`). 이유: 이 체험의 놓친 신호 해설은 이미 `explanation` 평문에 담겨 있고, 항목화할 카드/매물 리스트가 없다.
   - `explanation` 변수는 `setPendingResult` 호출부에서 이미 `buildExplanation(...)` 결과를 담고 있다(현재 인라인 호출이면 지역 변수로 한 번 빼서 `reviewItems[0].detail`과 공유).

### 지켜야 할 핵심 규칙

- `buildExplanation`의 구 단위 `**…**` 강조를 제거하지 마라 — 짧은 평문 + 핵심구 강조는 유지 대상이다.
- `pathRisks` / 타이머(`addTimer`) / `revealNode` 로직을 건드리지 마라.
- 세션 Context에 아무것도 저장하지 마라 (ADR-003).

### `src/components/experiences/VoicePhishingExperience.test.tsx` 갱신

- **신규**: 시나리오를 완주하면 `result.reviewItems` 길이가 1이고,
  - `reviewItems[0].userVerdict` === 사용자가 고른 마지막 선택지 텍스트
  - `reviewItems[0].correctVerdict` === `result.correctChoice`
  - `reviewItems[0].isCorrect` === `result.isCorrect`
- **신규**: `result.missedSignals === undefined`.
- 기존 `explanation`의 구 단위 `**` 강조를 검증하는 테스트가 있으면 그대로 통과하는지 확인.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다. **프로젝트 전체 테스트가 통과해야 한다.**
2. 아키텍처 체크리스트:
   - 수정 파일이 `VoicePhishingExperience.tsx` + 그 test 둘뿐인가?
   - `buildExplanation` 본문이 그대로인가?
   - `missedSignals`를 채우지 않았는가?
   - `correctChoice`와 `reviewItems[0].correctVerdict`가 같은 상수를 쓰는가?
3. 결과에 따라 `phases/11-review-breakdown-and-phase-nav/index.json`의 `step: 3`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `buildExplanation`을 바꾸지 마라. 이유: 사용자 피드백은 "전체 문장 볼드"에 대한 것이고, 이 함수는 이미 짧은 평문 + 핵심구만 강조라 문제가 없다.
- `missedSignals`를 억지로 채우지 마라. 이유: 이 체험엔 항목화할 데이터가 없다. 빈 배열도 넣지 말고 `undefined`로 둔다.
- 타이머 / `revealNode` / `pathRisks` / 기존 대화 노출 타이밍 테스트를 건드리지 마라.
- 다른 체험 컴포넌트를 건드리지 마라. 이유: 각각 step1·step2·step4.
- `src/app/result/page.tsx`를 수정하지 마라. 이유: 배선은 step6.
