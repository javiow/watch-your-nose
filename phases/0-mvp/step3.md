# Step 3: experience-case-select

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/docs/UI_GUIDE.md`
- `src/types/experience.ts`, `src/lib/registry.ts` (step1)
- `src/components/experiences/VoicePhishingExperience.tsx` (step2 — 동일한 패턴/컨벤션을 따르기 위해 참고)

## 작업

사례선택 체험 유형을 구현한다.

1. `src/types/experience.ts`에 필요하면 `ScamCasePair` 타입을 추가한다 (예: `{ id, scamCase: { title, body }, normalCase: { title, body }, correctSide: "scam" | "normal" }` — 이번 유형은 "사기로 의심되는 쪽"을 고르는 것이므로 `correctSide`는 항상 `"scam"`이지만, 확장성을 위해 필드로 남겨둔다).
2. `src/data/case-select.ts`: 사례 쌍 최소 2개. 각 쌍은 사기 사례 1개 + 정상 사례 1개로 구성하고, 실제 사례를 참고해 각색(기관명·개인정보 가상화)한다.
3. `src/components/experiences/CaseSelectExperience.tsx` (`"use client"`): props `content: ScamCasePair`, `onComplete: (result: ModuleResult) => void`. 두 사례를 나란히 카드로 보여주고 하나를 고르면 "다음" 버튼이 활성화된다. 즉시 정답/오답 피드백은 없다. 오답 시 `mistakeTag`는 `"missed-scam-signal"`로 설정.
4. `src/lib/registry.ts`에 `typeId: "case-select"`로 등록한다.

**TDD 필수**: 사기 사례를 선택하면 `isCorrect: true`, 정상 사례를 선택하면 `isCorrect: false`가 되는 채점 로직 테스트를 먼저 작성한 뒤 구현하라.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `docs/ARCHITECTURE.md`/`docs/ADR.md` 체크리스트를 확인한다 (step2와 동일 기준).
3. 결과에 따라 `phases/0-mvp/index.json`의 `step: 3` 항목을 업데이트한다.

## 금지사항

- 즉시 정답/오답 피드백 UI를 넣지 마라.
- 사용자 노출 텍스트에 유형명("사례선택")을 직접 쓰지 마라.
- 실제 기관명·실존 인물/사건을 그대로 쓰지 마라.
- 사례 본문(`title`/`body`)을 렌더링할 때 `dangerouslySetInnerHTML`을 쓰지 마라. 이유: XSS 방지, `CLAUDE.md` 보안 규칙.
- 기존 테스트를 깨뜨리지 마라.
