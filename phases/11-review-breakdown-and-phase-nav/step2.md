# Step 2: jeonse-review-payload

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` (특히 "TDD: 테스트 먼저")
- `/docs/ADR.md`의 ADR-003 (세션 상태는 React Context만), ADR-007 (전세매물 = 골목 이동 O/X 판정 게임)
- `/src/types/experience.ts` (전체) — **step0에서 추가된 `ReviewItem`, `MissedSignal`, `ModuleResult.reviewItems?` / `.missedSignals?`**
- `/src/components/experiences/JeonseExperience.tsx` (전체) — `buildExplanation`(L17-30), `answers` state(`Record<number, boolean>`, L35), `handleAnswer`(L45-73)에서 마지막 판정 후 `setPendingResult({...})`(L58-71)
- `/src/components/experiences/JeonseExperience.test.tsx` (전체) — `makeHouse()` 픽스처, `startJeonse()` / `judgeHouse()` 헬퍼, "일부를 오답으로 판정하면 mistakeTag가 …"(L121-148)
- `/src/components/experiences/jeonse/MapBoard.tsx` — O/X 판정 라벨 어휘가 `"O — 위험 있음"` / `"X — 위험 없음"` 이라는 점만 확인(읽기 전용)
- `/src/data/jeonse.ts` — `JeonseHouse { id, short, name, …, risky, reason, explain, lesson }` (`risky: true` = 정답 O(위험 있음))

## 배경

`JeonseExperience`는 매물 N채(보통 5채)를 O(위험 있음) / X(위험 없음)로 판정하고 정답 개수로 집계한다.

현재 `buildExplanation`(L17-30)은 오답 시
`` `놓친 위험 신호가 있습니다 — **${missed.join("; ")}**` `` 를 만든다. 놓친 매물을 `` `${house.short}: ${house.reason}` `` 로 바꿔 `; `로 잇고 **문장 전체를 `**…**`로 감싼다.** 결과 페이지에서 볼드 덩어리로 보인다(사용자 피드백). 매물별 판정(`answers: Record<number, boolean>`, L35)도 결과로 나가지 않는다.

이 step은 `ModuleResult`에 `reviewItems`(매물별 O/X)와 `missedSignals`(놓친 매물 항목화)를 채우고 `explanation`을 짧은 평문으로 축소한다. 체험 화면 렌더는 불변.

## 작업

### `src/components/experiences/JeonseExperience.tsx`

1. **`buildExplanation` 재작성** — 짧은 평문, `**`·조인 없음:
   - 정답: `"제시된 매물의 위험 신호를 모두 정확히 판정했습니다."`
   - 오답: `"일부 매물을 잘못 판정했습니다. 놓친 위험 신호를 확인하세요."`

2. **신규 순수 함수** `buildReviewItems(content: JeonseHouse[], answers: Record<number, boolean>): ReviewItem[]` — 매물당 1행:
   | 필드 | 값 |
   |---|---|
   | `label` | `house.short` |
   | `userVerdict` | `answers[i] ? "O (위험 있음)" : "X (위험 없음)"` |
   | `correctVerdict` | `house.risky ? "O (위험 있음)" : "X (위험 없음)"` |
   | `isCorrect` | `answers[i] === house.risky` |

3. **신규 순수 함수** `buildMissedSignals(content: JeonseHouse[], answers: Record<number, boolean>): MissedSignal[]` — `answers[i] !== house.risky`인 매물만, `{ title: house.short, description: house.reason }`. `JeonseHouse`에는 `source` 필드가 없으므로 `source`는 넣지 않는다.

4. **`handleAnswer`의 `setPendingResult({...})`**(L58-71)에 필드 추가(기존 필드 유지):
   - `reviewItems: buildReviewItems(content, next)`
   - `missedSignals: isCorrect ? undefined : buildMissedSignals(content, next)`

### 지켜야 할 핵심 규칙

- verdict 문자열은 정확히 `"O (위험 있음)"` / `"X (위험 없음)"` 로 통일한다 — `MapBoard` / `HouseDialogPanel`의 사용자 표기(`"O — 위험 있음"` 계열)와 같은 개념을 쓰되, 결과 표는 이 형식으로 고정한다. 테스트가 이 리터럴을 검증한다.
- `answers`를 세션 Context에 저장하지 마라 (ADR-003). `onComplete` 페이로드에만 담는다.
- `userChoice` / `correctChoice`(`"N채 중 K채 …"`)를 지우지 마라 — 폴백용.

### `src/components/experiences/JeonseExperience.test.tsx` 갱신

- 기존 "일부를 오답으로 판정하면 mistakeTag가 …"(L121-148)의
  `expect(result.explanation).toContain(houses[0].reason)` / `houses[1].reason` 2줄 → **교체**:
  `result.missedSignals`가 `{ title: houses[0].short, description: houses[0].reason }` 및 `houses[1]` 것을 포함하고, `result.explanation`에 `**`가 없다.
- **신규**: `result.reviewItems.length === houses.length`, verdict 문자열이 정확히 `"O (위험 있음)"` / `"X (위험 없음)"`, `isCorrect`가 `answers[i] === house.risky`와 일치.
- **신규**: 만점 케이스에서 `result.missedSignals === undefined`.
- 기존 IntroDialog 게이트 / 힌트 lock-in / `startJeonse()` 헬퍼 / `judgeHouse()` 테스트는 그대로 통과해야 한다.

## Acceptance Criteria

> 메모리 절약: 전체 Next 빌드 / 전체 테스트 대신 **타입체크 + 린트 + 이 step 관련 테스트만** 실행한다. 전체 `npm run build && npm test`는 phase 종료 후 운영자가 한 번 돌린다.

```bash
npx tsc --noEmit
npm run lint
npx vitest run src/components/experiences/JeonseExperience.test.tsx
```

## 검증 절차

1. 위 AC 커맨드를 실행한다. **위 타입체크·린트·관련 테스트가 모두 통과해야 한다.**
2. 아키텍처 체크리스트:
   - 수정 파일이 `JeonseExperience.tsx` + `JeonseExperience.test.tsx` 둘뿐인가? (`MapBoard.tsx`는 읽기만)
   - `buildExplanation`에 `**`/`join`이 없는가?
   - verdict 리터럴이 `"O (위험 있음)"` / `"X (위험 없음)"` 로 일관되는가?
   - 다른 체험 컴포넌트/테스트가 안 바뀌었는가?
3. 결과에 따라 `phases/11-review-breakdown-and-phase-nav/index.json`의 `step: 2`를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

`summary`에 `buildReviewItems` / `buildMissedSignals` 시그니처와 verdict 어휘를 적어라.

## 금지사항

- `explanation`에 `house.reason` 목록을 다시 조립하지 마라. 이유: run-on 볼드 덩어리 제거가 목적이다. 목록은 `missedSignals`로만.
- `src/components/experiences/jeonse/MapBoard.tsx`의 이동 루프(`requestAnimationFrame`), `window` keydown/keyup 핸들러, `ResizeObserver` 이펙트, `eslint-disable` 주석을 건드리지 마라. 이유: 이 step 범위 밖이고 회귀 위험이 크다. O/X 라벨 어휘는 읽기만 한다.
- `JeonseExperience.test.tsx`의 IntroDialog 게이트 / 힌트 lock-in 테스트, `startJeonse()` / `judgeHouse()` 헬퍼를 바꾸지 마라. 이유: 회귀 안전망.
- 다른 체험 컴포넌트를 건드리지 마라. 이유: 각각 step1·step3·step4.
- `src/app/result/page.tsx`를 수정하지 마라. 이유: 배선은 step6.
