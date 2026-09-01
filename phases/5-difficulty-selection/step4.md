# Step 4: difficulty-select-form

## 읽어야 할 파일

먼저 아래 파일들을 읽고 패턴을 파악하라:

- `/docs/ARCHITECTURE.md` ("패턴" — 인터랙션 화면은 Client Component; `ui/` 는 2곳 이상 중복 시에만 추출)
- `/docs/PRD.md` (핵심 기능 "난이도 선택" 항목, "디자인" 절)
- `/src/components/ui/PlayerSetupForm.tsx` — **이 컴포넌트를 템플릿으로 삼는다.** 로컬 `ChoiceGroup`, 선택 상태 클래스(`border-accent bg-accent-soft text-foreground` vs `border-border bg-surface text-muted`), 하단 우측 "시작하기" 버튼(비활성 클래스 포함), `onComplete` 호출 패턴.
- `/src/components/ui/PlayerSetupForm.test.tsx` — **이 테스트를 템플릿으로 삼는다.** RTL `render`/`screen`/`fireEvent`, `getByRole("button", { name })`, `vi.fn()` 콜백, "비활성" / "정확히 한 번 호출" 검증.
- `/src/data/difficulty.ts` — step1에서 만든 `DIFFICULTY_OPTIONS` (`{ id, label, description }[]`).
- `/src/types/experience.ts` — `Difficulty`.
- `/src/app/globals.css` — 사용 가능한 토큰(`bg-surface`, `border-border`, `text-muted`, `text-subtle`, `bg-accent`, `bg-accent-soft`, `text-foreground`, `hover:bg-accent-hover` 등).

## 배경 (step1~3 완료 상태)

- step1: `DIFFICULTY_OPTIONS` 생성(easy/medium/hard, 각 `label`·`description`).
- step2: `SessionProvider.difficulty` / `setDifficulty`.
- step3: `registry` 가 `difficulty` 로 콘텐츠를 좁힘.

이 step은 **폼 컴포넌트 레이어**만 다룬다. 난이도 3개를 카드로 보여주고 하나를 고르면 `onComplete(difficulty)` 를 부르는 컨트롤드 컴포넌트를 만든다. 페이지 배선(`/difficulty/page.tsx`)은 step5다.

`PlayerSetupForm` 은 옵션이 3개 필드라 컴팩트한 pill grid(`ChoiceGroup`)를 쓰지만, 난이도는 **한 줄 설명이 함께** 표시돼야 하므로 세로로 쌓인 큰 카드 버튼이 맞다. `ChoiceGroup` 을 공용 컴포넌트로 추출하지 않는다(형태가 달라지고, 아직 2곳 중복이 아님 — ARCHITECTURE 원칙).

## 작업

### 1. `src/components/ui/DifficultySelectForm.test.tsx` — 테스트 먼저

`PlayerSetupForm.test.tsx` 구조를 따른다. 최소 다음을 검증한다:

- 난이도를 고르기 전에는 "시작하기" 버튼이 `disabled` 다.
- `DIFFICULTY_OPTIONS` 의 세 `label` 과 세 `description` 이 모두 화면에 렌더된다.
- 한 카드를 클릭한 뒤 "시작하기" 를 누르면 `onComplete` 가 그 `id` 로 **정확히 한 번** 호출된다(예: "중간" 카드 → `toHaveBeenCalledWith("medium")`, `toHaveBeenCalledTimes(1)`).
- 다른 카드를 다시 고르면 마지막 선택만 반영된다(A 클릭 → B 클릭 → 시작하기 → `onComplete` 는 B의 id).

> 카드 버튼을 `getByRole("button", { name: /중간/ })` 로 잡으려면 버튼 접근성 이름에 라벨이 포함돼야 한다. 라벨과 설명을 한 버튼 안에 렌더하면 자연히 포함된다.

### 2. `src/components/ui/DifficultySelectForm.tsx` 구현

- `"use client"`.
- Props: `{ onComplete: (difficulty: Difficulty) => void }`.
- 로컬 상태: `const [selected, setSelected] = useState<Difficulty | null>(null);`
- 레이아웃(‑`PlayerSetupForm` 과 같은 외곽 `div className="w-full space-y-8"`):
  - 상단에 `<p className="text-sm font-medium text-muted">난이도</p>` (섹션 라벨 — `ChoiceGroup` 의 라벨과 동일 스타일).
  - `DIFFICULTY_OPTIONS.map((opt) => ...)` 로 세로 스택(`space-y-3`)의 전체폭 `<button type="button">`:
    - 클래스: `min-h-11 w-full rounded-xl border px-4 py-3 text-left transition-colors` +
      선택 시 `border-accent bg-accent-soft text-foreground` / 비선택 `border-border bg-surface text-muted`.
    - 내부: `<span className="block text-sm font-medium">{opt.label}</span>` + `<span className="block text-sm text-subtle">{opt.description}</span>`.
    - `onClick={() => setSelected(opt.id)}`, `key={opt.id}`.
  - 하단 우측 확인 버튼(`PlayerSetupForm` 의 "시작하기" 버튼 클래스 문자열 그대로 재사용):
    - `<div className="flex justify-end">` 안에 `<button type="button" disabled={selected === null} onClick={() => selected && onComplete(selected)}>시작하기</button>`.
    - 클래스: `min-h-11 rounded-xl bg-accent px-8 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-subtle`.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test        # DifficultySelectForm.test.tsx 통과 + 그 외 전부 통과
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트:
   - `DifficultySelectForm.test.tsx` 를 구현보다 먼저 만들었는가(TDD)?
   - 라벨·설명을 `DIFFICULTY_OPTIONS` 에서 읽는가(하드코딩 아님)?
   - 컴포넌트가 라우터/세션 Context에 의존하지 않는 순수 컨트롤드 컴포넌트인가? (배선은 step5)
   - `dangerouslySetInnerHTML` 미사용, 색상은 globals.css 토큰만 사용했는가?
3. 결과에 따라 `phases/5-difficulty-selection/index.json`의 `step: 4` 항목을 업데이트한다.

## 금지사항

- `src/app/**` 를 수정하거나 `next/navigation` 을 import 하지 마라. 이유: 이 컴포넌트는 `onComplete` 콜백만 노출하고, 라우팅·`setDifficulty` 연결은 step5의 `/difficulty/page.tsx` 가 한다(`PlayerSetupForm` ↔ `setup/page.tsx` 관계와 동일).
- `ChoiceGroup` 을 `PlayerSetupForm` 에서 빼내 공용 컴포넌트로 만들지 마라. 이유: 설명 줄 때문에 형태가 달라지고, ARCHITECTURE 원칙상 2곳 이상 중복 전에는 추출하지 않는다.
- 난이도 라벨/설명 문구를 컴포넌트 안에 다시 적지 마라(`DIFFICULTY_OPTIONS` 단일 출처).
- 화면에 체험 유형명이나 "다음은 X" 같은 안내를 넣지 마라(ADR-004).
- 기존 테스트를 깨뜨리지 마라.
