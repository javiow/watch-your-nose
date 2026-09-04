# Step 7: landing-mobile-hero-cards

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ADR.md`의 ADR-013(랜딩 히어로 원안), ADR-016(이번 phase 배경)
- `/docs/PRD.md`의 "디자인" 섹션 (모바일 반응형 필수 원칙)
- `/src/components/ui/LandingHero.tsx` (전체)
- `/src/components/ui/LandingHero.test.tsx` (전체)
- `/src/app/globals.css`의 `card-float-a/b/c` 관련 `@keyframes` (장식 카드 애니메이션, 건드리지 않음)

## 배경

`LandingHero.tsx`의 `HERO_CARDS`(마스코트 주변 장식용 "가짜 스캠 알림" 카드 4개)는 지금 `hidden ... sm:block` 클래스 때문에 640px 이상 화면(데스크톱)에서만 보이고, 모바일에서는 아예 렌더링되지 않는다. 이 카드들은 `pointer-events-none`·`aria-hidden="true"`인 순수 장식 요소라 상호작용·접근성에는 영향이 없다. 이 step에서는 모바일에서도 보이도록 노출 조건을 바꾸고, 헤드라인(`text-6xl` "코심코심")·마스코트와 겹치지 않도록 좁은 화면용 크기·위치를 함께 조정한다.

## 작업

### `src/components/ui/LandingHero.tsx`

- 각 카드 `<div>`의 `className`에서 `hidden`과 `sm:block` 게이팅을 제거해 모든 화면 크기에서 렌더되도록 한다.
- `max-w-[15rem]`는 좁은 화면 기준값을 별도로 두고 `sm:` 이상에서 기존 `15rem`을 유지한다(예: `max-w-[9.5rem] sm:max-w-[15rem]` — 정확한 값은 아래 4번 시각 검증 과정에서 조정해도 된다).
- `CARD_POSITION` 배열의 각 값도 모바일 전용 기본값(현재 `sm:` 앞에 이미 있는 `left-1 top-4` 류)이 헤드라인·마스코트와 겹치지 않도록 필요시 조정한다. `sm:` 이상의 기존 위치(`sm:-left-10` 등)는 그대로 유지한다.

### 회귀 방지 테스트

`LandingHero.test.tsx`의 "떠다니는 카드는 장식이다(aria-hidden, pointer-events-none)" 테스트 근처에, 카드 클래스 목록에 `"hidden"`이 더 이상 포함되지 않는지 확인하는 단언을 추가한다(레드로 먼저 확인한 뒤 구현). 기존 4개 테스트는 모두 그대로 통과해야 한다.

### 시각 검증 (필수, 자동화 불가)

Tailwind 값 튜닝은 코드만 보고 픽셀 단위를 확정하기 어렵다. `npm run dev`로 개발 서버를 띄운 뒤, 브라우저(또는 devtools 반응형 모드)를 375px 안팎 폭으로 좁혀 다음을 눈으로 확인하고, 겹침이 있으면 위 클래스 값을 반복 조정한다:

- 4개 알림 카드가 화면에 보인다.
- 카드 텍스트가 "코심코심" 헤드라인, "시작하기" 버튼과 겹치지 않는다.
- 카드가 화면 좌우 바깥으로 잘려 스크롤을 유발하지 않는다(`overflow-x` 발생 금지).

이 검증을 건너뛰고 코드만 수정한 채 완료 처리하지 마라.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 위 "시각 검증" 항목을 `npm run dev` + 브라우저 375px 폭으로 실제 확인한다.
3. 체크리스트:
   - 데스크톱(≥640px) 화면에서 기존 카드 위치·모션이 그대로인가?
   - 가로 스크롤이 새로 생기지 않았는가?
4. 결과에 따라 `phases/8-next-step-and-landing-intro/index.json`의 `step: 7`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `HERO_CARDS`의 카피(유형명·다음 단계를 드러내지 않는 원칙, ADR-004/ADR-013)를 바꾸지 마라.
- `card-float-a/b/c` `@keyframes` 자체(애니메이션 로직)를 바꾸지 마라 — 이 step은 노출 조건·크기·위치만 다룬다.
- 시각 검증을 생략하고 완료 처리하지 마라. 이유: 겹침 여부는 자동 테스트로 보장할 수 없다.
- 기존 테스트를 깨뜨리지 마라.
