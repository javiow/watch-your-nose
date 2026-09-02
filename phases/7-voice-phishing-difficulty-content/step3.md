# Step 3: new-scam-scenarios

## 읽어야 할 파일

먼저 아래 파일들을 읽고 설계 의도·불변식·톤을 파악하라:

- `/docs/ADR.md` (ADR-005 피해자 관점 전용, ADR-014 이번 phase 결정 + 난이도 배정표)
- `/docs/ARCHITECTURE.md` ("보안" 절, "엣지 케이스 / 방어 로직"의 보이스피싱 항목)
- `/.claude/agents/voice-phishing-scam-scenario-writer.md` — 이 step은 이 에이전트의 역할이다. 안전
  가드레일 6개를 정독하라.
- `/src/types/experience.ts` — `VoicePhishingScenario`, `DialogueNode`, `DialogueChoice`,
  `ChoiceRisk`(`"safe" | "caution" | "danger"`), `VoicePhishingCategory`, `Difficulty`
- `/src/data/voice-phishing.ts` — 기존 시나리오(step2에서 `difficulty` 태깅 완료). id 네이밍·톤·
  구조를 그대로 따른다.
- `/src/data/voice-phishing.test.ts` — 데이터 무결성 + 개수 단언. 이 step에서 개수 단언을 갱신한다.
- `/docs/research/voice-phishing-case-bank/kidnap-threat.md`
- `/docs/research/voice-phishing-case-bank/messenger-phishing.md`
- `/docs/research/voice-phishing-case-bank/delivery-impersonation.md`
  (위 3개는 step1에서 채워짐 — 각 시나리오의 근거로 삼는다)

## 배경

step2에서 기존 6개에 난이도를 태깅했지만 easy에는 사기만, hard에는 정상만 있어 난이도별 정상·사기
균형이 아직 없다. 이 step은 **사기 시나리오 3개**를 추가해 빈 카테고리(납치협박형·메신저피싱형·
택배배송사칭형)를 채우고 난이도 분포를 넓힌다. 정상 시나리오 1개는 step4.

다루는 파일은 `src/data/voice-phishing.ts` + `src/data/voice-phishing.test.ts` 둘뿐이다.

> 참고: 서브에이전트를 띄울 수 있으면 `voice-phishing-scam-scenario-writer`를 **한 번에 하나씩 순차**
> 호출해도 된다(그 에이전트는 `voice-phishing.ts`/`voice-phishing.test.ts`를 병렬 편집하지 않는다).
> 직접 작성해도 되며, 어느 쪽이든 아래 사양을 지킨다.

## 작업

### 추가할 사기 시나리오 3개

| id | category | difficulty | 근거(step1 사례 뱅크) | 요지 |
|---|---|---|---|---|
| `scam-family-emergency-transfer` | `납치협박형` | `"easy"` | `kidnap-threat.md`의 항목 `[id]` 1개 이상 인용 | 가족의 사고/체포/납치를 빙자, 극도의 공포·긴급성으로 즉시 현금 송금·전달 요구 |
| `scam-customs-fee-delivery` | `택배배송사칭형` | `"medium"` | `delivery-impersonation.md`의 항목 `[id]` 1개 이상 인용 | 해외배송 물품의 통관/관세 미납을 빙자, 소액 결제·개인정보 입력 유도 후 추가 사칭으로 연결 |
| `scam-messenger-impersonation-giftcard` | `메신저피싱형` | `"hard"` | `messenger-phishing.md`의 항목 `[id]` 1개 이상 인용 | 메신저에서 지인(프로필 도용) 사칭, 급전/모바일 상품권 대납 요청, 통화는 이유를 대며 회피 |

`speaker`는 상황에 맞는 익명형으로: 납치협박형은 협박범/사칭 수사관("OO경찰서 강력팀" 등 익명),
메신저피싱형은 "메신저 대화 상대(가족/지인 사칭)", 택배배송사칭형은 "OO택배 고객센터"·"OO세관" 등.

### 시나리오 구조 불변식 (전부 지켜야 함 — `voice-phishing.test.ts`가 강제)

- `startNodeId`가 `nodes` 안에 실제로 존재한다. 신규 노드 id는 `s1`, `s2`, … 로 붙인다(기존 사기 시나리오 관례).
- `startNodeId`부터 `next`를 따라가는 **최장 체인이 3~5개 노드**.
- 모든 노드에 `choices`가 1개 이상.
- **사기 시나리오의 시작 노드에는 `risk: "safe"` 이면서 `next`가 없는(즉시 거절·끊기) 선택지가 반드시 하나 있다** — 즉시 거절이 언제나 정답.
- `risk: "caution"` 선택지는 **항상 `next`를 가진다**(시나리오를 즉시 끝내지 않는다). 최소 1개 노드에 `caution` 분기가 있어야 한다.
- `risk: "danger"` 선택지는 **항상 `next`가 없다**(항상 시나리오 종료). `danger`는 정보 제공·이체·앱 설치·상품권 코드 전달 등 **순응 선택지에만**, 그리고 **가장 위험한 마지막 노드에만** 둔다.
- `startNodeId`에서 도달 가능한 선택지 중 `safe` 종료(`risk:"safe"` && `next` 없음)와 `danger` 종료가 **둘 다** 존재한다.
- 각 시나리오에 `difficulty` 필드를 위 표대로 넣는다.

