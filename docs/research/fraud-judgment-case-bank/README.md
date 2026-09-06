# 사기 판별 카드 사례 뱅크

`fraud-judgment-card-case-researcher` 에이전트가 공개 자료에서 수집한 생활 밀착형 사기
(중고거래·투자리딩방·스미싱·로맨스스캠 등 19개 유형) 사례를 **전개 흐름·정답을 가르는 핵심
신호 수준으로 추상화**해 정리한 자료다. `fraud-judgment-card-scenario-writer`가
`src/data/fraud-judgment.ts`의 `FRAUD_JUDGMENT_CARDS`에 새 카드(`FraudJudgmentCard`)를 만들
때 근거 자료로 참고한다.

이 유형은 팀원 레포 fraudtest에서 이식했고(ADR-009/011), 카드마다 "판단 시점에서 끝나는
서술형 지문"을 읽고 사기/정상을 판정한다. 세션당 4장을 연속 판정해 집계한다(ADR-015).

## 원칙

- **verbatim 금지**: 실제 피싱 URL·단축링크, 계좌번호, 실존 쇼핑몰/앱/리딩방 상호, 악성 앱
  이름, 피해자 개인정보를 그대로 옮기지 않는다. 이 문서가 실행 가능한 사기 대본으로 오용될
  수 없어야 한다 ([ADR-005](../../ADR.md)).
- **출처 필수**: 경찰청 사이버수사국, 금융감독원(FINE·소비자경보·불법 사금융/유사투자자문),
  더치트, 개인정보보호위원회, KISA(보호나라), 한국소비자원, 금융투자협회, 방송통신위원회,
  신뢰할 수 있는 언론 보도만 사용하고, 각 항목에 출처(기관명, URL, 조회일)를 남긴다.
- **패턴 수준 요약**: `scam_flow`(판단 시점까지의 전개 3~5단계), `decisive_signal`(정답을
  가르는 핵심 신호 — 가격/상품이 아니라 상대의 태도·요구하는 절차), `safe_contrast`(같은
  상황이 '정상'이려면 필요한 조건) 위주로 기록한다.
- **정답 암시 값 격리**: `source`는 사기 예방기관명이라 정답을 암시한다. 카드에서도 이
  값은 `explanation`과 함께 `/result`에서만 노출되므로, 사례 뱅크에서도 지문 흐름과 분리해
  적는다.

## 19개 카테고리 → 파일 매핑

| 파일 | 카테고리 (`FraudJudgmentCategory`) |
|---|---|
| `financial-investment-fraud.md` | 투자리딩방_사기 · 가상자산_사기 · 대환작업대출_사기 · 대리입금 · 명의도용_사기 |
| `commerce-transaction-fraud.md` | 중고거래_사기 · 가짜쇼핑몰 · 중고차_사기 · 반려동물_분양사기 · 티켓_되팔이_사기 |
| `impersonation-phishing-fraud.md` | 스미싱 · 지인사칭_메신저피싱 · 택배기사_사칭피싱 · 파밍_사기 · 몸캠피싱 |
| `relationship-employment-fraud.md` | 로맨스스캠 · 취업사기 · 전세사기 · 보험사기 |
| `legitimate-safe-patterns.md` | (카테고리 무관) "사기처럼 보이지만 정상"인 상황의 공통 구조 — safe 정답 카드용 |

> `src/data/fraud-judgment.test.ts`는 19개 카테고리 각각 최소 1개 카드를 요구한다. 새
> 카테고리를 다루기 시작할 때는 이 매핑표에 맞는 파일에 항목을 추가한다.

## 엔트리 스키마

```markdown
## [<slug-id>] <한 줄 설명>
- category: <FraudJudgmentCategory 값 — 내부 메타데이터, 카드에 렌더 금지>
- scam_flow: [판단 시점까지의 전형적 전개 3~5단계]
- decisive_signal: [정답을 가르는 핵심 신호 1~2개 — 태도/절차 중심]
- safe_contrast: [같은 상황이 '정상'이려면 필요한 조건 → safe 페어 카드용]
- source: <출처 기관명 (URL, 조회일) — 정답 암시 가능, 카드 source 필드 전용>
- abstraction_note: 실제 링크·계좌·상호·피해자 정보를 옮기지 않고 흐름만 요약함
```

## 갱신 로그

- 이 줄은 예시입니다. `fraud-judgment-card-case-researcher`가 실행될 때마다
  `YYYY-MM-DD — <무엇을 갱신했는지> (n건 추가)` 형식으로 아래에 append 합니다.
