# Step 0: inline-markup-and-prose

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` (특히 "dangerouslySetInnerHTML 금지", "순수 로직은 src/lib" 규칙)
- `/docs/ARCHITECTURE.md` (컴포넌트 배치: 공용 UI는 `src/components/ui/`)
- `/docs/ADR.md`의 ADR-002 (새 런타임 의존성 추가 금지)
- `/src/components/ui/HighlightedText.tsx` (전체) — 현재 `text.split(/\*\*(.+?)\*\*/g)`로 홀수 인덱스를 `<strong className="font-semibold text-foreground">`로 감쌈. 인라인 전용, 개행 처리 없음.
- `/src/components/ui/HighlightedText.test.tsx` (전체) — 특성화 테스트. **이 파일은 수정하지 마라.**
- `/src/components/ui/GlossaryTermText.tsx` (전체) — `{{term:key}}` / `{{term:key|label}}` 마커를 정규식 파싱해 `<TermTooltip>`으로 치환. `resolveGlossaryKey` 사용, 미존재 키는 표시 텍스트만 렌더. 인라인 전용.
- `/src/components/ui/GlossaryTermText.test.tsx` (전체) — 특성화 테스트. **이 파일은 수정하지 마라.**
- `/src/components/ui/TermTooltip.tsx` — `GlossaryTermText`가 렌더하는 툴팁 컴포넌트
- `/src/data/glossary.ts` — `resolveGlossaryKey(key)` 시그니처

## 배경

서비스 전반의 긴 본문이 개행 없는 단일 문자열로 저장돼 하나의 `<p>`에 렌더되면서 "들여쓰기가 안 되어 읽기 불편하다 / 텍스트가 너무 많다"는 피드백이 나왔다. 해결 방향은 **문단 분리 + 여백**(첫 줄 들여쓰기 아님)이다.

이 step은 이후 모든 step이 의존하는 두 개의 공용 텍스트 컴포넌트를 만든다:

1. `renderInlineMarkup` — `**강조**`와 `{{term:key|label}}`를 한 번에 처리하는 인라인 토크나이저. 지금은 `HighlightedText`(강조)와 `GlossaryTermText`(용어)가 서로를 알지 못해, 한 문자열에 둘 다 있으면 중첩해서 감싸야 한다. 이를 단일 패스로 통합한다.
2. `Prose` — 문자열을 `\n\n` 기준으로 문단 배열로 쪼개 문단마다 `<p>`로 렌더하고 문단 간 여백을 주는 래퍼.

`HighlightedText` / `GlossaryTermText`는 **공개 API를 그대로 유지**한 채 내부만 `renderInlineMarkup`을 쓰는 얇은 래퍼로 바꾼다. 두 컴포넌트의 기존 테스트가 특성화(회귀 방지) 역할을 하므로 반드시 통과해야 한다.

## 작업

### 1. `src/components/ui/inline-markup.tsx` 신규

```ts
import type { ReactNode } from "react";

// 한 문자열을 한 번만 순회하며 다음 두 마커를 처리한다:
//   - {{term:key}}            → resolveGlossaryKey(key)로 정의를 찾아 <TermTooltip>
//   - {{term:key|표시텍스트}}  → 표시텍스트로 <TermTooltip>, 정의 없으면 표시텍스트만
//   - **강조**                → <strong className="font-semibold text-foreground">
// 마커가 겹치지 않는다고 가정한다(현재 콘텐츠 규칙). 미존재 glossary key는
// 표시 텍스트(또는 key)를 그대로 두되, 그 텍스트도 ** 강조 대상이 될 수 있다.
export function renderInlineMarkup(text: string): ReactNode;
```

- 구현 방식(정규식 1개로 split 하든, 순차 스캔이든)은 재량. 단 **`dangerouslySetInnerHTML`을 쓰지 마라.**
- `<strong>`의 className은 기존 `HighlightedText`와 **정확히 동일**하게 `"font-semibold text-foreground"`.
- 용어 치환은 기존 `GlossaryTermText`와 동일하게 `resolveGlossaryKey` + `<TermTooltip term=... definition=... />` 형태를 재사용한다. 미존재 키 처리도 기존 `GlossaryTermText`와 동일(표시 텍스트만).
- key 생성 시 배열 인덱스 기반 `key` 부여(React 경고 방지).

### 2. `src/components/ui/HighlightedText.tsx` 리팩터

- 공개 시그니처 유지: `export function HighlightedText({ text }: { text: string }): ReactNode`(현재와 동일한 props).
- 내부를 `return <>{renderInlineMarkup(text)}</>` 수준으로 축소. `**` 파싱 로직을 `inline-markup.tsx`로 이관.
- 결과적으로 `HighlightedText`는 이제 `{{term:}}` 마커도 처리하게 되지만, 기존 호출부는 `**`만 쓰던 문자열을 넘기므로 동작 차이가 없어야 한다.

### 3. `src/components/ui/GlossaryTermText.tsx` 리팩터

- 공개 시그니처 유지: `export function GlossaryTermText({ text }: { text: string }): ReactNode`(현재와 동일).
- 내부를 `renderInlineMarkup(text)` 위임으로 축소.

### 4. `src/components/ui/Prose.tsx` 신규

```ts
import type { ReactNode } from "react";

