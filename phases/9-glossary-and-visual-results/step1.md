# Step 1: term-tooltip

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/src/components/ui/HighlightedText.tsx` — "문자열을 직접 파싱해 React 엘리먼트로 렌더링"하는 이 프로젝트의 기존 선례. `dangerouslySetInnerHTML`을 쓰지 않는 이유를 이해하라.
- `/src/data/glossary.ts` (이전 step에서 생성됨) — `GlossaryEntry` 타입만 참고, import는 이 컴포넌트에서 하지 않는다(아래 "작업" 참고).

## 배경

용어 옆에 탭하면 뜨는 짧은 설명 UI가 필요하다. 이 step은 그 UI 컴포넌트만 독립적으로 만든다 — `term`/`definition`을 그대로 props로 받는 범용 컴포넌트로, `glossary.ts`를 직접 import하지 않는다(마커 파싱과 사전 조회는 step2의 `GlossaryTermText`가 담당한다. 이 컴포넌트는 이미 조회된 텍스트만 받아 보여준다).

이 서비스는 모바일 우선이다. 호버로만 여는 툴팁은 쓰지 않는다 — 탭/클릭으로 열고 닫히는 "toggletip" 패턴을 쓴다.

## 작업

`src/components/ui/TermTooltip.tsx`를 신규 생성한다.

```ts
interface TermTooltipProps {
  term: string;       // 화면에 보이는 용어 표시 텍스트
  definition: string; // 탭하면 뜨는 정의
}

export function TermTooltip({ term, definition }: TermTooltipProps): JSX.Element
```

구현 요구사항:

- `term` 텍스트 옆에 작은 `(?)` 버튼(`<button type="button">`)을 둔다. 클릭/탭/Enter/Space로 토글된다(네이티브 `<button>`이면 자동으로 처리됨).
- 클릭할 때마다 정의 팝오버를 열고 닫는다. `useState`로 열림 상태를 관리한다.
- `role="tooltip"`은 쓰지 마라 — 호버·포커스 전제의 role이라 탭으로 열고 유지하는 이 패턴과 맞지 않는다. 대신 버튼에 `aria-expanded`(열림 상태 boolean)와 `aria-controls`(팝오버 id, `useId()`로 생성)를 단다. 팝오버 엘리먼트에는 `aria-live="polite"`를 달아 열릴 때 스크린리더가 정의를 읽도록 한다.
- 컴포넌트 바깥을 클릭(정확히는 `pointerdown` 이벤트)하면 닫힌다. 컴포넌트 루트에 `useRef`를 달고, `document`에 `pointerdown` 리스너를 등록해 `ref.current.contains(event.target)`가 아니면 닫는다. 팝오버가 열려 있을 때만 리스너를 등록하고, 닫히거나 언마운트되면 반드시 해제한다(`useEffect` cleanup).
- `Escape` 키를 누르면 닫힌다(같은 `useEffect` 안에서 `keydown` 리스너로 처리).
- 버튼의 실제 터치 히트 영역이 시각적 크기보다 넓도록 패딩을 준다(WCAG 터치 타깃 권장치에 가깝게).
- 새 색상 값을 하드코딩하지 말고 기존 Tailwind 토큰 클래스(`border-subtle`, `bg-surface`, `text-muted`, `border-border` 등, `globals.css`의 `@theme inline` 정의 참고)만 쓴다.

TDD로 먼저 `src/components/ui/TermTooltip.test.tsx`를 작성해 레드 상태를 확인한 뒤 구현한다. 최소한 아래를 검증한다(`@testing-library/react`의 `render`/`screen`, `fireEvent` 사용 — 이 프로젝트에는 `@testing-library/user-event`가 없다, `fireEvent`만 써라):

- 초기 렌더링 시 `definition` 텍스트는 화면에 없다.
- `(?)` 버튼을 클릭하면 `definition` 텍스트가 나타난다.
- 다시 클릭하면 사라진다.
- 버튼의 `aria-expanded`가 열림/닫힘에 따라 `"true"`/`"false"`로 바뀐다.
- 열린 상태에서 `fireEvent.pointerDown(document.body)`를 발생시키면 닫힌다.
- 열린 상태에서 `fireEvent.keyDown(document, { key: "Escape" })`를 발생시키면 닫힌다.
- 열린 상태에서 팝오버 내부 엘리먼트를 `pointerDown`해도 닫히지 않는다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `src/data/glossary.ts`를 이 컴포넌트가 import하지 않는가? (범용 컴포넌트로 남겨야 한다)
   - `dangerouslySetInnerHTML`을 쓰지 않았는가?
   - `pointerdown`/`keydown` 리스너가 컴포넌트 언마운트 시 확실히 해제되는가?
3. 결과에 따라 `phases/9-glossary-and-visual-results/index.json`의 `step: 1`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `src/data/glossary.ts`를 import하지 마라. 이유: 이 컴포넌트는 term/definition을 받기만 하는 범용 UI이고, 사전 조회는 step2의 책임이다.
- `HighlightedText.tsx`를 수정하지 마라. 이유: 별개 컴포넌트로 분리하는 것이 이 phase의 설계 결정이다(마커 문법과 소비 위치가 다름).
- `@testing-library/user-event`를 설치하거나 사용하지 마라. 이유: 이 프로젝트는 `fireEvent`만 쓰는 컨벤션이다.
- 기존 테스트를 깨뜨리지 마라.
