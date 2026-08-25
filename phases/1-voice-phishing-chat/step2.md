# Step 2: voice-phishing-chat-ui

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, `/docs/ADR.md` (step0에서 ADR-006 추가됨 — 보이스피싱만 채팅형 UI로 전환하는 배경과 트레이드오프를 반드시 읽는다)
- `src/types/experience.ts` (`ExperienceComponentProps`, `ModuleResult`, `DialogueNode`/`DialogueChoice`/`VoicePhishingScenario` — 이번 step에서도 타입은 변경하지 않는다)
- `src/lib/scoring.ts` (`computeGrade`)
- `src/data/voice-phishing.ts`, `src/data/remediation.ts` (step1에서 4개 시나리오로 교체되고 `fell-for-scam` 대응 문구가 추가됨 — 이 콘텐츠 기준으로 UI를 만들고 테스트하라)
- `src/components/experiences/VoicePhishingExperience.tsx`, `VoicePhishingExperience.test.tsx` (교체 대상 — "다음" 버튼 기반의 현재 구현과 테스트)
- `src/components/experiences/CaseSelectExperience.tsx`, `JeonseExperience.tsx` (이번 변경과 무관하게 유지되는 다른 두 유형 — 대조군으로 참고만 하고 건드리지 않는다)

이전 step에서 만들어진 4개 시나리오 데이터와 등록 방식을 꼼꼼히 읽고 작업하라. `ExperienceModule`/`ExperienceComponentProps` 계약(`content` prop을 받아 `onComplete(ModuleResult)`를 한 번 호출)은 그대로 유지해야 한다 — `src/lib/registry.ts`, `src/lib/session-context.tsx`, `src/app/session/page.tsx`, `src/app/result/page.tsx`는 이 계약만 보고 동작하므로 이번 step에서 수정할 필요도 없고 수정해서도 안 된다.

## 작업

