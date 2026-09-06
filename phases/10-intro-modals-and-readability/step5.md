# Step 5: wire-intro-jeonse-gate

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ADR.md`의 ADR-004, ADR-007 (전세매물 = 골목 이동 O/X 판정 게임), ADR-016
- `/src/components/ui/IntroDialog.tsx` (step2) + 그 `summary`
- `/src/data/experience-intro.ts` (step1)
- `/src/components/experiences/JeonseExperience.tsx` (전체) — 현재 시작 게이트가 **없다**. `answers` state를 들고 `<MapBoard>`를 곧바로 렌더한다.
- `/src/components/experiences/jeonse/MapBoard.tsx` (전체) — 마운트 시 `useEffect`에서 `requestAnimationFrame` 이동 루프 + `window` `keydown`/`keyup` 리스너 등록, 별도 `useEffect`에서 `ResizeObserver` 부착. 상단에 `FormatBadge` + 하드코딩 안내가 있음(문구 개선은 step8).
- `/src/components/experiences/JeonseExperience.test.tsx` (전체)
- `/src/components/experiences/jeonse/MapBoard.test.tsx` (전체)

## 배경

전세 체험에도 시작 전 `IntroDialog`(`mode="gate"`)를 붙인다. 다른 세 체험과 달리 이 체험은 **시작 게이트가 없고**, `MapBoard`가 마운트되는 순간 RAF 이동 루프와 전역 키보드 리스너가 붙는다. 모달이 떠 있는 동안 이것들이 돌면 뒤에서 플레이어가 움직이거나 방향키가 먹힌다.

해결: `JeonseExperience`에 **컴포넌트 레벨 게이트**를 둔다. `started === false`이면 `IntroDialog`만 렌더하고 `<MapBoard>`는 **아예 마운트하지 않는다**. 확인을 누르면 `started = true`가 되고 그때 `<MapBoard>`가 마운트되며 이펙트가 붙는다. 이렇게 하면 `MapBoard` 내부 이펙트(및 그 `eslint-disable exhaustive-deps` 주석)를 건드릴 필요가 없다.

## 작업

### 1. `JeonseExperience.tsx`

- `const [started, setStarted] = useState(false)` 추가.
- 렌더 최상단에서:
  ```tsx
  if (!started) {
    return (
      <IntroDialog
        mode="gate"
        format={EXPERIENCE_FORMAT["jeonse"]}
        intro={EXPERIENCE_INTRO["jeonse"]}
        confirmLabel="점검 시작"
        onConfirm={() => setStarted(true)}
      />
    );
  }
  ```
  → `!started`일 때 `<MapBoard>`가 JSX 트리에 없어야 한다(조건부 렌더, `display:none` 아님).
- `started` 이후 렌더: 기존 `<MapBoard ... />` + `pendingResult && <NextStepButton .../>` 구조 유지. 여기에 "안내 다시 보기" 버튼 + `showHelp` state + `mode="help"` `IntroDialog`를 추가한다(버튼은 보드 위쪽에).
- `answers` / `hintUsedIndex` / `pendingResult` / `handleAnswer` / `handleNextStep` 로직은 **변경 없음**.

### 2. `JeonseExperience.test.tsx` 갱신

- 헬퍼 추가:
  ```ts
  function startJeonse() {
    fireEvent.click(screen.getByRole("button", { name: "점검 시작" }));
  }
  ```
  기존 모든 `render(<JeonseExperience .../>)` 직후에 `startJeonse()`를 호출하도록 케이스를 갱신한다(그래야 `MapBoard`가 나타난다).
- 신규: 마운트 직후 `role="dialog"`가 보이고 `<MapBoard>`의 요소(예: 안내 문구/보드)는 아직 없다. `startJeonse()` 후 보드가 나타난다.
- 신규: 보드 화면에서 "안내 다시 보기" → `role="dialog"` 재등장 → 닫기 → 사라짐, `answers` 상태 유지.
- 기존 힌트/판정/onComplete 관련 케이스는 `startJeonse()` 삽입 외에는 의미가 바뀌지 않아야 한다.

### 3. `MapBoard.test.tsx`

- 이 파일은 `<MapBoard>`를 직접 렌더하므로 게이트의 영향을 받지 않는다. **이 step에서는 수정하지 마라**(문구 관련 변경은 step8).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다. **`JeonseExperience.test.tsx` 전체 + 프로젝트 전체가 통과해야 한다.**
2. `npm run dev`로 전세 체험 진입 → 모달이 먼저 뜨고, 그 상태에서 방향키를 눌러도 아무 반응이 없어야 한다(뒤에서 플레이어가 움직이지 않음). 확인 후 보드가 나타나고 이동/클릭이 정상 동작. "안내 다시 보기"가 동작하는지 확인.
3. 체크리스트:
   - `!started`일 때 `<MapBoard>`가 JSX 트리에 아예 없는가? (`display:none`이나 `visibility:hidden`으로 숨긴 게 아님)
   - `MapBoard.tsx`를 수정하지 않았는가?
   - `handleAnswer` / `pendingResult` / `onComplete` 로직이 그대로인가?
4. 결과에 따라 `phases/10-intro-modals-and-readability/index.json`의 `step: 5`를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `MapBoard`를 `!started`일 때 CSS로만 숨기지 마라(`hidden`, `display:none`, `opacity-0`). 이유: 그러면 마운트 이펙트(RAF 루프 + 전역 키 리스너 + ResizeObserver)가 이미 붙어 모달 뒤에서 동작한다. 반드시 조건부로 **마운트하지 않아야** 한다.
- `MapBoard.tsx`의 `useEffect`나 `eslint-disable` 주석을 건드리지 마라. 이유: 게이트 방식이면 손댈 필요가 없고, 이동 루프는 검증이 까다롭다.
- `confirmLabel`을 "점검 시작" 외의 것으로 바꾸지 마라. 이유: 테스트 헬퍼가 이 라벨로 버튼을 찾는다.
- `JeonseExperience.test.tsx` 외의 테스트를 깨뜨리지 마라.