### 콘텐츠 안전 (ADR-005 + scam-scenario-writer 가드레일)

- 가해자(`speaker`) 대사는 노드당 1~2문장, 짧고 정형화. 실제 계좌번호·악성 앱 이름·피싱 URL·구체적
  범행 절차(설치 방법 단계별 안내 등)를 재현하지 마라. `danger`(순응) 선택지도 실행 가능한 사기 절차
  안내가 되지 않게 추상적으로("안내에 따라 상품권 핀번호를 불러준다" 수준).
- 기관명·상호명은 "OO경찰서", "OO택배", "OO세관"처럼 익명화. 실존 기관/기업 실명을 가해자로 쓰지 마라.
- 피해자 관점(방어)만. 가해자가 "성공"하는 절차를 학습시키지 않는다.
- 각 시나리오가 근거로 삼은 사례 뱅크 항목 `[id]`를 이 step의 `summary`에 인용한다. 근거 없는 순수 창작 금지.

### 테스트 갱신 (`src/data/voice-phishing.test.ts`)

- `it("정확히 6개 시나리오(정상 3개 + 사기 3개)로 구성된다", ...)` 를
  `it("정확히 9개 시나리오(정상 3개 + 사기 6개)로 구성된다", ...)` 로 바꾸고 내부 단언을:
  - `expect(VOICE_PHISHING_SCENARIOS).toHaveLength(9);`
  - 정상: `.toHaveLength(3)` 유지
  - 사기: `.toHaveLength(3)` → `.toHaveLength(6)`
- 그 외 단언(그래프 무결성, `caution`/`danger` 규칙, 시작 노드 safe-terminal, 난이도 커버리지 등)은
  건드리지 않는다 — 새 시나리오가 그 단언들을 자동으로 만족해야 한다.
- step2에서 추가한 "easy·medium·hard 각각 최소 1개" 단언은 그대로 통과한다(신규는 easy/medium/hard 1개씩).

### TDD 순서

1. `voice-phishing.test.ts`의 개수 단언을 9 / 정상 3 / 사기 6으로 먼저 바꾼다 → `npm run test -- voice-phishing` red.
2. 시나리오 3개를 `VOICE_PHISHING_SCENARIOS` 배열에 추가한다(기존 배열 끝에 append).
3. `npm run test -- voice-phishing registry` green.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

- `VOICE_PHISHING_SCENARIOS`가 9개(정상 3 + 사기 6).
- 신규 3개가 그래프 무결성·`caution`/`danger`·시작 노드 safe-terminal·최장 체인 3~5 단언을 전부 통과.
- 신규 3개의 `difficulty`가 각각 easy / medium / hard.
- `registry.test.ts`의 voice-phishing 난이도 매칭 단언이 계속 통과.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 신규 시나리오 3개가 각각 근거 사례 뱅크 항목 `[id]`를 가지는가? (`summary`에 인용)
   - 가해자 대사에 실제 계좌번호·앱 이름·URL·단계별 범행 절차가 없는가? 실존 기관 실명이 없는가?
   - 시작 노드에 `risk:"safe"` && `next` 없는 즉시 거절 선택지가 있는가? (사기 불변식)
   - `danger` 선택지가 전부 마지막(가장 위험한) 노드의 순응 선택지인가? `next`가 없는가?
   - `caution` 선택지가 전부 `next`를 가지는가? 최소 1개 노드에 `caution` 분기가 있는가?
   - CLAUDE.md CRITICAL: 피해자 관점만 다루는가? 유형명을 사용자에게 노출하지 않는가?(`category`는 내부 메타데이터)
3. 결과에 따라 `phases/7-voice-phishing-difficulty-content/index.json`의 `step: 3` 항목을 업데이트한다.
   - `summary` 예: "사기 시나리오 3종 추가 — scam-family-emergency-transfer(납치협박형/easy, [kidnap-threat-00x] 근거), scam-customs-fee-delivery(택배배송사칭형/medium, [delivery-impersonation-00x]), scam-messenger-impersonation-giftcard(메신저피싱형/hard, [messenger-phishing-00x]). voice-phishing.test.ts 개수 단언 6→9(정상3/사기6). test N 통과"

## 금지사항

- 정상(`isNormalCase: true`) 시나리오를 추가하지 마라. 이유: 정상 1개는 step4에서 별도 사양·근거(정상 통화 패턴)로 다룬다.
- `danger` 선택지에 `next`를 달거나, `caution` 선택지의 `next`를 빼지 마라. 이유: `VoicePhishingExperience`의 종료 판정과 `voice-phishing.test.ts` 불변식이 이 규칙에 의존한다.
- 시작 노드에서 즉시 거절(`safe` + no `next`) 선택지를 빼지 마라. 이유: 사기 시나리오는 "묻지도 따지지도 않고 끊기"가 항상 정답이어야 한다(정상 시나리오와 정반대 규칙).
- 실제 사기 대사 verbatim, 악성 앱 이름, 피싱 URL, 계좌번호, 설치/이체 단계별 안내를 쓰지 마라. 이유: 콘텐츠가 실제로 통하는 사기 대본으로 오용될 수 있다(ADR-005).
- 기존 6개 시나리오와 step2의 난이도 태그를 수정하지 마라. 이유: 이 step은 신규 3개 추가 + 개수 단언 갱신만 한다.
- 기존 테스트를 깨뜨리지 마라.
