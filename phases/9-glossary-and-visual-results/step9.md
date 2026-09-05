# Step 9: attach-format-badge-briefing-experiences

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/src/data/experience-format.ts` (step7) — `EXPERIENCE_FORMAT`
- `/src/components/ui/FormatBadge.tsx` (step8)
- `/src/components/experiences/CaseInvestigationExperience.tsx` (전체) — `phase === "briefing"` 분기(브리핑 화면)
- `/src/components/experiences/JeonseExperience.tsx` (전체)와 `/src/components/experiences/jeonse/MapBoard.tsx` (전체) — 조작법/안내 문단 위치
- 각 컴포넌트의 대응 테스트 파일

## 배경

케이스 조사와 전세매물 체험에는 이미 시작 전 브리핑/안내 화면이 있다. 이 두 곳 화면 상단에 `FormatBadge`를 추가해 "지금 무슨 형식인지"를 한눈에 보여준다. 보이스피싱·사기 판별 카드는 시작 안내 자체가 없어서 step10~11에서 별도로 시작 게이트를 만들며 함께 배지를 붙인다 — 이 step에서는 그 두 컴포넌트(`VoicePhishingExperience.tsx`, `FraudJudgmentExperience.tsx`)를 건드리지 마라.

체험 컴포넌트에는 `typeId` prop이 없다(`ExperienceComponentProps`는 `content`/`onComplete`만 준다). 각 컴포넌트는 자기 유형을 이미 알고 있으므로 `EXPERIENCE_FORMAT["case-investigation"]` / `EXPERIENCE_FORMAT["jeonse"]`처럼 리터럴 키로 직접 참조한다.

## 작업

### 1. `src/components/experiences/CaseInvestigationExperience.tsx`

`import { FormatBadge } from "@/components/ui/FormatBadge";`와 `import { EXPERIENCE_FORMAT } from "@/data/experience-format";`를 추가한다. `phase === "briefing"` 분기가 반환하는 JSX의 최상단(브리핑 카드 위)에 `<FormatBadge format={EXPERIENCE_FORMAT["case-investigation"]} />`를 넣는다. `investigating`/`decision` 단계 화면은 건드리지 않는다(브리핑에서 이미 인지시켰으므로).

### 2. 전세매물 안내 화면

`JeonseExperience.tsx` 또는 `jeonse/MapBoard.tsx` 중 조작법/힌트 규칙 안내 문단이 있는 곳을 찾아, 그 안내 영역 상단에 `<FormatBadge format={EXPERIENCE_FORMAT["jeonse"]} />`를 넣는다. 매물 다이얼로그(`HouseDialogPanel`)에는 넣지 않는다.

### 3. 테스트

두 컴포넌트의 기존 테스트가 깨지지 않는지 확인하고(배지 추가로 텍스트 노드가 늘어날 뿐 기존 쿼리에는 영향이 없어야 정상), 각 컴포넌트 테스트에 "브리핑/안내 화면에 형식 배지(`EXPERIENCE_FORMAT[...].formatLabel`)가 렌더된다" 케이스를 1개씩 추가한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `VoicePhishingExperience.tsx`, `FraudJudgmentExperience.tsx`를 수정하지 않았는가? (`git status`로 확인)
   - 배지가 브리핑/안내 화면에만 뜨고, 실제 조사/판정 진행 화면에는 중복해서 뜨지 않는가?
3. 결과에 따라 `phases/9-glossary-and-visual-results/index.json`의 `step: 9`를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `VoicePhishingExperience.tsx`, `FraudJudgmentExperience.tsx`를 수정하지 마라. 이유: 이 둘은 시작 게이트를 새로 만들면서 배지를 붙여야 하므로 step10~11에서 각각 다룬다.
- `formatLabel`을 컴포넌트에 하드코딩하지 마라. 반드시 `EXPERIENCE_FORMAT[typeId]`를 참조하라. 이유: 문구의 단일 출처를 `experience-format.ts`로 유지해야 step7의 가드레일 테스트가 의미를 갖는다.
- 기존 테스트를 깨뜨리지 마라.
