# Step 6: wire-glossary-fraud-judgment

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/src/data/glossary.ts` (step0)
- `/src/components/ui/GlossaryTermText.tsx` (step2)
- `/src/data/fraud-judgment.ts` (전체) — `FraudJudgmentCard.content` 필드
- `/src/components/experiences/FraudJudgmentExperience.tsx` (전체)
- `/src/types/experience.ts`의 `FraudJudgmentCard` 정의 — `explanation`/`source`는 "체험 중 노출 금지, /result에서만" 주석이 붙어 있다.

## 배경

사기 판별 카드의 지문(`FraudJudgmentCard.content`)에 대환대출, WHOIS 조회 같은 용어가 설명 없이 등장한다. 이 카드는 19개 사기 유형(중고거래, 투자리딩방, 로맨스스캠 등)에 걸쳐 90장이 있으므로, 해당 용어가 포함된 카드만 찾아 마커를 심는다(모든 카드를 다 뒤질 필요는 없다).

## 작업

### 1. `src/data/fraud-judgment.ts`

`grep -n "대환대출\|WHOIS 조회\|이상거래탐지\|명의도용\|대포통장\|자금세탁\|원격지원 앱" src/data/fraud-judgment.ts`로 `content` 필드 안 출현 지점을 찾아 `{{term:용어}}`로 감싼다. `title`(카드 제목)에는 마커를 넣지 마라 — 제목은 짧고 즉각적이어야 한다. `explanation`/`source` 필드는 애초에 체험 중 렌더되지 않으므로(타입 주석 참고) 이 step의 대상이 아니다.

### 2. `src/components/experiences/FraudJudgmentExperience.tsx`

`import { GlossaryTermText } from "@/components/ui/GlossaryTermText";`를 추가하고, `<p className="mt-2 text-sm leading-relaxed text-muted">{currentCard.content}</p>`를 `<p className="mt-2 text-sm leading-relaxed text-muted"><GlossaryTermText text={currentCard.content} /></p>`로 바꾼다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `title`, `explanation`, `source` 필드에는 마커가 없는가?
   - `FraudJudgmentExperience.test.tsx`의 "체험 중에는 어떤 카드의 source와 explanation도 노출하지 않는다" 테스트가 그대로 통과하는가?
3. 결과에 따라 `phases/9-glossary-and-visual-results/index.json`의 `step: 6`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `title`, `explanation`, `source` 필드에 마커를 넣지 마라. 이유: `explanation`/`source`는 체험 중 렌더 자체가 금지된 스포일러 필드이고, `title`은 짧게 유지해야 한다.
- `src/data/voice-phishing.ts`, `src/data/jeonse.ts`, `src/data/case-investigation.ts`를 수정하지 마라. 이유: 각각 step3~5에서 다룬다.
- 90장 카드를 전부 훑어 억지로 용어를 추가하지 마라. 이유: 이미 등장하는 용어에만 마커를 다는 것이 목적이고, 없는 용어를 만들어 넣는 것은 범위 밖이다.
- 기존 테스트를 깨뜨리지 마라.
