# Step 3: jeonse-experience

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md`, `/docs/ADR.md`(ADR-007 — 맵 게임 교체 결정)
- `/phases/0-mvp/step4.md` (기존 `experience-jeonse` step의 금지사항 — 특히 "사용자 노출 텍스트에 유형명을 직접 쓰지 마라"는 이번에도 그대로 유효하다)
- `src/types/experience.ts`, `src/types/player.ts` (step1 산출물)
- `src/data/jeonse.ts`, `src/data/jeonse.test.ts` (step1에서 `JeonseHouse`/`JEONSE_HOUSES`/`JEONSE_HOUSE_SETS`가 추가됨 — 아직 `JEONSE_LISTING_PAIRS`도 남아있음, 이 step에서 정리)
- `src/lib/registry.ts`, `src/lib/scoring.ts`, `src/data/remediation.ts`
- `src/components/experiences/JeonseExperience.tsx`, `JeonseExperience.test.tsx` (지금부터 전면 재작성)
- `src/components/experiences/CaseSelectExperience.tsx` (참고용 — 이번엔 패턴이 많이 달라지지만 `ModuleResult` 구성 방식·Tailwind 톤은 동일하게 따른다)
- `src/app/session/page.tsx` (`Component` 렌더 계약 확인용 — 이 step에서 수정하지 않음)

## 배경

팀원 레포 [`JUNGMyeong-jin96/HousingFraudDetect`](https://github.com/JUNGMyeong-jin96/HousingFraudDetect)의 게임을 이식한다: 골목 맵을 방향키/WASD/D-패드로 이동 → 매물 5채의 문 앞에 서면(또는 클릭하면) 자동 입장 → 서류 8개 항목(등기부·전세가율 등) 확인 → O(위험 있음)/X(안전) 판정 → 5채 모두 판정하면 이 유형의 체험이 끝난다.

**원작과 반드시 다르게 만들어야 하는 부분(중요)**:

1. **판정 직후 정답 공개 금지.** 원작은 O/X 선택 즉시 정답·해설(`explain`/`lesson`)을 보여주지만, 이 앱은 "체험 중 정오답 노출 금지, `/result`에서만 공개"가 확정 원칙이다(다른 두 유형과 동일). 판정 직후에는 "판정을 기록했습니다" 같은 중립 안내만 보여주고 닫는다.
2. **정오답을 암시하는 다른 UI도 전부 제거.** 원작에는 헤더의 실시간 정답 카운터, 맵 위 집 버튼의 "정답/오답" 스탬프, 사이드바 점검기록의 "정답/오답" 배지가 있다 — 셋 다 정오답 구분 없이 "완료/미점검"만 표시하도록 바꾼다.
3. **유형명 비노출.** `phases/0-mvp/step4.md`의 금지사항이 이번에도 유효하다 — "전세", "전세사기", "jeonse", "JEONSE" 같은 문구를 사용자 노출 텍스트(헤더, 안내 문구 등)에 쓰지 마라. 원작의 "전세사기 위험 점검 훈련 / JEONSE RISK FIELD TEST" 헤더는 이식하지 말고, "매물 점검", "골목을 돌며 매물을 점검하세요" 같은 유형명을 특정하지 않는 문구로 바꿔라.
4. **5채 판정을 `ModuleResult` 1건으로 집계.** 이 앱의 `ModuleResult`는 체험 유형당 1건이 원칙이다 — 5채 각각의 결과가 아니라 집계된 결과 1건만 `onComplete`로 전달한다.

## 외부 참고 소스

아래 팀원 레포 파일을 WebFetch로 가져와 이식 기준으로 삼는다(캔버스 절차적 픽셀아트라 외부 이미지·라이브러리 의존성 없음 — `sprites.ts`/`HouseSprite.tsx`/`PlayerSprite.tsx`는 타입 임포트 경로만 바꿔서 거의 그대로 옮길 수 있다):

- `https://raw.githubusercontent.com/JUNGMyeong-jin96/HousingFraudDetect/main/lib/houses.ts` — `LAYOUT`, `BOARD_WIDTH`/`BOARD_HEIGHT`, `HOUSE_WIDTH`/`HOUSE_HEIGHT`, `PLAYER_SIZE`, `PLAYER_SPEED`, `START_POS` 등 보드 레이아웃 상수(House 데이터 자체는 이미 step1에서 옮겨졌으니 상수만 참고)
- `https://raw.githubusercontent.com/JUNGMyeong-jin96/HousingFraudDetect/main/lib/sprites.ts` — 건물/캐릭터 픽셀아트 절차적 생성 로직
- `https://raw.githubusercontent.com/JUNGMyeong-jin96/HousingFraudDetect/main/components/HouseSprite.tsx`
- `https://raw.githubusercontent.com/JUNGMyeong-jin96/HousingFraudDetect/main/components/PlayerSprite.tsx`
- `https://raw.githubusercontent.com/JUNGMyeong-jin96/HousingFraudDetect/main/components/MapScreen.tsx` — 이동/D-패드/문 자동입장 로직(단, 위 3번 규칙에 따라 정오답 노출 부분은 제거하고 이식)
- `https://raw.githubusercontent.com/JUNGMyeong-jin96/HousingFraudDetect/main/components/HouseDialog.tsx` — 서류 8항목 표시 + O/X 판정 UI(단, 판정 직후 정답 공개 구간은 제거)

