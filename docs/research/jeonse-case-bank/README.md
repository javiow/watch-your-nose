# 전세사기 사례 뱅크

`jeonse-case-researcher` 에이전트가 공개 자료에서 수집한 전세·임대차 계약 사기 사례를
**위험 신호·서류 확인 포인트 수준으로 추상화**해 정리한 자료다. `jeonse-scenario-writer`가
`src/data/jeonse.ts`의 `JEONSE_HOUSES`에 새 "전세 매물 O/X 판정" 콘텐츠(`JeonseHouse`)를 만들
때 근거 자료로 참고한다.

## 원칙

- **verbatim 금지**: 실제 매물 주소·동호수, 소유자/임대인/중개인 실명, 등기 고유번호,
  중개업 등록번호, 피해자 개인정보를 그대로 옮기지 않는다. 이 문서 자체가 "전세사기 치는 법"
  안내로 오용될 수 없어야 한다 ([ADR-005](../../ADR.md)).
- **출처 필수**: 국토교통부(전세사기 예방 가이드·실거래가 공개시스템), 주택도시보증공사(HUG),
  대법원 인터넷등기소 안내자료, 전세사기피해지원위원회/전세피해지원센터, 경찰청, 지자체
  전월세 종합지원센터, 한국부동산원, 신뢰할 수 있는 언론 보도만 사용하고, 각 항목에
  출처(기관명, URL, 조회일)를 남긴다. 근거 없는 사례는 만들지 않는다.
- **패턴 수준 요약**: `risk_signals`(서류/정황상 위험 신호), `document_checkpoints`(그 위험을
  잡아내는 확인 절차), `red_flags_for_tenants`(세입자가 알아챌 수 있는 신호), `safe_baseline`
  (정상이라면 갖췄어야 할 조건) 위주로 기록한다.
- **8개 서류 항목 어휘 유지**: `src/data/jeonse.ts`의 매물은 등기부등본 / 선순위 보증금 /
  시세 대비 전세가율 / 건축물대장 / 임대인 명의 / 공인중개사 / 계약 특약 / 전입세대열람의
  8개 항목으로 구성된다. `suggested_house_seed`도 이 8칸에 맞춰 위험/정상 배분을 제시하면
  생성 에이전트가 바로 옮기기 쉽다.

## 파일 구성

| 파일 | 다루는 유형 |
|---|---|
| `kkangtong-jeonse.md` | 깡통전세 · 매매가 대비 과도한 전세가율 · 역전세 |
| `multi-household-priority.md` | 다가구주택 선순위 보증금 · 근저당 합산으로 시세 초과 |
| `trust-property.md` | 신탁등기 부동산 · 신탁회사 동의 없는 임대인 단독 계약 |
| `proxy-impersonation.md` | 임대인·대리인 사칭 · 위임장/인감 위조 · 명의신탁 |
| `duplicate-contract.md` | 이중·중복 계약 · 중개보조원 단독 계약 · 무자격 중개 |
| `new-build-builder.md` | 신축 빌라 바지사장 · 컨설팅업자 조직형 · 매매·전세 동시진행 |
| `legitimate-safe-patterns.md` | 정상 매물이 갖추는 조건 (safe 판정 매물 작성용 1차 자료) |

## 엔트리 스키마

각 카테고리 파일 안에 다음 형식으로 항목을 추가한다:

```markdown
## [<slug-id>] <한 줄 설명>
- category: <위 표의 유형>
- risk_signals: [서류/정황상 드러나는 위험 신호 3~6개]
- document_checkpoints: [이 위험을 잡아내는 확인 절차]
- red_flags_for_tenants: [세입자가 계약 전에 알아챌 수 있는 신호]
- safe_baseline: (해당 시) 이 유형에서 "정상"이라면 갖췄어야 할 조건
- sources: [기관명 (URL, 조회일), ...]
- abstraction_note: 실제 주소·소유자명·등기 고유번호·중개업 등록번호를 옮기지 않고 위험 패턴만 요약함
- suggested_house_seed: (선택) 8개 서류 항목 힌트 (위험/정상 배분 포함)
```

## 갱신 로그

- 이 줄은 예시입니다. `jeonse-case-researcher`가 실행될 때마다
  `YYYY-MM-DD — <무엇을 갱신했는지> (n건 추가)` 형식으로 아래에 append 합니다.
