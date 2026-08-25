# Step 1: voice-phishing-content

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, `/docs/ADR.md` (step0에서 ADR-006 추가 및 보이스피싱 채팅형 UI 관련 서술이 갱신됨 — 반드시 최신 내용을 읽는다)
- `src/types/experience.ts` (`DialogueNode`/`DialogueChoice`/`VoicePhishingScenario` 타입 — 이번 step에서 타입은 변경하지 않는다)
- `src/data/voice-phishing.ts`, `src/data/voice-phishing.test.ts` (교체 대상 현재 콘텐츠와 기존 테스트 불변 조건)
- `src/data/remediation.ts`, `src/data/remediation.test.ts` (대응 방안 매핑 패턴)

## 작업

보이스피싱 콘텐츠 풀을 새로 설계한 4개 시나리오로 **전면 교체**하고, 새로 생기는 오답 유형에 대한 대응 방안 문구를 추가한다.

### 1. `src/data/voice-phishing.ts` 전면 교체

기존 `scam-loan-consolidation`, `normal-card-confirm` 2개 시나리오를 지우고 아래 4개로 교체한다. `nodes`/`DialogueNode`/`DialogueChoice`(`next` 포인터로 그래프 연결) 구조와 `refuse-`로 시작하는 선택지 id = 거절 선택지 컨벤션은 기존과 동일하게 유지한다 (이 컨벤션은 채점 로직이 `choice.id.startsWith("refuse")`로 판단하는 근거이므로 반드시 지켜라).

**① `normal-overseas-payment-alert`** (사기같은 정상 — 급박한 해외결제 차단 알림이지만 실제로는 은행의 정상적인 확인 전화)
```
isNormalCase: true
startNodeId: "n1"
n1 (speaker: "OO은행 이상거래탐지팀"):
  "고객님, 방금 해외 가맹점에서 235,000원 결제 시도가 있어 자동으로 차단했습니다. 본인이 시도하신 결제가 맞을까요?"
  choices: [
    { id: "confirm-not-me", text: "아니요, 저는 시도한 적 없어요", next: "n2" },
    { id: "refuse-hangup", text: "모르는 번호라 미심쩍어 바로 끊는다" }
  ]
n2 (같은 speaker):
  "확인 감사합니다. 저희 쪽에서 이미 차단 처리했고 별도로 알려주실 정보는 없습니다. 다만 카드 재발급이 필요하시면 카드 뒷면의 대표번호로 직접 연락해 신청해 주세요."
  choices: [
    { id: "end-call-politely", text: "알겠다고 답하고 통화를 마친다" },
    { id: "refuse-still-suspicious", text: "그래도 미심쩍어 전화를 끊는다" }
  ]
```

**② `normal-delivery-address-confirm`** (사기같은 정상 — "오늘 중 반송" 재촉 문구지만 실제 택배사의 정상 확인 전화)
```
isNormalCase: true
startNodeId: "n1"
n1 (speaker: "CJ○○ 택배 고객센터"):
  "고객님 앞으로 온 택배가 부재중으로 반송 처리 예정입니다. 오늘 중 재배송하지 않으면 물류센터로 회수됩니다. 배송지 다시 확인 도와드릴까요?"
  choices: [
    { id: "confirm-address", text: "네, 배송지를 다시 알려준다", next: "n2" },
    { id: "refuse-hangup", text: "보이스피싱 같아 바로 끊는다" }
  ]
n2 (같은 speaker):
  "확인 감사합니다. 결제나 배송비 관련해서는 요구드릴 내용이 없고, 오늘 중 다시 배송해드리겠습니다."
  choices: [
    { id: "end-call-politely", text: "알겠다고 답하고 통화를 마친다" },
    { id: "refuse-still-suspicious", text: "그래도 의심스러워 전화를 끊는다" }
  ]
```

**③ `scam-refund-remote-app`** (정상같은 사기 — 차분한 "환불 도와드린다" 어조지만 원격제어 앱 설치를 유도하는 실제 사기 수법)
```
isNormalCase: false
startNodeId: "s1"
s1 (speaker: "OO쇼핑 고객만족센터"):
  "안녕하세요 고객님, 지난달 주문하신 상품이 품절되어 환불 처리를 도와드리려고 연락드렸습니다. 잠시 시간 괜찮으실까요?"
  choices: [
    { id: "listen-more", text: "네, 말씀하세요", next: "s2" },
    { id: "refuse-hangup", text: "주문한 적 없어서 바로 끊는다" }
  ]
s2 (같은 speaker):
  "환불 처리를 위해 원격지원 앱을 하나 설치해주시면 저희 상담원이 화면을 보면서 계좌로 바로 환불해드릴 수 있어요. 어렵지 않으니 안내해드릴게요."
  choices: [
    { id: "comply-install-app", text: "안내에 따라 원격지원 앱을 설치한다" },
    { id: "refuse-suspicious", text: "이상해서 설치를 거부하고 전화를 끊는다" }
  ]
```

