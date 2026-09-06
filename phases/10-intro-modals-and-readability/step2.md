# Step 2: intro-dialog-component

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ADR.md`의 ADR-002 (새 의존성 금지)
- `/src/components/ui/Prose.tsx` (step0에서 신규) — 상황 문단 렌더에 사용
- `/src/components/ui/FormatBadge.tsx` (전체) — `ExperienceFormatMeta`를 받아 icon+formatLabel+hint pill을 렌더. 모달 헤더에 재사용.
- `/src/data/experience-format.ts` — `ExperienceFormatMeta` 타입
- `/src/data/experience-intro.ts` (step1에서 신규) — `ExperienceIntroMeta` 타입
- `/src/components/ui/TermTooltip.tsx` — 바깥 pointerdown / Esc로 닫는 팝오버 패턴(포커스·키 이벤트 처리 참고용)
- `/src/lib/useReducedMotion.ts` — `prefers-reduced-motion` 훅(애니메이션을 넣는다면 가드용)
- `/src/components/ui/NextStepButton.tsx` — accent 버튼 톤·클래스 참고
- 기존 모달 예시: `/src/components/experiences/jeonse/HouseDialogPanel.tsx`의 `fixed inset-0 z-20 ... bg-black/70` 오버레이 구조

## 배경

각 체험의 시작 전 안내를 팝업(모달)으로 빼고 설명을 보강한다(사용자 요청 1). 4개 체험이 공유할 모달 컴포넌트를 만든다. step3~5에서 각 체험에 배선한다.

두 가지 용도(`mode`)가 있다:
- `"gate"` — 체험 시작 전 **필수** 안내. 확인 버튼을 눌러야만 넘어간다. Esc·바깥 클릭으로 닫히면 안 된다(안내를 건너뛰게 됨).
- `"help"` — 체험 도중 "안내 다시 보기"로 여는 재열람용. Esc·닫기 버튼으로 닫힌다.

## 작업

### `src/components/ui/IntroDialog.tsx` 신규

```ts
import type { ExperienceFormatMeta } from "@/data/experience-format";
import type { ExperienceIntroMeta } from "@/data/experience-intro";

interface IntroDialogProps {
  format: ExperienceFormatMeta;
  intro: ExperienceIntroMeta;
  confirmLabel: string;              // 예: "통화 시작", "조사 시작", "점검 시작", "판정 시작"
  onConfirm: () => void;             // mode="gate"에서 확인 버튼
  onDismiss?: () => void;            // mode="help"에서 닫기/Esc
  mode?: "gate" | "help";           // 기본 "gate"
}

export function IntroDialog(props: IntroDialogProps): ReactNode;
```

레이아웃:

- 오버레이: `fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4`. (기존 `HouseDialogPanel`이 `z-20`이므로 그보다 위인 `z-30`.)
- 패널: `w-full max-w-md rounded-lg border border-border bg-surface p-6`, 스크롤 대비 `max-h-[90vh] overflow-y-auto`.
- 헤더: `<FormatBadge format={format} />`.
- 제목: `<h2>` (예: "잠깐, 상황을 확인하세요") — `id`를 부여하고 오버레이/패널의 `aria-labelledby`로 연결.
- 본문:
  - `<Prose text={intro.situation} />`
  - "할 일" 소제목 + `<ol className="...">{intro.task.map(step => <li>{step}</li>)}</ol>` (번호 목록).
- 푸터:
  - `mode="gate"`: accent 확인 버튼 하나. 라벨 = `confirmLabel`. 클릭 → `onConfirm()`.
  - `mode="help"`: "닫기" 버튼(outline 톤). 클릭 → `onDismiss?.()`. 우상단에 `aria-label="닫기"` X 버튼을 둬도 된다.

동작 규칙(핵심 — 반드시 지켜라):

1. `role="dialog"` + `aria-modal="true"` + `aria-labelledby={제목 id}`를 패널에 부여한다.
2. **`mode="gate"`에서는 Esc 키와 바깥(오버레이) 클릭이 아무 일도 하지 않는다.** 이유: 필수 안내를 건너뛰면 안 된다.
3. `mode="help"`에서는 Esc 키와 닫기 버튼이 `onDismiss`를 호출한다. 오버레이 클릭으로도 닫히게 해도 된다.
4. 마운트 시 포커스를 모달 내부(첫 포커서블 또는 확인 버튼)로 옮기고, 언마운트 시 직전 포커스 요소로 되돌린다.
5. 포커스 트랩: Tab / Shift+Tab이 모달 내부 포커서블을 벗어나지 않도록 순환시킨다. **의존성 없이** first/last 포커서블을 찾아 keydown으로 처리한다(ADR-002).
6. 진입 애니메이션은 넣지 않는다. 굳이 넣는다면 `useReducedMotion()`으로 가드한다.
7. `requestAnimationFrame` / `setInterval` / `setTimeout` 기반 로직을 넣지 마라.

### `src/components/ui/IntroDialog.test.tsx` 신규

- `FormatBadge`의 `formatLabel`, `situation` 문단, 모든 `task` 항목이 렌더된다.
- `role="dialog"` 이고 `aria-modal="true"`, `aria-labelledby`가 실제 제목 요소를 가리킨다.
- `mode="gate"`: 확인 버튼(`confirmLabel`) 클릭 → `onConfirm` 1회 호출. `fireEvent.keyDown(document, { key: "Escape" })` → `onConfirm`/`onDismiss` 모두 호출 안 됨. X/닫기 버튼이 없다.
- `mode="help"`: 닫기 버튼 클릭 → `onDismiss` 1회. Escape → `onDismiss` 1회.
- 마운트 시 모달 내부 요소로 포커스가 이동한다(`document.activeElement`가 패널 안).
- `situation`에 `**강조**`와 `\n\n`가 있는 픽스처 → 복수 `<p>` + `<strong>` (Prose 배선 확인).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트:
   - `IntroDialog`가 `src/components/ui/`에 있고 `Prose` + `FormatBadge`를 조합하는가?
   - `mode="gate"`에서 Esc가 무력화돼 있는가?
   - 새 npm 패키지 없음 (`git diff package.json` 비어 있음).
   - RAF/타이머 없음.
3. 결과에 따라 `phases/10-intro-modals-and-readability/index.json`의 `step: 2`를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

`summary`에 props 형태(`mode` "gate"/"help", `confirmLabel`, `onConfirm`/`onDismiss`)와 z-index(`z-30`), Esc 동작 차이를 적어라 — step3~5가 참조한다.

## 금지사항

- `mode="gate"`에서 Esc·바깥 클릭으로 닫히게 하지 마라. 이유: 시작 전 안내는 필수이며, 건너뛰면 사용자가 다시 "무슨 상황인지 모르는" 상태로 돌아간다.
- 포커스 트랩을 위해 `focus-trap`, `react-focus-lock` 같은 패키지를 설치하지 마라. 이유: ADR-002(무의존성). keydown 핸들러로 충분하다.
- 이 step에서 체험 컴포넌트(`VoicePhishingExperience` 등)를 수정하지 마라. 이유: 배선은 step3~5에서 각각 다룬다.
- 기존 테스트를 깨뜨리지 마라.
