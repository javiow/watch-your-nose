# Step 2: existing-difficulty-tags

## 읽어야 할 파일

먼저 아래 파일들을 읽고 설계 의도를 파악하라:

- `/docs/ADR.md` (ADR-012 난이도 메커니즘, ADR-014 이번 phase 결정 + 난이도 배정표)
- `/docs/ARCHITECTURE.md` ("엣지 케이스 / 방어 로직"의 `pickRandomContent`/`pickByDifficulty` 항목)
- `/src/types/experience.ts` — `Difficulty` 유니온(`"easy" | "medium" | "hard"`), `VoicePhishingScenario`
  인터페이스의 `difficulty?: Difficulty` 선택 필드(이미 존재, 추가할 필요 없음)
- `/src/data/voice-phishing.ts` — 기존 시나리오 6개. 톤·구조를 그대로 유지한다.
- `/src/data/voice-phishing.test.ts` — 데이터 무결성 테스트. 이 step에서 단언을 추가한다.
- `/src/lib/registry.ts` — `pickByDifficulty<T>`(난이도 필터 → 매칭 0건이면 전체 풀 fallback),
  `EXPERIENCE_MODULES`의 `voice-phishing` 모듈
- `/src/lib/registry.test.ts` — 특히 "jeonse 모듈은 각 난이도에 대해 그 난이도의 5채 배열을 반환한다"
  테스트(이번에 보이스피싱용으로 유사 단언을 추가한다)
- `/src/data/difficulty.ts` — 난이도 정의(easy=위험 신호 뚜렷 / medium=여러 정보 종합 / hard=겉과 실제가 다름)

## 배경

`VOICE_PHISHING_SCENARIOS`의 6개 시나리오에 `difficulty` 태그가 하나도 없어서 `pickByDifficulty`가
항상 전체 풀 fallback을 타고 난이도 선택이 무시된다. 이 step은 **기존 6개에 난이도를 부여**하고,
난이도 커버리지를 강제하는 테스트를 추가한다. 신규 시나리오(사기 3 + 정상 1)는 step3~4에서 다룬다.

이 step에서 다루는 파일은 `src/data/voice-phishing.ts`(데이터), `src/data/voice-phishing.test.ts`,
`src/lib/registry.test.ts`(테스트 2개)뿐이다. `registry.ts` 로직·`experience.ts` 타입·컴포넌트는
건드리지 않는다(태그만 채우면 기존 `pickByDifficulty`가 자동으로 동작한다).

## 작업

### TDD 순서

1. 먼저 `src/data/voice-phishing.test.ts`에 아래 `describe` 블록을 추가한다(파일 맨 끝, 마지막 `});` 뒤):

```ts
describe("VOICE_PHISHING_SCENARIOS 난이도 태깅", () => {
  it("모든 시나리오는 difficulty가 easy|medium|hard 중 하나로 태깅되어 있다", () => {
    for (const scenario of VOICE_PHISHING_SCENARIOS) {
      expect(["easy", "medium", "hard"]).toContain(scenario.difficulty);
    }
  });

  it("easy·medium·hard 각각 최소 1개 시나리오가 있다", () => {
    for (const level of ["easy", "medium", "hard"] as const) {
      expect(
        VOICE_PHISHING_SCENARIOS.some((scenario) => scenario.difficulty === level)
      ).toBe(true);
    }
  });
});
```

2. `src/lib/registry.test.ts`의 `describe("EXPERIENCE_MODULES 난이도 선택", ...)` 안에 아래 `it`을 추가한다
   (jeonse 단언 바로 아래):

```ts
  it("voice-phishing 모듈은 각 난이도에 대해 그 난이도의 시나리오를 반환한다", () => {
    const voicePhishing = EXPERIENCE_MODULES.find(
      (mod) => mod.typeId === "voice-phishing"
    );
    expect(voicePhishing).toBeDefined();
    for (const d of ["easy", "medium", "hard"] as Difficulty[]) {
      for (let i = 0; i < 20; i += 1) {
        const scenario = voicePhishing!.pickRandomContent(d) as {
          difficulty?: Difficulty;
        };
        expect(scenario.difficulty).toBe(d);
      }
    }
  });
```

3. `npm run test -- voice-phishing registry` 로 red 확인(새 단언이 실패해야 한다).

4. `src/data/voice-phishing.ts`의 기존 6개 시나리오 객체 각각에 `difficulty` 필드를 추가한다.
   객체 내 위치는 `category` 다음 줄이 자연스럽다. 값은 아래 표를 **그대로** 쓴다(ADR-014 확정):

