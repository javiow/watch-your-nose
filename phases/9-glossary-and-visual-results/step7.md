# Step 7: experience-format-data

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` — 특히 "사용자에게 체험 유형 목록이나 다음 단계가 무엇인지 사전에 노출하지 않는다" CRITICAL 규칙
- `/docs/ADR.md`의 ADR-004
- `/src/data/experience-types.ts` (전체) — `EXPERIENCE_TYPE_LABELS: Record<ExperienceTypeId, string>`, 결과 페이지 전용이라는 주석 스타일
- `/src/types/experience.ts`의 `ExperienceTypeId` 타입

## 배경

"각 콘텐츠가 어떤 콘텐츠인지도 알려줘야 한다"는 피드백이 있었다. 단, ADR-004("체험 유형명 사전 비노출")는 유지해야 한다. 절충안: 체험 진행 중 화면에 사기 유형명(보이스피싱/케이스 조사/전세매물/사기 판별 카드)이 아니라, "지금 상호작용하는 형식"(전화 통화/현장 조사/매물 확인/빠른 판별)만 아이콘 배지로 보여준다. 이 형식 라벨은 `EXPERIENCE_TYPE_LABELS`(결과 페이지 전용 유형명)와 반드시 다른 문구를 써야 한다 — 우연히라도 겹치면 두 원칙(체험 중 비노출 vs 결과 페이지만 공개)이 사실상 동의어가 되어 유형명이 새는 셈이 된다.

## 작업

`src/data/experience-format.ts`를 신규 생성한다.

```ts
import type { ExperienceTypeId } from "@/types/experience";

export interface ExperienceFormatMeta {
  icon: string;           // 이모지 아이콘 하나
  formatLabel: string;    // 상호작용 "형식" — 사기 유형명이 아니다. EXPERIENCE_TYPE_LABELS의 어떤 값과도 문자열이 같으면 안 된다.
  hint: string;           // 5~10자 내외 초단문 안내
  learningPhrase: string; // 결과 막대그래프 캡션용, 6자 내외 명사구 (문장이 아니다)
}

export const EXPERIENCE_FORMAT: Record<ExperienceTypeId, ExperienceFormatMeta>;
```

4개 유형 각각에 아래 내용으로 채운다(그대로 써도 됨):

| typeId | icon | formatLabel | hint | learningPhrase |
|---|---|---|---|---|
| `voice-phishing` | 📞 | 전화 통화 | 듣고 바로 답해보세요 | 전화 판단력 |
| `case-investigation` | 🔍 | 현장 조사 | 서류를 확인해보세요 | 서류 비교력 |
| `jeonse` | 🏠 | 매물 확인 | 매물 서류를 확인해보세요 | 계약 전 확인력 |
| `fraud-judgment` | ⚡ | 빠른 판별 | 바로바로 판단해보세요 | 즉시 판단력 |

TDD로 먼저 `src/data/experience-format.test.ts`를 작성해 레드 상태를 확인한 뒤 구현한다. 최소한 아래를 검증한다:

- `EXPERIENCE_FORMAT`에 `ExperienceTypeId`의 4개 값이 모두 키로 존재한다(레지스트리 `src/lib/registry.ts`의 `EXPERIENCE_MODULES.map(m => m.typeId)`와 `Object.keys(EXPERIENCE_FORMAT)`이 같은 집합인지 비교 — 나중에 유형이 추가되면 이 테스트가 실패해 이 파일도 갱신해야 함을 알려준다).
- 각 항목의 `icon`/`formatLabel`/`hint`/`learningPhrase`가 비어있지 않다.
- **가드레일 테스트**: `src/data/experience-types.ts`의 `EXPERIENCE_TYPE_LABELS`를 import해서, `EXPERIENCE_FORMAT`의 어떤 `formatLabel`도 `EXPERIENCE_TYPE_LABELS`의 값과 문자열이 완전히 같지 않음을 검증한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `formatLabel` 4개 중 어느 것도 "보이스피싱", "케이스 조사", "전세매물", "사기 판별 카드"(현재 `EXPERIENCE_TYPE_LABELS`의 값)와 같지 않은가?
   - `src/components/`, `src/app/` 아래 어떤 것도 이 step에서 수정하지 않았는가? (실제 배지 컴포넌트는 step8, 부착은 step9~11)
3. 결과에 따라 `phases/9-glossary-and-visual-results/index.json`의 `step: 7`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `formatLabel`에 실제 사기 유형명(보이스피싱, 케이스 조사, 전세매물, 사기 판별 등)이나 그와 동일한 문자열을 쓰지 마라. 이유: ADR-004(체험 중 유형명 비노출)를 우회하는 결과가 된다.
- `src/components/`, `src/app/` 아래 파일을 만들거나 수정하지 마라. 이유: 배지 UI는 step8, 실제 부착은 step9~11이다.
- 기존 테스트를 깨뜨리지 마라.