interface ProseProps {
  text: string | string[];   // string이면 /\n{2,}/로 split, 배열이면 그대로 문단 목록으로 사용
  size?: "sm" | "base";      // 기본 "sm"
  className?: string;        // 컨테이너에 덧붙임
  as?: "div" | "section";   // 기본 "div"
}

export function Prose({ text, size = "sm", className, as = "div" }: ProseProps): ReactNode;
```

- `string` 입력: `text.split(/\n{2,}/)` → 각 조각 `trim()` → 빈 문자열 제거 → 문단 배열.
- 컨테이너 className: `max-w-prose space-y-3 leading-relaxed text-muted` + (`size === "base" ? "text-base" : "text-sm"`) + 전달받은 `className`.
- 문단마다 `<p>{renderInlineMarkup(paragraph)}</p>`, 문단 key는 인덱스.
- 문단이 1개뿐이면 그대로 `<p>` 하나. 0개(빈 입력)면 `null` 반환.
- 첫 줄 들여쓰기(`text-indent`, `pl-*`)를 **넣지 마라** — 이 phase의 명시적 요구사항이다.

### 5. 테스트

**`src/components/ui/inline-markup.test.tsx` 신규:**
- `**중요**` → `<strong>` 안에 "중요", className `font-semibold text-foreground`.
- `{{term:전세가율}}`(glossary에 존재하는 키) → `TermTooltip` 렌더(용어 텍스트 노출).
- `{{term:없는키|표시}}` → "표시" 텍스트만, 툴팁 없음.
- `앞 **강조** 뒤 {{term:전세가율}} 끝` 혼합 → strong 1개 + tooltip 1개 + 사이 평문 유지.
- 마커 없는 평문 → 그대로.
- 인접 마커(`**A****B**` 또는 `**A** **B**`) → strong 2개.

**`src/components/ui/Prose.test.tsx` 신규:**
- `"문단1\n\n문단2\n\n문단3"` → `<p>` 3개.
- `["a", "b"]` 배열 → `<p>` 2개.
- `"a\n\n\n\nb"`(공백/연속 개행) → `<p>` 2개, 빈 문단 없음.
- 문단 내 `**x**` → 해당 `<p>` 안에 `<strong>`.
- 컨테이너에 `max-w-prose`, `leading-relaxed` 클래스 존재.
- `size="base"` → `text-base` 클래스, 기본은 `text-sm`.
- 빈 문자열 `""` → 아무것도 렌더 안 함(`container.firstChild === null`).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다. **`HighlightedText.test.tsx`와 `GlossaryTermText.test.tsx`가 수정 없이 그대로 통과해야 한다** — 통과하지 않으면 래퍼 리팩터가 동작을 바꾼 것이다.
2. 아키텍처 체크리스트:
   - `renderInlineMarkup` / `Prose`가 `src/components/ui/`에 있는가?
   - `dangerouslySetInnerHTML`을 쓰지 않았는가? (`grep -rn "dangerouslySetInnerHTML" src/` → 0건)
   - 새 npm 패키지를 추가하지 않았는가? (`git diff package.json` → 변화 없음)
   - `Prose`가 첫 줄 들여쓰기를 넣지 않았는가?
3. 결과에 따라 `phases/10-intro-modals-and-readability/index.json`의 `step: 0`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

`summary`에는 신규 파일 경로와 `HighlightedText`/`GlossaryTermText`가 래퍼로 바뀌었다는 사실, `Prose`의 split 규칙을 적어라(다음 step들이 참조한다).

## 금지사항

- `HighlightedText.test.tsx`, `GlossaryTermText.test.tsx`, `TermTooltip.test.tsx`를 수정하지 마라. 이유: 이 파일들은 리팩터가 기존 동작을 보존했는지 검증하는 안전망이다. 여기를 고쳐야 통과한다면 래퍼 구현이 틀린 것이다.
- `HighlightedText` / `GlossaryTermText`의 props 이름·형태를 바꾸지 마라. 이유: 여러 호출부(`result/page.tsx`, `ChatBubble.tsx`, `HouseDialogPanel.tsx` 등)가 `text` prop에 의존한다.
- `@tailwindcss/typography`나 `.prose` 클래스를 도입하지 마라. 이유: 미설치 의존성이며 ADR-002 위반. `Prose`는 Tailwind 유틸리티 조합으로만 만든다.
- 마스코트/애니메이션 관련 파일이나 `globals.css`를 건드리지 마라. 이유: 이 step 범위 밖(줄 높이는 step13).
- 기존 테스트를 깨뜨리지 마라.