## 작업

### 1. `src/data/jeonse.ts` / `src/types/experience.ts` 정리

- `JEONSE_LISTING_PAIRS`(및 그 테스트)와 `ListingSide`/`ListingPair` 타입을 이제 완전히 **삭제**한다 — 이 step에서 registry/컴포넌트를 새 콘텐츠로 전환하므로 더 이상 쓰이지 않는다.
- `src/data/jeonse.test.ts`에서 `JEONSE_LISTING_PAIRS` 관련 `describe` 블록도 함께 삭제한다.

### 2. `src/components/experiences/jeonse/boardConfig.ts` (신규)

팀원 레포 `lib/houses.ts`에서 House 데이터를 제외한 레이아웃 상수(`LAYOUT`, `BOARD_WIDTH`, `BOARD_HEIGHT`, `HOUSE_WIDTH`, `HOUSE_HEIGHT`, `PLAYER_SIZE`, `PLAYER_SPEED`, `START_POS`)를 그대로 옮긴다.

### 3. `src/components/experiences/jeonse/sprites.ts`, `HouseSprite.tsx`, `PlayerSprite.tsx` (신규)

팀원 레포의 3개 파일을 거의 그대로 이식한다. `BuildingType` 타입 참조만 `@/types/experience`의 `JeonseBuildingType`으로 바꾼다. 외부 이미지 자산이나 새 npm 의존성을 추가하지 않는다(canvas 2D API만 사용).

### 4. `src/components/experiences/jeonse/HouseDialogPanel.tsx` (신규, `"use client"`)

```ts
interface HouseDialogPanelProps {
  house: JeonseHouse;
  answered: boolean;
  onAnswer: (risky: boolean) => void;
  onClose: () => void;
}
```

- 원작 `HouseDialog.tsx`처럼 확인 → 서류 8항목(`fields`) 노출 → O/X 버튼 흐름을 따르되, **`answered`가 true가 되는 순간에도 `house.risky`/`explain`/`lesson`을 렌더하지 않는다.** 대신 "판정을 기록했습니다. 다음 집으로 이동하세요." 같은 중립 문구와 닫기 버튼만 보여준다.
- Tailwind 다크테마로 새로 스타일링한다(`bg-[#141414]`/`border-neutral-800`/`bg-blue-500` 톤, 모달 백드롭은 `fixed inset-0 bg-black/70` 류로 구성).

### 5. `src/components/experiences/jeonse/MapBoard.tsx` (신규, `"use client"`)

```ts
interface MapBoardProps {
  houses: JeonseHouse[]; // 정확히 5개
  answers: Record<number, boolean>;
  onAnswer: (index: number, risky: boolean) => void;
}
```

- 원작 `MapScreen.tsx`의 이동 로직(방향키/WASD, `requestAnimationFrame` 루프, 문 앞 자동입장, 집 클릭으로도 입장, `ResizeObserver` 기반 보드 스케일, 터치 D-패드)을 그대로 이식한다.
- 집 버튼과 사이드바 목록은 `answers[i] !== undefined`(완료 여부)만 표시하고, **정답 여부(`answers[i] === houses[i].risky`)는 이 컴포넌트 안에서 계산도, 렌더도 하지 않는다.** 헤더에도 실시간 정답 카운터를 넣지 않는다 — "점검 {answeredCount}/5"만 표시.
- 헤더/안내 문구에 "전세", "전세사기" 등 유형명을 특정하는 단어를 쓰지 않는다. 예: "골목을 돌며 매물을 점검하세요", "붉은 문에 서면 서류가 열립니다" 정도로 일반화.
- 매물 입장 시 `HouseDialogPanel`을 렌더하고, `onAnswer` 결과를 그대로 부모(`onAnswer` prop)로 전달한다.

### 6. `src/components/experiences/JeonseExperience.tsx` 전면 재작성 (`"use client"`)

```ts
interface JeonseExperienceProps {
  content: JeonseHouse[]; // 5채
  onComplete: (result: ModuleResult) => void;
}
```

- `answers: Record<number, boolean>` 로컬 state로 5채 판정을 누적하고, `MapBoard`를 렌더한다.
- `Object.keys(answers).length === content.length`가 되는 순간(정확히 한 번, 중복 방지 가드 포함 — `isTransitioning` 같은 플래그로 이미 다른 유형들이 하는 것과 동일한 방식) 아래 규칙으로 `ModuleResult`를 만들어 `onComplete`를 호출한다:
  - `typeId: "jeonse"`
  - `contentId`: `content.map(h => h.id).sort().join("-")`
  - `correctCount = content.filter((h, i) => answers[i] === h.risky).length`
  - `score = (correctCount / content.length) * 100`
  - `grade = computeGrade(score)` (`src/lib/scoring.ts` 재사용)
  - `isCorrect = grade === "safe"` (80% 이상, 기존 등급 기준 재사용 — 새 임계값을 만들지 않는다)
  - `mistakeTag = isCorrect ? undefined : "missed-lease-fraud-signal"` (기존 `remediation.ts` 키 재사용, 새 카피 추가 불필요)
  - `userChoice`: 예) `` `${content.length}채 중 ${correctCount}채 정답 판정` ``
  - `correctChoice`: 예) `` `${content.length}채 모두 정확히 판정` ``
  - `explanation`: `isCorrect`면 짧은 격려 문장, 아니면 놓친 매물의 `short`(또는 `name`)와 `reason`을 이어붙인 요약(예: 놓친 매물이 여러 채면 세미콜론으로 구분, 2~3개까지만 나열)

