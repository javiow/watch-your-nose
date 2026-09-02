# Step 1: case-bank-research

## 읽어야 할 파일

먼저 아래 파일들을 읽고 사례 뱅크의 스키마·원칙·기존 톤을 파악하라:

- `/docs/ADR.md` (ADR-005 피해자 관점 전용, ADR-014 이번 phase의 결정)
- `/docs/research/voice-phishing-case-bank/README.md` (엔트리 스키마·원칙·갱신 로그 형식)
- `/docs/research/voice-phishing-case-bank/institution-impersonation.md` (이미 채워진 3건 — 항목 형식·추상화 수준·출처 표기의 기준 예시)
- `/.claude/agents/voice-phishing-case-researcher.md` (이 step은 이 에이전트의 역할을 그대로 수행한다 — 규칙을 정독하라)
- 갱신 대상 파일 4개:
  - `/docs/research/voice-phishing-case-bank/kidnap-threat.md`
  - `/docs/research/voice-phishing-case-bank/messenger-phishing.md`
  - `/docs/research/voice-phishing-case-bank/delivery-impersonation.md`
  - `/docs/research/voice-phishing-case-bank/legitimate-call-patterns.md`

## 배경

`src/data/voice-phishing.ts`에 실제 사례 기반 시나리오 4종(사기 3 + 정상 1)을 추가하려는데(step3~4),
근거가 될 사례 뱅크의 해당 카테고리가 비어 있다. 이 step에서 **웹 조사로 사례 뱅크만 채운다.**
코드(`src/`)는 건드리지 않는다.

이 step은 `voice-phishing-case-researcher` 에이전트의 작업 그 자체다. 서브에이전트를 띄울 수 있으면
`voice-phishing-case-researcher`를 호출해도 되고, 직접 수행해도 된다. 어느 쪽이든 아래 규칙을 지킨다.

## 작업

### 조사·기록 규칙 (CRITICAL — `.claude/agents/voice-phishing-case-researcher.md` + README 원칙)

- **공개 자료만**: 금융감독원 보이스피싱 지킴이, 경찰청(사이버수사국), KISA, 은행/카드사 공식 보도자료,
  신뢰할 수 있는 언론 보도. 각 항목에 `sources`로 기관명·URL·조회일(오늘 날짜)을 남긴다.
  출처를 확인하지 못하면 그 항목을 만들지 않는다(억지로 채우지 말 것).
- **verbatim 금지 (defense-in-depth, ADR-005)**: 사기범 대사를 그대로 옮기지 않는다. 실제 계좌번호,
  실제 악성 원격제어 앱 이름, 실제 피싱 URL/전화번호, 피해자 실명·식별 가능 개인정보를 적지 않는다.
- **패턴 수준 요약만**: `typical_flow`(전형적 진행, 3~5단계), `psychological_pressure_patterns`
  (권위 사칭 / 공포·처벌 위협 / 긴급성 / 신뢰 증폭 등 기법 유형), `red_flags_for_victims`
  (피해자가 알아챌 수 있는 신호).
- 각 항목 끝에 `abstraction_note`로 "실제 대사·계좌번호·앱 이름·URL을 옮기지 않고 흐름/패턴만 요약함" 명시.
- 비슷한 기존 항목이 있으면 새로 만들지 말고 그 항목의 `sources`만 보강한다(이번엔 대상 3개 카테고리가
  비어 있으므로 신규 추가가 기본).

### 엔트리 형식 (README 스키마 그대로)

```markdown
## [<slug-id>] <한 줄 설명>
- category: <VoicePhishingCategory 값>
- typical_flow: [단계1, 단계2, ...]
- psychological_pressure_patterns: [...]
- red_flags_for_victims: [...]
- sources: [기관명 (URL, 조회일), ...]
- abstraction_note: 실제 대사·계좌번호·앱 이름·URL을 옮기지 않고 흐름/패턴만 요약함
- suggested_scenario_seed: (선택) 후속 생성 에이전트를 위한 힌트
```

각 `.md` 파일의 `<!-- voice-phishing-case-researcher가 이 아래에 항목을 추가합니다. -->` 주석 아래에 추가한다.

### 채울 항목

1. **`kidnap-threat.md`** (category: `납치협박형`) — 1~2건.
   - 가족·지인의 사고/납치/체포를 빙자해 공포를 유발하고 즉시 현금 송금·전달을 요구하는 전형.
   - `slug-id` 예: `kidnap-threat-001`. (실제 조사 결과에 맞춰 명명)
