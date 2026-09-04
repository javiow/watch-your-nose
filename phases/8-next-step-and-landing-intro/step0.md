# Step 0: next-step-button

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ADR.md`의 ADR-016 (이번 phase 전체의 배경 결정)
- `/src/components/ui/StartButton.tsx` — 스타일 톤을 맞출 기존 공용 버튼 예시
- `/src/components/experiences/CaseInvestigationExperience.tsx`의 `primaryButtonClass` 상수 (39~40번째 줄 부근) — 같은 accent 버튼 톤

## 배경

이번 phase는 4개 체험 유형(보이스피싱/케이스 조사/전세매물/사기 판별 카드) 모두에서, 한 유형의 콘텐츠를 끝까지 마쳐도 더 이상 자동으로 다음 유형으로 넘어가지 않고 사용자가 "다음으로 넘어가기" 버튼을 직접 눌러야 넘어가도록 바꾼다(ADR-016). 이 step은 그 버튼의 공용 컴포넌트만 만든다. 실제로 4개 체험 컴포넌트에 적용하는 것은 이후 step(2~5)에서 각각 처리한다 — 이 step에서는 체험 컴포넌트를 건드리지 않는다.

## 작업

`src/components/ui/NextStepButton.tsx`를 신규 생성한다.

```ts
interface NextStepButtonProps {
  onClick: () => void;
  label?: string; // 기본값 "다음으로 넘어가기"
  disabled?: boolean;
}

export function NextStepButton({ onClick, label, disabled }: NextStepButtonProps): JSX.Element
```

- 기본 라벨은 `"다음으로 넘어가기"`.
- `<button type="button">`으로 렌더하고, `StartButton.tsx`/`primaryButtonClass`와 같은 톤(accent 배경, `hover:bg-accent-hover`, `disabled:` 스타일)의 Tailwind 클래스를 적용한다 — 새 색상/토큰을 만들지 말고 `globals.css`에 이미 정의된 `--accent`/`--accent-hover` 기반 클래스(`bg-accent`, `hover:bg-accent-hover` 등)만 재사용한다.
- `disabled`가 `true`면 버튼에 `disabled` 속성을 주고 클릭이 발생하지 않게 한다.

TDD로 먼저 `src/components/ui/NextStepButton.test.tsx`를 작성해 레드 상태를 확인한 뒤 구현한다. 최소한 아래를 검증한다:

- 기본 라벨 `"다음으로 넘어가기"`가 렌더된다.
- `label` prop을 주면 그 텍스트로 렌더된다.
- 클릭 시 `onClick`이 정확히 1회 호출된다.
- `disabled`일 때 클릭해도 `onClick`이 호출되지 않는다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `src/components/experiences/` 아래 어떤 파일도 수정되지 않았는가? (`git status`로 확인)
   - 새 색상 값을 하드코딩하지 않고 기존 Tailwind 토큰 클래스만 썼는가?
3. 결과에 따라 `phases/8-next-step-and-landing-intro/index.json`의 `step: 0`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `src/components/experiences/` 아래 파일을 수정하지 마라. 이유: 각 체험 컴포넌트 적용은 step2~5에서 개별적으로 다룬다.
- 기존 테스트를 깨뜨리지 마라.
