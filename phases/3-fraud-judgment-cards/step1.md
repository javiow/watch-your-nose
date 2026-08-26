# Step 1: data-model

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md` (특히 방금 step0에서 추가된 ADR-009)
- `src/types/experience.ts`
- `src/data/case-select.ts`, `src/data/case-select.test.ts` (`CASE_SELECT_PAIRS`처럼 "정적 배열 + registry가 `Math.random()`으로 하나 뽑는" 기존 패턴 참고)
- `src/data/jeonse.ts`의 `JEONSE_HOUSES`/`JEONSE_HOUSE_SETS` 정의부 (외부 팀원 레포를 그대로 이식한 선례 — 모듈 로드 시점에 `Math.random()`을 쓰지 않는 규칙 확인용)

이 step은 타입/콘텐츠 데이터만 다룬다. UI 컴포넌트나 `registry.ts`/`remediation.ts` 등록은 이 step에서 하지 않는다(step2에서 함).

## 외부 참고 소스

팀원 레포 [`KKanghh/fraudtest`](https://github.com/KKanghh/fraudtest)의 아래 파일을 WebFetch로 가져와 참고한다:

- `https://raw.githubusercontent.com/KKanghh/fraudtest/main/src/data/seed-scenarios.json` — **최상위 구조가 `{ _meta: {...}, scenarios: [...] }`다. `.scenarios` 배열을 꺼내 써야 한다(배열이 바로 최상위에 있지 않음).** 이 글 작성 시점 기준 74개 항목, 15개 사기 유형(`중고거래_사기`/`투자리딩방_사기`/`로맨스스캠`/`스미싱`/`대환작업대출_사기`/`몸캠피싱`/`가짜쇼핑몰`/`대리입금`/`지인사칭_메신저피싱`/`취업사기`/`전세사기`/`택배기사_사칭피싱`/`중고차_사기`/`반려동물_분양사기`/`티켓_되팔이_사기`) 모두 최소 1개 이상 포함, id 전부 고유.
- 원본 각 항목 필드: `id`(string, 고유), `type`(위 15종 중 하나), `format`("text"|"dialogue"|"sms"|"notice" — 이번 이식에서는 사용하지 않는다, 아래 참고), `title`(string), `content`(string, 서술형 지문 한 문단), `answer`("fraud"|"safe"), `explanation`(string), `source`(string, 출처).

원본 항목 예시 2개(필드 형태 확인용, 실제 사용할 74개는 fetch 결과에서 그대로 가져올 것):

```json
{
  "id": "used-01",
  "type": "중고거래_사기",
  "format": "dialogue",
  "title": "먼저 입금해주면 바로 보내드릴게요",
  "content": "중고거래 앱에서 인기 상품(한정판 운동화)을 판매 중인 판매자가 '지방이라 직거래는 어렵고, 택배로 먼저 보내드릴 테니 계좌로 선입금해주시면 바로 발송하겠다'고 합니다. 안전결제(에스크로)를 제안하니 '수수료 때문에 그건 좀 어렵다'고 답합니다.",
  "answer": "fraud",
  "explanation": "선입금을 요구하면서 안전결제(에스크로)를 거부하는 것은 판매자가 물건을 보내지 않고 잠적할 수 있는 전형적인 위험 신호입니다. 가격이나 상품 자체보다 '안전한 결제 방식을 피하려는 태도'에 주목해야 합니다.",
  "source": "더치트/경찰청 사이버수사국 공개 중고거래 사기 유형"
}
```
```json
{
  "id": "used-02",
  "type": "중고거래_사기",
  "format": "dialogue",
  "title": "후기는 없지만 안전결제로 진행하자는 판매자",
  "content": "중고거래 앱에서 판매자가 '직거래보다 안전결제로 진행하시죠. 안전결제 수수료는 제가 부담할게요'라고 제안합니다. 다만 판매자 프로필에 등록된 거래 후기가 아직 하나도 없고, 채팅 말투도 다소 사무적입니다.",
  "answer": "safe",
  "explanation": "후기가 없다는 점은 다소 불안 요소이지만, 공식 안전결제(에스크로)를 통해 진행하면 구매자가 물건을 받고 확인한 뒤에만 대금이 지급되므로 실제로는 안전합니다. 상대의 말투나 후기 개수보다 '결제 방식이 안전한가'가 더 중요한 판단 기준입니다.",
  "source": "일반 전자상거래 안전결제 구조"
}
```

## 작업

### 1. `src/types/experience.ts`에 타입 추가 (기존 타입은 삭제하지 않는다)

```ts
export type ExperienceTypeId =
  | "voice-phishing"
  | "case-select"
  | "jeonse"
  | "fraud-judgment"; // 추가

export type FraudJudgmentAnswer = "fraud" | "safe";

// 원본 레포(fraudtest)의 15개 사기 유형을 그대로 옮긴 것. UI에는 절대 노출하지 않는다 —
// 콘텐츠 커버리지 테스트용 내부 메타데이터일 뿐이다.
export type FraudJudgmentCategory =
  | "중고거래_사기" | "투자리딩방_사기" | "로맨스스캠" | "스미싱"
  | "대환작업대출_사기" | "몸캠피싱" | "가짜쇼핑몰" | "대리입금"
  | "지인사칭_메신저피싱" | "취업사기" | "전세사기" | "택배기사_사칭피싱"
  | "중고차_사기" | "반려동물_분양사기" | "티켓_되팔이_사기";

export interface FraudJudgmentCard {
  id: string;
  category: FraudJudgmentCategory; // 렌더링 금지 — 내부 메타데이터 (step2에서 강제)
  title: string;
  content: string; // 판단 시점에서 끝나는 서술형 지문 (단일 문단)
  answer: FraudJudgmentAnswer; // 정답: fraud=사기, safe=정상
  explanation: string; // /result에서만 노출 (체험 중 노출 금지, step2에서 강제)
  source: string; // 출처 — 사기 예방기관명이 정답을 암시하므로 /result에서만 노출 (step2에서 강제)
}
```

