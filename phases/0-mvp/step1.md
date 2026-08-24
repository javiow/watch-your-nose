# Step 1: core-types-and-registry

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `package.json`, `src/app/layout.tsx` (step0에서 생성된 프로젝트 스캐폴드)

이전 step에서 만들어진 프로젝트 설정을 꼼꼼히 읽고, 설계 의도를 이해한 뒤 작업하라.

## 작업

체험 유형들이 공통으로 따라야 할 타입, 채점 로직, 세션 상태를 만든다. 이 step에서는 **인터페이스와 순수 로직만** 만들고, 실제 유형별 콘텐츠나 UI 컴포넌트는 만들지 않는다.

1. `src/types/experience.ts`:
   ```ts
   export type ExperienceTypeId = "voice-phishing" | "case-select" | "jeonse";
   export type Grade = "safe" | "caution" | "danger";

   export interface ModuleResult {
     typeId: ExperienceTypeId;
     contentId: string;
     score: number;          // 0~100
     grade: Grade;
     userChoice: string;     // 사용자가 고른 선택지 id/텍스트
     correctChoice: string;  // 정답 선택지 id/텍스트
     isCorrect: boolean;
     explanation: string;    // 왜 그게 정답인지 (결과 리뷰용)
     mistakeTag?: string;    // 오답일 때만: remediation.ts 매핑 키
   }

   export interface ExperienceModule<TContent = unknown> {
     typeId: ExperienceTypeId;
     contentPool: TContent[];
     pickRandomContent(): TContent;
   }
   ```
   보이스피싱 대화 트리를 위한 `DialogueNode`, `VoicePhishingScenario` 타입도 함께 정의한다 (턴, 선택지, 다음 노드, `isNormalCase: boolean` 등 — 필드는 시그니처 수준으로만 잡고 세부는 step2에서 채운다).

2. `src/lib/scoring.ts`:
   ```ts
   export function computeGrade(scorePercent: number): Grade;
   export function aggregateResults(results: ModuleResult[]): { average: number; grade: Grade };
   ```
   등급 구간은 `docs/UI_GUIDE.md`를 따른다: 80%↑ safe, 50~79% caution, 50%↓ danger. 이 구간 값은 이 파일에 상수로 정의해 나중에 조정 가능하게 한다.

3. `src/lib/registry.ts`:
   - `EXPERIENCE_MODULES: ExperienceModule[]` 배열 (이 step에서는 빈 배열로 시작 — step2~4에서 각 유형이 여기 등록한다).
   - `pickSessionPlan(): { typeId: ExperienceTypeId }[]` — 등록된 모듈들의 순서를 셔플해서 반환하는 유틸.

4. `src/lib/session-context.tsx`:
   - `SessionProvider`(React Context, `"use client"`), `useSession()` 훅.
   - 상태: `sessionPlan`, `results: ModuleResult[]`, `addResult(result: ModuleResult)`, `resetSession()`.
   - **localStorage나 다른 영속화 로직을 쓰지 않는다** — 순수 in-memory Context 상태.

**TDD 필수** (`CLAUDE.md` 개발 프로세스 규칙, `tdd-guard.sh` 훅이 강제): 각 로직 파일(`scoring.ts`, `registry.ts`, `session-context.tsx`)에 대응하는 테스트 파일을 먼저 작성한 뒤 구현하라.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `docs/ARCHITECTURE.md` 디렉토리 구조를 따르는가?
   - `docs/ADR.md` ADR-003(Context만, localStorage 없음), ADR-004(레지스트리 패턴) 위반 없는가?
3. 결과에 따라 `phases/0-mvp/index.json`의 `step: 1` 항목을 업데이트한다.

## 금지사항

- 보이스피싱/사례선택/전세매물의 실제 콘텐츠 데이터(`src/data/*.ts`)나 UI 컴포넌트를 이 step에서 만들지 마라. 이유: 이 step은 공통 인터페이스와 순수 로직만 다룬다 — 콘텐츠/UI는 step2~5.
- `localStorage`, `sessionStorage`, 쿠키 등 어떤 형태로든 세션을 영속화하지 마라. 이유: `docs/ADR.md` ADR-003.
- 기존 테스트를 깨뜨리지 마라.
