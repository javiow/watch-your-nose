# Step 5: result-and-flow

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/docs/PRD.md`
- `/docs/UI_GUIDE.md`
- `src/types/experience.ts`, `src/lib/registry.ts`, `src/lib/scoring.ts`, `src/lib/session-context.tsx` (step1)
- `src/components/experiences/*.tsx` (step2~4에서 등록된 3개 체험 컴포넌트와 `mistakeTag` 값들: `blind-refusal`, `missed-scam-signal`, `missed-lease-fraud-signal`)

이전 step들에서 만들어진 레지스트리·세션 컨텍스트·체험 컴포넌트를 꼼꼼히 읽고, 이 step에서 전체 플로우로 연결하라.

## 작업

랜딩 → 세션 → 결과로 이어지는 전체 사용자 여정을 완성한다.

1. `src/data/remediation.ts`: `mistakeTag`별 대응 방안 초안 카피를 작성한다 (`blind-refusal`, `missed-scam-signal`, `missed-lease-fraud-signal` 각각에 대해 — 왜 틀렸는지 설명 + 실생활 대응 팁 2~3줄). 나중에 쉽게 교체할 수 있도록 이 데이터 파일에만 문구를 둔다.

2. `src/app/layout.tsx`에 `SessionProvider`(step1)를 마운트한다.

3. `src/app/page.tsx` (랜딩, Server Component 가능):
   - 서비스명 "Watch Your Nose", 헤드라인은 속담 "눈 뜨고 코 베인다"를 크게 활용.
   - 톤앤매너: 도발적·자신감을 자극하는 카피 (예: "나는 절대 안 속아? 확인해보자" 류).
   - 규칙 안내: 총 3단계, 각 선택 후 "다음"을 눌러 진행, 결과는 마지막에 한 번에 공개 — **어떤 유형이 나올지는 언급하지 않는다.**
   - 비주얼: `docs/UI_GUIDE.md`의 anti-slop 규칙을 지키는 인라인 SVG 라인 아트 아이콘/일러스트 (블러 배경 orb, 그라데이션 텍스트, 보라색 금지).
   - CTA "시작하기" 클릭 시 `useSession().resetSession()`으로 세션을 초기화하고 `/session`으로 이동.

4. `src/app/session/page.tsx` (`"use client"`):
   - `useSession()`으로 `sessionPlan`(랜덤 순서)을 가져와 현재 단계에 해당하는 유형을 `registry.ts`에서 찾아 그 `ExperienceModule.pickRandomContent()`로 콘텐츠를 뽑고, 해당 `*Experience` 컴포넌트를 렌더한다.
   - 상단에 진행률 바("N/3", 유형명 노출 금지) 표시.
   - `onComplete(result)`에서 `addResult(result)` 후 다음 단계로 이동. 마지막 단계 완료 시 `/result`로 이동.
   - `sessionPlan`이 비어있으면(직접 URL 진입 등) `/`로 리다이렉트한다.

5. `src/app/result/page.tsx` (`"use client"`):
   - `useSession().results`로 `aggregateResults()`(step1의 `scoring.ts`) 호출해 종합 점수/등급을 표시.
   - 문항별 상세 리뷰: 각 `ModuleResult`의 `userChoice` vs `correctChoice`, `explanation`을 리스트로 보여준다.
   - `isCorrect === false`인 결과들의 `mistakeTag`를 모아 `remediation.ts`에서 대응 방안을 찾아 렌더한다.
   - CTA는 **"다시 체험하기" 하나만** 제공한다 — 클릭 시 `resetSession()` 후 랜딩을 거치지 않고 바로 `/session`으로 이동. "처음으로/홈" 버튼은 만들지 않는다.
   - `results`가 비어있으면(직접 URL 진입 등) `/`로 리다이렉트한다.

**TDD 필수**: `aggregateResults` 사용 로직, remediation 매핑 로직에 대한 테스트를 먼저 작성하라. 페이지 컴포넌트 자체는 `tdd-guard.sh`의 Next.js 파일(`page.tsx`) 예외 대상이지만, 그 안에서 쓰는 순수 함수(집계/매핑 로직)는 별도로 분리해 테스트 가능하게 만드는 것을 권장한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `npm run dev`로 로컬 실행 후 수동으로 확인한다:
   - 랜딩 → "시작하기" → 3단계(매번 랜덤 순서/콘텐츠) 진행, 각 단계에서 선택 후 "다음"을 눌러야만 진행되는가?
   - 진행 중 정답/오답이 전혀 노출되지 않는가?
   - 3단계 완료 후 `/result`에서 평균 점수/등급, 문항별 리뷰, 대응방안이 선택 내역과 일치하는가?
   - 보이스피싱 단계에서 모든 턴을 "거절"로 선택했을 때, 정상 케이스는 오답·사기 케이스는 정답으로 반영되는가?
   - 새로고침 시 진행 중이던 세션이 사라지고 처음부터 다시 시작되는가?
   - 결과 화면에서 "다시 체험하기" 클릭 시 랜딩을 거치지 않고 새 랜덤 세션이 바로 시작되는가?
3. 결과에 따라 `phases/0-mvp/index.json`의 `step: 5` 항목을 업데이트한다.

## 금지사항

- 결과 화면에 "처음으로/홈으로 돌아가기" 버튼을 추가하지 마라. 이유: 제품 결정 — "다시 체험하기" 하나만 제공.
- 세션 상태를 `localStorage`/`sessionStorage`/쿠키 등에 저장하지 마라. 이유: `docs/ADR.md` ADR-003 — 새로고침 시 처음부터 재시작이 의도된 동작.
- 랜딩·세션·결과 어디에도 체험 유형명(보이스피싱/사례선택/전세매물)을 사용자 노출 텍스트로 쓰지 마라. 이유: ADR-004.
- 기존 테스트를 깨뜨리지 마라.
