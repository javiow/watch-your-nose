# 보이스피싱 사례 뱅크

`voice-phishing-case-researcher` 에이전트가 웹에서 수집한 실제 보이스피싱/정상 확인전화 사례를
**유형·흐름·심리적 압박 패턴 수준으로 추상화**해 정리한 자료다. `voice-phishing-scam-scenario-writer`와
`voice-phishing-normal-scenario-writer`가 `src/data/voice-phishing.ts`에 새 시나리오를 만들 때
근거 자료로 참고한다.

## 원칙

- **verbatim 금지**: 실제 사기 대사, 계좌번호, 악성 앱 이름, 피싱 URL, 피해자 개인정보를 그대로 옮기지 않는다.
  이 문서 자체가 가해자 대본으로 오용될 수 없어야 한다 ([ADR-005](../../ADR.md)).
- **출처 필수**: 금융감독원 보이스피싱 지킴이, 경찰청 사이버수사국, KISA, 신뢰할 수 있는 언론 보도 등
  공개 자료만 사용하고, 각 항목에 출처(기관명, URL, 조회일)를 남긴다. 근거 없는 사례는 만들지 않는다.
- **패턴 수준 요약**: `typical_flow`(전형적 진행 단계), `psychological_pressure_patterns`(심리적 압박 기법),
  `red_flags_for_victims`(피해자가 알아챌 수 있는 신호) 위주로 기록한다.

## 파일 구성

| 파일 | 유형 (`VoicePhishingCategory`) |
|---|---|
| `institution-impersonation.md` | 기관사칭형 |
| `loan-fraud.md` | 대출빙자형 |
| `kidnap-threat.md` | 납치협박형 |
| `messenger-phishing.md` | 메신저피싱형 |
| `refund-payment-impersonation.md` | 환불결제사칭형 |
| `delivery-impersonation.md` | 택배배송사칭형 |
| `legitimate-call-patterns.md` | 정상금융확인형 / 정상생활안내형 (정상 케이스 생성 에이전트 전용 1차 자료) |

## 엔트리 스키마

각 카테고리 파일 안에 다음 형식으로 항목을 추가한다:

```markdown
## [<slug-id>] <한 줄 설명>
- category: <VoicePhishingCategory 값>
- typical_flow: [단계1, 단계2, ...]
- psychological_pressure_patterns: [권위 사칭, 공포/처벌 위협, 긴급성, ...]
- red_flags_for_victims: [..., ...]
- sources: [기관명 (URL, 조회일), ...]
- abstraction_note: 실제 대사·계좌번호·앱 이름·URL을 옮기지 않고 흐름/패턴만 요약함
- suggested_scenario_seed: (선택) 후속 생성 에이전트를 위한 힌트
```

## 갱신 로그

- 이 줄은 예시입니다. `voice-phishing-case-researcher`가 실행될 때마다 `YYYY-MM-DD — <무엇을 갱신했는지> (n건 추가)` 형식으로 아래에 append 합니다.
- 2026-08-26 — institution-impersonation.md(기관사칭형) 시험 실행: 안전계좌 이체 패턴, 가짜 구속영장·셀프감금 신종수법, 허위 조직명 사칭 3건 추가 (3건 추가)
- 2026-08-26 — legitimate-call-patterns.md 시험 실행: 은행/카드사 정당한 이상거래 확인전화 패턴 1건 추가 (1건 추가)
