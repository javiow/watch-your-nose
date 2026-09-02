# Step 4: new-normal-scenario

## 읽어야 할 파일

먼저 아래 파일들을 읽고 설계 의도·불변식·톤을 파악하라:

- `/docs/ADR.md` (ADR-005, ADR-014 이번 phase 결정 + 난이도 배정표)
- `/docs/ARCHITECTURE.md` ("엣지 케이스 / 방어 로직"의 보이스피싱 항목)
- `/.claude/agents/voice-phishing-normal-scenario-writer.md` — 이 step은 이 에이전트의 역할이다. 안전
  가드레일 6개를 정독하라(특히 "정답 로직"이 scam writer와 정반대인 점).
- `/src/types/experience.ts` — `VoicePhishingScenario`, `DialogueNode`, `DialogueChoice`, `ChoiceRisk`, `Difficulty`
- `/src/data/voice-phishing.ts` — step2에서 난이도 태깅됨, step3에서 사기 3개 추가됨(총 9개). 기존 정상
  시나리오 3개(`normal-overseas-payment-alert`, `normal-delivery-address-confirm`,
  `normal-sim-reissue-alert`)의 톤·불변식을 그대로 따른다.
- `/src/data/voice-phishing.test.ts` — 개수 단언(step3에서 9로 갱신됨). 이 step에서 10으로 갱신 + 난이도×정상/사기 단언 1개 추가.
- `/docs/research/voice-phishing-case-bank/legitimate-call-patterns.md` — step1에서 `[legit-002]`
  (카드사 부정사용 의심 통보 패턴)이 추가됨. 이 시나리오의 근거.

## 배경

step3까지 완료하면 풀은 9개(정상 3 + 사기 6)이고 난이도 분포는:

- easy: 사기 2(`scam-fake-prosecutor-safe-account`, `scam-family-emergency-transfer`) — **정상 없음**
- medium: 정상 1 + 사기 3
- hard: 정상 2 + 사기 1

easy에 정상 시나리오가 없다. 이 step은 **정상 시나리오 1개(`normal-card-fraud-block`, easy)** 를 추가해
"모든 난이도에 정상·사기가 최소 1개씩"을 완성한다. 최종 풀은 **10개(정상 4 + 사기 6)**.

다루는 파일은 `src/data/voice-phishing.ts` + `src/data/voice-phishing.test.ts` 둘뿐이다.

> 참고: 서브에이전트를 띄울 수 있으면 `voice-phishing-normal-scenario-writer`를 호출해도 되고, 직접
> 작성해도 된다. 어느 쪽이든 아래 사양을 지킨다.

## 작업

### 추가할 정상 시나리오

| id | category | isNormalCase | difficulty | 근거 |
|---|---|---|---|---|
| `normal-card-fraud-block` | `정상금융확인형` | `true` | `"easy"` | `legitimate-call-patterns.md` `[legit-002]` 인용 |

**요지**: OO카드사가 이상 승인 시도를 감지해 **선제적으로 해당 카드를 정지 처리**했다고 통보 →
본인 사용이 맞는지 단순 확인 → (필요 시) 재발급은 카드 뒷면 대표번호나 공식 앱에서 직접 하라고 안내 →
"추가로 요청드릴 정보는 없다"며 마무리. `speaker`는 "OO카드 이상거래 모니터링팀" 같은 익명형.

난이도가 `easy`인 이유: 위험한 요구(비밀번호·CVC·OTP·원격앱·즉시이체)가 전혀 없고, "이미 정지했고
추가 정보는 필요 없다"는 정상 신호가 뚜렷하다 — 차분히 들으면 어렵지 않게 정상으로 판단 가능.

### 시나리오 구조 불변식 (`voice-phishing.test.ts`가 강제)

- `startNodeId`가 `nodes`에 존재. 노드 id는 `n1`, `n2`, … (기존 정상 시나리오 관례).
- 최장 체인 **3~5개 노드**. 모든 노드에 `choices` 1개 이상.
- **정상 시나리오의 시작 노드에는 `risk: "danger"` 이면서 `next`가 없는(듣지도 않고 끊기/무시) 선택지가
  반드시 하나 있다** — 반사적 거부는 첫 턴부터 오답(scam writer와 정반대).
- `risk: "caution"` 선택지는 **항상 `next`를 가진다**. 최소 1개 노드에 `caution` 분기.
- `risk: "danger"` 선택지는 **항상 `next`가 없다**(항상 종료). 정상 시나리오에서 `danger`는 "듣지도
  확인하지도 않고 끊거나 무시하는" 선택지에 붙인다(어느 노드든).
- `safe` 종료와 `danger` 종료가 둘 다 도달 가능.
- `safe`는 (a) 요청에 정상적으로 협조하거나 (b) "미심쩍으면 카드 뒷면·공식 앱 등 **공식 채널로 직접
  재확인**하겠다"처럼 근거 있는 확인 절차를 골랐을 때만. `caution`은 근거 있는 확인도 완전 무시도 아닌
  회색지대(대충 얼버무려 넘어감).
- `difficulty: "easy"`.

### 콘텐츠 안전 (normal-scenario-writer 가드레일)

