# Step 9: jeonse-panel-auto-close

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ADR.md`의 ADR-007, ADR-016 ("다음으로 넘어가기" 버튼)
- `/src/components/experiences/jeonse/HouseDialogPanel.tsx` (전체) — 특히:
  - `confirmed` 초기값 = `answered` (이미 판정한 집은 확인 단계 건너뜀)
  - 판정 영역: `answered`면 "당신의 판정" 표시, 아니면 "이 집, 위험 신호가 있습니까?" + O/X 버튼. O 버튼 `onClick={() => onAnswer(true)}`, X 버튼 `onClick={() => onAnswer(false)}`
  - 상단 "닫기" 버튼 `onClick={onClose}`, 확인 단계의 "나중에" 버튼도 `onClose`
- `/src/components/experiences/jeonse/MapBoard.tsx` — `closeDialog()` (activeIndex를 null로 만들기 전에 플레이어를 문에서 ~40px 밖으로 이동시켜 `checkDoor()`가 즉시 재발동하지 않게 함). `HouseDialogPanel`의 `onClose`에 연결됨. `enter(i)`는 `activeIndexRef.current !== null`이면 무시.
- `/src/components/experiences/JeonseExperience.tsx` — `handleAnswer(index, risky)`: `answers[index] !== undefined`면 무시(재판정 불가). 5채 모두 판정되면 `pendingResult` 세팅 → `<NextStepButton message="모든 매물 판정을 완료했습니다.">` 노출.
- `/src/components/experiences/jeonse/HouseDialogPanel.test.tsx` (전체)
- `/src/components/experiences/jeonse/MapBoard.test.tsx` (전체)
- `/src/components/experiences/JeonseExperience.test.tsx` (전체) — `judgeHouse` 류 헬퍼가 판정 후 "닫기"를 클릭하는지 확인

## 배경

사용자 피드백: "위험 신호를 선택하면 창을 자동으로 내려줘. 굳이 닫기 버튼으로 안 나가도 될 것 같아."

현재는 O/X를 눌러도 패널이 `answered=true` 상태로 다시 그려지고, 사용자가 "닫기"를 눌러야 보드로 돌아간다. O/X 선택 시 **자동으로 패널을 닫는다**. 확인 단계·힌트 단계에서는 자동으로 닫지 않는다(O/X 답변에서만).

## 작업

### 1. `src/components/experiences/jeonse/HouseDialogPanel.tsx`

- O/X 버튼의 `onClick`을 각각 `onAnswer` 호출 **직후 `onClose` 호출**로 바꾼다:
  ```tsx
  onClick={() => { onAnswer(true); onClose(); }}   // O — 위험 있음
  onClick={() => { onAnswer(false); onClose(); }}  // X — 위험 없음
  ```
- "닫기" 버튼과 확인 단계의 "나중에" 버튼(`onClose`)은 그대로 둔다 — 판정 전에 나가는 경로로 계속 필요하다.
- `answered === true`로 다시 열렸을 때의 "당신의 판정" 표시 화면은 그대로 둔다(보드에서 그 집을 다시 클릭해 재열람하는 경로).

### 2. `MapBoard.closeDialog` — 건드리지 않는다

`closeDialog`의 플레이어 텔레포트(문 밖 ~40px)가 유지돼야 O/X 직후 자동 닫힘에서 방금 판정한 문이 `checkDoor()`로 즉시 다시 열리지 않는다. **이 함수를 수정하지 마라.**

### 3. 테스트

**`HouseDialogPanel.test.tsx`:**
- 기존 "O를 선택하면 onAnswer(true)" / "X를 선택하면 onAnswer(false)" 케이스에 `expect(onClose).toHaveBeenCalledTimes(1)` 추가.
- 신규: O 또는 X 클릭 시 `onAnswer`가 먼저, `onClose`가 그 다음 호출된다(호출 순서까지 검증하고 싶으면 `mock.invocationCallOrder` 사용).
- `answered=true`로 렌더된 재열람 화면 테스트는 그대로 통과해야 한다.

**`MapBoard.test.tsx`:**
- 기존 "점검 패널에서 O/X를 선택하면 onAnswer(index, risky)가 호출된다"에서, 클릭 후 패널이 사라졌는지 추가 검증: `queryByText("당신의 판정")`이 null, O/X 버튼도 사라짐.
- 신규: O/X 판정 직후 패널이 자동으로 닫히고 보드가 다시 보인다.

**`JeonseExperience.test.tsx`:**
- `judgeHouse`(또는 유사) 헬퍼에서 판정 후 `fireEvent.click(screen.getByText("닫기"))` 하는 부분을 **제거**한다(이제 자동으로 닫힘). step5에서 넣은 `startJeonse()` 호출은 유지.
- "매물 하나를 판정한 직후 정답/오답/해설 텍스트가 없다" 케이스는 그대로 유지(선택적으로 "패널이 닫혔다"도 확인).
- 5채 전부 판정 → `<NextStepButton>` 노출 → 클릭 시 `onComplete` 1회 호출, 연속 클릭해도 1회. 이 케이스들이 자동 닫힘 이후에도 통과해야 한다. 마지막(5번째) 판정에서도 `handleAnswer`가 먼저 실행돼 `pendingResult`가 세팅된 뒤 패널이 닫히므로, 닫힌 보드 위에 `NextStepButton`이 보여야 한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다. **`HouseDialogPanel.test.tsx`, `MapBoard.test.tsx`, `JeonseExperience.test.tsx` 전체 + 프로젝트 전체가 통과해야 한다.**
2. `npm run dev`로 전세 체험 전체를 완주한다:
   - 매물 클릭 → 서류 → O 또는 X → **자동으로 보드로 복귀**.
   - 방금 판정한 집이 즉시 다시 열리지 않는다(플레이어가 문 밖에 있음).
   - 5채 다 판정하면 "다음으로 넘어가기" 버튼이 뜬다.
   - 판정한 집을 다시 클릭하면 "당신의 판정"이 보이고 재판정은 안 된다.
3. 체크리스트:
   - `closeDialog`(MapBoard)를 수정하지 않았는가?
   - 확인 단계/힌트 단계에서는 자동으로 닫히지 않는가? (O/X에서만)
   - `handleAnswer`의 재판정 방지 가드(`answers[index] !== undefined`)가 그대로인가?
4. 결과에 따라 `phases/10-intro-modals-and-readability/index.json`의 `step: 9`를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `MapBoard`의 `closeDialog` 안 플레이어 텔레포트를 제거·축소하지 마라. 이유: 자동 닫힘 직후 `checkDoor()`가 방금 판정한 문을 다시 열어 무한 재진입이 된다.
- 확인 단계("확인"/"나중에")나 힌트 사용에서 `onClose`를 자동 호출하지 마라. 이유: 사용자가 서류를 더 보려는 흐름을 끊는다. 자동 닫힘은 **O/X 판정**에서만.
- `handleAnswer` / `pendingResult` / `NextStepButton` 연결을 바꾸지 마라. 이유: ADR-016의 "버튼을 눌러야 다음으로" 계약과 `onComplete` 1회 호출 보장에 영향을 준다.
- "닫기" 버튼을 없애지 마라. 이유: 판정 전에 나가는 경로로 여전히 필요하다.
- 갱신이 명시된 3개 테스트 파일 외의 테스트를 깨뜨리지 마라.