### 7. `src/lib/registry.ts`

`jeonse` 항목을 아래로 교체한다:

```ts
{
  typeId: "jeonse",
  contentPool: JEONSE_HOUSE_SETS,
  pickRandomContent: () => JEONSE_HOUSE_SETS[Math.floor(Math.random() * JEONSE_HOUSE_SETS.length)],
  Component: JeonseExperience,
}
```

`import { JEONSE_LISTING_PAIRS } from "@/data/jeonse"`를 `import { JEONSE_HOUSE_SETS } from "@/data/jeonse"`로 바꾼다.

### 8. 테스트 (TDD — 구현보다 먼저 작성)

- `src/components/experiences/JeonseExperience.test.tsx` 전면 재작성:
  - 초기 렌더 시 5채 모두 미판정 상태로 보드가 표시된다.
  - 매물 하나를 열어 O/X 중 하나를 고른 직후 화면에 정답/오답/`explain`/`lesson` 텍스트가 **없다**(핵심 회귀 테스트 — `screen.queryByText`로 부재를 확인).
  - 5채를 모두 판정하면 `onComplete`가 정확히 1회 호출되고, 인자의 `score`/`isCorrect`/`mistakeTag`/`contentId`가 판정 결과와 일치한다(전부 정답인 경우와 일부 오답인 경우 둘 다 케이스로 작성).
- `src/lib/registry.test.ts`: 기존 테스트가 여전히 통과하는지 확인(로직 변경 없음, 회귀 확인용).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - 판정 직후 정답/해설/정오답 스탬프가 어디에도 렌더되지 않는가? (즉시 피드백 금지 원칙)
   - 사용자 노출 텍스트에 "전세"/"jeonse"/"JEONSE" 등 유형명이 없는가? (`phases/0-mvp/step4.md` 금지사항)
   - `dangerouslySetInnerHTML`을 쓰지 않았는가? (`CLAUDE.md` CRITICAL 규칙)
   - 새 npm 의존성을 추가하지 않았는가?
   - `src/app/session/page.tsx`/`src/app/result/page.tsx`를 이 step에서 수정하지 않았는가?(오케스트레이션 레이어는 무수정이어야 한다)
3. `npm run dev`로 수동 플레이스루: `/setup` → `/session`에서 무작위 순서 중 매물 판정 차례가 나오면 방향키/D-패드로 이동 → 문 앞 자동입장 → 서류 8개 확인 후 O/X 판정 → **정답이 즉시 뜨지 않는지** 확인 → 5채 모두 판정 후 다음 단계(또는 결과)로 자동 진행되는지 확인.
4. `/result`에서 이 유형 항목이 "N채 중 M채 정답 판정" 형태로 1건만 표시되고, 오답 시 대응 방안에 기존 전세사기 카피가 뜨는지 확인.
5. 좁은 뷰포트(모바일 폭)에서 D-패드 터치 컨트롤이 정상 동작하는지 확인.
6. 결과에 따라 `phases/2-jeonse-map-game/index.json`의 `step: 3` 항목을 업데이트한다.

## 금지사항

- 판정 직후(또는 5채를 다 채우기 전 어떤 시점에도) 정답 여부·해설·`risky` 값을 사용자에게 보여주는 UI를 만들지 마라. 이유: 이 앱의 "결과 페이지에서만 공개" 원칙 위반.
- 사용자 노출 텍스트에 "전세"/"전세사기"/"jeonse" 같은 유형명을 직접 쓰지 마라. 이유: `phases/0-mvp/step4.md`의 기존 금지사항, 유형 사전 노출 방지.
- 매물 콘텐츠(주소·서류 항목 등)를 렌더링할 때 `dangerouslySetInnerHTML`을 쓰지 마라. 이유: XSS 방지.
- 새 npm 런타임 의존성(애니메이션/상태관리/캔버스 라이브러리 등)을 추가하지 마라. 이유: 팀원 원작도 `next`/`react`/`react-dom`만으로 구현되어 있어 그대로 이식 가능하다.
- `src/app/session/page.tsx`, `src/app/result/page.tsx`, `src/lib/scoring.ts`, `src/data/remediation.ts`를 수정하지 마라. 이유: 오케스트레이션/채점/대응방안 로직은 기존 `ModuleResult` 계약만 지키면 무수정으로 재사용 가능해야 한다.
- 기존 테스트를 깨뜨리지 마라.
