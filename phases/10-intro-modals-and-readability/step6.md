# Step 6: case-investigation-purpose-data

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` (특히 "모든 콘텐츠는 src/data의 정적 TS 파일", "피해자 관점만")
- `/docs/ADR.md`의 ADR-004, ADR-010
- `/src/types/experience.ts` — `CaseInvestigation` 인터페이스 (`{ investigationId, name, cost, documentId, unlockCondition, hiddenUntilUnlocked? }`), 그리고 `CaseInvestigationContent`, `CaseEvidenceDefinition`
- `/src/data/case-investigation.ts` (전체) — `CASE_INVESTIGATION_CASES: CaseInvestigationContent[]`. 6개 케이스: `JEONSE_001`, `JEONSE_002`, `JEONSE_003`, `CHEONGYAK_004`, `BUNYANG_005`, `FINAL_001`. 각 케이스의 `investigations` 배열(케이스당 2~5개).
- `/src/data/case-investigation.test.ts` (전체) — 데이터 완결성 테스트 패턴
- `/src/components/experiences/CaseInvestigationExperience.test.tsx` — 상단의 테스트 픽스처(`gatingFixture` 등: `INV_CHEAP`, `INV_EXPENSIVE`, `INV_HIDDEN` 같은 investigation 객체를 직접 만든다)

## 배경

사용자 피드백: "각종 정보를 왜 확인해야 되는지 모르겠다. 포인트는 무엇이고 덜 쓰면/다 쓰면 어떻게 되는지 모르겠다."

이 step은 데이터 계층만 담당한다: 각 조사 항목에 **"이걸 왜 확인하나"** 한 줄 설명(`purpose`)을 추가한다. 화면 렌더는 step7.

`purpose`를 필수(`string`, optional 아님)로 추가하므로, `CaseInvestigation`을 인라인으로 만드는 **모든 테스트 픽스처**도 `purpose`를 넣어야 컴파일된다.

## 작업

### 1. `src/types/experience.ts` — `CaseInvestigation`에 필드 추가

```ts
export interface CaseInvestigation {
  investigationId: string;
  name: string;
  cost: number;
  documentId: string;
  unlockCondition: CaseInvestigationUnlock | null;
  hiddenUntilUnlocked?: boolean;
  /** 체험자에게 보여줄 "이 조사를 왜 하는가" 한 줄 설명. 사기 유형·정답을 암시하지 않는다. */
  purpose: string;
}
```

### 2. `src/data/case-investigation.ts` — 6개 케이스 전 investigation에 `purpose` 작성

- 각 조사의 `name`, 연결된 `documentId`, 그 문서 `blocks`의 내용을 보고 "무엇을 확인하려는 조사인지"를 **1문장(대략 20~45자)**으로 쓴다.
- 예시(참고용, 실제 데이터에 맞춰 조정):
  - `매물 광고 확인` → `"광고 문구에 계약을 재촉하거나 조건을 부풀리는 표현이 있는지 봅니다."`
  - `시세 정보 확인` → `"제시된 전세금이 주변 실거래가와 맞는 수준인지 비교합니다."`
  - `등기 정보 확인` → `"소유자가 누구인지, 근저당·압류 같은 권리관계가 있는지 확인합니다."`
  - `임대인 추가 조사` → `"계약 상대가 실제 소유자·정당한 대리인이 맞는지 확인합니다."`
- **금지**: `purpose`에 케이스 `title`(스포일러성 제목), `hiddenTruth.fraudType`, 사기 유형명, "이건 위험하다/사기다" 같은 정답 암시를 넣지 마라. 어디까지나 "무엇을 보러 가는지"만 서술한다.
- `hiddenUntilUnlocked: true`인 숨겨진 조사도 `purpose`를 채운다(언락된 뒤 보인다).

### 3. `src/data/case-investigation.test.ts` — 완결성 테스트 추가

- 모든 케이스의 모든 `investigations[].purpose`가 존재하고 `trim().length` 가 1 이상, 그리고 대략적 상한(예: `<= 60`).
- 모든 `purpose`가 같은 케이스의 `title`을 부분 문자열로 포함하지 않는다.
- 모든 `purpose`가 정규식 `/사기|위험|보이스피싱|전세사기|깡통전세/`에 매치되지 않는다(정답·유형 암시 차단). (문구를 이 제약에 맞춰 작성하라.)

### 4. 컴파일이 깨지는 다른 곳 수리

- `CaseInvestigationExperience.test.tsx`의 인라인 `CaseInvestigation` 픽스처(`INV_CHEAP` 등)에 `purpose: "..."`를 추가한다. 테스트 로직은 바꾸지 말고 필드만 채운다.
- `grep -rn "investigationId:" src/` 로 다른 인라인 정의가 있는지 확인하고 있으면 동일 처리.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다. TypeScript strict에서 `purpose` 누락이 있으면 `npm run build`가 실패한다 — 전부 채워야 한다.
2. 체크리스트:
   - `purpose`가 required `string`인가?
   - 6개 케이스 × 각 investigation 전부에 `purpose`가 있는가? (`grep -c "purpose:" src/data/case-investigation.ts` 로 개수 확인, `investigationId:` 개수와 일치)
   - `purpose`에 스포일러(제목/유형/정답 암시)가 없는가?
   - 렌더 코드(`CaseInvestigationExperience.tsx`)를 건드리지 않았는가? (그건 step7)
3. 결과에 따라 `phases/10-intro-modals-and-readability/index.json`의 `step: 6`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

`summary`에 "`CaseInvestigation.purpose` required 추가, 6케이스 N개 investigation 채움, 픽스처 M곳 수리"를 적어라 — step7이 참조한다.

## 금지사항

- `purpose`를 optional(`purpose?: string`)로 만들지 마라. 이유: 팀이 새 케이스를 추가할 때 빠뜨리지 않도록 강제해야 하고, step7 렌더가 항상 존재를 가정한다.
- `purpose`에 정답이나 사기 유형을 드러내지 마라. 이유: 조사 전에 답을 알려주면 학습이 안 된다(ADR-004).
- `CaseInvestigationExperience.tsx`(렌더)나 `scoring.ts`를 수정하지 마라. 이유: 이 step은 순수 데이터/타입 계층이다.
- 기존 `investigations`의 `name`/`cost`/`documentId`/`unlockCondition`을 바꾸지 마라. 이유: 채점·언락 로직이 이 값에 의존한다.
- 기존 테스트를 깨뜨리지 마라.
