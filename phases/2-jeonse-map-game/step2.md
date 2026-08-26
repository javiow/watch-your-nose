# Step 2: player-setup-flow

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md`, `/docs/ADR.md`(ADR-008 — 캐릭터 설정 전역화 결정)
- `src/types/player.ts` (step1에서 생성됨 — `PlayerInfo`/`PlayerAgeGroup`/`PlayerGender`)
- `src/lib/session-context.tsx`, `src/lib/session-context.test.tsx`
- `src/components/ui/StartButton.tsx`
- `src/app/page.tsx`, `src/app/session/page.tsx`, `src/app/result/page.tsx`

이 step은 `jeonse` 체험 자체(맵 게임)와 무관하다 — 랜딩과 세션 사이에 끼워 넣는 **전역** 캐릭터 설정 단계만 다룬다. `jeonse` 콘텐츠/컴포넌트는 step3에서 다룬다.

## 배경

팀원 게임 원작에는 게임 시작 전 캐릭터(나이대/직업/성별) 설정 화면이 있었다. 이 프로젝트에서는 이걸 `jeonse` 유형 전용이 아니라 **랜딩 이후, 세션 시작 전에 한 번만 거치는 전역 단계**(`/setup`)로 승격한다. 수집한 정보는 화면 어디에도 노출하지 않고 `SessionProvider`에만 저장하며, 향후 시나리오 매칭(콘텐츠 추천/난이도 조정)에 쓸 목적이다 — **매칭 로직은 이번 범위에 없다. 지금은 수집·저장만 한다.**

"다시 체험하기"(재시작)는 `/setup`을 다시 거치지 않는다 — 한 번 저장된 `playerInfo`는 `resetSession()`으로 초기화되지 않는다.

## 외부 참고 소스

팀원 레포의 캐릭터 설정 화면(레이아웃/선택지 참고용, 스타일은 이 프로젝트의 Tailwind 다크테마로 새로 작성한다):

- `https://raw.githubusercontent.com/JUNGMyeong-jin96/HousingFraudDetect/main/components/SetupScreen.tsx`

선택지: 나이대 `["10대", "20대", "30대", "40대", "50대 이상"]`, 직업 `["학생", "사회초년생", "직장인", "신혼부부", "자영업자", "프리랜서"]`, 성별 `["남성", "여성", "선택 안 함"]`.

## 작업

### 1. `src/lib/session-context.tsx`

`SessionContextValue`에 아래를 추가한다:

```ts
playerInfo: PlayerInfo | null;
setPlayerInfo: (info: PlayerInfo) => void;
```

- `useState<PlayerInfo | null>(null)`로 초기화.
- `resetSession()`은 **`playerInfo`를 건드리지 않는다** — `sessionPlan`/`results`만 초기화하는 기존 동작을 유지한다. (이게 이 step의 핵심 불변 조건이다: 재시작 시 캐릭터 설정을 다시 묻지 않기 위함.)

### 2. `src/lib/session-context.test.tsx`에 테스트 추가 (기존 테스트는 유지)

- `setPlayerInfo`를 호출하면 `playerInfo`가 갱신된다.
- `setPlayerInfo` 호출 후 `resetSession()`을 호출해도 `playerInfo`는 그대로 유지된다(재시작 시 다시 묻지 않는다는 요구사항의 회귀 테스트).

### 3. 새 파일 `src/components/ui/PlayerSetupForm.tsx` (`"use client"`)

```ts
interface PlayerSetupFormProps {
  onComplete: (info: PlayerInfo) => void;
}
```

