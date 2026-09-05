# Step 5: wire-glossary-case-investigation

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/src/data/glossary.ts` (step0)
- `/src/components/ui/GlossaryTermText.tsx` (step2)
- `/src/data/case-investigation.ts` (전체) — `CaseDocumentBlock` = `{ blockId, text, evidencePattern }` 구조
- `/src/components/experiences/CaseInvestigationExperience.tsx` (전체) — 특히 `openDocument.blocks.map(...)` 부분(문서 열람 화면)
- `/src/types/experience.ts`의 `CaseDocumentBlock` 정의: `evidencePattern`이 `null`이면 증거 등록 불가한 일반 정보 텍스트, 아니면 증거로 등록 가능한 텍스트다.

## 배경

케이스 조사의 등기부/서류 텍스트(`CaseDocumentBlock.text`)에 갑구, 을구, 신탁원부, 수탁자, 채권최고액 같은 등기부 전문 용어가 그대로 등장한다.

**중요한 제약**: `CaseInvestigationExperience.tsx`에서 `block.evidencePattern === null`인 블록은 `<p>` 안에 렌더되지만, `evidencePattern`이 있는 블록은 `<button onClick={...}>{block.text}</button>` 안에 렌더된다(클릭하면 증거로 등록됨). `GlossaryTermText`는 내부에 `<button>`(용어 설명 아이콘)을 렌더하는 컴포넌트다 — `<button>` 안에 `<button>`을 중첩하는 것은 잘못된 HTML이고 클릭 이벤트가 서로 충돌한다. 따라서 **이 step은 `evidencePattern === null`인 블록(`<p>`로 렌더되는 일반 정보 텍스트)에만 적용한다.** 증거 등록 버튼 안의 텍스트는 건드리지 않는다.

## 작업

### 1. `src/data/case-investigation.ts`

`grep -n "【갑구】\|【을구】\|근저당권설정\|채권최고액\|신탁원부\|수탁자\|수탁사" src/data/case-investigation.ts`로 출현 지점을 찾는다. 각 지점이 속한 `CaseDocumentBlock`의 `evidencePattern`이 `null`인지 확인하고(문서 안에서 해당 `blockId`를 찾아 위아래 몇 줄을 같이 읽어 `evidencePattern` 값을 직접 확인하라), `null`인 블록의 `text`에만 `{{term:...}}` 마커를 심는다. `evidencePattern`이 `null`이 아닌(증거 등록 가능한) 블록은 절대 건드리지 마라.

### 2. `src/components/experiences/CaseInvestigationExperience.tsx`

`import { GlossaryTermText } from "@/components/ui/GlossaryTermText";`를 추가한다.

`openDocument.blocks.map((block) => { if (block.evidencePattern === null) { return (<p ...>{block.text}</p>); } ... })` 부분에서, **`evidencePattern === null` 분기의 `<p>` 안 `{block.text}`만** `<GlossaryTermText text={block.text} />`로 바꾼다. 그 아래 `evidencePattern`이 있는 분기의 `<button>{block.text}</button>`는 그대로 둔다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `{{term:` 마커가 들어간 모든 `CaseDocumentBlock`의 `evidencePattern`이 정말 `null`인지 하나씩 재확인했는가?
   - `<button>` 안에 `<GlossaryTermText>`를 렌더하는 곳이 하나도 없는가? (`grep -A2 "evidencePattern as string" src/components/experiences/CaseInvestigationExperience.tsx`로 해당 버튼 블록을 다시 확인하라)
3. 결과에 따라 `phases/9-glossary-and-visual-results/index.json`의 `step: 5`를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `evidencePattern`이 `null`이 아닌 `CaseDocumentBlock.text`에 마커를 넣지 마라. 이유: 그 텍스트는 `<button>` 안에 렌더되고, `GlossaryTermText`가 만드는 `<button>`과 중첩되면 잘못된 HTML이자 클릭 충돌이 발생한다.
- `title`(`CaseInvestigationContent.title`), `hiddenTruth.explanation`, `endingOptions[].comment` 등 "렌더링 금지" 주석이 붙은 필드는 건드리지 마라. 이유: 스포일러 방지 필드다.
- `src/data/voice-phishing.ts`, `src/data/jeonse.ts`, `src/data/fraud-judgment.ts`를 수정하지 마라. 이유: 각각 step3, step4, step6에서 다룬다.
- 기존 테스트를 깨뜨리지 마라.
