# Step 7: case-investigation-guidance-ui

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ADR.md`의 ADR-004 (체험 중 정답 암시 금지), ADR-010
- `/src/components/experiences/CaseInvestigationExperience.tsx` (전체) — 특히 `phase === "investigating"` 블록:
  - 상태 행: `남은 포인트 {points}P` + `등록된 증거 {registeredEvidence.size}건` (분모 없음)
  - `visibleInvestigations` (= `content.investigations` 중 `hiddenUntilUnlocked`가 아니거나 언락된 것)
  - 조사 버튼: `{inv.name}` + `{inv.cost}P`, `handleStartInvestigation`이 `points -= inv.cost`, `completedInvestigationIds`에 추가, `openDocumentId` 설정
  - 열린 문서: `blocks` 순회. `evidencePattern === null`이면 `<p>`, 아니면 등록 버튼. 등록 후 `확인: {definition.description}` 노출
  - `content.evidenceDefinitions[].importance` (`1 | 2`) — 현재 체험 중 노출 안 함
- `/src/components/experiences/CaseInvestigationExperience.test.tsx` (전체) — 특히 `screen.getByText(/등록된 증거.*1/)` / `queryByText(/등록된 증거.*2/)` 어서션(라인 161~165 부근)
- `/src/types/experience.ts` — `CaseInvestigation.purpose` (step6), `CaseEvidenceDefinition.importance`
- `/src/data/experience-intro.ts` — `EXPERIENCE_INTRO["case-investigation"]` (포인트 경제 설명이 이미 여기 들어 있음)
- step6의 `summary`

## 배경

step6에서 데이터에 넣은 `purpose`를 화면에 노출하고, "포인트를 어떻게 쓰는가 / 덜 쓰면·다 쓰면 어떻게 되는가"를 investigating 화면에서 알 수 있게 한다. 사용자 피드백의 핵심 3가지를 이 step에서 해소한다:

1. 각 조사가 무엇을 확인하는 건지 → `purpose` 노출
2. 포인트의 의미와 트레이드오프 → 안내 박스
3. 얼마나 조사했는지 감 → 조사 진행 분모

**증거(evidence) 쪽에는 분모나 중요도를 노출하지 않는다** — 위험 신호가 총 몇 개인지 알려주면 정답("위험하다")을 유도하게 되어 ADR-004 위반이다.

## 작업

### 1. `purpose` 노출

- 조사 버튼(`{inv.name} {inv.cost}P`) 안/아래에 둘째 줄로 `inv.purpose`를 `text-xs text-subtle`로 렌더.
- 문서를 열었을 때(`openDocument`) 헤더의 `{openDocument.title}` 아래에, 그 문서에 해당하는 조사의 `purpose`를 `text-xs text-subtle`로 렌더한다:
  ```ts
  const openInv = content.investigations.find((i) => i.documentId === openDocumentId);
  // openInv?.purpose 렌더
  ```

### 2. 포인트 경제 안내 박스

- `phase === "investigating"` 이고 문서를 열지 않은 상태(`!openDocument`)에서, 조사 목록 **위에** 안내 콜아웃을 렌더:
  - 컨테이너: `rounded-xl border border-border bg-surface-muted p-3 text-xs text-muted`
  - 문구(고정): `"예산 안에서 꼭 필요한 조사를 고르세요. 조사를 많이 할수록 단서는 늘지만 남는 예산이 줄고, 너무 아끼면 핵심 단서를 놓칠 수 있어요."`
- 같은 취지의 문장이 `EXPERIENCE_INTRO["case-investigation"].situation`에도 있으므로(시작 모달), 여기서는 investigating 화면용 한 문장이면 충분하다.

### 3. 조사 진행 분모

- 상태 행에 항목 추가: `조사 {completedInvestigationIds.size}/{visibleInvestigations.length}`.
  - 분모는 `content.investigations.length`가 아니라 **`visibleInvestigations.length`** 를 쓴다. 이유: `hiddenUntilUnlocked` 조사가 언락 전에 개수로 새어나가면 안 된다.
- `등록된 증거 {registeredEvidence.size}건` 문자열은 **그대로 둔다**(분모 붙이지 않음). 이유는 아래 "금지사항" 참조.

### 4. 중요도(importance)는 체험 중 계속 숨긴다 + lock-in 테스트

- `evidenceDefinitions[].importance`를 등록 후 화면에 노출하지 마라. 등록 후 표시는 지금처럼 중립적인 `확인: {definition.description}` 한 줄만.

### 5. 테스트 (`CaseInvestigationExperience.test.tsx`)

- 픽스처의 investigation에 step6에서 `purpose`가 이미 들어갔다고 가정(없으면 추가).
- 신규: investigating 진입 후 각 조사 버튼에 해당 `purpose` 텍스트가 보인다.
- 신규: 조사를 눌러 문서를 열면 헤더에 그 조사의 `purpose`가 보인다.
- 신규: 조사 목록 위에 예산 안내 문구("예산 안에서 꼭 필요한 조사를 고르세요"의 일부)가 보인다.
- 신규: 상태 행에 `조사 0/N` 형태가 보이고(픽스처의 visible 조사 개수 N), 조사 1건 완료 후 `조사 1/N`으로 바뀐다. `hiddenUntilUnlocked` 픽스처가 있으면 그건 N에서 제외됨을 확인.
- 신규(ADR-004 lock-in): 중요도 2짜리 증거를 등록해도 화면에 "핵심 단서" / "참고 단서" 문구나 "핵심"·"참고" 배지가 나타나지 않는다. 중립적 `확인:` 라인만 보인다.
- 기존 `getByText(/등록된 증거.*1/)` / `queryByText(/등록된 증거.*2/)` 어서션이 **그대로 통과해야 한다** — "등록된 증거" 라인 문자열을 바꾸지 않았으므로.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `npm run dev`로 케이스 조사 investigating 화면 확인: 조사 버튼마다 왜 하는지 한 줄, 목록 위 예산 안내, `조사 n/N` 진행도. 문서를 열면 헤더에 목적. 증거를 등록해도 중요도/총개수가 안 보이는지 확인.
3. 체크리스트:
   - `등록된 증거` 라인에 분모를 붙이지 않았는가?
   - `importance`를 어떤 형태로도 체험 중 노출하지 않았는가?
   - 조사 분모가 `visibleInvestigations.length` 기준인가?
   - 채점 로직(`computeCaseInvestigationScore`)이나 `scoring.ts`를 건드리지 않았는가?
4. 결과에 따라 `phases/10-intro-modals-and-readability/index.json`의 `step: 7`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `등록된 증거 {size}건`에 `/ {evidenceDefinitions.length}` 같은 분모를 붙이지 마라. 이유: 위험 신호(증거) 총 개수는 `hiddenTruth.riskPatterns` 개수와 강하게 연동돼, 노출하면 "이 건은 위험" 이라는 정답을 사실상 알려준다(ADR-004). 구조적 정보인 "조사 개수"와 다르다.
- `evidenceDefinitions[].importance`(1/2)를 "핵심/참고" 등으로 체험 중 노출하지 마라. 이유: 어떤 증거가 결정적인지 알려주는 건 정답 힌트다. 이 값은 결과 페이지/채점 전용이다.
- `handleStartInvestigation` / `handleRegisterEvidence` / 언락 로직(`isUnlocked`)을 바꾸지 마라. 이유: 채점 컴포넌트(`efficiency` = 등록/열람 비율 등)가 이 흐름에 의존한다.
- `scoring.ts`를 수정하지 마라.
- 갱신이 명시된 테스트 파일 외의 테스트를 깨뜨리지 마라.