| id | difficulty | 배정 근거 |
|---|---|---|
| `normal-overseas-payment-alert` | `"medium"` | 사기처럼 들리나 정상 — 요청 내용(이름·생년월일만)을 따져봐야 정상임을 판단 |
| `normal-delivery-address-confirm` | `"hard"` | 반송·회수 긴급 압박으로 사기처럼 느껴지나 위험한 요구가 전혀 없음(겉과 실제가 다름) |
| `scam-refund-remote-app` | `"medium"` | "환불" 전제는 자연스럽고 원격 앱 요구를 종합 판단해야 함 |
| `scam-government-loan-program` | `"medium"` | 저금리 대환대출 전제로 시작해 주민번호→계좌 비밀번호까지 점진적 에스컬레이션 |
| `normal-sim-reissue-alert` | `"hard"` | "통신사 보안센터"의 유심 재발급 차단 통보가 이례적이라 반사적으로 끊으면 오답 |
| `scam-fake-prosecutor-safe-account` | `"easy"` | 검찰이 전화 + "안전계좌" + 이체 요구 = 가장 유명한 전형, 위험 신호 뚜렷 |

   결과 분포(6개): easy 1(사기 1) / medium 3(정상 1 + 사기 2) / hard 2(정상 2).
   각 난이도에 정상·사기가 모두 존재하지는 않지만(easy는 사기만, hard는 정상만) 그건 step4에서
   신규 시나리오로 채운다 — 이 step의 테스트는 "각 난이도 최소 1개"까지만 강제한다.

5. `npm run test -- voice-phishing registry` 로 green 확인.

### 지켜야 할 규칙

- `difficulty` 값은 반드시 코드 식별자 `"easy" | "medium" | "hard"` 중 하나다. 한글 라벨을 쓰지 마라.
- 기존 시나리오의 `nodes`·`choices`·`line`·`risk`·`speaker`·문구는 **한 글자도 바꾸지 마라.**
  이 step은 `difficulty` 한 줄만 추가한다.
- `src/types/experience.ts`는 수정하지 마라 — `difficulty?: Difficulty`는 이미 선언돼 있다.
- `src/lib/registry.ts`(로직)는 수정하지 마라 — `pickByDifficulty`는 태그만 채우면 그대로 동작한다.
- `voice-phishing.test.ts`의 기존 단언(개수 6개 = 정상 3 + 사기 3 등)은 이 step에서 바꾸지 마라 —
  개수 변경은 step3~4에서 신규 시나리오와 함께 처리한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

- `voice-phishing.test.ts`의 새 난이도 단언 2개가 통과한다.
- `registry.test.ts`의 새 voice-phishing 난이도 단언이 통과한다(fallback을 타지 않고 요청 난이도와 일치).
- 기존 테스트 전부 통과(개수·그래프 무결성 단언 포함).

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `src/types/experience.ts`, `src/lib/registry.ts`, 컴포넌트 파일을 수정하지 않았는가?
   - 6개 시나리오 전부에 `difficulty`가 표대로 들어갔는가? (오타·값 뒤바뀜 없는지 확인)
   - 기존 시나리오 본문(대사·선택지·risk)이 그대로인가? (`git diff`로 `difficulty` 줄 추가 외 변경이 없어야 함)
   - CLAUDE.md CRITICAL: `difficulty`는 렌더링에 노출되지 않는 내부 메타데이터로만 쓰이는가?
3. 결과에 따라 `phases/7-voice-phishing-difficulty-content/index.json`의 `step: 2` 항목을 업데이트한다.
   - 성공 → `"status": "completed"`, `"summary"`에 "기존 6개 시나리오 difficulty 태깅(easy 1/medium 3/hard 2), voice-phishing.test.ts 난이도 커버리지 단언 2건 + registry.test.ts voice-phishing 난이도 매칭 단언 1건 추가. test N 통과" 형식으로 기록.

## 금지사항

- `voice-phishing.ts`의 시나리오 개수를 늘리거나 줄이지 마라. 이유: 신규 시나리오는 step3~4에서 추가하며, 그때 `voice-phishing.test.ts`의 개수 단언도 함께 갱신한다. 지금 손대면 step 경계가 흐려진다.
- `pickByDifficulty`/`pickJeonseSet`/`registry.ts`의 로직을 수정하지 마라. 이유: 이 함수들은 이미 난이도 필터 + fallback을 올바로 구현하고 있고, 이번 문제는 순전히 데이터 태깅 누락이다.
- 난이도 값을 한글(`"쉬움"` 등)로 넣지 마라. 이유: 코드 식별자는 영문이고 한글은 `difficulty.ts`의 표시용 라벨이다(`Grade`, `JeonseDifficulty`와 동일 규칙).
- 기존 테스트를 깨뜨리지 마라.
