# Step 11: fraud-judgment-start-gate

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/src/data/experience-format.ts` (step7) — `EXPERIENCE_FORMAT["fraud-judgment"]`
- `/src/components/ui/FormatBadge.tsx` (step8)
- `/src/components/experiences/FraudJudgmentExperience.tsx` (전체)
- `/src/components/experiences/FraudJudgmentExperience.test.tsx` (전체) — 모든 테스트가 `render()` 직후 첫 카드/버튼을 기대함
- `/src/components/experiences/VoicePhishingExperience.tsx` (step10에서 추가된 `started` 게이트 패턴) — 같은 방식을 따른다

## 배경

`FraudJudgmentExperience`도 마운트되자마자 `1 / N` 카드와 "사기예요/정상이에요" 버튼이 바로 뜬다. step10과 동일하게 짧은 시작 화면(형식 배지 + 한 줄 안내 + "판정 시작" 버튼)을 앞에 둔다.

## 작업

### 1. `src/components/experiences/FraudJudgmentExperience.tsx`

- `import { FormatBadge }`, `import { EXPERIENCE_FORMAT }`를 추가한다.
- `const [started, setStarted] = useState(false);`를 추가한다.
- 기존 return 문 앞에 `if (!started) { return (<시작 화면 JSX>); }`를 둔다. 시작 화면은:
  - `<FormatBadge format={EXPERIENCE_FORMAT["fraud-judgment"]} />`
  - `EXPERIENCE_FORMAT["fraud-judgment"].hint` 한 줄
  - `<button type="button" onClick={() => setStarted(true)}>판정 시작</button>` — 기존 accent 버튼 톤 재사용
- 이 컴포넌트는 타이머/이펙트가 없으므로 `useEffect` 수정은 필요 없다. 단순히 렌더 게이트만 추가하면 된다.

### 2. `src/components/experiences/FraudJudgmentExperience.test.tsx`

모든 기존 `it(...)`의 `render(...)` 다음 줄에 `fireEvent.click(screen.getByRole("button", { name: "판정 시작" }))`를 추가한다(헬퍼 함수로 묶어도 좋다). `answerAll(...)` 헬퍼를 쓰는 테스트도 시작 클릭이 먼저 와야 한다.

추가로 아래 케이스를 신규로 넣는다:

- `render` 직후에는 첫 카드/판정 버튼이 없고 "판정 시작" 버튼과 형식 배지(`EXPERIENCE_FORMAT["fraud-judgment"].formatLabel`)만 보인다.
- "판정 시작"을 누르면 첫 카드의 `content`와 "사기예요"/"정상이에요" 버튼이 나타난다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다. **`FraudJudgmentExperience.test.tsx` 전체 + 그 외 전체 테스트가 회귀 없이 통과해야 한다.**
2. 체크리스트:
   - `VoicePhishingExperience.tsx`를 수정하지 않았는가?
   - 시작 화면에 문단(2문장 이상)이 없는가?
   - "체험 중에는 어떤 카드의 source와 explanation도 노출하지 않는다" 테스트가 시작 클릭 추가 후에도 통과하는가?
3. 결과에 따라 `phases/9-glossary-and-visual-results/index.json`의 `step: 11`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `VoicePhishingExperience.tsx` 및 그 테스트를 수정하지 마라. 이유: step10에서 이미 처리됐다.
- 시작 화면에 긴 설명 문단을 넣지 마라. 이유: "텍스트가 너무 많다"는 피드백 대응이 이 phase의 목적이다.
- 기존 테스트를 (갱신이 명시된 `FraudJudgmentExperience.test.tsx` 외에는) 깨뜨리지 마라.
