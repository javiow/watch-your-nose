# Step 4: experience-jeonse

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/docs/UI_GUIDE.md`
- `src/types/experience.ts`, `src/lib/registry.ts` (step1)
- `src/components/experiences/CaseSelectExperience.tsx` (step3 — 동일한 패턴/컨벤션 참고)

## 작업

전세매물 체험 유형을 구현한다.

1. `src/types/experience.ts`에 `ListingPair` 타입을 추가한다 (예: `{ id, normalListing: { title, details }, scamListing: { title, details }, correctSide: "normal" }` — 이 유형은 "정상 매물"을 고르는 것이므로 `correctSide`는 항상 `"normal"`).
2. `src/data/jeonse.ts`: 매물 쌍 최소 2개. 정상 매물 1개 + 전세사기 위험 신호(예: 근저당 과다, 시세 대비 이상 조건, 집주인 명의 불일치 등)가 있는 매물 1개로 구성. 실제 사례를 참고해 각색(주소·성명 등은 가상화).
3. `src/components/experiences/JeonseExperience.tsx` (`"use client"`): props `content: ListingPair`, `onComplete: (result: ModuleResult) => void`. 두 매물을 카드로 나란히 보여주고 하나를 고르면 "다음" 버튼이 활성화된다. 즉시 피드백 없음. 오답 시 `mistakeTag`는 `"missed-lease-fraud-signal"`로 설정.
4. `src/lib/registry.ts`에 `typeId: "jeonse"`로 등록한다.

**TDD 필수**: 정상 매물을 선택하면 `isCorrect: true`, 사기 매물을 선택하면 `isCorrect: false`가 되는 채점 로직 테스트를 먼저 작성한 뒤 구현하라.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `docs/ARCHITECTURE.md`/`docs/ADR.md` 체크리스트를 확인한다 (step2/3과 동일 기준).
3. 결과에 따라 `phases/0-mvp/index.json`의 `step: 4` 항목을 업데이트한다.

## 금지사항

- 즉시 정답/오답 피드백 UI를 넣지 마라.
- 사용자 노출 텍스트에 유형명("전세매물")을 직접 쓰지 마라.
- 실제 주소·부동산·실존 인물을 그대로 쓰지 마라.
- 기존 테스트를 깨뜨리지 마라.
