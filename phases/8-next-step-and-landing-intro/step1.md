# Step 1: experience-type-labels

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ADR.md`의 ADR-016
- `/docs/PRD.md`의 "핵심 기능" 4번 항목 (4개 체험 유형 이름)
- `/src/types/experience.ts`의 `ExperienceTypeId` 타입 정의
- `/src/data/difficulty.ts` — 이번 step에서 그대로 따라야 할 기존 "코드값 → 한글 라벨" 패턴 예시

## 배경

`ModuleResult.typeId`는 이미 존재하지만 어느 화면에도 한글 라벨로 노출된 적이 없다. 이번 phase의 결과 페이지 라벨링(step6)에서 이 라벨을 쓴다. `src/data/difficulty.ts`가 `Difficulty` 코드값(`"easy"` 등)을 한글 라벨(`"쉬움"` 등)로 매핑하는 것과 동일한 패턴을 `ExperienceTypeId`에도 적용한다.

**중요**: 이 라벨은 결과 페이지(체험이 모두 끝난 뒤)에서만 쓰인다. CLAUDE.md의 "체험 유형 목록을 사전에 노출하지 않는다" 규칙은 체험 진행 중·랜딩 화면에 적용되는 것이며, 이 데이터 파일 자체는 그 규칙을 어기지 않는다 — 다만 이 파일을 랜딩이나 세션 진행 화면에서 import해서 쓰면 안 된다(그건 이 step의 책임이 아니라 사용하는 쪽의 책임이다. 이 step은 데이터 정의만 한다).

## 작업

`src/data/experience-types.ts`를 신규 생성한다.

```ts
import type { ExperienceTypeId } from "@/types/experience";

// 결과 페이지(/result) 전용 한글 라벨. 체험 진행 중·랜딩 화면에는 절대 사용하지 말 것
// (CLAUDE.md: 체험 유형 목록 사전 비노출 원칙, ADR-004/ADR-016).
export const EXPERIENCE_TYPE_LABELS: Record<ExperienceTypeId, string> = {
  "voice-phishing": "보이스피싱",
  "case-investigation": "케이스 조사",
  "jeonse": "전세매물",
  "fraud-judgment": "사기 판별 카드",
};
```

라벨 문구는 `docs/PRD.md` 4번 항목에 이미 쓰인 표기를 그대로 따른다 — 임의로 다른 표현으로 바꾸지 않는다.

TDD로 먼저 `src/data/experience-types.test.ts`를 작성한다. 최소한:

- `ExperienceTypeId`의 4개 값(`voice-phishing`/`case-investigation`/`jeonse`/`fraud-judgment`) 모두에 대해 `EXPERIENCE_TYPE_LABELS`에 빈 문자열이 아닌 라벨이 존재한다.
- 4개 라벨이 PRD 표기(`"보이스피싱"`/`"케이스 조사"`/`"전세매물"`/`"사기 판별 카드"`)와 정확히 일치한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `src/app/`, `src/components/` 아래 어떤 파일도 이 step에서 수정되지 않았는가? (이 라벨을 실제 화면에 쓰는 것은 step6에서 한다)
   - `Record<ExperienceTypeId, string>` 타입이라 4개 키를 빠짐없이 채우지 않으면 TypeScript 컴파일이 실패하는가(의도된 안전장치)?
3. 결과에 따라 `phases/8-next-step-and-landing-intro/index.json`의 `step: 1`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 이 라벨을 `src/app/page.tsx`, `src/components/ui/LandingHero.tsx`, 세션 진행 화면(`src/app/session/page.tsx`, `src/components/experiences/*`) 어디에도 import해서 쓰지 마라. 이유: 체험 유형은 결과 페이지 전에는 절대 노출되면 안 된다(CLAUDE.md CRITICAL). 이 데이터는 오직 이후 step6(`/result`)에서만 소비된다.
- 기존 테스트를 깨뜨리지 마라.