2. **`messenger-phishing.md`** (category: `메신저피싱형`) — 1~2건.
   - 카카오톡 등 메신저에서 가족·지인을 사칭(프로필 도용)해 급한 송금·상품권(기프트카드) 구매·대납을
     요청하고, 전화 통화는 이런저런 이유로 회피하는 전형.
   - `slug-id` 예: `messenger-phishing-001`.
3. **`delivery-impersonation.md`** (category: `택배배송사칭형`) — 1~2건.
   - 택배 배송 문제(반송, 통관/관세 미납, 주소 불일치 등)를 빙자해 링크 클릭·개인정보 입력·소액 결제를
     유도하고 이후 다른 사칭으로 연결하는 전형.
   - `slug-id` 예: `delivery-impersonation-001`.
4. **`legitimate-call-patterns.md`** (category: `정상금융확인형`) — 1건 보강.
   - **카드사의 정당한 부정사용 의심 통보 전화** 패턴: 이상 승인 감지 → 카드사가 선제적으로 해당 카드를
     정지/보류 처리했다고 통보 → 본인 사용이 맞는지 단순 확인 → 재발급은 공식 앱/고객센터 대표번호로
     안내하고 추가 정보(비밀번호·CVC·OTP·주민번호 전체 등)는 요구하지 않음.
   - `slug-id`: `legit-002`. 기존 `legit-001`(은행 이상거래 확인전화)과 형식을 맞춘다.
   - 이 파일 상단의 "정당한 확인전화가 절대 요구하지 않는 것" 목록과 모순되지 않게 작성한다.

### 갱신 로그

`README.md`의 "갱신 로그" 목록 맨 아래에 한 줄 append:

```
- <오늘 날짜 YYYY-MM-DD> — kidnap-threat.md / messenger-phishing.md / delivery-impersonation.md / legitimate-call-patterns.md 갱신: 납치협박·메신저피싱·택배배송사칭 + 카드사 부정사용 통보 패턴 (n건 추가)
```

`n`은 실제 추가한 항목 수로 채운다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

(코드 변경이 없으므로 이 커맨드들이 변경 전과 동일하게 통과하는지만 확인한다.)

추가로 문서 확인:

```bash
# 4개 파일에 새 항목(## [ ... ]) 이 실제로 들어갔는지
grep -c '^## \[' docs/research/voice-phishing-case-bank/kidnap-threat.md docs/research/voice-phishing-case-bank/messenger-phishing.md docs/research/voice-phishing-case-bank/delivery-impersonation.md
grep -c '^## \[legit-002\]' docs/research/voice-phishing-case-bank/legitimate-call-patterns.md
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 사례 뱅크 체크리스트:
   - `src/` 아래 파일을 전혀 수정하지 않았는가?
   - 새 항목이 전부 README 스키마(7개 필드)를 따르는가?
   - 각 항목에 실제 공개 출처(기관명 + URL + 조회일)가 있는가? 근거 없는 창작은 없는가?
   - 실제 대사 verbatim·계좌번호·악성 앱 이름·피싱 URL·개인정보가 들어가지 않았는가?
   - `typical_flow`가 3~5단계인가?
   - `README.md` 갱신 로그에 한 줄이 추가됐는가?
3. 결과에 따라 `phases/7-voice-phishing-difficulty-content/index.json`의 `step: 1` 항목을 업데이트한다.
   - 웹 조사 도구(WebSearch/WebFetch)를 쓸 수 없는 환경이면 `"status": "blocked"`,
     `"blocked_reason": "웹 조사 도구 미제공 — 사례 뱅크를 공개 출처로 채울 수 없음"` 후 즉시 중단한다.
     추측으로 사례를 지어내지 마라.

## 금지사항

- `src/` 아래 어떤 파일도 수정하지 마라. 이유: 이 step은 근거 자료(사례 뱅크)만 만든다. 시나리오 코드는 step3~4.
- 출처 없이 사례를 창작하지 마라. 이유: 사례 뱅크의 존재 이유가 "검증된 공개 자료 기반"이다. 근거 없는 항목은 뱅크의 신뢰를 무너뜨린다.
- 실제 사기 대사를 그대로 옮기거나, 악성 앱 이름·피싱 URL·계좌번호를 적지 마라. 이유: 이 문서가 가해자 대본으로 오용될 수 있다(ADR-005).
- `institution-impersonation.md`, `loan-fraud.md`는 건드리지 마라. 이유: 이번 phase의 신규 시나리오는 납치협박·메신저피싱·택배배송·정상(카드사) 4종뿐이다.
- 기존 테스트를 깨뜨리지 마라.
