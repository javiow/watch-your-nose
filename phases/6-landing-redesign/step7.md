# Step 7: landing-hero

## 읽어야 할 파일

- `/src/app/page.tsx` (현재 서버 컴포넌트 — `Mascot` + eyebrow `Watch Your Nose` + H1 `눈 뜨고 코 베인다` + 서브카피 + "진행 방식" 카드(불릿 3개) + `StartButton`)
- `/src/app/page.test.tsx` (현재: `<SessionProvider>`로 감싸고 `next/navigation` `useRouter`만 mock. `getByText("Watch Your Nose")` 통과 기대, `queryByText(/보이스피싱|사례선택|전세매물/)` 이 `null` 기대)
- `/src/app/layout.tsx` (`metadata.title: "Watch Your Nose"`, `metadata.description: "눈 뜨고 코 베인다 — 금융 사기 교육 서비스"` — description만 바꾼다)
- `/src/components/ui/StartButton.tsx` (`"use client"`, `resetSession()` 후 `router.push("/setup")` — **수정 금지**)
- `/src/components/ui/Mascot.tsx` (step6 — `interactive`, `proximityRef`, `priority`, `className` props)
- `/src/components/ui/PlayerSetupForm.tsx` (기존 UI 컴포넌트가 토큰/클래스를 쓰는 방식 참고)
- `/src/app/globals.css` (step2 — `.hero-bg`, `.hero-grain`, `.card-float-a|b|c`, `.cta-pulse`, `.scroll-cue`)
- `/src/lib/session-context.tsx` (`SessionProvider`, `useSession`)
- `/docs/PRD.md` (step0에서 개정된 「디자인」 + 핵심 기능 1번 — 헤드라인 "코심코심")
- `/docs/ADR.md` ADR-013, ADR-004(유형 비노출)
- `/docs/ARCHITECTURE.md` (「패턴」 랜딩 = 서버 셸 + `LandingHero` 아일랜드)

## 배경

랜딩을 풀 히어로로 개편한다. `src/app/page.tsx`는 **서버 컴포넌트로 유지**하고, 인터랙티브 부분만 새 `src/components/ui/LandingHero.tsx`(`"use client"`) 아일랜드로 분리한다. "진행 방식" 안내는 히어로 아래 스크롤 섹션(`#how-it-works`)으로 내린다. 한글 헤드라인을 **"코심코심"** 로 바꾼다(영문 "Watch Your Nose"는 유지).

## 작업

### 1. `src/components/ui/LandingHero.test.tsx` (구현 전)

`<SessionProvider>`로 감싸고 `next/navigation` `useRouter`를 mock한 뒤(현재 `page.test.tsx`와 동일 패턴), `tests/setup.ts`의 matchMedia shim에 의존:

- `"Watch Your Nose"`, `"코심코심"`, 그리고 `시작하기` 버튼 텍스트가 렌더된다.
- 장식용 마스코트 `img`(`aria-hidden`)가 존재한다.
- `queryByText(/보이스피싱|사례선택|전세매물|사기 판별/)` 가 `null`.
- 모듈에서 export한 `HERO_CARDS`(떠다니는 카드 문구 배열)를 import해 `HERO_CARDS.join(" ")` 가 `/보이스피싱|사례선택|전세매물|사기 판별/` 에 매치되지 않는다.
- 떠다니는 카드 요소들이 `aria-hidden`이고 클래스에 `pointer-events-none` 를 가진다.

### 2. `src/components/ui/LandingHero.tsx` (`"use client"`)

- 모듈 레벨에 `export const HERO_CARDS: readonly string[]` — 떠다니는 "가짜 스캠 알림" 카드 문구 3~4개. 일반적 스캠 톤이되 **체험 유형명·다음 단계를 절대 드러내지 않는다.** 예:
  - `"[Web발신] 해외에서 로그인 시도가 감지되었습니다"`
  - `"부재중 전화 3통 · 지금 확인"`
  - `"《혜택 도착》 고객님만을 위한 안내입니다"`
  - `"송금이 완료되지 않았습니다. 링크에서 인증하세요"`
- 최상위: `<section className="hero-bg hero-grain relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">`.
- `stageRef = useRef<HTMLDivElement>(null)` 를 단 `relative` 래퍼 안에:
  - `HERO_CARDS`를 순회해 `absolute` 배치된 장식 `div` 렌더 — 각각 `aria-hidden`, `className`에 `pointer-events-none select-none` + `card-float-a`/`b`/`c`(순환), 그리고 rounded-xl `bg-surface` border `shadow-sm` + 작은 글리프 + 문구 + 가짜 타임스탬프.
  - `<Mascot interactive proximityRef={stageRef} priority className="w-56 sm:w-72 md:w-80" />`.
- 헤드라인 블록:
  - `<p className="text-sm font-medium text-accent">Watch Your Nose</p>` — **정확히 이 문자열**.
  - `<h1 className="text-6xl font-bold tracking-tight text-foreground sm:text-7xl">코심코심</h1>` — **정확히 `코심코심`**. (원하면 `<span className="text-accent">코심</span>코심` 처럼 일부 강조 가능 — `getByText`가 부분 매치가 아니므로, 강조로 텍스트 노드가 쪼개지면 `getByText("코심코심")`가 실패한다. 이 경우 테스트를 `getByRole("heading", { name: "코심코심" })`로 바꾸고 접근성 이름이 "코심코심"으로 읽히게 하라. 단순하게 통짜 텍스트를 권장.)
  - 서브카피: `나는 절대 안 속아? 그 자신감, 지금 바로 확인해보자.` (유지 또는 경미 리워딩 가능)
