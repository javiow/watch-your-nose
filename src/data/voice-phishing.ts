import type { VoicePhishingScenario } from "@/types/experience";

export const VOICE_PHISHING_SCENARIOS: VoicePhishingScenario[] = [
  {
    id: "normal-overseas-payment-alert",
    isNormalCase: true,
    category: "정상금융확인형",
    difficulty: "medium",
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
            spokenText: "이거 보이스피싱이죠? 됐고요, 끊을게요.",
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
            spokenText: "개인정보를 왜 자꾸 물어보세요? 그냥 끊을게요.",
            risk: "danger",
          },
          {
            id: "vague-answer",
            text: "찜찜해하면서도 정확히 확인은 안 하고 대충 얼버무려 넘어간다",
            spokenText: "어... 그냥 대충 아시는 대로 하시면 안 될까요?",
            next: "n3",
            risk: "caution",
          },
          {
            id: "confirm-identity",
            text: "본인 확인 절차임을 이해하고 이름과 생년월일을 알려준다",
            spokenText: "네, 홍길동이고 생년월일은 1990년 1월 1일이에요.",
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
            spokenText: "아, 됐어요. 아무래도 의심스러우니까 끊을게요.",
            risk: "danger",
          },
          {
            id: "end-call-politely",
            text: "알겠다고 답하고, 필요하면 카드 뒷면 대표번호로 직접 확인해보겠다고 말한 뒤 통화를 마친다",
            spokenText: "네, 알겠습니다. 필요하면 카드 뒷면 번호로 직접 확인해볼게요. 감사합니다.",
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
    difficulty: "hard",
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
            spokenText: "스팸 전화 같은데요, 끊을게요.",
            risk: "danger",
          },
          {
            id: "confirm-address",
            text: "네, 확인해달라고 답한다",
            spokenText: "네, 확인 부탁드려요.",
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
            spokenText: "주소를 왜 자꾸 확인하시는 거예요? 그냥 끊을게요.",
            risk: "danger",
          },
          {
            id: "careless-answer",
            text: "제대로 안 보고 대충 맞다고만 대답한다",
            spokenText: "네네, 맞아요 맞아요.",
            next: "n3",
            risk: "caution",
          },
          {
            id: "confirm-address-carefully",
            text: "주소를 차분히 확인하고 정확히 답한다",
            spokenText: "잠시만요, 확인해보니 OO동 12-3 맞아요.",
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
            spokenText: "가만 보니 좀 의심스럽네요. 끊을게요.",
            risk: "danger",
          },
          {
            id: "shrug-off",
            text: "별생각 없이 알겠다고만 하고 넘긴다",
            spokenText: "아 네, 알겠어요.",
            next: "n4",
            risk: "caution",
          },
          {
            id: "note-official-channel",
            text: "결제 요구가 오면 공식 고객센터로 재확인하겠다고 답한다",
            spokenText: "네, 혹시 결제 요구하시면 공식 고객센터로 다시 확인해볼게요.",
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
            spokenText: "아뇨, 됐어요. 필요 없어요. 끊을게요.",
            risk: "danger",
          },
          {
            id: "end-call-politely",
            text: "없다고 답하고 정중히 통화를 마친다",
            spokenText: "네, 없습니다. 감사합니다.",
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
    difficulty: "medium",
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
            spokenText: "저 주문한 적 없는데요. 끊을게요.",
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
            spokenText: "주문한 적 없는데 이상하네요. 끊을게요.",
            risk: "safe",
          },
          {
            id: "vague-answer",
            text: "정확히 기억 안 나지만 대충 둘러대며 답한다",
            spokenText: "음... 정확히는 기억 안 나는데, 그냥 카드로 했던 것 같아요.",
            next: "s3",
            risk: "caution",
          },
          {
            id: "deny-order-again",
            text: "주문한 적이 없다고 다시 한번 분명히 말한다",
            spokenText: "저 진짜 주문한 적 없어요.",
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
            spokenText: "환불하는데 앱 설치가 왜 필요해요? 안 할게요. 끊습니다.",
            risk: "safe",
          },
          {
            id: "ask-more-about-app",
            text: "앱이 뭔지 이름이나 좀 더 물어본다",
            spokenText: "그 앱 이름이 뭔데요?",
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
            spokenText: "아무래도 이상한데요. 설치 안 할게요. 끊습니다.",
            risk: "safe",
          },
          {
            id: "comply-install-app",
            text: "안내에 따라 원격지원 앱을 설치한다",
            spokenText: "네, 알려주시는 대로 설치할게요.",
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
    difficulty: "medium",
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
            spokenText: "필요 없어요. 끊을게요.",
            risk: "safe",
          },
          {
            id: "listen-more",
            text: "어떤 조건인지 들어본다",
            spokenText: "어떤 조건인지 한번 들어볼게요.",
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
            spokenText: "그런 걸 왜 전화로 물어보세요? 끊을게요.",
            risk: "safe",
          },
          {
            id: "vague-answer",
            text: "정확하지 않게 대충 얼버무려 답한다",
            spokenText: "어디였더라... 잘 기억이 안 나는데 대충 어디 은행이었던 것 같아요.",
            next: "s3",
            risk: "caution",
          },
          {
            id: "ask-official-process",
            text: "공식 절차인지 먼저 확인하고 싶다고 답한다",
            spokenText: "이게 공식적인 절차가 맞는지 먼저 확인하고 싶어요.",
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
            spokenText: "선착순에 마감이라니 좀 수상하네요. 끊을게요.",
            risk: "safe",
          },
          {
            id: "keep-listening",
            text: "서두르는 게 미심쩍지만 일단 조건을 더 물어본다",
            spokenText: "좀 이상하긴 한데, 조건이 뭔지 더 말씀해주세요.",
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
            spokenText: "주민등록번호는 전화로 안 알려드려요. 끊을게요.",
            risk: "safe",
          },
          {
            id: "provide-ssn",
            text: "찜찜하지만 이름과 주민등록번호를 알려준다",
            spokenText: "음... 홍길동이고 주민등록번호는 900101-1234567이에요.",
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
            spokenText: "비밀번호는 왜 물어보세요? 그건 안 알려드려요. 끊을게요.",
            risk: "safe",
          },
          {
            id: "comply-provide-info",
            text: "안심하고 요청한 정보를 알려준다",
            spokenText: "네, 앞 두 자리는 12예요.",
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
    difficulty: "hard",
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
            spokenText: "스팸 같은데요, 끊을게요.",
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
            spokenText: "그런 걸 왜 물어보세요? 그냥 끊을게요.",
            risk: "danger",
          },
          {
            id: "vague-answer",
            text: "잘 기억도 안 나는데 대충 아무렇게나 답한다",
            spokenText: "어... 잘 기억 안 나는데 아마 그랬을걸요.",
            next: "n3",
            risk: "caution",
          },
          {
            id: "answer-carefully",
            text: "기억나는 대로 차분히 답한다",
            spokenText: "음, 지난주에 대리점 가서 요금제 바꿨어요.",
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
            spokenText: "그래도 좀 미심쩍네요. 끊을게요.",
            risk: "danger",
          },
          {
            id: "end-call-politely",
            text: "알겠다고 답하고, 필요하면 공식 앱에서 직접 확인해보겠다고 말한 뒤 통화를 마친다",
            spokenText: "네, 알겠습니다. 필요하면 공식 앱에서 직접 확인해볼게요. 감사합니다.",
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
    difficulty: "easy",
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
            spokenText: "검찰이 전화로 이런 연락을 할 리가 없죠. 끊을게요.",
            risk: "safe",
          },
          {
            id: "listen-more",
            text: "무슨 일인지 자세히 들어본다",
            spokenText: "무슨 일인지 자세히 좀 말씀해주세요.",
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
            spokenText: "공공기관은 전화로 개인정보 안 물어보잖아요. 끊을게요.",
            risk: "safe",
          },
          {
            id: "vague-answer",
            text: "대수롭지 않게 이름과 생년월일을 알려준다",
            spokenText: "홍길동이고 90년 1월 1일생이에요.",
            next: "s3",
            risk: "caution",
          },
          {
            id: "ask-badge-number",
            text: "먼저 소속과 사건번호부터 확인해달라고 요구한다",
            spokenText: "먼저 소속이랑 사건번호부터 알려주세요.",
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
            spokenText: "공공기관은 이체 요구 안 하잖아요. 끊을게요.",
            risk: "safe",
          },
          {
            id: "double-check-procedure",
            text: "정말 그런 절차가 있는지 재차 확인해본다",
            spokenText: "정말 그런 절차가 있는 게 맞아요? 다시 한번 확인해주세요.",
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
            spokenText: "그래도 미심쩍네요. 끊고 검찰청 대표번호로 직접 확인해볼게요.",
            risk: "safe",
          },
          {
            id: "comply-transfer-funds",
            text: "혐의를 벗으려 안내에 따라 이체한다",
            spokenText: "네, 알려주시는 계좌로 바로 이체할게요.",
            risk: "danger",
          },
        ],
      },
    ],
  },
  {
    id: "scam-family-emergency-transfer",
    isNormalCase: false,
    category: "납치협박형",
    difficulty: "easy",
    startNodeId: "s1",
    nodes: [
      {
        id: "s1",
        speaker: "전화 속 낯선 남성",
        line: "지금 당신 자녀를 데리고 있다. 전화 끊지 말고, 경찰이나 가족한테 알리지 마라.",
        choices: [
          {
            id: "hang-up-and-call-child",
            text: "전화를 끊고 자녀에게 직접 연락한다",
            spokenText: "말도 안 되는 소리네요. 끊고 애한테 직접 전화해볼게요.",
            risk: "safe",
          },
          {
            id: "demand-talk-to-child",
            text: "자녀를 바꿔달라고 요구한다",
            spokenText: "우리 애 목소리부터 들려주세요.",
            next: "s2",
            risk: "safe",
          },
        ],
      },
      {
        id: "s2",
        speaker: "전화 속 낯선 남성",
        line: "지금은 통화 못 하게 해놨다. 치료비랑 합의금부터 보내야 풀어준다.",
        choices: [
          {
            id: "refuse-and-hang-up",
            text: "말 같지도 않다며 전화를 끊는다",
            spokenText: "무슨 소리예요. 안 믿어요, 끊습니다.",
            risk: "safe",
          },
          {
            id: "ask-how-much",
            text: "얼마를 어떻게 보내야 하냐고 되묻는다",
            spokenText: "얼마를... 어디로 보내면 되는데요?",
            next: "s3",
            risk: "caution",
          },
          {
            id: "try-verify-family",
            text: "다른 가족에게 연락해 자녀가 무사한지 먼저 확인하겠다고 말한다",
            spokenText: "잠깐만요, 다른 가족한테 먼저 연락해서 확인해볼게요.",
            next: "s3",
            risk: "safe",
          },
        ],
      },
      {
        id: "s3",
        speaker: "OO경찰서 강력팀이라는 남성",
        line: "나 담당 수사관이다. 현금으로 준비해서 알려주는 사람한테 직접 전달해라.",
        choices: [
          {
            id: "hang-up-verify-police",
            text: "끊고 112나 자녀에게 직접 확인한다",
            spokenText: "끊고 112랑 애한테 직접 확인하겠습니다.",
            risk: "safe",
          },
          {
            id: "stall-ask-again",
            text: "정말 그런 절차가 맞는지 다시 따져 묻는다",
            spokenText: "수사기관이 현금을 직접 받아간다고요? 그게 말이 돼요?",
            next: "s4",
            risk: "caution",
          },
        ],
      },
      {
        id: "s4",
        speaker: "OO경찰서 강력팀이라는 남성",
        line: "더 못 기다린다. 지금 당장 현금을 준비해 전달해라.",
        choices: [
          {
            id: "final-refuse",
            text: "요구를 거부하고 전화를 끊은 뒤 자녀·경찰에 직접 확인한다",
            spokenText: "안 합니다. 끊고 직접 확인할게요.",
            risk: "safe",
          },
          {
            id: "comply-hand-over-cash",
            text: "겁에 질려 안내에 따라 현금을 마련해 전달한다",
            spokenText: "알겠어요, 시키는 대로 현금 마련해서 전달할게요.",
            risk: "danger",
          },
        ],
      },
    ],
  },
  {
    id: "scam-customs-fee-delivery",
    isNormalCase: false,
    category: "택배배송사칭형",
    difficulty: "medium",
    startNodeId: "s1",
    nodes: [
      {
        id: "s1",
        speaker: "OO택배 고객센터",
        line: "고객님 앞으로 온 해외배송 물품에 관세가 미납되어 통관이 보류됐습니다. 오늘 안 처리하면 반송됩니다.",
        choices: [
          {
            id: "check-official-app",
            text: "안내를 끊고 택배사 공식 앱·대표번호로 직접 조회한다",
            spokenText: "그건 제가 공식 앱이랑 대표번호로 직접 확인할게요. 끊습니다.",
            risk: "safe",
          },
          {
            id: "ask-details",
            text: "무슨 물품인지, 어떻게 처리하냐고 물어본다",
            spokenText: "무슨 물품인데요? 처리는 어떻게 하나요?",
            next: "s2",
            risk: "safe",
          },
        ],
      },
      {
        id: "s2",
        speaker: "OO택배 고객센터",
        line: "문자로 보내드린 링크에서 미납 관세를 결제하시면 바로 통관됩니다. 금액은 크지 않아요.",
        choices: [
          {
            id: "refuse-link-payment",
            text: "문자 링크로는 결제하지 않겠다며 끊는다",
            spokenText: "문자 링크로 결제는 안 해요. 끊을게요.",
            risk: "safe",
          },
          {
            id: "open-link-hesitate",
            text: "링크를 열어보긴 하되 결제 전에 좀 더 확인한다",
            spokenText: "링크는 일단 열어볼게요. 결제는 좀 더 확인하고요.",
            next: "s3",
            risk: "caution",
          },
          {
            id: "ask-why-link",
            text: "왜 공식 홈페이지가 아니라 문자 링크로 결제하냐고 따진다",
            spokenText: "왜 공식 홈페이지 놔두고 문자 링크로 결제하라는 거예요?",
            next: "s3",
            risk: "safe",
          },
        ],
      },
      {
        id: "s3",
        speaker: "OO세관 통관담당이라는 사람",
        line: "통관 확인을 위해 성함, 주소, 주민등록번호가 필요합니다. 입력 안 하면 물품이 폐기됩니다.",
        choices: [
          {
            id: "refuse-personal-info",
            text: "세관은 전화로 주민등록번호를 요구하지 않는다며 끊는다",
            spokenText: "세관이 전화로 주민번호를 왜 물어봐요. 끊습니다.",
            risk: "safe",
          },
          {
            id: "give-partial-info",
            text: "폐기된다는 말에 이름과 주소 정도는 알려준다",
            spokenText: "폐기된다니까... 이름이랑 주소 정도는 알려드릴게요.",
            next: "s4",
            risk: "caution",
          },
        ],
      },
      {
        id: "s4",
        speaker: "OO세관 통관담당이라는 사람",
        line: "마지막으로 링크에서 카드정보를 입력해 결제만 완료하시면 됩니다. 지금 해주세요.",
        choices: [
          {
            id: "final-refuse",
            text: "끊고 세관·택배사 공식 대표번호로 직접 확인한다",
            spokenText: "안 되겠어요. 끊고 공식 대표번호로 직접 확인할게요.",
            risk: "safe",
          },
          {
            id: "comply-enter-card",
            text: "안내에 따라 링크에서 카드정보를 입력해 결제한다",
            spokenText: "알겠어요, 링크에서 카드정보 입력해서 결제할게요.",
            risk: "danger",
          },
        ],
      },
    ],
  },
  {
    id: "scam-messenger-impersonation-giftcard",
    isNormalCase: false,
    category: "메신저피싱형",
    difficulty: "hard",
    startNodeId: "s1",
    nodes: [
      {
        id: "s1",
        speaker: "메신저 대화 상대 (지인 프로필)",
        line: "나야, 폰이 고장 나서 PC로 연락해. 급하게 부탁 하나만 할게.",
        choices: [
          {
            id: "call-to-verify",
            text: "대화를 멈추고 원래 알던 번호로 전화해 본인인지 확인한다",
            spokenText: "잠깐만, 원래 번호로 전화해서 확인 좀 할게.",
            risk: "safe",
          },
          {
            id: "ask-what-favor",
            text: "무슨 일인지 물어본다",
            spokenText: "무슨 일인데? 말해봐.",
            next: "s2",
            risk: "safe",
          },
        ],
      },
      {
        id: "s2",
        speaker: "메신저 대화 상대 (지인 프로필)",
        line: "결제가 막혔는데 모바일 상품권을 대신 좀 사줄 수 있어? 이따 바로 갚을게.",
        choices: [
          {
            id: "refuse-giftcard-request",
            text: "상품권 대리구매 요청은 전형적인 사기라 거절하고 대화를 끊는다",
            spokenText: "상품권 대신 사달라는 건 사기 수법이야. 이 대화 그만할게.",
            risk: "safe",
          },
          {
            id: "suggest-call",
            text: "그럼 잠깐 전화로 통화하자고 한다",
            spokenText: "그럼 잠깐 전화로 얘기하자.",
            next: "s3",
            risk: "caution",
          },
          {
            id: "ask-why-me",
            text: "왜 하필 나한테, 왜 상품권이냐고 되묻는다",
            spokenText: "왜 하필 나한테 부탁해? 그리고 왜 상품권이야?",
            next: "s3",
            risk: "safe",
          },
        ],
      },
      {
        id: "s3",
        speaker: "메신저 대화 상대 (지인 프로필)",
        line: "지금 통화는 곤란해. 상품권 사서 뒷번호만 사진 찍어 보내줘.",
        choices: [
          {
            id: "refuse-pin",
            text: "핀번호를 보내달라는 건 현금을 넘기라는 것과 같다며 거절하고 끊는다",
            spokenText: "그 번호 보내는 건 현금 주는 거랑 똑같아. 안 해, 끊을게.",
            risk: "safe",
          },
          {
            id: "hesitate-buy-small",
            text: "찜찜하지만 소액이라 일단 하나 사보기로 한다",
            spokenText: "찜찜하긴 한데... 소액이니까 일단 하나만 사볼게.",
            next: "s4",
            risk: "caution",
          },
        ],
      },
      {
        id: "s4",
        speaker: "메신저 대화 상대 (지인 프로필)",
        line: "그거로는 부족한데 몇 장 더 사서 번호 다 보내줘. 정말 이따 갚을게.",
        choices: [
          {
            id: "final-refuse",
            text: "이상함을 깨닫고 구매를 멈춘 뒤 지인의 원래 번호로 직접 확인한다",
            spokenText: "이건 아무래도 이상해. 그만하고 원래 번호로 직접 확인할게.",
            risk: "safe",
          },
          {
            id: "comply-send-pins",
            text: "재촉에 밀려 상품권을 더 사서 핀번호를 사진으로 보낸다",
            spokenText: "알겠어, 몇 장 더 사서 번호 사진으로 보낼게.",
            risk: "danger",
          },
        ],
      },
    ],
  },
];
