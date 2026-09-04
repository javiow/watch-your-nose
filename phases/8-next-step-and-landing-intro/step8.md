# Step 8: how-it-works-page

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ADR.md`의 ADR-004(유형 사전 비노출), ADR-016(이번 phase 배경)
- `/docs/PRD.md`의 "핵심 기능" 1·4번 항목
- `/src/app/page.tsx` (전체)
- `/src/app/page.test.tsx` (전체)
- `/src/components/ui/LandingHero.tsx` (전체) — 특히 하단의 "더 알아보기(⌄)" 스크롤 큐 링크
- `/src/components/ui/LandingHero.test.tsx` (전체)
- `/src/components/ui/StartButton.tsx`, `/src/components/ui/StartButton.test.tsx` (전체)
- `/src/app/setup/page.tsx` (전체) — 이동할 다음 페이지, 이 step에서는 수정하지 않는다

## 배경

지금 랜딩(`/`)은 `<LandingHero />` + 그 아래 같은 페이지의 `id="how-it-works"` 스크롤 섹션(진행 방식 안내 3줄)으로 구성돼 있고, `StartButton`을 누르면 세션을 초기화하고 곧바로 `/setup`(캐릭터 설정)으로 이동한다.

이번 step은 이 "진행 방식" 안내를 별도 페이지 `/how-it-works`로 분리하고, "시작하기" → `/how-it-works` → `/setup` 순서의 **필수 단계**로 만든다(사용자 확정 사항, ADR-016). 이 페이지는:

- 서비스에 대한 간략한 설명을 담는다.
- "어떤 콘텐츠가 있는지"는 구체적 유형명(보이스피싱/케이스 조사/전세매물/사기 판별 카드 같은 이름)을 **절대 밝히지 않고**, "전화·문자·실제 계약 확인 등 일상에서 마주칠 수 있는 다양한 사기 상황을 체험한다" 수준의 일반적 톤으로만 소개한다 — `LandingHero.tsx`의 `HERO_CARDS` 주석에 이미 명시된 "유형명·다음 단계 비노출" 원칙(ADR-004)을 그대로 따른다.
- 기존 3줄 진행 방식 안내를 보강한다: 여러 단계로 진행된다는 것, **각 콘텐츠를 마치면 화면에 남는 "다음으로 넘어가기" 버튼을 눌러야 다음 단계로 넘어간다는 것**(이번 phase의 step2~5에서 구현됨), 선택 직후에는 정답/오답을 알려주지 않고 결과는 마지막에 한 번에 공개된다는 것, 결과 페이지에서 종합 점수·문항별 리뷰(어떤 유형이었는지 포함)·대응 방안을 확인할 수 있다는 것(step6에서 구현됨).

## 작업

### 1. `src/app/how-it-works/page.tsx` 신규 생성

- 서버 컴포넌트로 작성한다(`useRouter`/`onClick` 불필요 — 다음 페이지 이동은 `next/link`의 `<Link href="/setup">`로 처리하면 충분하다. `"use client"` 지시어를 붙이지 마라).
- 위 "배경"에서 설명한 서비스 소개, 콘텐츠 티저(유형명 비노출), 보강된 진행 방식 안내를 담는다.
- 하단에 다음 단계로 넘어가는 CTA — `<Link href="/setup">` 스타일 버튼(레이블 예: "시작하기" 또는 "다음"). `resetSession()`은 이미 랜딩의 `StartButton` 클릭 시 호출되므로 여기서는 세션 관련 로직을 넣지 않는다.
- `src/app/page.tsx`/`LandingHero.tsx`와 톤이 맞는 기존 Tailwind 토큰(`bg-accent`, `text-muted`, `border-border` 등)만 사용한다.

### 2. `src/components/ui/StartButton.tsx`

- `router.push("/setup")` → `router.push("/how-it-works")`로 목적지만 바꾼다. `resetSession()` 호출은 그대로 유지한다.

### 3. `src/app/page.tsx`

- 하단의 `<section id="how-it-works">...</section>` 블록 전체를 제거한다. `<main>` 안에는 `<LandingHero />`만 남긴다.

### 4. `src/components/ui/LandingHero.tsx`

- 하단의 "더 알아보기" 스크롤 큐(`<a href="#how-it-works" aria-label="더 알아보기">⌄</a>`)를 `next/link`의 `<Link href="/how-it-works" aria-label="더 알아보기">⌄</Link>`로 바꾼다. 기존 `className`(스타일)은 그대로 유지한다.

## 테스트 갱신

### `src/app/page.test.tsx`

- "헤드라인과 진행 방식 안내를 보여준다" 테스트에서 `expect(screen.getByText("진행 방식")).toBeDefined();` 단언을 제거한다(더 이상 이 페이지에 없다). 헤드라인(`"코심코심"`) 관련 단언은 유지한다. 테스트 제목도 필요하면 다듬는다.
- "체험 유형명을 노출하지 않는다" 테스트는 그대로 유지한다(랜딩에 여전히 적용돼야 하는 원칙).

### `src/components/ui/StartButton.test.tsx`

- `pushMock`이 `"/setup"`이 아니라 `"/how-it-works"`로 호출됐는지로 기대값을 바꾼다.

### `src/app/how-it-works/page.test.tsx` 신규 생성

TDD로 먼저 작성한다. 최소한:

- 진행 방식 관련 안내 문구(예: "다음으로 넘어가기" 버튼을 눌러야 넘어간다는 설명)가 렌더된다.
- 체험 유형명(`/보이스피싱|케이스 조사|전세매물|사기 판별/`)이 노출되지 않는다(`LandingHero.test.tsx`의 동일 원칙 테스트를 참고해 같은 방식으로 작성).
- CTA 링크의 `href`가 `"/setup"`이다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `src/app/setup/page.tsx`를 수정하지 않았는가?
   - `/how-it-works` 페이지에 4개 체험 유형의 구체적 이름이 어디에도 등장하지 않는가?
   - `src/app/page.tsx`에 `id="how-it-works"` 문자열이 더 이상 남아있지 않은가?
3. 결과에 따라 `phases/8-next-step-and-landing-intro/index.json`의 `step: 8`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `/how-it-works` 페이지에 보이스피싱/케이스 조사/전세매물/사기 판별 카드 같은 구체적 유형명을 쓰지 마라. 이유: ADR-004의 "유형 목록 사전 비노출" 원칙은 체험 시작 전 모든 화면에 적용된다.
- `src/app/setup/page.tsx`, `src/lib/session-context.tsx`를 수정하지 마라. 이유: 세션 초기화·다음 단계 로직은 그대로 유지한다.
- `resetSession()`을 `/how-it-works` 페이지에서 다시 호출하지 마라. 이유: "시작하기" 클릭 시 한 번만 호출되는 것이 의도된 동작이다(중복 호출 시 부작용은 없지만 책임 소재를 `StartButton`에만 두기 위함).
- 기존 테스트를 깨뜨리지 마라 (위에 나열되지 않은 테스트는 그대로 통과해야 한다).
