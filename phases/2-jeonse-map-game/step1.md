# Step 1: data-model

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md` (특히 방금 step0에서 추가된 ADR-007/ADR-008)
- `src/types/experience.ts`
- `src/data/jeonse.ts`, `src/data/jeonse.test.ts` (지금부터 이 두 파일을 교체한다)
- `src/data/case-select.ts` (`CASE_SELECT_PAIRS`처럼 "정적 배열 + registry가 `Math.random()`으로 하나 뽑는" 기존 패턴 참고)

이 step은 타입/콘텐츠 데이터만 다룬다. UI 컴포넌트나 registry.ts 등록은 이 step에서 하지 않는다(step3에서 함).

## 외부 참고 소스

팀원 레포 [`JUNGMyeong-jin96/HousingFraudDetect`](https://github.com/JUNGMyeong-jin96/HousingFraudDetect)의 아래 파일을 WebFetch로 가져와 참고한다:

- `https://raw.githubusercontent.com/JUNGMyeong-jin96/HousingFraudDetect/main/lib/types.ts` — `House`/`HouseField`/`FieldStatus`/`BuildingType` 원본 타입 정의
- `https://raw.githubusercontent.com/JUNGMyeong-jin96/HousingFraudDetect/main/lib/houses.ts` — `HOUSES` 배열(매물 42개), 매물마다 `num`(번호), `short`(짧은 제목), `name`(정식 이름), `addr`, `buildingType`, `deposit`, `monthlyRent?`, `market`, `ratio`, `ratioBad`, `risky`(정답: true=위험 있음/O, false=안전/X), `fields`(8개 `[라벨, 값, 상태]` 튜플), `explain`(정오답 해설), `lesson`(기억할 것), `reason`(결과 페이지 요약용 한 줄 근거)를 가짐.

## 작업

### 1. `src/types/experience.ts`

- 기존 `ListingSide`/`ListingPair` 타입은 **아직 삭제하지 않는다.** `registry.ts`와 `JeonseExperience.tsx`가 이번 step에서는 여전히 이 타입을 참조하고 있어(둘 다 step3에서 교체됨), 여기서 지우면 그 시점의 `npm run build`가 깨진다. 대신 새 타입을 **추가**만 한다.
- 아래 타입을 추가한다(팀원 원본 `House`를 그대로 옮기되 `num`→`id`로만 이름을 바꾼다):

```ts
export type JeonseFieldStatus = "정상" | "주의" | "위험";
export type JeonseField = [label: string, value: string, status: JeonseFieldStatus];
export type JeonseBuildingType = "다가구주택" | "아파트" | "오피스텔" | "빌라" | "단독주택";

export interface JeonseHouse {
  id: string;
  short: string;
  name: string;
  addr: string;
  buildingType: JeonseBuildingType;
  deposit: string;
  monthlyRent?: string; // 반전세 매물일 때만 존재
  market: string;
  ratio: string;
  ratioBad: boolean;
  risky: boolean; // true = 정답 O(위험 있음), false = 정답 X(안전)
  fields: JeonseField[];
  explain: string;
  lesson: string;
  reason: string;
}
```

- `jeonse` 유형의 `ExperienceModule` 콘텐츠 타입은 매물 1채가 아니라 **매물 5채 세트**(`JeonseHouse[]`)다. 즉 이 유형은 `ExperienceModule<JeonseHouse[]>`가 된다 — step3에서 `registry.ts`/`JeonseExperience.tsx`를 작성할 때 이 제네릭을 사용한다는 것만 기억하고, 이 step에서 `ExperienceModule`/`ExperienceComponentProps` 정의 자체는 수정하지 않는다(이미 제네릭이라 그대로 재사용 가능).

### 2. 새 파일 `src/types/player.ts`

체험 유형과 무관한 전역 개념이라 별도 파일로 둔다:

```ts
export type PlayerAgeGroup = "10대" | "20대" | "30대" | "40대" | "50대 이상";
export type PlayerGender = "남성" | "여성" | "선택 안 함";

export interface PlayerInfo {
  ageGroup: PlayerAgeGroup;
  job: string;
  gender: PlayerGender;
}
```

### 3. `src/data/jeonse.ts`에 새 export 추가 (기존 `JEONSE_LISTING_PAIRS`는 그대로 둔다)