원본의 `type` 필드는 위 `category`로 이름만 바꿔 옮긴다(이 앱에서 `type`은 이미 `ExperienceTypeId`/`typeId` 어휘로 쓰이므로 혼동 방지). 원본의 `format` 필드는 **옮기지 않는다** — 렌더링에 실질적 차이가 없어 죽은 메타데이터가 되기 때문. `answer`/`explanation`/`source`/`content`/`title`/`id`는 원본 그대로 옮긴다.

`ExperienceModule`/`ModuleResult`/`ExperienceComponentProps`는 수정하지 않는다 — 기존 제네릭 계약으로 이 유형도 충분히 표현된다.

### 2. 새 파일 `src/data/fraud-judgment.ts`

```ts
import type { FraudJudgmentCard } from "@/types/experience";

export const FRAUD_JUDGMENT_CARDS: FraudJudgmentCard[] = [
  // fetch한 74개 항목 전부를 위 필드 규칙(type→category, format 드롭)에 맞춰 리터럴로 작성
];
```

- WebFetch로 가져온 `.scenarios` 배열 74개 항목 **전부**를 옮긴다. 일부만 옮기거나 임의로 요약/재구성하지 마라 — 원문 그대로(제목·본문·해설·출처 텍스트 수정 없이) 필드명만 리매핑한다.
- `id`는 원본 그대로 사용한다(이미 74개 전부 고유 확인됨. 혹시 fetch 시점에 원본이 바뀌어 중복이 생기면 그 사실을 `error_message`에 남기고 이 step을 실패 처리하라).
- **모듈 로드 시점에 `Math.random()`이나 다른 비결정적 계산을 쓰지 마라.** 이 배열은 고정된 정적 리터럴이어야 한다(`JEONSE_HOUSE_SETS`와 동일한 규칙) — 무작위 선택은 step2의 `registry.ts`가 담당한다.
- 이 파일은 변환 스크립트 없이, 이 step 안에서 직접 손으로 작성한 리터럴 배열이어야 한다(선례: `phases/2-jeonse-map-game/step1.md`도 동일 방식으로 매물 42개를 이식했다). `scripts/` 아래에 재사용 변환 스크립트를 새로 만들지 마라.

### 3. 새 파일 `src/data/fraud-judgment.test.ts` (TDD — `fraud-judgment.ts` 작성 전에 먼저 작성)

아래를 검증하는 테스트를 작성한다:

- `FRAUD_JUDGMENT_CARDS.length`가 0보다 크다(정확한 총 개수를 하드코딩해 단언하지 않는다 — 원본이 늘어나도 깨지지 않게 하한만 확인).
- 모든 항목의 `id`가 전부 고유하다.
- 모든 항목이 `title`/`content`/`explanation`/`source`를 비어있지 않은 문자열로 가진다.
- `answer`는 `"fraud"` 또는 `"safe"`만 존재한다.
- 15개 `FraudJudgmentCategory` 값 각각에 대해 최소 1개 이상의 카드가 존재한다.
- `"fraud"` 정답과 `"safe"` 정답이 모두 최소 1개 이상 존재한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - 콘텐츠(사기 판별 카드)가 `src/data/`의 정적 TS 파일에만 있는가? (`CLAUDE.md` CRITICAL 규칙)
   - `FRAUD_JUDGMENT_CARDS` 생성에 런타임 `Math.random()`을 쓰지 않았는가?
   - 기존 `voice-phishing.ts`/`case-select.ts`/`jeonse.ts`와 그 테스트를 건드리지 않았는가?
   - `fraud-judgment.ts` 항목 수가 원본(fetch 시점 기준 74개)과 일치하는가? (일부만 옮기지 않았는지 재확인)
3. 결과에 따라 `phases/3-fraud-judgment-cards/index.json`의 `step: 1` 항목을 업데이트한다.

## 금지사항

- `src/lib/registry.ts`, `src/data/remediation.ts`, 어떤 UI 컴포넌트도 이 step에서 건드리거나 새로 만들지 마라. 이유: 아직 등록되지 않은 타입/데이터만 추가하는 단계이며, registry 등록과 컴포넌트는 step2에서 한 번에 다룬다.
- 기존 다른 유형(`voice-phishing.ts`, `case-select.ts`, `jeonse.ts`)의 데이터나 테스트를 수정하지 마라.
- 팀원 원본 콘텐츠(제목·본문·해설·출처)의 문구를 임의로 각색·요약·의역하지 마라 — 필드명 리매핑(`type`→`category`, `format` 드롭) 외에는 원문 그대로 옮긴다.
- `scripts/` 아래에 이 변환을 위한 새 스크립트 파일을 만들지 마라.
- step 종료 시점에 `npm run build`/`npm run lint`/`npm test`가 반드시 통과해야 한다 — 새 export를 추가하는 것만으로는 기존 빌드를 깨뜨리지 않는다는 점을 확인하라.
