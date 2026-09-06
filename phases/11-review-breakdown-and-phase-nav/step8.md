# Step 8: decision-recap-panel

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` (특히 "`dangerouslySetInnerHTML` 금지", "체험 유형/다음 단계 사전 노출 금지", "공용 UI는 `ui/`, 유형별 체험 컴포넌트는 `experiences/`")
- `/docs/ADR.md`의 ADR-003 (Context만), ADR-004 (유형 사전 비공개), ADR-010 (조사 게임)
- `/src/components/experiences/CaseInvestigationExperience.tsx` (전체) — **step4·step7이 반영된 상태**. decision 렌더 블록에는 step7이 넣은 "이전" 버튼(`!confirmed` 가드)이 최상단에 있다. 로컬 state: `registeredEvidence: Set<string>`, `chatLog: ChatEntry[]`(`{ key, userText, npcText, statementId }`), `content.scenario.*`, `content.evidenceDefinitions`
- `/src/components/experiences/CaseInvestigationExperience.test.tsx` (전체)
- `/src/components/ui/Prose.tsx` — `text`(string) → `/\n{2,}/`로 문단 분리
- `/src/data/case-investigation.ts` — `scenario { description, propertyLocation, propertyPriceDescription, brokerLine, speakerLabel, goal }`, `evidenceDefinitions[] { pattern, importance, description }`, `npc`
- `/src/components/experiences/jeonse/` 디렉토리 — 유형별 하위 폴더 컴포넌트 배치 관례 참고

## 배경

step7에서 계약 사기 체험에 단계 간 "이전" 이동을 넣었다. 사용자 피드백의 나머지 절반: **판단(decision) 단계에서 파악한 정보를 다시 보고 싶다.**

이 step은 decision 단계 상단에 **접이식 요약 패널**을 넣어 (a) 현재 상황, (b) 확인한 정보(등록한 증거), (c) NPC 문답을 한자리에서 다시 볼 수 있게 한다. 네이티브 `<details open>`을 써서 별도 JS state 없이 펼침/접힘을 처리한다(기본은 펼침).

## 작업

### 1. `src/components/experiences/case-investigation/DecisionRecapPanel.tsx` 신규

(하위 폴더는 `src/components/experiences/jeonse/` 관례를 따른다.)

```ts
import type { ReactNode } from "react";
import type { CaseInvestigationContent } from "@/types/experience";

interface DecisionRecapPanelProps {
  scenario: CaseInvestigationContent["scenario"];
  confirmedInfo: string[];                                  // 등록된 증거의 description 목록
  npcAnswers: { question: string; answer: string }[];       // 사용자 질문 + NPC 답변
}

export function DecisionRecapPanel(props: DecisionRecapPanelProps): ReactNode;
```

- 루트: `<details open className="rounded-xl border border-border bg-surface p-4 shadow-sm">`
  - `<summary className="cursor-pointer text-sm font-medium text-muted">상황 다시 보기</summary>`
  - `<div className="mt-3 space-y-4">` 안에:
    - `<Prose text={scenario.description} size="sm" />`
    - `<p className="text-sm text-subtle">{scenario.propertyLocation} · {scenario.propertyPriceDescription}</p>`
    - 화자 인용 카드 (briefing 카드와 동일 스타일): `<div className="rounded-xl border border-border bg-surface-muted p-3">` + `<p className="text-sm font-medium text-muted">{scenario.speakerLabel}</p>` + `<p className="mt-1 text-sm leading-relaxed text-muted">&ldquo;{scenario.brokerLine}&rdquo;</p>`
    - `<p className="text-sm font-medium text-muted">{scenario.goal}</p>`
    - "확인한 정보" 블록: `<p className="text-xs font-medium text-subtle">확인한 정보</p>` +
      `confirmedInfo.length ? <ul className="space-y-1">{confirmedInfo.map((info) => <li className="text-sm text-muted">{info}</li>)}</ul> : <p className="text-sm text-subtle">등록한 증거가 없습니다.</p>`
    - "{speakerLabel} 답변" 블록: `<p className="text-xs font-medium text-subtle">{`${scenario.speakerLabel} 답변`}</p>` +
      `npcAnswers.length ? <ul className="space-y-1">{npcAnswers.map((qa) => <li className="text-sm text-muted">「{qa.question}」 → {qa.answer}</li>)}</ul> : <p className="text-sm text-subtle">물어본 질문이 없습니다.</p>`
- 평문 React 텍스트 노드만. `dangerouslySetInnerHTML` 금지.
- `key`는 배열 인덱스로 부여.

### 2. `src/components/experiences/CaseInvestigationExperience.tsx` 배선

decision 렌더 블록에서 step7이 넣은 "이전" 버튼 **바로 다음**, "이제 판단을 내려주세요" 카드 **앞**에:

```tsx
<DecisionRecapPanel
  scenario={content.scenario}
  confirmedInfo={content.evidenceDefinitions
    .filter((d) => registeredEvidence.has(d.pattern))
    .map((d) => d.description)}
  npcAnswers={chatLog.map((e) => ({ question: e.userText, answer: e.npcText }))}