- 나이대/직업/성별 세 그룹을 버튼 그리드로 보여주고(팀원 원작의 `ChoiceGroup` 패턴 참고 — 제네릭 재사용 컴포넌트로 구현해도 되고 인라인으로 풀어써도 됨), 셋 다 선택되기 전에는 "시작하기" 버튼을 비활성화한다.
- 스타일은 기존 `JeonseExperience.tsx`/홈 페이지와 동일한 톤을 따른다: 카드/버튼 `rounded-lg border border-neutral-800 bg-[#141414]`, 선택된 버튼은 `border-blue-500 bg-blue-500/10`, CTA는 `bg-blue-500 hover:bg-blue-400`, 버튼 최소 터치 타겟 `min-h-11`.
- 셋 다 선택된 뒤 "시작하기" 클릭 시 `onComplete({ ageGroup, job, gender })` 호출.

### 4. 새 라우트 `src/app/setup/page.tsx` (`"use client"`)

- `useSession()`에서 `setPlayerInfo`를 가져온다.
- `<PlayerSetupForm onComplete={(info) => { setPlayerInfo(info); router.push("/session"); }} />` 렌더.

### 5. `src/components/ui/StartButton.tsx`

- `router.push("/session")` → `router.push("/setup")`로 변경. `resetSession()` 호출은 그대로 유지한다(홈에서 "시작하기"를 누를 때마다 세션 플랜을 새로 셔플하는 기존 동작 보존).

### 6. `src/app/session/page.tsx`

- `useSession()`에서 `playerInfo`도 가져온다.
- 기존 `sessionPlan.length === 0`이면 `/`로 리다이렉트하는 `useEffect`와 같은 패턴으로, **`playerInfo`가 `null`이면 `/`로 리다이렉트**하는 조건을 추가한다(직접 URL로 `/session`에 진입해 설정 단계를 건너뛰는 것을 방지). 두 조건 모두 리다이렉트 대상 동안은 `null`을 렌더한다(기존 관례와 동일).

### 7. `src/app/result/page.tsx`

- **수정 불필요.** `handleRetry`는 이미 `/session`으로 직접 이동하고, `resetSession()`이 `playerInfo`를 건드리지 않으므로 "재시작 시 다시 묻지 않음" 요구사항이 코드 변경 없이 충족된다. 다만 검증 절차에서 실제로 그런지 확인은 한다.

### 8. `src/components/ui/PlayerSetupForm.test.tsx` (신규, TDD로 구현보다 먼저 작성)

- 나이대/직업/성별 중 하나라도 선택되지 않으면 "시작하기" 버튼이 비활성 상태다.
- 셋 다 선택 후 클릭하면 `onComplete`가 선택한 값 그대로(`{ ageGroup, job, gender }`) 정확히 한 번 호출된다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `playerInfo`가 화면 어디에도 렌더되지 않는가? (ADR-008 — 지금은 수집만 하고 노출하지 않음)
   - `resetSession()`이 `playerInfo`를 초기화하지 않는가?
   - `/session` 가드가 `sessionPlan`/`playerInfo` 두 조건 모두 처리하는가?
   - `CLAUDE.md` CRITICAL 규칙(localStorage 금지, `ExperienceModule` 레지스트리 패턴 불변) 위반이 없는가?
3. `npm run dev`로 수동 확인: 홈 "시작하기" → `/setup`에서 세 선택지 고르기 전엔 시작 버튼 비활성 → 고른 뒤 시작 → `/session` 진입 확인.
4. 결과에 따라 `phases/2-jeonse-map-game/index.json`의 `step: 2` 항목을 업데이트한다.

## 금지사항

- 이 step에서 `jeonse` 콘텐츠나 `JeonseExperience.tsx`를 건드리지 마라 — step3에서 다룬다.
- `playerInfo`를 화면에 노출하는 UI(헤더에 "30대 · 직장인 · 여성" 같은 표시 등)를 만들지 마라. 이유: ADR-008에 따라 이번 범위는 수집·저장까지만이다.
- `playerInfo`를 이용한 콘텐츠 매칭/추천 로직을 만들지 마라. 이유: 향후 범위, 지금 만들면 쓰이지 않는 죽은 코드가 된다.
- 기존 테스트를 깨뜨리지 마라.