보이스피싱 체험을 "다음" 버튼 클릭 방식에서, 가해자·피해자가 말풍선을 주고받는 채팅형 UI로 재작성한다. 참고 리포 [javiow/sache](https://github.com/javiow/sache)의 `ChatBubble`/`TypingIndicator`/`ChatChoiceButtons` 패턴(타이핑 인디케이터 + 메시지별 딜레이 후 말풍선 등장, 선택지는 클릭 즉시 진행 — 별도 전송/다음 버튼 없음)을 이 프로젝트의 정적 아키텍처(백엔드 없음, 세션 상태는 컴포넌트 로컬 state)에 맞게 이식한다.

### 1. 신규 컴포넌트 (`src/components/experiences/` — 기존과 동일한 평평한 구조, 하위 폴더 만들지 않는다)

**`ChatBubble.tsx`**
```ts
function ChatBubble({ speaker, text }: { speaker: "caller" | "me"; text: string }): JSX.Element
```
- `speaker === "me"`(사용자 본인 선택)면 우측 정렬 + 브랜드 톤(예: `bg-blue-500 text-white`), `speaker === "caller"`(상대방 대사)면 좌측 정렬 + 카드 톤(`bg-[#141414] border border-neutral-800 text-neutral-300`). 기존 색상 컨벤션(`docs/PRD.md` 디자인 절 — 블루 포인트, 다크 배경)을 따른다.
- 말풍선 폭은 `max-w-[80%]` 정도로 제한해 모바일에서도 자연스럽게 줄바꿈되도록 한다(반응형 — 모바일 사용 비중이 높은 서비스 특성).

**`TypingIndicator.tsx`**
```ts
function TypingIndicator(): JSX.Element
```
- 점 3개가 순차적으로 바운스하는 애니메이션(무한 반복). `caller` 말풍선과 같은 좌측 정렬 위치에 렌더한다.

**`ChatChoiceButtons.tsx`**
```ts
function ChatChoiceButtons({
  choices,
  onSelect,
}: {
  choices: DialogueChoice[];
  onSelect: (choiceId: string) => void;
}): JSX.Element
```
- 선택지를 세로로 나열한 버튼 목록. **클릭하면 즉시 `onSelect(choiceId)`를 호출한다 — 별도의 "다음"/전송 버튼 없음.**
- 내부에 `locked` state를 두고, 클릭 시 즉시 `true`로 설정해 이후 클릭을 무시한다 (연속 클릭으로 같은 턴에서 두 선택지가 동시에 선택되거나 `onSelect`가 중복 호출되는 것을 방지 — sache의 `ChatChoiceButtons` 잠금 패턴과 동일). 부모(`VoicePhishingExperience`)가 다음 노드로 넘어가면서 이 컴포넌트는 새 `choices`로 다시 마운트되므로 `locked`는 노드가 바뀔 때마다 자연히 초기화된다.

### 2. `VoicePhishingExperience.tsx` 재작성

- 로컬 state: `history: { id: string; speaker: "caller" | "me"; text: string }[]`(누적 대화 로그, 화면에는 이 배열을 그대로 매핑해 `ChatBubble` 목록으로 렌더), `currentNodeId: string`, `typing: boolean`, `choicesReady: boolean`.
- 타이핑 딜레이는 콘텐츠 작성자가 데이터에 딜레이 값을 직접 넣지 않아도 되도록, 텍스트 길이 기반으로 컴포넌트 내부에서 계산하는 순수 함수로 둔다: `computeTypingDelay(text: string): number` — 예) `Math.min(500 + text.length * 25, 2200)`.
- 마운트 시(`useEffect`, 최초 1회): `content.startNodeId` 노드에 대해 `typing=true` → 계산된 딜레이만큼 대기 → `history`에 caller 라인 push, `typing=false`, `choicesReady=true`.
- 선택지 클릭 핸들러(`handleSelectChoice(choiceId: string)`):
  1. 즉시 `history`에 `{ speaker: "me", text: choice.text }`를 push하고 `choicesReady=false`로 내린다.
  2. `choice.next`가 있고 `content.nodes`에서 실제로 찾아지면: `currentNodeId`를 갱신하고 다시 "typing=true → 딜레이 → history push → choicesReady=true" 사이클을 실행한다.
  3. 그렇지 않으면(시나리오 종료 — `next`가 없거나, 있어도 대상 노드가 존재하지 않는 댕글링 참조인 경우 모두) 기존 채점 로직을 아래처럼 **수정**해서 실행하고, 사용자가 자신의 마지막 메시지를 화면에서 볼 수 있도록 약 600ms 대기한 뒤 `onComplete`를 호출한다:
     - `refused = choice.id.startsWith("refuse")`
     - `isCorrect = content.isNormalCase ? !refused : refused` (기존과 동일 — 사기 거절/정상 응대가 정답)
     - **버그 수정**: 기존 코드는 오답일 때 원인과 무관하게 항상 `mistakeTag: "blind-refusal"`을 방출했다. 이제 원인별로 구분한다:
       - `isNormalCase && !isCorrect` (정상 케이스인데 거절) → `mistakeTag: "blind-refusal"`
       - `!isNormalCase && !isCorrect` (사기 케이스인데 응함) → `mistakeTag: "fell-for-scam"`
       - `isCorrect` → `mistakeTag: undefined`
     - `buildExplanation` 등 기존 헬퍼 로직(설명 문구 4종)은 그대로 재사용한다 — 이 문구는 `isNormalCase`/`isCorrect` 조합에만 의존하므로 수정 불필요.
- 타이머는 `useRef<number[]>`로 추적하고, `useEffect` cleanup에서 전부 `clearTimeout`한다(언마운트 후 setState 방지).
- 선택 직후에도 정답/오답 피드백은 절대 보여주지 않는다(기존 규칙 유지) — 화면에는 대화 로그와 선택지만 보인다.
- "다음" 버튼은 완전히 제거한다.

### 3. 테스트 전면 재작성 (TDD — 반드시 구현 전에 먼저 작성)

`VoicePhishingExperience.test.tsx`를 아래 항목을 검증하도록 재작성한다. `vi.useFakeTimers()` + `vi.advanceTimersByTime(...)`로 타이핑 딜레이를 건너뛰며 검증하고, `afterEach`에서 `vi.useRealTimers()`로 복원한다. 테스트 전용 인라인 fixture(`VoicePhishingScenario` 객체)를 이 파일 안에 직접 정의해 쓴다 — 실제 콘텐츠 문구가 바뀌어도 테스트가 깨지지 않도록 실제 `src/data/voice-phishing.ts`를 import하지 않는다(기존 테스트 파일의 관례와 동일).