**④ `scam-government-loan-program`** (정상같은 사기 — "정부지원 저금리" + "걱정 안 하셔도 된다"는 안심시키는 어조지만 계좌 비밀번호를 요구하는 실제 사기)
```
isNormalCase: false
startNodeId: "s1"
s1 (speaker: "서민금융지원센터"):
  "안녕하세요 고객님, 정부 지원 저금리 대환대출 대상자로 안내드리려 연락드렸습니다. 기존 대출을 더 낮은 금리로 바꿔드릴 수 있어요."
  choices: [
    { id: "listen-more", text: "어떤 조건인지 들어본다", next: "s2" },
    { id: "refuse-hangup", text: "필요 없다며 바로 끊는다" }
  ]
s2 (같은 speaker):
  "심사를 위해 성함, 주민등록번호, 그리고 신분 확인용으로 계좌 비밀번호 앞 두 자리만 확인 부탁드립니다. 절차대로 진행되는 거니 걱정 안 하셔도 돼요."
  choices: [
    { id: "comply-provide-info", text: "안심하고 요청한 정보를 알려준다" },
    { id: "refuse-suspicious", text: "비밀번호까지 요구하는게 이상해 전화를 끊는다" }
  ]
```

실명 기관명은 쓰지 않는다("OO은행", "OO쇼핑"처럼 가상화 — 기존 컨벤션과 동일). 항상 피해자(전화를 받는 사람) 시점으로만 작성하고, 가해자가 어떻게 접근하면 성공하는지를 알려주는 "효과적인 사기 스크립트"로 읽히지 않도록 주의한다(`docs/ADR.md` ADR-005).

### 2. `src/data/remediation.ts`에 `fell-for-scam` 대응 방안 추가

`REMEDIATION_COPY`에 새 키를 추가한다:

```ts
"fell-for-scam":
  "실제로 사기성 정황이 있는 전화였는데 요청에 응했습니다. 원격제어 앱 설치, 계좌 비밀번호나 보안카드 번호 요구, '정부지원·저금리' 같은 솔깃한 조건은 대표적인 보이스피싱 수법입니다. 전화로 이런 요청을 받으면 그 자리에서 응하지 말고, 반드시 끊은 뒤 공식 대표번호로 직접 확인하세요.",
```

이 태그는 실제로 컴포넌트에서 방출되기 시작하는 것은 step2다 — 이 step에서는 매핑 데이터만 미리 준비해 둔다.

### 3. 테스트 갱신 (TDD — 데이터/매핑 로직에 대한 테스트를 먼저 손보고 나서 데이터를 채워라)

- `src/data/voice-phishing.test.ts`: 기존 불변 조건 테스트(각 시나리오 `startNodeId`가 `nodes` 안에 존재, 모든 노드에 선택지 1개 이상)는 새 데이터로도 그대로 통과해야 한다. 여기에 이번 설계 의도를 검증하는 테스트를 추가한다: **정확히 4개 시나리오, 그중 `isNormalCase: true` 2개 + `isNormalCase: false` 2개**를 포함하는지.
- `src/data/remediation.test.ts`: 기존 `blind-refusal`/`missed-scam-signal`/`missed-lease-fraud-signal` 테스트 패턴과 동일하게 `"fell-for-scam"` 태그에 대해 `getRemediation("fell-for-scam")`이 `DEFAULT_REMEDIATION_MESSAGE`가 아닌 실제 문구를 반환하는지 테스트를 추가한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `src/data/voice-phishing.ts`가 정확히 4개 시나리오(정상 2 + 사기 2)를 담고 있는지, 각 시나리오의 `next` 참조가 실제 존재하는 노드를 가리키는지 확인한다.
3. `src/data/remediation.ts`에 `fell-for-scam` 키가 추가됐는지, `getRemediation("fell-for-scam")`이 기본 문구가 아닌 값을 반환하는지 확인한다.
4. 아키텍처 체크리스트:
   - `docs/ARCHITECTURE.md`의 `data/` 구조를 따르는가?
   - `docs/ADR.md` ADR-005(피해자 관점만) 위반 없는가? 실명 기관명을 쓰지 않았는가?
5. 결과에 따라 `phases/1-voice-phishing-chat/index.json`의 `step: 1` 항목을 업데이트한다.

## 금지사항

- `src/types/experience.ts`의 타입을 변경하지 마라. 이유: 데이터 모델은 그대로 두고 콘텐츠만 교체하는 것이 이 step의 범위 — 컴포넌트/UI 변경은 step2 담당.
- `src/components/experiences/VoicePhishingExperience.tsx`를 이 step에서 수정하지 마라. 이유: 레이어 분리 — mistakeTag 방출 로직 수정(버그 픽스)과 채팅 UI 재작성은 step2에서 함께 다룬다. 이 step에서 컴포넌트를 건드리면 기존 "다음" 버튼 기반 테스트가 새 데이터로 인해 깨질 수 있다.
- 실명 기관명(실제 은행/택배사/정부기관명 등)이나 실존 인물/사건을 그대로 쓰지 마라. 이유: 법적/명예훼손 리스크.
- 가해자 관점 콘텐츠(효과적인 사기 수법 튜토리얼처럼 읽히는 대사)를 만들지 마라. 이유: `docs/ADR.md` ADR-005.
- 기존 테스트를 깨뜨리지 마라.
