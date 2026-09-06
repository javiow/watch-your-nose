# Step 8: jeonse-instructions-click-first

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ADR.md`의 ADR-004 (체험 중 유형명 비노출), ADR-007
- `/src/components/experiences/jeonse/MapBoard.tsx` (전체) — 특히:
  - 헤더(대략 199~213행): `<FormatBadge>` + `<h1>골목을 돌며 매물을 점검하세요</h1>` + `<p className="... max-w-prose pl-4 text-xs ...">` (이동=방향키 먼저 설명) + `점검 {answeredCount} / {houses.length}`
  - 각 매물이 이미 `<button aria-label="{house.short} 입장" onClick={() => enter(i)}>` 이다 — 클릭 입장은 이미 동작한다
  - 보드 아래 안내 행(대략 281~285행): `↑ ↓ ← → / WASD — 이동` · `붉은 문에 서면 자동 입장` · `집을 클릭해도 입장`
- `/src/components/experiences/jeonse/MapBoard.test.tsx` (전체) — 특히 "유형명을 드러내는 문구를 쓰지 않는다" 류 테스트(대략 102행), 완료된 매물 재클릭 테스트
- `/src/components/ui/Prose.tsx` (step0)

## 배경

사용자 피드백: "전세 부분은 꼭 방향키로 움직이지 말고 그냥 매물을 클릭하기만 해도 서류를 볼 수 있다. 이 부분 설명이 필요할 것 같다."

기능은 이미 있다(매물이 `<button>`이라 클릭하면 `enter(i)`). 안내가 방향키 위주라 그 사실이 안 보일 뿐이다. 안내 문구를 **클릭 우선**으로 재작성하고 위치를 정리한다. 전체 how-to는 이제 시작 모달(`IntroDialog`)이 담으므로, 보드 카피는 핵심만 짧게.

## 작업

### `src/components/experiences/jeonse/MapBoard.tsx`

1. 헤더의 상세 안내 `<p className="... max-w-prose pl-4 text-xs ...">`를 `<Prose>` 기반 짧은 2문단으로 교체:
   - 1문단: `"매물을 클릭하면 바로 서류가 열립니다. 원하면 방향키(WASD)로 골목을 걸어 붉은 문 앞에 서도 됩니다."`
   - 2문단: `"서류를 읽고 위험 신호가 있으면 O, 없으면 X로 판정하세요. 서류의 위험도 표시는 가려져 있고, 힌트는 매물 전체에서 딱 1번 쓸 수 있습니다."`
   - `pl-4`(왼쪽 들여쓰기)를 **제거**한다 — 이 phase는 들여쓰기 대신 문단 여백을 쓴다.
   - 필요한 강조는 `**...**` 마커로(`Prose`가 처리). 기존처럼 `<strong>`을 직접 박아도 되지만 `Prose`로 통일 권장.
2. 보드 **아래**에 있던 안내 행을 헤더 바로 아래(보드 **앞**)로 옮기고, 순서를 클릭 우선으로:
   - `집을 클릭하면 입장` · `붉은 문에 서면 자동 입장` · `방향키 / WASD — 이동`
   - 기존 `flex flex-wrap gap-4 text-xs text-subtle` 스타일 유지.
3. `<h1>` 문구, `점검 {answeredCount} / {houses.length}` 표시, 보드/스프라이트/D-pad/이동 로직은 **변경하지 않는다**.

### 테스트 (`MapBoard.test.tsx`)

- 신규: 안내 텍스트에서 "클릭"이 "방향키"보다 먼저 나온다 — 예:
  ```ts
  const text = container.textContent ?? "";
  expect(text.indexOf("클릭")).toBeGreaterThanOrEqual(0);
  expect(text.indexOf("클릭")).toBeLessThan(text.indexOf("방향키"));
  ```
- 기존 "유형명 비노출" 테스트가 새 문구로도 통과하는지 확인(전세사기/jeonse/JEONSE 등 금칙어가 새 카피에 없어야 함).
- 기존 "완료된 매물을 다시 클릭하면 …", O/X 판정 관련 테스트는 이 step에서 의미가 바뀌지 않아야 한다(자동 닫기는 step9).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `npm run dev`로 전세 체험(시작 모달 확인 후) → 보드 상단 안내가 "클릭하면 열린다"를 먼저 말하는지, 매물을 클릭만 해서 서류가 열리는지 확인.
3. 체크리스트:
   - `pl-4` 들여쓰기를 제거했는가?
   - `<h1>` 문구와 이동/보드 로직을 건드리지 않았는가?
   - 새 안내 문구에 사기 유형명이 없는가?
4. 결과에 따라 `phases/10-intro-modals-and-readability/index.json`의 `step: 8`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 이동/충돌/문 감지(`step()`, `checkDoor()`, `blocked()`, `keysRef`) 로직을 건드리지 마라. 이유: 이 step은 안내 문구·배치만 바꾼다.
- `HouseDialogPanel.tsx`를 수정하지 마라. 이유: 패널 자동 닫기는 step9다.
- `<h1>골목을 돌며 매물을 점검하세요</h1>` 문구를 바꾸지 마라. 이유: 테스트가 이 텍스트로 헤더를 찾을 수 있고, 문구 변경은 요청 범위 밖이다.
- 안내에 사기 유형명을 넣지 마라(ADR-004).
- 기존 테스트를 (갱신이 명시된 `MapBoard.test.tsx` 외에는) 깨뜨리지 마라.