/>
```

import 1줄 추가.

### 지켜야 할 핵심 규칙

- `evidenceDefinitions[].importance`(1 | 2)를 패널에 **넘기지도 렌더하지도 마라** — "핵심/참고" 비노출.
- 스포일러 필드(`content.title`, `hiddenTruth.*`, `endingOptions[].comment`, `contradictions[].explanation`)를 패널에 넣지 마라 — 판단 전 화면이다.
- `chatLog`의 **모든** 항목을 보여준다(매칭 실패한 `fallbackLine` 답변, `statementId === null`인 항목 포함). 채점 로직(`statementId` null 제외)과 무관하게, 사용자가 실제로 나눈 대화를 그대로 복기하게 하는 것이 목적이다.
- 세션 Context를 쓰지 마라 (ADR-003). 패널은 부모가 넘긴 props만 렌더한다.
- `<details>` 대신 커스텀 JS 토글 state를 만들지 마라 — 네이티브로 충분하고 접근성도 확보된다.

### 3. 테스트

**`src/components/experiences/case-investigation/DecisionRecapPanel.test.tsx` 신규:**
- `scenario.description` / `speakerLabel` / `brokerLine` / `goal` 텍스트가 렌더된다.
- `confirmedInfo` 각 항목이 렌더된다; `confirmedInfo={[]}` → "등록한 증거가 없습니다.".
- `npcAnswers`가 `「질문」 → 답변` 형태로 렌더된다; `npcAnswers={[]}` → "물어본 질문이 없습니다.".
- 루트에 `open` 속성을 가진 `<details>`와 `<summary>` "상황 다시 보기"가 있다.

**`src/components/experiences/CaseInvestigationExperience.test.tsx` 갱신:**
- decision 단계 진입 시(확정 전) `screen.getByText("상황 다시 보기")`와 `scenario.description` 텍스트가 토글 없이 보인다(`<details open>`).
- investigating에서 증거 1건 등록 후 decision 단계에서 그 증거의 `description`이 패널에 보인다.
- NPC에 질문 1개를 한 뒤 decision 단계 패널에 그 질문 텍스트 + NPC 답변이 보인다.

## Acceptance Criteria

> 메모리 절약: 전체 Next 빌드 / 전체 테스트 대신 **타입체크 + 린트 + 이 step 관련 테스트만** 실행한다. 전체 `npm run build && npm test`는 phase 종료 후 운영자가 한 번 돌린다.

```bash
npx tsc --noEmit
npm run lint
npx vitest run src/components/experiences/case-investigation/DecisionRecapPanel.test.tsx src/components/experiences/CaseInvestigationExperience.test.tsx
```

## 검증 절차

1. 위 AC 커맨드를 실행한다. **위 타입체크·린트·관련 테스트가 모두 통과해야 한다.**
2. (선택, 자동 실행 세션에서는 생략 — `npm run dev`는 종료되지 않으므로 실행하지 마라) 로컬 육안 확인 시 `npm run dev`로 계약 사기 케이스를 decision 단계까지 진행해 "상황 다시 보기"를 펼치고: 현재 상황 서술 + 화자 인용 + 목표 + 확인한 정보 목록 + NPC 문답이 보인다. `<summary>` 클릭으로 접힌다.
3. 체크리스트:
   - `importance` / 스포일러 필드가 패널에 노출되지 않는가?
   - `<details>`가 `open` 기본값인가?
   - `chatLog` 전 항목을 보여주는가(fallback 답변 포함)?
   - 세션 Context를 쓰지 않았는가?
   - `grep -rn "dangerouslySetInnerHTML" src/` → 0건인가?
   - 컴포넌트가 `src/components/experiences/case-investigation/`에 있는가?
4. 결과에 따라 `phases/11-review-breakdown-and-phase-nav/index.json`의 `step: 8`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `importance`나 스포일러 필드(`content.title`, `hiddenTruth.*`, `endingOptions[].comment`, `contradictions[].explanation`)를 패널에 렌더하지 마라. 이유: 판단 전 화면이며 ADR-004 유형 비공개 원칙에 어긋난다.
- 요약 패널을 investigating이나 briefing 단계에 넣지 마라. 이유: 이 step의 범위는 decision 단계다. (investigating의 "안내 다시 보기"는 이미 있고 별개다.)
- `chatLog`를 필터링해서 일부만 보여주지 마라. 이유: 사용자가 실제로 한 대화 전체를 복기하는 것이 목적이다.
- `<details>` 대신 커스텀 JS 토글 state를 만들지 마라. 이유: 불필요한 상태다 — 네이티브로 충분하고 접근성도 확보된다.
- step7의 "이전" 버튼 / `visitedInvestigatingRef` / `handleBackToInvestigating` 로직을 되돌리지 마라.
- 세션 Context / localStorage를 쓰지 마라 (ADR-003).
