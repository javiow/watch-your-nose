# Step 2: glossary-term-text

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/src/data/glossary.ts` (step0에서 생성) — `resolveGlossaryKey` 시그니처
- `/src/components/ui/TermTooltip.tsx` (step1에서 생성) — props
- `/src/components/ui/HighlightedText.tsx` — 문자열을 정규식으로 분해해 React 엘리먼트 배열로 렌더링하는 기존 패턴. 이 컴포넌트도 같은 방식(정규식 매칭 → 텍스트 조각과 컴포넌트를 번갈아 배열에 push)을 따른다.

## 배경

체험 콘텐츠 문자열 안에 `{{term:키}}` 형태의 마커를 심어두고, 이 컴포넌트가 그 마커를 실제 화면에서 `TermTooltip`으로 바꿔 보여준다. 이 step은 파서 컴포넌트만 만든다. 실제 콘텐츠 파일에 마커를 심고 렌더 지점을 이 컴포넌트로 바꾸는 것은 step3~6에서 각 체험별로 처리한다 — 이 step에서는 `src/data/voice-phishing.ts`, `src/data/jeonse.ts`, `src/data/case-investigation.ts`, `src/data/fraud-judgment.ts`와 `src/components/experiences/` 아래 파일들을 건드리지 마라.

## 작업

`src/components/ui/GlossaryTermText.tsx`를 신규 생성한다.

```ts
interface GlossaryTermTextProps {
  text: string; // {{term:용어키}} 또는 {{term:용어키|표시텍스트}} 마커가 섞인 문장
}

export function GlossaryTermText({ text }: GlossaryTermTextProps): JSX.Element
```

마커 문법: `{{term:용어키}}` — 화면에는 `용어키` 그대로 표시하고 그 정의를 보여준다. `{{term:용어키|표시텍스트}}` — 화면에는 `표시텍스트`를 보이되(조사가 붙거나 표기가 다른 경우), 정의는 `용어키`로 조회한다.

구현 요구사항:

- 정규식(`/\{\{term:([^}|]+?)(?:\|([^}]+))?\}\}/g`와 동등한 패턴)으로 `text`를 스캔하며, 매치되지 않는 구간은 그대로 텍스트로, 매치된 구간은 `resolveGlossaryKey`로 조회해 `<TermTooltip term={표시텍스트} definition={entry.definition} />`로 치환한다.
- 마커가 하나도 없으면 원문 문자열을 그대로 렌더한다.
- 사전에 없는 키를 만나도 에러를 던지거나 크래시하지 마라 — 표시 텍스트만 일반 텍스트로 렌더하고 `(?)` 버튼 없이 넘어간다(콘텐츠 작성자의 오타를 방어하기 위함).
- `dangerouslySetInnerHTML`을 쓰지 마라.

TDD로 먼저 `src/components/ui/GlossaryTermText.test.tsx`를 작성해 레드 상태를 확인한 뒤 구현한다. 최소한 아래를 검증한다:

- 마커가 없는 문장(`"평범한 문장입니다."`)은 그대로 렌더된다.
- `"등기부에 {{term:근저당권}}이 있습니다."`를 렌더하면 "근저당권" 텍스트와 `(?)` 버튼(`role="button"` 또는 `getByRole("button")`)이 함께 나타난다.
- 마커 두 개가 있는 문장은 두 개의 `(?)` 버튼이 순서대로 렌더된다.
- `{{term:근저당권|근저당}}`은 "근저당"이라는 표시 텍스트로 보이고, `(?)` 버튼을 클릭하면 근저당권의 정의가 뜬다.
- `{{term:존재하지않는키}}`는 크래시 없이 "존재하지않는키" 텍스트만 렌더하고 `(?)` 버튼은 없다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `src/data/voice-phishing.ts`, `src/data/jeonse.ts`, `src/data/case-investigation.ts`, `src/data/fraud-judgment.ts`, `src/components/experiences/` 중 어떤 것도 수정하지 않았는가?
   - 존재하지 않는 키를 넣어도 테스트가 크래시 없이 통과하는가?
3. 결과에 따라 `phases/9-glossary-and-visual-results/index.json`의 `step: 2`를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `src/components/experiences/` 아래 파일을 수정하지 마라. 이유: 실제 적용은 step3~6의 작업이다.
- 콘텐츠 데이터 파일에 마커를 삽입하지 마라. 이유: 마찬가지로 step3~6의 작업이다.
- 오타/미존재 키에 대해 에러를 던지지 마라. 이유: 콘텐츠 작성자가 마커 키를 잘못 써도 앱이 죽지 않아야 한다.
- 기존 테스트를 깨뜨리지 마라.