- 발신자(`speaker`)는 계좌 비밀번호·보안카드·CVC·OTP 전체 값, 원격제어 앱 설치, 즉시 계좌 이체/송금,
  주민등록번호 전체를 **절대 요구하지 않는다**. 기존 정상 시나리오의 불변식("추가로 요청드릴 정보는
  없습니다"류 명시적 마무리)을 유지한다.
- 긴장감의 원천은 다급한 말투·공식적 어조·"이상 승인이 감지돼 카드를 정지했다"는 사실 통지여야 하고,
  금지 목록의 위험 요청이면 안 된다.
- `legitimate-call-patterns.md` `[legit-002]`를 근거로 삼고 `summary`에 인용한다.

### 테스트 갱신 (`src/data/voice-phishing.test.ts`)

1. step3에서 `9`로 바꾼 개수 단언을 `10`으로:
   - `it("정확히 9개 시나리오(정상 3개 + 사기 6개)로 구성된다", ...)` →
     `it("정확히 10개 시나리오(정상 4개 + 사기 6개)로 구성된다", ...)`
   - `expect(VOICE_PHISHING_SCENARIOS).toHaveLength(10);`
   - 정상 `.toHaveLength(3)` → `.toHaveLength(4)`
   - 사기 `.toHaveLength(6)` 유지
2. `describe("VOICE_PHISHING_SCENARIOS 난이도 태깅", ...)` 블록에 아래 `it`을 추가:

```ts
  it("easy·medium·hard 각각에 정상·사기 시나리오가 모두 있다", () => {
    for (const level of ["easy", "medium", "hard"] as const) {
      const inLevel = VOICE_PHISHING_SCENARIOS.filter(
        (scenario) => scenario.difficulty === level
      );
      expect(inLevel.some((scenario) => scenario.isNormalCase)).toBe(true);
      expect(inLevel.some((scenario) => !scenario.isNormalCase)).toBe(true);
    }
  });
```

### TDD 순서

1. 개수 단언 10 / 정상 4로 바꾸고 위 `it`을 추가한다 → `npm run test -- voice-phishing` red
   (개수 불일치 + easy에 정상 없음으로 새 `it` 실패).
2. `normal-card-fraud-block` 시나리오를 `VOICE_PHISHING_SCENARIOS` 배열에 추가.
3. `npm run test -- voice-phishing registry` green.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

- `VOICE_PHISHING_SCENARIOS`가 10개(정상 4 + 사기 6).
- easy/medium/hard 각각에 정상·사기 시나리오가 모두 존재(새 `it` 통과).
- 신규 시나리오가 그래프 무결성·`caution`/`danger`·**시작 노드 danger-terminal**·최장 체인 3~5 단언 통과.
- `registry.test.ts`의 voice-phishing 난이도 매칭 단언이 계속 통과.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 시작 노드에 `risk:"danger"` && `next` 없는 "반사적 거부" 선택지가 있는가? (정상 불변식 — scam과 정반대)
   - 발신자가 비밀번호·CVC·OTP·원격앱·즉시이체·주민번호 전체를 요구하지 않는가?
   - "추가로 요청드릴 정보는 없다"류로 마무리되는가?
   - `difficulty`가 `"easy"`인가? 근거 `[legit-002]`를 `summary`에 인용했는가?
   - 최종 분포가 easy(정상1/사기2), medium(정상1/사기3), hard(정상2/사기1)인가?
   - CLAUDE.md CRITICAL: 피해자 관점, 유형명 비노출, `dangerouslySetInnerHTML` 미사용.
3. 결과에 따라 `phases/7-voice-phishing-difficulty-content/index.json`의 `step: 4` 항목을 업데이트한다.
   - `summary` 예: "정상 시나리오 normal-card-fraud-block(정상금융확인형/easy, [legit-002] 근거) 추가 — 최종 10개(정상4/사기6), easy/medium/hard 각각 정상·사기 공존. voice-phishing.test.ts 개수 9→10(정상4) + 난이도×정상/사기 단언 추가. test N 통과"
4. 이 step이 완료되면 phase 전체가 끝난다 — `phases/index.json`의 `7-voice-phishing-difficulty-content` 항목 상태도 확인한다(execute.py가 처리하지만 수동 실행 시 직접 갱신).

## 금지사항

- 사기(`isNormalCase: false`) 시나리오를 추가하지 마라. 이유: 사기 3개는 step3에서 이미 추가됐다. 이 step은 정상 1개로 난이도×정상/사기 매트릭스를 완성하는 것이 목적이다.
- 시작 노드의 `danger`-terminal(반사적 거부 함정) 선택지를 빼지 마라. 이유: 정상 시나리오는 "듣지도 않고 끊기"가 첫 턴부터 오답이어야 한다 — 이 앱이 가르치려는 것은 "모든 낯선 전화를 끊어라"가 아니라 "요청 내용으로 판단하라"이다.
- 발신자가 비밀번호·OTP·원격앱·즉시이체·주민번호 전체를 요구하게 만들지 마라. 이유: 그러면 정상 시나리오가 아니라 사기 시나리오가 된다(정답 로직이 뒤집힌다).
- 기존 9개 시나리오와 난이도 태그, step3의 개수 단언 구조를 재작성하지 마라. 이유: 이 step은 신규 1개 추가 + 개수 9→10 갱신 + 난이도 매트릭스 단언 1개 추가만 한다.
- 기존 테스트를 깨뜨리지 마라.
