# 부동산 계약 사기 조사 사례 뱅크

`case-investigation-case-researcher` 에이전트가 공개 자료에서 수집한 전세·청약·분양 계약
사기 사례를 **위험 패턴·수집 가능한 증거·상대방 진술 대 서류상 사실 수준으로 추상화**해
정리한 자료다. `case-investigation-scenario-writer`가 `src/data/case-investigation.ts`의
`CASE_INVESTIGATION_CASES`에 새 "사기 조사" 케이스(`CaseInvestigationContent`)를 만들 때
근거 자료로 참고한다.

이 체험은 팀원 레포 red-flag에서 이식했으며(ADR-010), 사용자는 조사 포인트로 문서를
열람하고 증거를 등록하고 NPC에게 정해진 질문을 한 뒤, 진술과 증거의 모순을 찾아
"계약 진행 가능 / 추가 확인 필요 / 계약 중단" 3지선다로 판단한다. 정답은 LLM이 아니라
rule-based 채점으로 결정된다.

## 원칙

- **verbatim 금지**: 실제 단지명·주소, 시행사/분양대행사/중개사무소 실명, 피해자 식별 정보,
  허위 서류 제작 방법을 그대로 옮기지 않는다. 이 문서가 "분양·청약·전세 사기 치는 법"
  안내로 오용될 수 없어야 한다 ([ADR-005](../../ADR.md)).
- **출처 필수**: 국토교통부, 주택도시보증공사(HUG), 한국부동산원/청약홈 안내, 금융감독원
  소비자경보, 경찰청, 지자체 분양·청약 피해 안내, 대한법률구조공단, 신뢰할 수 있는 언론
  보도만 사용하고, 각 항목에 출처(기관명, URL, 조회일)를 남긴다.
- **패턴 수준 요약**: `risk_patterns`, `evidence_the_victim_could_gather`(수집 가능한 증거
  후보), `broker_or_seller_claims_vs_reality`(상대방 진술 ↔ 서류상 사실 — 모순 설계용),
  `reasonable_endings`(어느 최종 판단이 최고점이며 왜인지) 위주로 기록한다.
- **설계 노트 분리**: 증거 중요도·조사 비용·언락 체인·모순 점수·엔딩 점수 배분 같은 게임
  밸런싱 규칙은 `investigation-design-notes.md`에 자유 형식으로 모은다.

## 파일 구성

| 파일 | 다루는 유형 (`CaseDomain`) |
|---|---|
| `jeonse-contract-fraud.md` | 전세 계약: 전세가율 · 갭투자 임대인 · 신탁 · 대항력/확정일자 공백 |
| `cheongyak-fraud.md` | 청약: 당첨 사칭 연락 · 프리미엄/계약금 대납 미끼 · 위장 전입 |
| `bunyang-fraud.md` | 분양: 확정수익 보장 광고 · 인허가/분양보증 미비 · 시행사·대행사 사칭 · 허위 계약률 |
| `investigation-design-notes.md` | 조사 게임 설계 규칙 (밸런싱·채점식) |
| `legitimate-safe-patterns.md` | 문제 없는 계약이 통과하는 조건 (NONE_LIMITED_RISK 케이스용) |

## 엔트리 스키마

사기 유형 파일(`jeonse-contract-fraud.md` / `cheongyak-fraud.md` / `bunyang-fraud.md` /
`legitimate-safe-patterns.md`):

```markdown
## [<slug-id>] <한 줄 설명>
- domain: JEONSE | CHEONGYAK | BUNYANG
- fraud_type_hint: <CaseFraudType 후보: HIGH_JEONSE_RATIO_RISK / GAP_INVESTMENT_RISK / TRUST_PROPERTY / PRESALE_IMPERSONATION / NONE_LIMITED_RISK / COMPOUND_JEONSE_RISK>
- risk_patterns: [조사로 드러나는 위험 신호]
- evidence_the_victim_could_gather: [수집 가능한 증거 후보 — 문서/조회 절차 단위]
- broker_or_seller_claims_vs_reality: [상대방 진술 ↔ 서류상 사실 (모순 설계용 쌍)]
- reasonable_endings: [진행 가능 / 추가 확인 필요 / 계약 중단 중 최고점과 이유]
- sources: [기관명 (URL, 조회일), ...]
- abstraction_note: 실제 단지명·주소·시행사명·피해자 정보를 옮기지 않고 패턴만 요약함
```

`investigation-design-notes.md`는 위 스키마 대신 설계 규칙을 자유 형식으로 정리한다.

## 갱신 로그

- 이 줄은 예시입니다. `case-investigation-case-researcher`가 실행될 때마다
  `YYYY-MM-DD — <무엇을 갱신했는지> (n건 추가)` 형식으로 아래에 append 합니다.
