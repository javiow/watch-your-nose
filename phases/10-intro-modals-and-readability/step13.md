# Step 13: globals-line-height

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ADR.md`의 ADR-001 (Tailwind), ADR-002 (무의존성), ADR-013 (마스코트 CSS 애니메이션이 `globals.css`에 있음)
- `/src/app/globals.css` (전체) — 현재 `@import "tailwindcss";`, `:root` 색상 변수, `@theme inline`, `body { background; color; font-family }`, 그리고 마스코트/히어로 `@keyframes` 다수. `p`·heading·`line-height`·문단 여백에 대한 base 규칙은 **없다**.
- `/src/app/layout.tsx` — `<body className="... antialiased">`

## 배경

이 phase의 마지막 손질. 본문 가독성을 위해 문서 전역의 기본 줄 높이를 살짝 키운다. 문단 구조·여백은 step0의 `Prose`가 담당하므로, 여기서는 `body`의 `line-height`만 건드린다.

## 작업

### `src/app/globals.css`

- 기존 `body { ... }` 규칙에 `line-height: 1.6;` 한 줄을 추가한다. (값은 1.55~1.65 범위 재량.)
- 그 외에는 아무것도 추가하지 마라.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `npm run dev`로 홈, `/how-it-works`, 세션, `/result`를 훑어 텍스트 줄 간격이 넉넉해졌는지, 마스코트/히어로 애니메이션이 그대로인지, 버튼/배지 레이아웃이 깨지지 않았는지 눈으로 확인한다.
3. 체크리스트:
   - `globals.css` 변경이 `body`의 `line-height` 한 줄뿐인가? (`git diff src/app/globals.css`)
   - `p`/heading `margin` 규칙이나 `.prose` 클래스, `@tailwindcss/typography` `@plugin`을 추가하지 않았는가?
   - `@keyframes`·`.mascot-*`·`.hero-*` 규칙을 건드리지 않았는가?
4. 결과에 따라 `phases/10-intro-modals-and-readability/index.json`의 `step: 13`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `p`, `h1`~`h6`, `ul`/`ol`/`li`에 `margin`이나 `padding` base 규칙을 넣지 마라. 이유: 컴포넌트들이 `space-y-*` / `gap-*` 유틸리티로 수직 리듬을 잡고 있어 base margin이 이와 충돌해 레이아웃이 이중으로 벌어진다.
- `text-indent`를 어디에도 넣지 마라. 이유: 이 phase는 첫 줄 들여쓰기가 아니라 문단 여백으로 가독성을 잡는다(사용자 확답).
- `@tailwindcss/typography`를 설치하거나 `@plugin`으로 불러오지 마라. 이유: 미설치 의존성, ADR-002 위반.
- 마스코트/히어로 애니메이션 관련 CSS를 건드리지 마라. 이유: ADR-013 컴포넌트들이 클래스명으로 이 규칙에 의존한다.
- 기존 테스트를 깨뜨리지 마라.