- CTA: `<div className="cta-pulse rounded-xl"><StartButton /></div>` — `StartButton`은 그대로 감싸기만.
- 스크롤 큐: 섹션 하단 중앙에 `<a href="#how-it-works" aria-label="더 알아보기" className="... scroll-cue">` + 유니코드/CSS 셰브론.

### 3. `src/app/page.tsx` 재작성 (서버 컴포넌트 유지 — `"use client"` 붙이지 마라)

```tsx
import { LandingHero } from "@/components/ui/LandingHero";

export default function Home() {
  return (
    <main>
      <LandingHero />
      <section id="how-it-works" className="mx-auto max-w-3xl scroll-mt-8 px-4 py-16">
        <div className="w-full space-y-3 rounded-xl border border-border bg-surface p-6 text-left shadow-sm">
          <p className="text-sm font-medium text-muted">진행 방식</p>
          <ul className="space-y-2 text-sm leading-relaxed text-muted">
            <li>여러 단계로 진행됩니다.</li>
            <li>각 단계에서 선택하면 다음 단계로 넘어갑니다.</li>
            <li>정답과 오답은 그 자리에서 알려주지 않고, 결과는 마지막에 한 번에 공개됩니다.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
```

"진행 방식" 카피 3줄은 **위 문구 그대로**.

### 4. `src/app/layout.tsx` — metadata description

`description: "눈 뜨고 코 베인다 — 금융 사기 교육 서비스"` → `description: "코심코심 — 금융 사기 교육 서비스"`. `title`은 그대로.

### 5. `src/app/page.test.tsx` 보강

- 기존 단언(`"Watch Your Nose"` 존재, 유형명 미노출)은 유지.
- `getByText("진행 방식")` 존재 단언 추가.
- (선택) `getByText("코심코심")` 존재 단언 추가.
- `LandingHero`가 `"use client"`라 렌더에 `SessionProvider` + `useRouter` mock이 필요하다 — 기존 파일이 이미 둘 다 갖췄으니 구조 변경 없이 통과해야 한다. matchMedia는 `tests/setup.ts` shim으로 커버됨.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

추가:
- `npx vitest run src/components/ui/LandingHero.test.tsx src/app/page.test.tsx` 통과.
- `npm run build` 가 `/` 라우트를 서버 컴포넌트로 빌드한다(RSC 경계 에러 없음 — `LandingHero`만 `"use client"`).
- `grep -rn "눈 뜨고 코 베인다" src/` 결과가 비어 있다.
- `page.tsx` 최상단에 `"use client"` 가 **없다**.

## 검증 절차

1. 위 AC를 실행한다.
2. 체크리스트:
   - `page.tsx`가 서버 컴포넌트인가(`"use client"` 없음, `useRouter`/`useState` 미사용)?
   - eyebrow가 정확히 `"Watch Your Nose"`, H1이 정확히 `"코심코심"`인가?
   - 히어로 카피·`HERO_CARDS`·스크롤 섹션 어디에도 `보이스피싱`/`사례선택`/`전세매물`/`사기 판별` 및 "다음 단계" 힌트가 없는가(ADR-004, `page.test.tsx`)?
   - "진행 방식" 3줄 문구가 원문 그대로인가?
   - `StartButton.tsx`를 수정하지 않았는가?
   - 떠다니는 카드가 `pointer-events-none`이라 CTA를 가리지 않는가?
3. `phases/6-landing-redesign/index.json`의 `step: 7`을 업데이트한다.

## 금지사항

- `src/app/page.tsx`에 `"use client"`를 붙이지 마라. 이유: 아래 스크롤 섹션은 정적이라 서버 렌더가 맞고, 클라 번들을 불필요하게 키운다. 인터랙션은 `LandingHero` 아일랜드에만.
- `StartButton.tsx`를 수정하지 마라. 이유: 세션 리셋+라우팅 로직은 이 phase 범위 밖이고 별도 테스트가 있다.
- 히어로 문구·떠다니는 카드에 체험 유형명(`보이스피싱`/`사례선택`/`전세매물`/`사기 판별`)이나 "다음은 캐릭터 설정" 같은 다음 단계 힌트를 넣지 마라. 이유: CLAUDE.md CRITICAL + ADR-004 + `page.test.tsx` 네거티브 단언.
- "진행 방식" 3줄, eyebrow `"Watch Your Nose"`, H1 `"코심코심"` 문구를 임의로 바꾸지 마라(강조 마크업은 허용하되 텍스트 노드는 그대로).
- 새 npm 패키지를 추가하지 마라.
- `dangerouslySetInnerHTML`·인라인 `<svg>`로 배경/그레인을 만들지 마라 — step2의 CSS 클래스(`hero-bg`, `hero-grain`)를 붙이기만.
- 영문 "Watch Your Nose", 리포명을 바꾸지 마라.
- 기존 테스트를 깨뜨리지 마라.