- 마운트 직후에는 상대방 말풍선이 아직 없고 타이핑 인디케이터만 보이다가, 딜레이 이후 말풍선과 선택지가 나타난다.
- 선택지 클릭 시 "다음" 버튼 없이 즉시 진행된다: 클릭한 선택지 텍스트가 `me` 말풍선으로 즉시 추가되고, 이후(딜레이 경과 후) 다음 노드의 대사가 이어진다.
- 선택 직후에도 정답/오답 텍스트(`/정답/`, `/오답/`)가 노출되지 않는다.
- 정상 케이스에서 거절 선택 → `isCorrect: false`, `mistakeTag: "blind-refusal"`.
- 정상 케이스에서 정상 응대 → `isCorrect: true`, `mistakeTag: undefined`.
- 사기 케이스에서 거절 선택 → `isCorrect: true`, `mistakeTag: undefined`.
- 사기 케이스에서 거절하지 않고 응함 → `isCorrect: false`, **`mistakeTag: "fell-for-scam"`**(버그 수정 검증 — 기존엔 여기서도 `"blind-refusal"`이 나왔던 부분).
- 존재하지 않는 `next` 참조를 만나도 크래시 없이 시나리오가 종료 처리된다(`onComplete`가 한 번 호출됨).
- 같은 선택지를 연속으로 빠르게 두 번 클릭해도 `onComplete`(또는 히스토리에 같은 메시지)가 중복되지 않는다(`ChatChoiceButtons`의 `locked` 방어 검증).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트:
   - `docs/ARCHITECTURE.md`의 `components/experiences/` 구조를 따르는가(하위 폴더 없이 평평하게)?
   - `docs/ADR.md` ADR-006(보이스피싱만 채팅형, 나머지 유형 미변경) 위반 없는가 — `CaseSelectExperience.tsx`/`JeonseExperience.tsx`를 건드리지 않았는가?
   - `ExperienceModule`/`ExperienceComponentProps` 계약이 그대로 유지되는가(여전히 `content`/`onComplete` prop만 받는가)?
3. `npm run dev`로 로컬 실행 후 보이스피싱 단계가 나올 때까지 세션을 진행해 수동으로 확인한다(랜덤 순서라 여러 번 "다시 체험하기"를 눌러야 할 수 있다):
   - 타이핑 인디케이터 → 말풍선 등장 → 선택지 클릭 즉시 다음 대화로 이어지는가?
   - 결과 페이지에서 사기 케이스에 응한 오답의 대응 방안이 `fell-for-scam` 문구로 정상 노출되는가?
   - 모바일 폭에서도 말풍선/선택지가 레이아웃 깨짐 없이 세로로 자연스럽게 쌓이는가?
4. 결과에 따라 `phases/1-voice-phishing-chat/index.json`의 `step: 2` 항목을 업데이트한다.

## 금지사항

- 선택 직후 정답/오답을 보여주는 즉시 피드백 UI를 넣지 마라. 이유: 제품 결정 — 결과는 `/result`에서만 공개.
- 화면의 사용자 노출 텍스트에 "보이스피싱"이라는 유형명을 직접 쓰지 마라. 이유: `docs/ADR.md` ADR-004.
- `CaseSelectExperience.tsx`/`JeonseExperience.tsx`나 `src/lib/registry.ts`, `src/lib/session-context.tsx`, `src/app/session/page.tsx`, `src/app/result/page.tsx`를 수정하지 마라. 이유: `docs/ADR.md` ADR-006 — 이번 변경은 보이스피싱 컴포넌트 내부로 범위가 한정되고, 다른 유형·오케스트레이션 코드는 기존 `ExperienceModule` 계약만으로 이미 잘 동작한다.
- `src/data/voice-phishing.ts`, `src/data/remediation.ts`를 이 step에서 다시 수정하지 마라(이미 step1에서 완료됨). 오타를 발견해도 이 step 파일에서 지시하지 않은 범위이니, 실제로 필요하면 별도로 알리고 넘어가라.
- 대사·선택지 텍스트를 렌더링할 때 `dangerouslySetInnerHTML`을 쓰지 마라. 이유: XSS 방지, `CLAUDE.md` 보안 규칙.
- 타이핑 인디케이터 이외의 곳에 글로우/무한반복 애니메이션을 추가하지 마라. 이유: 담백한 도구형 UI 원칙 유지.
- 기존 테스트를 깨뜨리지 마라 (`CaseSelectExperience.test.tsx`, `JeonseExperience.test.tsx`, `registry`/`scoring`/`session-context` 관련 테스트 등).
