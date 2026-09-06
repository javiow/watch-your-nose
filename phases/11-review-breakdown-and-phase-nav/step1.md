# Step 1: fraud-judgment-review-payload

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` (특히 "TDD: 테스트 먼저", "체험 유형 목록/다음 단계 사전 노출 금지")
- `/docs/ADR.md`의 ADR-003 (세션 상태는 React Context만), ADR-015 (사기 판별 카드 1장 → 4장 연속 판정 집계)
- `/src/types/experience.ts` (전체) — **step0에서 추가된 `ReviewItem`, `MissedSignal`, `ModuleResult.reviewItems?` / `.missedSignals?`**
- `/src/components/experiences/FraudJudgmentExperience.tsx` (전체) — `buildExplanation`(L17-26), `buildMistakeTag`(L28-31), `answers` state(`Record<number, FraudJudgmentAnswer>`, L37), `handleAnswer`(L45-79)에서 마지막 카드 후 `setPendingResult({...})`(L65-78)
- `/src/components/experiences/FraudJudgmentExperience.test.tsx` (전체) — 픽스처 `fraudCard`/`safeCard`/`fraudCard2`/`safeCard2`, `answerAll()` 헬퍼, "오답이 있으면 explanation에 해당 카드의 title과 출처가 포함된다"(L204-214)
- `/src/data/fraud-judgment.ts` — `FraudJudgmentCard { id, category, title, content, answer, explanation, source }`
- `/src/lib/scoring.ts` — `computeGrade`

## 배경

`FraudJudgmentExperience`는 카드 N장(보통 4장)을 연속으로 "사기/정상" 판정하고 정답 개수로 집계 점수를 낸다.

현재 `buildExplanation`(L17-26)은 오답 시
`` `놓친 위험 신호가 있습니다 — **${missed.join("; ")}**` `` 를 만든다. 놓친 카드들을 `` `${card.title}: ${card.explanation} (출처: ${card.source})` `` 문자열로 바꿔 `; `로 이어붙이고 **문장 전체를 `**…**`로 감싼다.** 결과 페이지 `Prose`가 이걸 한 문단·전체 볼드로 렌더해 읽기 힘들다(사용자 피드백). 또 카드별 판정(`answers` 로컬 state)이 `ModuleResult`로 전달되지 않아 결과 페이지가 "무엇을 골랐고 무엇이 정답인지"를 문항 단위로 보여줄 수 없다.

이 step은 `onComplete`로 넘기는 `ModuleResult`에 `reviewItems`(카드별 O/X)와 `missedSignals`(놓친 카드 항목화)를 채우고, `explanation`을 짧은 평문 한 문장으로 축소한다. **체험 화면 렌더는 바꾸지 않는다** — 결과 페이지 표현은 step5~6.

## 작업

### `src/components/experiences/FraudJudgmentExperience.tsx`

1. **`buildExplanation` 재작성** — 짧은 평문 한 문장, `**` 없음, 데이터 조인 없음:
   - 정답: `"제시된 사기 판별 카드를 모두 정확히 판정했습니다."`
   - 오답: `"일부 카드를 잘못 판정했습니다. 놓친 위험 신호를 확인하세요."`

2. **신규 순수 함수** `buildReviewItems(content: FraudJudgmentCard[], answers: Record<number, FraudJudgmentAnswer>): ReviewItem[]` — `content` 인덱스 순서로 카드당 1행:
   | 필드 | 값 |
   |---|---|
   | `label` | `` `${i + 1}번 — ${card.title}` `` |
   | `userVerdict` | `answers[i] === "fraud" ? "사기" : "정상"` |
   | `correctVerdict` | `card.answer === "fraud" ? "사기" : "정상"` |
   | `isCorrect` | `answers[i] === card.answer` |
   | `detail` | 생략 |

3. **신규 순수 함수** `buildMissedSignals(content: FraudJudgmentCard[], answers: Record<number, FraudJudgmentAnswer>): MissedSignal[]` — `answers[i] !== card.answer`인 카드만, `{ title: card.title, description: card.explanation, source: card.source }`.
   - 기존 `buildExplanation`의 `.slice(0, 3)` 상한을 **가져오지 마라** — 결과 페이지가 불릿으로 렌더하므로 개수 제한 불필요.

4. **`handleAnswer` 마지막 `setPendingResult({...})`**(L65-78)에 필드 추가. 기존 `typeId`/`contentId`/`score`/`grade`/`userChoice`/`correctChoice`/`isCorrect`/`explanation`/`mistakeTag`는 그대로 두고:
   - `reviewItems: buildReviewItems(content, next)`
   - `missedSignals: isCorrect ? undefined : buildMissedSignals(content, next)`

### 지켜야 할 핵심 규칙

- `answers`(로컬 state)를 세션 Context나 localStorage 등 어디에도 저장하지 마라. `onComplete` 페이로드에만 담는다 (ADR-003).
- `userChoice` / `correctChoice`(집계 문자열 `"N장 중 K장 정답 판정"` 등)를 지우지 마라 — 결과 페이지가 신규 필드 없는 결과의 폴백으로 쓴다.
- 체험 화면(카드 판정 중)에서는 여전히 `card.explanation` / `card.source`를 노출하지 마라.

### `src/components/experiences/FraudJudgmentExperience.test.tsx` 갱신

- 기존 "오답이 있으면 explanation에 해당 카드의 title과 출처가 포함된다"(L204-214) → **교체**:
  - `result.missedSignals`가 오판한 카드에 대해 `{ title: card.title, description: card.explanation, source: card.source }`를 포함한다.
  - `result.explanation`에는 `**`도 `card.source`도 포함되지 않는다.
- **신규**: 4장 mixed 답안(예: `answerAll(["safe", "safe", "fraud", "fraud"])`)에서 `result.reviewItems.length === fourCards.length`, 각 행의 `userVerdict` / `correctVerdict` / `isCorrect`가 정확하다.
- **신규**: 4장 전부 정답이면 `result.missedSignals === undefined`이고 모든 `reviewItems[i].isCorrect === true`.
- 나머지 기존 테스트(체험 중 미노출, N/4 진행, `contentId` 정렬, `다음으로 넘어가기` 멱등, IntroDialog)는 그대로 통과해야 한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다. **프로젝트 전체 테스트가 통과해야 한다.**
2. 아키텍처 체크리스트:
   - 수정 파일이 `FraudJudgmentExperience.tsx` + `FraudJudgmentExperience.test.tsx` 둘뿐인가?
   - `buildExplanation` 결과에 `**`와 `join`이 없는가?
   - `answers`가 Context/스토리지로 새지 않는가?
   - 다른 3개 체험 컴포넌트/테스트가 안 바뀌었는가?
3. 결과에 따라 `phases/11-review-breakdown-and-phase-nav/index.json`의 `step: 1`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

`summary`에 `buildReviewItems` / `buildMissedSignals` 시그니처와 필드 매핑(특히 `label` 형식, verdict 어휘)을 적어라.

## 금지사항

- `explanation`에 놓친 카드 목록을 다시 문자열로 이어붙이지 마라. 이유: 이 phase의 목적이 그 run-on 볼드 덩어리를 없애는 것이다. 목록은 `missedSignals`로만 전달한다.
- `missedSignals`에 `.slice(0, 3)` 같은 상한을 넣지 마라. 이유: 결과 페이지가 불릿으로 렌더하므로 3개를 넘어도 가독성 문제가 없고, 정보 손실을 막아야 한다.
- `FraudJudgmentExperience.test.tsx`의 "체험 중 미노출" / "진행 표시(N/4)" / `contentId` 정렬 / `NextStepButton` 멱등 / IntroDialog 테스트를 바꾸지 마라. 이유: 회귀 안전망이다.
- 다른 체험 컴포넌트(`Jeonse`/`VoicePhishing`/`CaseInvestigation`)를 건드리지 마라. 이유: 각각 step2·step3·step4다.
- `src/app/result/page.tsx`를 수정하지 마라. 이유: 결과 페이지 배선은 step6다.