- `JEONSE_HOUSES: JeonseHouse[]` — 팀원 레포 `lib/houses.ts`의 42개 항목을 위 타입에 맞춰 그대로 옮긴다(`num`→`id`, 나머지 필드명·값 동일). 콘텐츠 자체(주소·매물명 등)는 이미 가상화되어 있으므로 각색 없이 그대로 사용해도 된다.
- `JEONSE_HOUSE_SETS: JeonseHouse[][]` — `JEONSE_HOUSES`를 **5개씩 순서대로 정적 분할**해 8개 세트(40채 사용, 나머지 2채는 사용하지 않아도 무방)를 만든다. **이 배열은 코드에 고정된 정적 리터럴/결정적 계산이어야 한다 — 모듈 로드 시점에 `Math.random()`을 쓰지 마라.** 실제로 어떤 세트가 세션에 뽑히는지의 무작위성은 `registry.ts`(step3)의 `pickRandomContent`가 담당한다(기존 `CASE_SELECT_PAIRS[Math.floor(Math.random() * ...)]` 패턴과 동일하게, 이 데이터 파일이 아니라 registry 쪽에서 인덱스를 무작위로 고른다).
- 기존 `JEONSE_LISTING_PAIRS`(및 이를 쓰는 `registry.ts`/`JeonseExperience.tsx`)는 이 step에서 손대지 않는다 — step3에서 새 콘텐츠로 완전히 교체하면서 함께 삭제한다.
- 이 파일에서 board/이동 관련 상수(`LAYOUT`, `BOARD_WIDTH` 등)는 다루지 않는다 — 그건 UI 레이아웃 설정이라 step3에서 `src/components/experiences/jeonse/boardConfig.ts`에 둔다.

### 4. `src/data/jeonse.test.ts`에 새 테스트 추가 (TDD — 구현보다 먼저 작성, 기존 테스트는 유지)

`JEONSE_LISTING_PAIRS` 관련 기존 테스트는 그대로 두고(아직 살아있는 코드라 계속 통과해야 한다), 아래를 검증하는 `describe` 블록을 추가한다:

- `JEONSE_HOUSES.length`가 40 이상이다.
- `JEONSE_HOUSES`의 모든 항목이 `id`/`short`/`name`/`addr`/`deposit`/`market`/`ratio`/`explain`/`lesson`/`reason`을 비어있지 않게 가지고, `fields.length === 8`이다.
- `JEONSE_HOUSES`의 `id`가 전부 고유하다.
- `JEONSE_HOUSE_SETS.length >= 1`이고, 모든 세트가 정확히 5개의 `JeonseHouse`를 가진다.
- `JEONSE_HOUSE_SETS`에 등장하는 모든 `id`가 `JEONSE_HOUSES`에 실제로 존재한다.

## Acceptance Criteria

```bash
npm run build
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - 콘텐츠(매물 데이터)가 `src/data/`의 정적 TS 파일에만 있는가? (`CLAUDE.md` CRITICAL 규칙)
   - `ListingSide`/`ListingPair`/`JEONSE_LISTING_PAIRS`가 여전히 온전히 남아 있어 기존 빌드를 깨뜨리지 않는가? (삭제는 step3 몫)
   - `JEONSE_HOUSE_SETS` 생성에 런타임 `Math.random()`을 쓰지 않았는가?
3. 결과에 따라 `phases/2-jeonse-map-game/index.json`의 `step: 1` 항목을 업데이트한다.

## 금지사항

- `src/lib/registry.ts`, `src/components/experiences/JeonseExperience.tsx`, 기존 `ListingSide`/`ListingPair`/`JEONSE_LISTING_PAIRS`를 이 step에서 건드리거나 지우지 마라. 이유: 이 셋은 아직 서로 연결된 채로 동작 중이며, step3에서 한 번에 교체·삭제한다. 지금 지우면 `npm run build`가 깨진다.
- 매물 콘텐츠(주소·설명 등)를 렌더링할 코드를 이 step에서 작성하지 마라 — 데이터/타입만 다룬다.
- 기존 다른 유형(`voice-phishing.ts`, `case-select.ts`)의 데이터나 테스트를 건드리지 마라.
- step 종료 시점에 `npm run build`/`npm test`가 반드시 통과해야 한다 — 새 export를 추가하는 것만으로는 기존 빌드를 깨뜨리지 않는다는 점을 확인하라.
