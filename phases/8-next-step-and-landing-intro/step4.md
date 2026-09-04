# Step 4: jeonse-defer-complete

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ADR.md`의 ADR-016
- `/src/components/ui/NextStepButton.tsx` (step0에서 생성됨) — props: `onClick`, `label?`, `disabled?`
- `/src/components/experiences/JeonseExperience.tsx` (전체)
- `/src/components/experiences/jeonse/MapBoard.tsx` (전체) — `JeonseExperience`가 감싸는 지도 컴포넌트, props 계약 확인용
- `/src/components/experiences/JeonseExperience.test.tsx` (전체)
- `/src/types/experience.ts`의 `ModuleResult`

## 배경

지금 `JeonseExperience`는 5채 전부 판정이 끝나는 순간(`handleAnswer` 안에서 `Object.keys(next).length === content.length`가 참이 되는 시점) `onComplete`를 곧바로 호출한다. 이 step에서는 그 타이밍만 바꾼다: 5채 판정이 끝나면 결과를 계산해 로컬 state에 저장만 하고, 화면에 나타나는 "다음으로 넘어가기" 버튼을 사용자가 눌러야만 `onComplete`가 호출되게 한다.

집 하나하나를 방문·판정하는 내부 흐름(`MapBoard`, 힌트, 문서 확인, O/X 판정, 다이얼로그 닫기)은 이번 변경과 무관하다 — 그대로 둔다. `session/page.tsx`도 이 step에서 건드리지 않는다.

## 작업

### `src/components/experiences/JeonseExperience.tsx`

- `pendingResult: ModuleResult | null` state를 추가한다.
- `handleAnswer` 안, `Object.keys(next).length === content.length` 분기에서 `onComplete({...})` 호출을 `setPendingResult({...})`로 바꾼다(전달 객체 내용은 그대로 유지). `isTransitioning` 가드는 그대로 두되, "5채 다 판정했지만 아직 다음으로 넘어가지 않은" 상태에서도 이미 판정된 답을 다시 바꿀 수 없어야 한다(기존 `answers[index] !== undefined` 가드로 이미 충족됨 — 추가 조치 불필요, 확인만 하라).
- `pendingResult`가 있을 때만 `onComplete(pendingResult)`를 호출하는 핸들러를 추가하고, 중복 클릭 가드를 둔다.
- JSX: 현재 `<MapBoard .../>` 하나만 반환하는 구조를, `pendingResult`가 채워지면 `MapBoard` 아래(또는 감싸는 컨테이너 안)에 "모든 매물 판정을 완료했습니다" 같은 짧은 완료 안내 문구와 `<NextStepButton onClick={...} />`을 함께 렌더하도록 바꾼다. `MapBoard`는 계속 렌더해 마지막 판정 상태(지도·판정 배지)가 화면에 남아 있게 한다. 정답/오답이나 점수는 노출하지 않는다.

### `src/components/experiences/JeonseExperience.test.tsx` 갱신

지금 이 파일에서 5채를 모두 판정한 직후 `onComplete` 값을 바로 읽는 테스트 2개는 판정 완료와 `onComplete` 확인 사이에 "다음으로 넘어가기" 버튼 클릭을 추가해야 한다:

- "5채를 모두 정답으로 판정하면 onComplete가 1회 호출되고 만점으로 채점된다"
- "일부를 오답으로 판정하면 mistakeTag가 missed-lease-fraud-signal로 채점된다"

두 테스트 모두 `houses.forEach(...)`/개별 `judgeHouse(...)` 호출이 끝난 다음, `onComplete` 관련 단언 전에 `fireEvent.click(screen.getByText("다음으로 넘어가기"))`를 추가하라.

새 테스트를 최소 1개 추가한다: 5채를 모두 판정한 직후에는 `onComplete`가 아직 호출되지 않고 `"다음으로 넘어가기"` 버튼이 나타남을 검증하고, 그 버튼을 빠르게 두 번 클릭해도 `onComplete`가 1회만 호출되는지도 검증한다(레드 상태로 먼저 작성 후 구현).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `session/page.tsx`, `MapBoard.tsx`를 수정하지 않았는가?
   - 4채까지만 판정했을 때는 "다음으로 넘어가기" 버튼이 나타나지 않는가?
   - "다음으로 넘어가기" 화면에 정답/오답/점수가 노출되지 않는가?
3. 결과에 따라 `phases/8-next-step-and-landing-intro/index.json`의 `step: 4`를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `src/app/session/page.tsx`, `src/lib/session-context.tsx`, `src/components/experiences/jeonse/MapBoard.tsx`를 수정하지 마라. 이유: 오케스트레이션 계약과 지도 내부 인터랙션은 그대로 유지한다.
- "다음으로 넘어가기" 완료 화면에 `isCorrect`/`score`/정답 텍스트를 노출하지 마라.
- `src/components/experiences/VoicePhishingExperience.tsx`, `CaseInvestigationExperience.tsx`, `FraudJudgmentExperience.tsx`를 수정하지 마라. 이유: 각각 step2, step3, step5에서 개별적으로 다룬다.
- 기존 테스트를 깨뜨리지 마라 (위에 나열되지 않은 테스트는 그대로 통과해야 한다).
