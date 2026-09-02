# Step 2: motion-keyframes

## 읽어야 할 파일

- `/src/app/globals.css` (전체 — 현재 `@import "tailwindcss"`, `:root` 토큰, `@theme inline`, `body` 규칙만 있다)
- `/docs/PRD.md` 「디자인」 섹션 (step0에서 개정됨 — 브랜드 토큰 범위 내 은은한 모션·그레인·그라디언트 허용, 보라색 글로우·블러·AI 템플릿 티 지양)
- `/docs/ADR.md` ADR-013 (모션은 `globals.css` `@keyframes`로만, 새 npm 의존성 없음)
- `/docs/ARCHITECTURE.md` 「보안」 절 (그레인은 인라인 SVG/`dangerouslySetInnerHTML` 없이 CSS `radial-gradient`)

## 배경

랜딩 히어로(step7)와 마스코트 컴포넌트(step6)가 쓸 애니메이션을 **CSS `@keyframes` + 헬퍼 클래스**로 미리 정의한다. 모션 라이브러리(framer-motion 등)를 추가하지 않는다. `prefers-reduced-motion`을 반드시 존중한다.

`globals.css`는 `tdd-guard.sh` 면제 대상이라 테스트 없이 수정 가능하다.

### 현재 팔레트 토큰 (참고, 수정 금지)

`--background:#fdf8f0`, `--foreground:#2a2118`, `--surface:#ffffff`, `--surface-muted:#f3e9d8`, `--border:#e7dac0`, `--muted:#6e624f`, `--subtle:#9c8f76`, `--accent:#e8623a`, `--accent-hover:#f07c57`, `--accent-soft:#fde4d8`, `--safe:#2f9e52`, `--danger:#e5484d`.

## 작업

`src/app/globals.css`의 **기존 내용은 그대로 두고**, 파일 끝에 아래를 append 한다. 클래스명은 정확히 이 이름을 쓴다(step6·step7이 이 이름에 의존).

### 1. `prefers-reduced-motion: no-preference` 블록 안에 정의

`@media (prefers-reduced-motion: no-preference) { ... }` 안에 `@keyframes`와 애니메이션 바인딩 클래스:

- `@keyframes mascot-bob` — `translateY(0)` ↔ `translateY(-8px)`, `.mascot-bob { animation: mascot-bob 4s ease-in-out infinite; }`
- `@keyframes mascot-pop-in` — `opacity:0; translateY(12px) scale(.92)` → `opacity:1; none`, `.mascot-pop-in { animation: mascot-pop-in .5s ease-out both; }`
- `@keyframes cta-pulse` — `box-shadow` 링이 `0 0 0 0 rgba(232,98,58,.45)` → `0 0 0 16px rgba(232,98,58,0)`, `.cta-pulse { animation: cta-pulse 2.4s ease-out infinite; }` (색은 `--accent` `#e8623a`의 rgb `232,98,58`)
- `@keyframes hero-bg-drift` — `background-position` 이동, `.hero-bg { background-size: 200% 200%, 200% 200%; animation: hero-bg-drift 24s linear infinite alternate; }`. `.hero-bg`의 `background-image`는 `--accent-soft`·`--surface-muted`·`--background`를 겹친 `radial-gradient` 2개로 구성한다(은은하게, 대비 낮게).
- `@keyframes hero-grain` — 미세 `translate` 스텝 애니메이션, `.hero-grain { position: relative; }` + `.hero-grain::after { content:""; position:absolute; inset:0; pointer-events:none; background-image: <repeating radial-gradient 기반 speckle>; opacity: ~.04; animation: hero-grain 8s steps(6) infinite; }`. **인라인 SVG·외부 이미지·`dangerouslySetInnerHTML` 금지 — 순수 CSS `radial-gradient`/`repeating-radial-gradient`로만.** (`public/`에 작은 타일 noise를 두는 방식도 허용하나 신규 애셋을 추가하지 않는 CSS 방식을 우선한다.)
- `@keyframes card-float-a` / `card-float-b` / `card-float-c` — 각기 다른 미세 `translate`+`rotate` 경로, 각 `.card-float-a|b|c { animation: <name> 14s|17s|15s ease-in-out infinite; }` 로 주기·`animation-delay`를 서로 다르게(스태거).
- `@keyframes scroll-cue` — `translateY(0)`/`opacity:1` ↔ `translateY(6px)`/`opacity:.4`, `.scroll-cue { animation: scroll-cue 1.8s ease-in-out infinite; }`

### 2. 미디어 쿼리 밖(항상 적용)

- `.mascot-frame { transition: opacity 220ms ease; }` — step6의 프레임 크로스페이드용.

### 3. `prefers-reduced-motion: reduce` 블록

`@media (prefers-reduced-motion: reduce) { ... }` 안에:

- `.mascot-bob, .mascot-pop-in, .cta-pulse, .hero-bg, .hero-grain::after, .card-float-a, .card-float-b, .card-float-c, .scroll-cue { animation: none !important; }`
- `.mascot-frame { transition: none; }`
- `.mascot-pop-in { opacity: 1; transform: none; }`

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

추가:
- `grep -c "@keyframes" src/app/globals.css` 가 9 이상.
- `grep -n "prefers-reduced-motion: reduce" src/app/globals.css` 가 매치된다.
- `src/app/globals.css` 외 다른 파일은 변경되지 않았다(`git status`).
- `package.json`이 변경되지 않았다(새 의존성 없음).

## 검증 절차

1. 위 AC를 실행한다. `npm run build`가 CSS 파싱 에러 없이 통과하는지 확인한다.
2. 체크리스트:
   - `:root` / `@theme inline` / `body` 기존 규칙을 수정하지 않았는가?
   - 모든 장식 `@keyframes`가 `no-preference` 블록 안에 있고, `reduce` 블록에서 전부 꺼지는가?
   - 인라인 SVG / 외부 URL / `url(data:...)` 없이 `radial-gradient`만 썼는가?
3. `phases/6-landing-redesign/index.json`의 `step: 2`를 업데이트한다(`summary`에 추가한 클래스명 목록 기재).

## 금지사항

- `npm install`로 패키지를 추가하지 마라(framer-motion, motion, tailwindcss-animate, gsap 등). 이유: ADR-013 — 애니메이션은 CSS만.
- `globals.css`의 기존 `:root`·`@theme inline`·`body` 블록을 편집하지 마라. append만.
- 그레인/노이즈를 인라인 `<svg>`나 `dangerouslySetInnerHTML`, 외부 이미지 URL로 만들지 마라. 이유: ARCHITECTURE 「보안」 — CSS `radial-gradient`만.
- `src/` 아래 `.tsx` 컴포넌트를 만들거나 수정하지 마라. 이 step은 CSS 전용이다.
- 클래스명을 위 명세와 다르게 짓지 마라 — step6/step7이 정확한 이름에 의존한다.
- 기존 테스트를 깨뜨리지 마라.
