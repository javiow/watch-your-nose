# Step 10: voice-phishing-start-gate

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/src/data/experience-format.ts` (step7) — `EXPERIENCE_FORMAT["voice-phishing"]`
- `/src/components/ui/FormatBadge.tsx` (step8)
- `/src/components/experiences/VoicePhishingExperience.tsx` (전체) — 특히 마운트 시 `useEffect(() => { revealNode(content.startNodeId); ... }, [])` 부분과 `computeTypingDelay`, `timers` ref
- `/src/components/experiences/VoicePhishingExperience.test.tsx` (전체) — 모든 테스트가 `render()` 직후 곧바로 콘텐츠(타이핑 인디케이터/말풍선)를 기대한다는 점에 주목
- `/src/components/experiences/CaseInvestigationExperience.tsx`의 `phase === "briefing"` 분기 — "시작 버튼 뒤에 콘텐츠"라는 기존 패턴 참고

## 배경

지금 `VoicePhishingExperience`는 마운트되자마자 타이핑 인디케이터와 전화 대화가 시작된다 — 사용자가 "이게 뭐지"를 파악할 틈이 없다(다른 두 체험에는 브리핑이 있는데 여기만 없다). 이 step은 아주 짧은 시작 화면(형식 배지 + 한 줄 안내 + "통화 시작" 버튼)을 앞에 두고, 버튼을 눌러야 대화가 시작되게 한다.

**"글이 너무 많다"는 피드백을 명심하라. 시작 화면에는 문단을 넣지 마라 — 배지 + 한 줄(예: `EXPERIENCE_FORMAT["voice-phishing"].hint`) + 버튼이 전부다.**

## 작업

### 1. `src/components/experiences/VoicePhishingExperience.tsx`

- `import { FormatBadge }`, `import { EXPERIENCE_FORMAT }`를 추가한다.
- `const [started, setStarted] = useState(false);`를 추가한다.
- 마운트 시 `revealNode(content.startNodeId)`를 호출하던 `useEffect`를, `started`가 `true`가 된 뒤에만 `revealNode`를 호출하도록 바꾼다. `useEffect`의 의존성 배열에 `started`를 넣고, 함수 본문 첫 줄에서 `if (!started) return;` 가드를 둔다. `timers` cleanup(언마운트 시 `clearTimeout`)은 그대로 유지한다.
- 모든 hook 선언 이후, 기존 return 문 이전에 `if (!started) { return (<시작 화면 JSX>); }` 분기를 추가한다. 시작 화면 JSX는:
  - `<FormatBadge format={EXPERIENCE_FORMAT["voice-phishing"]} />`
  - `EXPERIENCE_FORMAT["voice-phishing"].hint` 한 줄
  - `<button type="button" onClick={() => setStarted(true)}>통화 시작</button>` — 기존 accent 버튼 톤(`bg-accent`, `hover:bg-accent-hover`, `min-h-11` 등) 재사용
- 새 색상/토큰을 만들지 마라.

### 2. `src/components/experiences/VoicePhishingExperience.test.tsx`

모든 기존 `it(...)`이 `render(...)` 직후 콘텐츠를 기대하므로 전부 깨진다. 각 테스트에서 `render(...)` 바로 다음 줄에 `fireEvent.click(screen.getByRole("button", { name: "통화 시작" }))`를 추가한다(테스트 상단에 `function start() { fireEvent.click(screen.getByRole("button", { name: "통화 시작" })); }` 헬퍼를 만들어 재사용해도 좋다). `vi.useFakeTimers()`를 쓰는 테스트이므로, 시작 버튼 클릭 → 그 다음에 기존의 `advanceAllTimers()` 흐름이 이어지도록 순서만 맞추면 된다.

추가로 아래 케이스를 신규로 넣는다:

- `render` 직후에는 타이핑 인디케이터/말풍선이 없고 "통화 시작" 버튼과 형식 배지(`EXPERIENCE_FORMAT["voice-phishing"].formatLabel`)만 보인다.
- "통화 시작"을 누른 뒤 타이머를 진행하면 첫 대사가 나타난다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다. **`VoicePhishingExperience.test.tsx` 전체가 통과해야 하며, 그 외 파일 테스트도 회귀 없이 통과해야 한다.**
2. 체크리스트:
   - `started`가 `false`인 동안에는 `revealNode`/`setTimeout`이 한 번도 호출되지 않는가? (시작 전에는 타이머가 안 걸려야 한다)
   - `FraudJudgmentExperience.tsx`를 수정하지 않았는가? (그건 step11)
   - 시작 화면에 문단(2문장 이상)이 없는가?
3. 결과에 따라 `phases/9-glossary-and-visual-results/index.json`의 `step: 10`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `FraudJudgmentExperience.tsx` 및 그 테스트를 수정하지 마라. 이유: 동일 패턴이지만 step11에서 별도로 다뤄 리스크를 분리한다.
- 시작 화면에 긴 설명 문단을 넣지 마라. 이유: "텍스트가 너무 많다"는 피드백에 대한 대응이 이 phase의 목적이다. 배지 + 한 줄 + 버튼이면 충분하다.
- `session-context`나 다른 체험 컴포넌트를 건드리지 마라.
- 기존 테스트를 (갱신이 명시된 `VoicePhishingExperience.test.tsx` 외에는) 깨뜨리지 마라.
