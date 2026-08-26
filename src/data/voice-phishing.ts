import type { VoicePhishingScenario } from "@/types/experience";

export const VOICE_PHISHING_SCENARIOS: VoicePhishingScenario[] = [
  {
    id: "normal-overseas-payment-alert",
    isNormalCase: true,
    category: "정상금융확인형",
    startNodeId: "n1",
    nodes: [
      {
        id: "n1",
        speaker: "OO은행 이상거래탐지팀",
        line: "고객님, 방금 해외 가맹점에서 235,000원 결제 시도가 있어 자동으로 차단했습니다. 본인이 시도하신 결제가 맞을까요?",
        choices: [
          {
            id: "blind-hangup",
            text: "듣지도 않고 보이스피싱 같아 바로 끊는다",
            risk: "danger",
          },
          {
            id: "confirm-not-me",
            text: "아니요, 저는 시도한 적 없어요",
            next: "n2",
            risk: "safe",
          },
        ],
      },
      {
        id: "n2",
        speaker: "OO은행 이상거래탐지팀",
        line: "확인 감사합니다. 본인 확인을 위해 성함과 생년월일을 다시 한번 말씀해 주시겠어요?",
        choices: [
          {
            id: "refuse-info-request",
            text: "개인정보를 왜 자꾸 묻냐며 그냥 끊어버린다",
            risk: "danger",
          },
          {
            id: "vague-answer",
            text: "찜찜해하면서도 정확히 확인은 안 하고 대충 얼버무려 넘어간다",
            next: "n3",
            risk: "caution",
          },
          {
            id: "confirm-identity",
            text: "본인 확인 절차임을 이해하고 이름과 생년월일을 알려준다",
            next: "n3",
            risk: "safe",
          },
        ],
      },
      {
        id: "n3",
        speaker: "OO은행 이상거래탐지팀",
        line: "확인됐습니다. 재발급 카드가 필요하시면 카드 뒷면 대표번호로 직접 연락해 신청해 주세요. 저희 쪽에서 추가로 요청드릴 정보는 없습니다.",
        choices: [
          {
            id: "hangup-still-suspicious",
            text: "말이 끝나기도 전에 의심된다며 끊는다",
            risk: "danger",
          },
          {
            id: "end-call-politely",
            text: "알겠다고 답하고, 필요하면 카드 뒷면 대표번호로 직접 확인해보겠다고 말한 뒤 통화를 마친다",
            risk: "safe",
          },
        ],
      },
    ],
  },
  {
    id: "normal-delivery-address-confirm",
    isNormalCase: true,
    category: "정상생활안내형",
    startNodeId: "n1",
    nodes: [
      {
        id: "n1",
        speaker: "CJ○○ 택배 고객센터",
        line: "고객님 앞으로 온 택배가 부재중으로 반송 처리 예정입니다. 오늘 중 재배송하지 않으면 물류센터로 회수됩니다. 배송지 다시 확인 도와드릴까요?",
        choices: [
          {
            id: "blind-hangup",
            text: "듣지도 않고 스팸 같아 바로 끊는다",
            risk: "danger",
          },
          {
            id: "confirm-address",
            text: "네, 확인해달라고 답한다",
            next: "n2",
            risk: "safe",
          },
        ],
      },
      {
        id: "n2",
        speaker: "CJ○○ 택배 고객센터",
        line: "현재 등록된 주소가 OO동 12-3으로 되어 있는데, 다른 요청사항이나 변경할 부분이 있으신가요?",
        choices: [
          {
            id: "refuse-address-check",
            text: "주소를 왜 자꾸 확인하냐며 그냥 끊어버린다",
            risk: "danger",
          },
          {
            id: "careless-answer",
            text: "제대로 안 보고 대충 맞다고만 대답한다",
            next: "n3",
            risk: "caution",
          },
          {
            id: "confirm-address-carefully",
            text: "주소를 차분히 확인하고 정확히 답한다",
            next: "n3",
            risk: "safe",
          },
        ],
      },
      {
        id: "n3",
        speaker: "CJ○○ 택배 고객센터",
        line: "확인 감사합니다. 결제나 배송비를 요구드리는 일은 없으니, 혹시 그런 연락을 받으시면 저희 소속이 아니라는 점 유의해주세요.",
        choices: [
          {
            id: "hangup-now-suspicious",
            text: "이제 와서 의심된다며 끊는다",
            risk: "danger",
          },
          {
            id: "shrug-off",
            text: "별생각 없이 알겠다고만 하고 넘긴다",
            next: "n4",
            risk: "caution",
          },
          {
            id: "note-official-channel",
            text: "결제 요구가 오면 공식 고객센터로 재확인하겠다고 답한다",
            next: "n4",
            risk: "safe",
          },
        ],
      },
      {
        id: "n4",
        speaker: "CJ○○ 택배 고객센터",
        line: "네, 오늘 중으로 다시 배송해드리겠습니다. 추가로 필요한 건 없으신가요?",
        choices: [
          {
            id: "hangup-at-the-end",
            text: "끝까지 의심하며 필요없다고 끊는다",
            risk: "danger",
          },
          {
            id: "end-call-politely",
            text: "없다고 답하고 정중히 통화를 마친다",
            risk: "safe",
          },
        ],
      },
    ],
  },
  {
    id: "scam-refund-remote-app",
    isNormalCase: false,
    category: "환불결제사칭형",
    startNodeId: "s1",
    nodes: [
      {
        id: "s1",
        speaker: "OO쇼핑 고객만족센터",
        line: "안녕하세요 고객님, 지난달 주문하신 상품이 품절되어 환불 처리를 도와드리려고 연락드렸습니다. 잠시 시간 괜찮으실까요?",
        choices: [
          {
            id: "refuse-hangup",
            text: "주문한 적 없어서 바로 끊는다",
            risk: "safe",
          },
          {
            id: "listen-more",
            text: "네, 말씀하세요",
            next: "s2",
            risk: "safe",
          },
        ],
      },
      {
        id: "s2",
        speaker: "OO쇼핑 고객만족센터",
        line: "환불을 도와드리기 위해 주문하신 상품명과 결제 수단을 확인해주시겠어요?",
        choices: [
          {
            id: "refuse-no-order",
            text: "주문 내역이 없는 게 이상해서 끊는다",
            risk: "safe",
          },
          {
            id: "vague-answer",
            text: "정확히 기억 안 나지만 대충 둘러대며 답한다",
            next: "s3",
            risk: "caution",
          },
          {
            id: "deny-order-again",
            text: "주문한 적이 없다고 다시 한번 분명히 말한다",
            next: "s3",
            risk: "safe",
          },
        ],
      },
      {
        id: "s3",
        speaker: "OO쇼핑 고객만족센터",
        line: "환불 처리를 위해 원격지원 앱을 하나 설치해주시면 저희 상담원이 화면을 보면서 계좌로 바로 환불해드릴 수 있어요.",
        choices: [
          {
            id: "refuse-remote-app",
            text: "환불에 원격 앱 설치가 필요할 리 없다며 설치를 거부하고 끊는다",
            risk: "safe",
          },
          {
            id: "ask-more-about-app",
            text: "앱이 뭔지 이름이나 좀 더 물어본다",
            next: "s4",
            risk: "caution",
          },
        ],
      },
      {
        id: "s4",
        speaker: "OO쇼핑 고객만족센터",
        line: "어렵지 않으니 안내해드리는 대로만 따라오시면 금방 끝나요. 지금 바로 설치해 주세요.",
        choices: [
          {
            id: "refuse-suspicious",
            text: "그래도 이상해서 설치를 거부하고 전화를 끊는다",
            risk: "safe",
          },
          {
            id: "comply-install-app",
            text: "안내에 따라 원격지원 앱을 설치한다",
            risk: "danger",
          },
        ],
      },
    ],
  },
  {
    id: "scam-government-loan-program",
    isNormalCase: false,
    category: "대출빙자형",
    startNodeId: "s1",
    nodes: [
      {
        id: "s1",
        speaker: "서민금융지원센터",
        line: "안녕하세요 고객님, 정부 지원 저금리 대환대출 대상자로 안내드리려 연락드렸습니다. 기존 대출을 더 낮은 금리로 바꿔드릴 수 있어요.",
        choices: [
          {
            id: "refuse-hangup",
            text: "필요 없다며 바로 끊는다",
            risk: "safe",
          },
          {
            id: "listen-more",
            text: "어떤 조건인지 들어본다",
            next: "s2",
            risk: "safe",
          },
        ],
      },
      {
        id: "s2",
        speaker: "서민금융지원센터",
        line: "먼저 대상자 확인을 위해 현재 이용 중이신 대출 은행과 대략적인 대출 금액을 여쭤봐도 될까요?",
        choices: [
          {
            id: "refuse-loan-info",
            text: "대출 정보를 왜 전화로 묻냐며 끊는다",
            risk: "safe",
          },
          {
            id: "vague-answer",
            text: "정확하지 않게 대충 얼버무려 답한다",
            next: "s3",
            risk: "caution",
          },
          {
            id: "ask-official-process",
            text: "공식 절차인지 먼저 확인하고 싶다고 답한다",
            next: "s3",
            risk: "safe",
          },
        ],
      },
      {
        id: "s3",
        speaker: "서민금융지원센터",
        line: "이 상품은 선착순 마감이라 오늘 안에 심사를 받으셔야 낮은 금리가 적용됩니다. 서두르셔야 해요.",
        choices: [
          {
            id: "refuse-urgency-pressure",
            text: "선착순·마감 재촉이 수상해서 끊는다",
            risk: "safe",
          },
          {
            id: "keep-listening",
            text: "서두르는 게 미심쩍지만 일단 조건을 더 물어본다",
            next: "s4",
            risk: "safe",
          },
        ],
      },
      {
        id: "s4",
        speaker: "서민금융지원센터",
        line: "심사를 위해 성함, 주민등록번호를 확인 부탁드립니다. 절차대로 진행되는 거니 걱정 안 하셔도 돼요.",
        choices: [
          {
            id: "refuse-ssn-request",
            text: "공공기관·금융사는 전화로 주민등록번호를 묻지 않는다는 걸 알고 있어 끊는다",
            risk: "safe",
          },
          {
            id: "provide-ssn",
            text: "찜찜하지만 이름과 주민등록번호를 알려준다",
            next: "s5",
            risk: "caution",
          },
        ],
      },
      {
        id: "s5",
        speaker: "서민금융지원센터",
        line: "마지막으로 본인 확인을 위해 계좌 비밀번호 앞 두 자리만 알려주시면 바로 대출 진행해드릴게요.",
        choices: [
          {
            id: "refuse-password-request",
            text: "비밀번호까지 요구하는 게 이상해 전화를 끊는다",
            risk: "safe",
          },
          {
            id: "comply-provide-info",
            text: "안심하고 요청한 정보를 알려준다",
            risk: "danger",
          },
        ],
      },
    ],
  },
  {
    id: "normal-sim-reissue-alert",
    isNormalCase: true,
    category: "정상생활안내형",
    startNodeId: "n1",
    nodes: [
      {
        id: "n1",
        speaker: "OO텔레콤 보안센터",
        line: "고객님, 방금 다른 기기에서 고객님 명의로 유심 재발급 시도가 있어 저희 쪽에서 자동으로 차단했습니다. 본인이 시도하신 게 맞을까요?",
        choices: [
          {
            id: "blind-hangup",
            text: "듣지도 않고 스팸 같아 바로 끊는다",
            risk: "danger",
          },
          {
            id: "confirm-not-me",
            text: "아니요, 저는 시도한 적 없어요",
            next: "n2",
            risk: "safe",
          },
        ],
      },
      {
        id: "n2",
        speaker: "OO텔레콤 보안센터",
        line: "확인을 위해 최근 이용하신 요금제나 서비스센터 방문 이력을 여쭤봐도 될까요?",
        choices: [
          {
            id: "refuse-info-request",
            text: "그런 걸 왜 묻냐며 그냥 끊어버린다",
            risk: "danger",
          },
          {
            id: "vague-answer",
            text: "잘 기억도 안 나는데 대충 아무렇게나 답한다",
            next: "n3",
            risk: "caution",
          },
          {
            id: "answer-carefully",
            text: "기억나는 대로 차분히 답한다",
            next: "n3",
            risk: "safe",
          },
        ],
      },
      {
        id: "n3",
        speaker: "OO텔레콤 보안센터",
        line: "확인됐습니다. 유심 재발급이 필요하시면 대리점 방문이나 공식 앱에서 본인 인증 후 진행해 주세요. 저희 쪽에서 추가로 요청드릴 정보는 없습니다.",
        choices: [
          {
            id: "hangup-still-suspicious",
            text: "그래도 미심쩍다며 끊는다",
            risk: "danger",
          },
          {
            id: "end-call-politely",
            text: "알겠다고 답하고, 필요하면 공식 앱에서 직접 확인해보겠다고 말한 뒤 통화를 마친다",
            risk: "safe",
          },
        ],
      },
    ],
  },
  {
    id: "scam-fake-prosecutor-safe-account",
    isNormalCase: false,
    category: "기관사칭형",
    startNodeId: "s1",
    nodes: [
      {
        id: "s1",
        speaker: "OO지방검찰청 수사관",
        line: "고객님 명의 계좌가 대포통장 개설 및 자금세탁 사건에 연루된 정황이 확인되어 연락드렸습니다. 본인 명의 계좌가 맞으신가요?",
        choices: [
          {
            id: "refuse-hangup",
            text: "검찰이 전화로 연락할 리 없다며 바로 끊는다",
            risk: "safe",
          },
          {
            id: "listen-more",
            text: "무슨 일인지 자세히 들어본다",
            next: "s2",
            risk: "safe",
          },
        ],
      },
      {
        id: "s2",
        speaker: "OO지방검찰청 수사관",
        line: "명의도용 확인을 위해 성함과 생년월일을 불러주시겠어요?",
        choices: [
          {
            id: "refuse-no-info-by-phone",
            text: "공공기관은 전화로 개인정보를 묻지 않는다는 걸 알고 있어 끊는다",
            risk: "safe",
          },
          {
            id: "vague-answer",
            text: "대수롭지 않게 이름과 생년월일을 알려준다",
            next: "s3",
            risk: "caution",
          },
          {
            id: "ask-badge-number",
            text: "먼저 소속과 사건번호부터 확인해달라고 요구한다",
            next: "s3",
            risk: "safe",
          },
        ],
      },
      {
        id: "s3",
        speaker: "OO지방검찰청 수사관",
        line: "혐의를 벗기 위해 계좌 자금을 저희가 안내하는 안전계좌로 임시 이체해주셔야 합니다.",
        choices: [
          {
            id: "refuse-no-transfer-request",
            text: "공공기관은 이체를 요구하지 않는다는 걸 알고 있어 전화를 끊는다",
            risk: "safe",
          },
          {
            id: "double-check-procedure",
            text: "정말 그런 절차가 있는지 재차 확인해본다",
            next: "s4",
            risk: "caution",
          },
        ],
      },
      {
        id: "s4",
        speaker: "OO지방검찰청 수사관",
        line: "지금 이체하지 않으면 계좌가 동결되고 불이익이 있을 수 있습니다. 서둘러 주세요.",
        choices: [
          {
            id: "refuse-and-verify-officially",
            text: "그래도 미심쩍어 끊고 검찰청 대표번호로 직접 확인한다",
            risk: "safe",
          },
          {
            id: "comply-transfer-funds",
            text: "혐의를 벗으려 안내에 따라 이체한다",
            risk: "danger",
          },
        ],
      },
    ],
  },
];
