import type { CaseInvestigationContent } from "@/types/experience";

export const CASE_INVESTIGATION_CASES: CaseInvestigationContent[] = [
  {
    caseId: "JEONSE_001",
    title: "위험한 전세가율",
    domain: "JEONSE",
    initialPoints: 800,
    scenario: {
      description:
        "서울 △△구의 신축 풀옵션 오피스텔. 시세보다 조금 비싸 보이지만 중개사는 문제없다고 한다.",
      propertyLocation: "서울 △△구 신축 오피스텔",
      propertyPriceDescription: "전세금 2억 3천만 원",
      brokerLine:
        "어머, 이 매물 진짜 잘 나온 거예요. 시세보다 저렴하게 나와서 지금 안 잡으시면 금방 나갑니다~",
      speakerLabel: "중개사",
      goal: "이 계약을 진행해도 되는지 판단하십시오.",
    },
    documents: [
      {
        documentId: "DOC_LISTING",
        title: "매물 광고",
        blocks: [
          {
            blockId: "LST_00",
            text: "🏢 서울 △△구 신축 풀옵션 오피스텔 전세 매물 / 전용 24㎡, 방1 화장실1 / 냉장고·세탁기·에어컨·붙박이장 완비 / 즉시 입주 가능",
            evidencePattern: null,
          },
          {
            blockId: "LST_01",
            text: "전세금 2억 3,000만원 (융자 없음 표기)",
            evidencePattern: null,
          },
          {
            blockId: "LST_02",
            text: "매물 설명 추가 문구: '문의 많은 매물입니다. 지금 계약 안 하시면 바로 다른 분과 계약 진행됩니다. 오늘 안에 결정 부탁드려요!'",
            evidencePattern: "URGENCY",
          },
          {
            blockId: "LST_03",
            text: "게시일 2026.02.10 / 조회수 312 / 찜하기 47",
            evidencePattern: null,
          },
        ],
      },
      {
        documentId: "DOC_MARKET",
        title: "시세 정보",
        blocks: [
          {
            blockId: "MKT_01",
            text: "국토교통부 실거래가 공개시스템 조회 결과 — 동일 단지·동일 평형 최근 6개월 전세 실거래 평균 2억 2,000만원 (2025.09~2026.02, 총 7건 거래)",
            evidencePattern: "HIGH_JEONSE_RATIO",
          },
          {
            blockId: "MKT_02",
            text: "매매가 대비 {{term:전세가율}} 참고자료: 해당 단지 평균 전세가율 68% (국토부 통계 기준)",
            evidencePattern: null,
          },
          {
            blockId: "MKT_03",
            text: "동일 단지 최근 매매 실거래가 평균 3억 2,000만원 (2025.11 기준)",
            evidencePattern: null,
          },
        ],
      },
    ],
    hiddenTruth: {
      fraudType: "HIGH_JEONSE_RATIO_RISK",
      riskPatterns: ["HIGH_JEONSE_RATIO", "URGENCY"],
      requiredEvidence: ["HIGH_JEONSE_RATIO"],
      explanation:
        "이 매물은 전세금이 주변 시세보다 높게 책정된, 이른바 '깡통전세' 위험이 있는 사례입니다.\n\n전세가율이 높을수록 매매가가 하락하거나 집이 경매로 넘어갈 경우 보증금을 온전히 돌려받지 못할 가능성이 커집니다.",
    },
    evidenceDefinitions: [
      {
        pattern: "HIGH_JEONSE_RATIO",
        importance: 2,
        description: "전세금이 주변 실거래가보다 높음 ({{term:전세가율}} 과다)",
      },
      {
        pattern: "URGENCY",
        importance: 1,
        description: "계약을 서두르도록 압박함",
      },
    ],
    investigations: [
      {
        investigationId: "CHECK_LISTING",
        name: "매물 광고 확인",
        cost: 100,
        unlockCondition: null,
        documentId: "DOC_LISTING",
        purpose:
          "광고 문구에 계약을 재촉하거나 조건을 부풀리는 표현이 있는지 봅니다.",
      },
      {
        investigationId: "CHECK_MARKET",
        name: "시세 정보 확인",
        cost: 300,
        unlockCondition: null,
        documentId: "DOC_MARKET",
        purpose:
          "제시된 금액이 주변 실거래가와 맞는 수준인지 비교합니다.",
      },
    ],
    npc: {
      npcId: "NPC_01",
      displayName: "공인중개사 박중개",
      greeting: "네~ 궁금하신 거 있으면 편하게 물어보세요! 저 이 근처 매물 진짜 많이 다뤄봤거든요.",
      fallbackLine: "그건 저도 잘 모르겠는데요, 일단 계약부터 진행하시죠~",
      statements: [
        {
          statementId: "S01",
          text: "이 전세금은 주변 시세보다 저렴하게 나온 겁니다.",
          matchKeywords: ["시세", "가격", "얼마"],
        },
      ],
      questions: [
        {
          questionId: "S01-q",
          prompt: "주변 시세는 어느 정도인가요?",
          statementId: "S01",
        },
      ],
    },
    contradictions: [
      {
        contradictionId: "C01",
        statementId: "S01",
        evidencePattern: "HIGH_JEONSE_RATIO",
        score: 12,
        explanation:
          "주변 6개월 평균 실거래가(약 2억 2천만 원)보다 이 매물의 전세금(2억 3천만 원)이 더 높다. '시세보다 저렴하다'는 설명은 실거래가 정보와 모순된다.",
      },
    ],
    endingOptions: [
      {
        decision: "SAFE_TO_PROCEED",
        score: 6,
        comment: "시세보다 높은 전세금을 그대로 진행하는 것은 위험할 수 있습니다.",
      },
      {
        decision: "NEED_MORE_VERIFICATION",
        score: 14,
        comment: "정확한 시세와 보증보험 가입 가능 여부를 더 확인한 뒤 진행하는 것이 안전합니다.",
      },
      {
        decision: "STOP_CONTRACT",
        score: 10,
        comment: "전세가율이 부담스럽다면 계약을 중단하는 것도 안전한 선택입니다.",
      },
    ],
  },
  {
    caseId: "JEONSE_002",
    title: "여러 채를 가진 임대인",
    domain: "JEONSE",
    initialPoints: 1200,
    scenario: {
      description: "경기 □□시 신축 빌라. 집주인이 최근 여러 채를 매입했다는 이야기를 들었다.",
      propertyLocation: "경기 □□시 신축 빌라",
      propertyPriceDescription: "전세금 2억 원",
      brokerLine:
        "제가 이 동네에서만 15년 넘게 중개했는데요, 집주인분이 여러 채 갖고 계셔도 그 정도 자금력이면 전혀 문제없습니다. 걱정 붙들어 매세요.",
      speakerLabel: "중개사",
      goal: "이 계약을 진행해도 되는지 판단하십시오.",
    },
    documents: [
      {
        documentId: "DOC_REGISTRY",
        title: "등기 정보",
        blocks: [
          {
            blockId: "REG_00",
            text: "고유번호 1234-2026-004511 / 소재지: 경기 □□시 □□동 456, ○○빌라 302호 / 전용면적 38.5㎡",
            evidencePattern: null,
          },
          {
            blockId: "REG_01",
            text: "【갑구】 순위 2번 소유권이전 2026.01.10 접수 제55201호, 등기원인: 2026.01.05 매매, 소유자: D (전 소유자 C로부터 이전)",
            evidencePattern: "RECENT_OWNERSHIP_CHANGE",
          },
          {
            blockId: "REG_02",
            text: "소유자 D 명의 부동산 추가 조회 — 최근 3개월간 인근 단지 오피스텔 5채를 순차 매입 (2025.11~2026.01, 등기부 각 건 확인됨)",
            evidencePattern: "MULTIPLE_PROPERTY_ACQUISITION",
          },
          {
            blockId: "REG_03",
            text: "【{{term:을구}}】 {{term:근저당권}} 설정 등기 없음 (해당 사항 없음)",
            evidencePattern: null,
          },
        ],
      },
      {
        documentId: "DOC_MARKET",
        title: "시세 정보",
        blocks: [
          {
            blockId: "MKT_01",
            text: "국토교통부 실거래가 공개시스템 — 동일 단지 최근 6개월 평균 전세 실거래가 1억 8,000만원 (본 매물 호가 2억원, 시세 대비 약 111%)",
            evidencePattern: "HIGH_JEONSE_RATIO",
          },
          {
            blockId: "MKT_02",
            text: "동일 단지 최근 매매 평균가 2억 6,500만원 (2025.12 기준, 총 3건)",
            evidencePattern: null,
          },
        ],
      },
      {
        documentId: "DOC_LANDLORD",
        title: "임대인 추가 조사",
        blocks: [
          {
            blockId: "LND_01",
            text: "임대인 D 추가 조사 메모 — 최근 3개월간 매입한 5채 모두 매매대금 대비 대출·보증금 비중이 높아 '무자본 갭투자' 정황. 5채 중 4채는 매입 직후 곧바로 신규 세입자와 전세계약을 체결해, 보증금이 다음 매입 자금으로 순환 사용된 것으로 추정됨",
            evidencePattern: null,
          },
          {
            blockId: "LND_02",
            text: "국세청 홈택스 사업자 조회 결과: 별도 임대사업자 등록 없음",
            evidencePattern: null,
          },
        ],
      },
    ],
    hiddenTruth: {
      fraudType: "GAP_INVESTMENT_RISK",
      riskPatterns: [
        "RECENT_OWNERSHIP_CHANGE",
        "MULTIPLE_PROPERTY_ACQUISITION",
        "HIGH_JEONSE_RATIO",
      ],
      requiredEvidence: ["MULTIPLE_PROPERTY_ACQUISITION", "HIGH_JEONSE_RATIO"],
      explanation:
        "임대인이 짧은 기간 여러 채를 연달아 매입한 정황은 '무자본 갭투자'의 전형적인 패턴입니다.\n\n세입자에게 받은 보증금으로 다음 매물을 매입하는 방식이라, 임대인의 자금 사정이 악화되면 여러 세입자가 동시에 보증금을 돌려받지 못하는 사고로 이어질 수 있습니다.",
    },
    evidenceDefinitions: [
      {
        pattern: "RECENT_OWNERSHIP_CHANGE",
        importance: 1,
        description: "최근 소유권이 변경됨",
      },
      {
        pattern: "MULTIPLE_PROPERTY_ACQUISITION",
        importance: 2,
        description: "임대인이 짧은 기간 다수의 부동산을 추가 매입함 ({{term:갭투자|무자본 갭투자}} 의심)",
      },
      {
        pattern: "HIGH_JEONSE_RATIO",
        importance: 2,
        description: "전세금이 주변 시세보다 높음",
      },
    ],
    investigations: [
      {
        investigationId: "CHECK_REGISTRY",
        name: "등기 정보 확인",
        cost: 500,
        unlockCondition: null,
        documentId: "DOC_REGISTRY",
        purpose:
          "소유자가 누구인지, 근저당·압류 같은 권리관계가 있는지 확인합니다.",
      },
      {
        investigationId: "CHECK_MARKET",
        name: "시세 정보 확인",
        cost: 300,
        unlockCondition: null,
        documentId: "DOC_MARKET",
        purpose:
          "제시된 금액이 주변 실거래가와 맞는 수준인지 비교합니다.",
      },
      {
        investigationId: "CHECK_LANDLORD",
        name: "임대인 추가 조사",
        cost: 400,
        unlockCondition: { kind: "evidence", pattern: "MULTIPLE_PROPERTY_ACQUISITION" },
        documentId: "DOC_LANDLORD",
        purpose:
          "계약 상대가 실제 소유자이고 다른 문제 이력은 없는지 확인합니다.",
      },
    ],
    npc: {
      npcId: "NPC_01",
      displayName: "공인중개사 이중개",
      greeting: "이 동네서 15년 넘게 중개했습니다. 뭐가 궁금하신지 편하게 물어보세요.",
      fallbackLine: "그런 세세한 것까지는... 제가 15년째 하고 있는데 걱정 안 하셔도 됩니다.",
      statements: [
        {
          statementId: "S01",
          text: "집주인이 여러 채를 갖고 있어도 자금 여력이 충분해서 안전합니다.",
          matchKeywords: ["집주인", "임대인", "자금", "여력"],
        },
        {
          statementId: "S02",
          text: "전세금은 시세에 맞게 책정된 겁니다.",
          matchKeywords: ["시세", "가격", "전세금"],
        },
      ],
      questions: [
        {
          questionId: "S01-q",
          prompt: "집주인은 어떤 분인가요?",
          statementId: "S01",
        },
        {
          questionId: "S02-q",
          prompt: "전세금이 시세에 맞나요?",
          statementId: "S02",
        },
      ],
    },
    contradictions: [
      {
        contradictionId: "C01",
        statementId: "S01",
        evidencePattern: "MULTIPLE_PROPERTY_ACQUISITION",
        score: 12,
        explanation:
          "짧은 기간 다수의 부동산을 매입한 것은 세입자 보증금으로 매입 자금을 충당하는 무자본 갭투자일 가능성을 시사한다. '자금 여력이 충분하다'는 설명은 이 정황과 모순된다.",
      },
      {
        contradictionId: "C02",
        statementId: "S02",
        evidencePattern: "HIGH_JEONSE_RATIO",
        score: 10,
        explanation:
          "주변 평균 전세가(1억 8천만 원)보다 이 매물의 전세금(2억 원)이 더 높다. '시세에 맞게 책정됐다'는 설명과 모순된다.",
      },
    ],
    endingOptions: [
      {
        decision: "SAFE_TO_PROCEED",
        score: 4,
        comment: "무자본 갭투자 정황을 확인하지 않고 진행하는 것은 위험합니다.",
      },
      {
        decision: "NEED_MORE_VERIFICATION",
        score: 15,
        comment: "임대인의 자금 상황과 보증보험 가입 여부를 추가로 확인한 뒤 진행하는 것이 안전합니다.",
      },
      {
        decision: "STOP_CONTRACT",
        score: 11,
        comment: "위험 신호가 겹친다면 계약을 중단하는 것도 안전한 선택입니다.",
      },
    ],
  },
  {
    caseId: "JEONSE_003",
    title: "안전해 보이는 신탁 오피스텔",
    domain: "JEONSE",
    initialPoints: 1500,
    scenario: {
      description:
        "서울 ○○구 신축 오피스텔. 중개사가 융자도 없고 보증보험도 가능한 안전한 매물이라고 소개했다.",
      propertyLocation: "서울 ○○구 신축 오피스텔",
      propertyPriceDescription: "전세금 2억 7천만 원",
      brokerLine:
        "제가 등록된 공인중개사라 확실히 말씀드리는 건데, 이 오피스텔 융자도 없고 보증보험도 바로 되는 완전 안전한 매물이에요. 이런 조건 흔치 않습니다.",
      speakerLabel: "공인중개사 김중개",
      goal: "이 계약을 진행해도 되는지 판단하십시오.",
    },
    documents: [
      {
        documentId: "DOC_REGISTRY",
        title: "등기 정보",
        blocks: [
          {
            blockId: "REG_00",
            text: "고유번호 1234-2026-002211 / 소재지: 서울특별시 ○○구 ○○동 123-45, ○○오피스텔 401호 / 전용면적 42.3㎡",
            evidencePattern: null,
          },
          {
            blockId: "REG_01",
            text: "【갑구】 순위 3번 소유권이전 2026.03.21 접수 제12345호, 등기원인: 2026.03.15 매매, 소유자: B (전 소유자 A로부터 이전)",
            evidencePattern: "RECENT_OWNERSHIP_CHANGE",
          },
          {
            blockId: "REG_02",
            text: "【갑구】 순위 4번 신탁 2026.03.21 접수 제12346호, 등기원인: 신탁, 수탁자: ○○신탁주식회사, 신탁원부 제2026-88호 별첨 — 신탁원부상 처분·관리에 관한 사항은 수탁자 동의 필요",
            evidencePattern: "TRUST_REGISTRATION",
          },
          {
            blockId: "REG_03",
            text: "【{{term:을구}}】 {{term:근저당권}} 설정 등기 없음 (해당 사항 없음)",
            evidencePattern: null,
          },
          {
            blockId: "REG_04",
            text: "발급일자 2026.03.25 (열람용) — 등기기록의 내용과 틀림없음을 증명함, 법원행정처 등기정보중앙관리소",
            evidencePattern: null,
          },
        ],
      },
      {
        documentId: "DOC_AGENT",
        title: "중개사 정보",
        blocks: [
          {
            blockId: "AGT_01",
            text: "공인중개사사무소 등록번호: 서울-○○구-2019-00123 / 대표 김중개, 등록일 2019.05.02 — 국가공간정보포털 조회 결과 정상 등록",
            evidencePattern: null,
          },
          {
            blockId: "AGT_02",
            text: "통화 메모 14:32 — '오늘 중으로 계약금 안 넣으시면 다른 분이랑 계약 진행하겠다'고 안내함. 콜백 요청에도 '지금 결정 안 하시면 어렵다'는 답변만 반복",
            evidencePattern: "URGENCY",
          },
          {
            blockId: "AGT_03",
            text: "최근 1년간 처리 건수 47건, 관할 구청 민원 접수 이력 없음",
            evidencePattern: null,
          },
        ],
      },
      {
        documentId: "DOC_CONTRACT",
        title: "계약서",
        blocks: [
          {
            blockId: "CTR_00",
            text: "제1조(목적) 임대인은 임차인에게 아래 표시 부동산을 다음 조건으로 임대차한다. 임대차기간: 2026.04.01 ~ 2028.03.31 (24개월)",
            evidencePattern: null,
          },
          {
            blockId: "CTR_01",
            text: "제3조(임대인) 임대인란에 소유자 'B' 기재. 신탁 부동산의 경우 첨부되어야 할 신탁회사 동의서(또는 신탁원부상 임대차 동의 확인서)가 계약서에 첨부되어 있지 않음",
            evidencePattern: "VERIFICATION_BLOCK",
          },
          {
            blockId: "CTR_02",
            text: "특약사항 제5항: '본 계약은 보증보험 가입이 가능한 안전한 매물임을 임대인이 확인함'이라 기재되어 있으나 보증사 확인서류는 미첨부",
            evidencePattern: null,
          },
        ],
      },
    ],
    hiddenTruth: {
      fraudType: "TRUST_PROPERTY",
      riskPatterns: ["TRUST_REGISTRATION", "VERIFICATION_BLOCK", "URGENCY"],
      requiredEvidence: ["TRUST_REGISTRATION", "VERIFICATION_BLOCK"],
      explanation:
        "이 매물은 신탁회사에 신탁 등기가 되어 있는 '신탁부동산'이었습니다.\n\n신탁 부동산은 등기부상 소유자가 아니라 신탁회사(수탁자)가 처분·관리 권한을 갖기 때문에, 수탁자의 동의 없이 체결된 임대차 계약은 무효가 되거나 임차인이 보증금을 지키지 못할 위험이 있습니다. 중개사의 '집주인이 직접 계약하면 문제없다'는 설명은 이 사실과 정면으로 배치됩니다.",
    },
    evidenceDefinitions: [
      {
        pattern: "TRUST_REGISTRATION",
        importance: 2,
        description: "{{term:신탁등기|신탁 등기}} 발견 — 신탁회사({{term:수탁자}}) 동의 없이는 계약 권한이 없을 수 있음",
      },
      {
        pattern: "RECENT_OWNERSHIP_CHANGE",
        importance: 1,
        description: "최근 소유권이 변경됨",
      },
      {
        pattern: "URGENCY",
        importance: 1,
        description: "계약을 서두르도록 압박함",
      },
      {
        pattern: "VERIFICATION_BLOCK",
        importance: 2,
        description: "계약 권한을 확인할 수 있는 서류({{term:신탁회사}} 동의서)가 누락됨",
      },
    ],
    investigations: [
      {
        investigationId: "CHECK_REGISTRY",
        name: "등기 정보 확인",
        cost: 500,
        unlockCondition: null,
        documentId: "DOC_REGISTRY",
        purpose:
          "소유자가 누구인지, 근저당·압류 같은 권리관계가 있는지 확인합니다.",
      },
      {
        investigationId: "CHECK_AGENT",
        name: "중개사 등록 확인",
        cost: 200,
        unlockCondition: null,
        documentId: "DOC_AGENT",
        purpose:
          "중개를 맡은 곳이 정식 등록된 공인중개사무소이고 설명이 서류와 맞는지 확인합니다.",
      },
      {
        investigationId: "CHECK_CONTRACT",
        name: "계약서 확인",
        cost: 300,
        unlockCondition: { kind: "investigation", investigationId: "CHECK_REGISTRY" },
        documentId: "DOC_CONTRACT",
        purpose:
          "계약서 특약과 조건에 불리하거나 이상한 항목이 있는지 확인합니다.",
      },
    ],
    npc: {
      npcId: "NPC_01",
      displayName: "공인중개사 김중개",
      greeting: "저는 정식 등록된 공인중개사입니다. 궁금하신 점 있으시면 뭐든 물어보세요.",
      fallbackLine: "그 부분은 제가 지금 확답드리기 어렵네요. 일단 계약부터 하시죠.",
      statements: [
        {
          statementId: "S01",
          text: "집주인이 직접 계약하면 아무 문제 없습니다.",
          matchKeywords: ["집주인", "소유주", "명의", "신탁", "계약자"],
        },
        {
          statementId: "S02",
          text: "보증보험도 가입 가능한 안전한 매물입니다.",
          matchKeywords: ["보증보험", "보증", "안전"],
        },
      ],
      questions: [
        {
          questionId: "S01-q",
          prompt: "집주인이 직접 계약하는 건가요?",
          statementId: "S01",
        },
        {
          questionId: "S02-q",
          prompt: "보증보험 가입할 수 있나요?",
          statementId: "S02",
        },
      ],
    },
    contradictions: [
      {
        contradictionId: "C01",
        statementId: "S01",
        evidencePattern: "TRUST_REGISTRATION",
        score: 15,
        explanation:
          "신탁 부동산은 소유자 본인이 아니라 신탁회사(수탁자)의 동의 없이는 계약 권한이 없을 수 있다. '집주인이 직접 계약하면 문제없다'는 설명은 신탁 등기 사실과 모순된다.",
      },
      {
        contradictionId: "C02",
        statementId: "S02",
        evidencePattern: "VERIFICATION_BLOCK",
        score: 10,
        explanation:
          "보증보험 가입 가능 여부는 신탁회사 동의서 등 서류가 갖춰져야 확인할 수 있는데, 계약서에 해당 서류가 누락되어 있어 '안전한 매물'이라는 주장과 모순된다.",
      },
    ],
    endingOptions: [
      {
        decision: "SAFE_TO_PROCEED",
        score: 5,
        comment: "신탁 문제를 확인하지 않고 진행하는 것은 위험합니다.",
      },
      {
        decision: "NEED_MORE_VERIFICATION",
        score: 15,
        comment: "신탁회사 동의서 등을 추가로 확인한 뒤 진행하는 것이 안전합니다.",
      },
      {
        decision: "STOP_CONTRACT",
        score: 12,
        comment: "위험 신호가 명확하다면 계약을 중단하는 것도 안전한 선택입니다.",
      },
    ],
  },
  {
    caseId: "CHEONGYAK_004",
    title: "특별공급 당첨 문자",
    domain: "CHEONGYAK",
    initialPoints: 1000,
    scenario: {
      description:
        "낯선 번호로 분양 특별공급 대상자 선정 문자를 받았다. 오늘 오후 5시까지 계약 의사를 확인해야 한다고 한다.",
      propertyLocation: "○○건설 분양 예정 아파트",
      propertyPriceDescription: "특별공급 대상자 선정 안내",
      brokerLine:
        "[○○건설] 축하드립니다! 고객님은 미계약 잔여세대 특별공급 대상자로 최종 선정되셨습니다. 금일 17시까지 계약 의사를 회신하지 않으시면 자동 취소되오니 유의하시기 바랍니다.",
      speakerLabel: "발신 문자",
      goal: "이 안내를 믿고 계약을 진행해도 되는지 판단하십시오.",
    },
    documents: [
      {
        documentId: "DOC_SMS",
        title: "수신 문자",
        blocks: [
          {
            blockId: "SMS_00",
            text: "발신번호: 010-9284-5510 (수신 시각 09:14)",
            evidencePattern: null,
          },
          {
            blockId: "SMS_01",
            text: "[Web발신]\n[○○건설] 축하드립니다! 고객님은 미계약 잔여세대 특별공급 대상자로 최종 선정되셨습니다. 금일 17시까지 계약 의사를 회신하지 않으시면 자동 취소되오니 유의 바랍니다.",
            evidencePattern: "URGENCY",
          },
          {
            blockId: "SMS_02",
            text: "계약금(500만원) 입금계좌: 국민은행 123456-01-789012 (예금주: 김민수) — 입금 확인 후 정식 계약서 발송 예정",
            evidencePattern: "PAYMENT_PRESSURE",
          },
          {
            blockId: "SMS_03",
            text: "자세한 안내 및 신청서 작성은 아래 링크에서 진행해주세요: gunsul-official.kr/apply (수신거부 080-000-0000)",
            evidencePattern: null,
          },
        ],
      },
      {
        documentId: "DOC_SITE",
        title: "문자 속 사이트",
        blocks: [
          {
            blockId: "SITE_01",
            text: "접속 URL 확인 결과: gunsul-official.kr — 실제 ○○건설 공식 홈페이지 도메인(official-ggunsul.co.kr)과 철자 순서가 다름. WHOIS 조회 결과 도메인 등록일 2026.01.02, 등록자 정보 비공개 처리됨",
            evidencePattern: "FAKE_WEBSITE",
          },
          {
            blockId: "SITE_02",
            text: "사이트 내 회사 소개 문구는 ○○건설 공식 홈페이지 텍스트를 그대로 복사한 것으로 확인됨",
            evidencePattern: null,
          },
        ],
      },
      {
        documentId: "DOC_OFFICIAL",
        title: "청약Home / 건설사 공식 분양공고",
        blocks: [
          {
            blockId: "OFC_01",
            text: "청약Home 공식 안내: '특별공급 당첨자는 청약Home 마이페이지 및 등기우편을 통해서만 개별 통지되며, 문자메시지로 개인 계좌 입금을 요구하는 경우가 없습니다. 확인되지 않은 링크·연락처를 통한 입금을 절대 하지 마시기 바랍니다.'",
            evidencePattern: "FAKE_AUTHORITY",
          },
          {
            blockId: "OFC_02",
            text: "○○건설 공식 고객센터: 1588-0000 (평일 09:00~18:00) / 공식 홈페이지: official-ggunsul.co.kr",
            evidencePattern: null,
          },
          {
            blockId: "OFC_03",
            text: "청약Home 로그인 후 '나의 청약 현황' 조회 결과 — 해당 세대에 대한 당첨·예비 이력 없음",
            evidencePattern: null,
          },
        ],
      },
      {
        documentId: "DOC_PAYMENT",
        title: "입금계좌 재확인",
        blocks: [
          {
            blockId: "PAY_01",
            text: "입금계좌 예금주 조회 — '김민수'는 ○○건설 법인 명의가 아닌 개인 명의 계좌. 정상적인 분양계약금은 시행사 명의의 법인 계좌로만 입금받는 것이 원칙",
            evidencePattern: "PAYMENT_PRESSURE",
          },
          {
            blockId: "PAY_02",
            text: "해당 계좌번호로 최근 유사 피해 신고 사례 검색 결과 다수 확인됨 (경찰청 사이버캅 조회)",
            evidencePattern: null,
          },
        ],
      },
    ],
    hiddenTruth: {
      fraudType: "PRESALE_IMPERSONATION",
      riskPatterns: ["FAKE_AUTHORITY", "FAKE_WEBSITE", "URGENCY", "PAYMENT_PRESSURE"],
      requiredEvidence: ["FAKE_AUTHORITY", "FAKE_WEBSITE"],
      explanation:
        "이 문자는 건설사를 사칭한 분양 사기 시도였습니다.\n\n실제 특별공급 당첨자는 청약Home을 통해서만 개별 통지되며, 문자로 개인 계좌 입금을 요구하는 경우가 없습니다. 공식 도메인과 다른 가짜 사이트, 법인이 아닌 개인 명의 계좌가 이 사기를 드러내는 결정적 단서였습니다.",
    },
    evidenceDefinitions: [
      {
        pattern: "FAKE_AUTHORITY",
        importance: 2,
        description: "공식 통지 절차(청약Home)와 다른 방식으로 연락함 — 건설사를 사칭할 가능성",
      },
      {
        pattern: "FAKE_WEBSITE",
        importance: 2,
        description: "공식 도메인과 스펠링이 다른 가짜 사이트로 유도함",
      },
      {
        pattern: "URGENCY",
        importance: 1,
        description: "당일 마감을 이유로 빠른 결정을 압박함",
      },
      {
        pattern: "PAYMENT_PRESSURE",
        importance: 1,
        description: "법인 명의가 아닌 개인 계좌로 입금을 요구함",
      },
    ],
    investigations: [
      {
        investigationId: "CHECK_SMS",
        name: "수신 문자 확인",
        cost: 0,
        unlockCondition: null,
        documentId: "DOC_SMS",
        purpose:
          "받은 문자의 발신 번호와 링크, 문구가 정상적인 안내인지 확인합니다.",
      },
      {
        investigationId: "CHECK_SITE",
        name: "문자 속 사이트 확인",
        cost: 200,
        unlockCondition: { kind: "investigation", investigationId: "CHECK_SMS" },
        documentId: "DOC_SITE",
        purpose:
          "문자 속 사이트가 공식 도메인인지, 개인정보를 요구하는지 확인합니다.",
        hiddenUntilUnlocked: true,
      },
      {
        investigationId: "CHECK_OFFICIAL",
        name: "청약Home/건설사 공식 확인",
        cost: 400,
        unlockCondition: null,
        documentId: "DOC_OFFICIAL",
        purpose:
          "청약Home과 건설사 공식 채널의 안내가 문자 내용과 일치하는지 대조합니다.",
      },
      {
        investigationId: "CHECK_PAYMENT",
        name: "입금계좌 재확인",
        cost: 100,
        unlockCondition: { kind: "investigation", investigationId: "CHECK_SMS" },
        documentId: "DOC_PAYMENT",
        purpose:
          "입금하라는 계좌가 공식 계좌인지, 예금주 명의가 맞는지 다시 확인합니다.",
        hiddenUntilUnlocked: true,
      },
    ],
    npc: {
      npcId: "NPC_01",
      displayName: "문자 속 안내 담당자",
      greeting: "고객님, 문의사항 있으시면 답장 주세요. 다만 시간이 얼마 남지 않았습니다.",
      fallbackLine: "고객님, 시간이 얼마 안 남았습니다. 서둘러 주세요.",
      statements: [
        {
          statementId: "S01",
          text: "네, 맞습니다. 오늘 오후 5시까지 계약금을 입금해주셔야 특별공급 자격이 유지됩니다.",
          matchKeywords: ["당첨", "선정", "진짜", "맞나요", "정말"],
        },
      ],
      questions: [
        {
          questionId: "S01-q",
          prompt: "정말 제가 당첨된 게 맞나요?",
          statementId: "S01",
        },
      ],
    },
    contradictions: [
      {
        contradictionId: "C01",
        statementId: "S01",
        evidencePattern: "FAKE_AUTHORITY",
        score: 15,
        explanation:
          "공식 분양공고에 따르면 특별공급 당첨자는 청약Home을 통해 개별 통지되며 문자로 개인 계좌 입금을 요구하지 않는다. '오늘 입금해야 자격이 유지된다'는 안내는 이 공식 절차와 모순된다.",
      },
    ],
    endingOptions: [
      {
        decision: "SAFE_TO_PROCEED",
        score: 0,
        comment: "가짜 사이트와 개인 계좌 요구가 확인된 상황에서 입금을 진행하는 것은 매우 위험합니다.",
      },
      {
        decision: "NEED_MORE_VERIFICATION",
        score: 14,
        comment: "청약Home 등 공식 채널로 먼저 확인하는 것이 안전합니다.",
      },
      {
        decision: "STOP_CONTRACT",
        score: 18,
        comment: "공식 통지 절차와 다르고 가짜 사이트까지 확인되었다면 즉시 중단하는 것이 맞습니다.",
      },
    ],
  },
  {
    caseId: "BUNYANG_005",
    title: "임대수익 보장형 분양",
    domain: "BUNYANG",
    initialPoints: 1400,
    scenario: {
      description: "분양가 3억 원, 월 180만 원 임대수익을 보장한다는 오피스텔 분양 상담을 받았다.",
      propertyLocation: "지방 광역시 신축 오피스텔 분양",
      propertyPriceDescription: "분양가 3억 원 / 월 180만 원 임대수익 보장",
      brokerLine:
        "고객님~ 저희 상품은 수익보장이 쭉 이어지니까 정말 안심하고 투자하셔도 돼요! 이런 조건 요즘 찾기 힘듭니다, 진짜예요.",
      speakerLabel: "분양상담사",
      goal: "이 분양 계약을 진행해도 되는지 판단하십시오.",
    },
    documents: [
      {
        documentId: "DOC_DEVELOPER",
        title: "시행사 정보",
        blocks: [
          {
            blockId: "DEV_01",
            text: "시행사 등록 확인 — 법인 설립 2018년(8년차), 사업자등록번호 정상 확인됨. 과거 준공 실적 3건 (2020, 2022, 2024년 각 1건, 모두 사용승인 완료)",
            evidencePattern: null,
          },
          {
            blockId: "DEV_02",
            text: "최근 3년간 시행사 관련 민사소송·분쟁 이력 조회 결과 특이사항 없음",
            evidencePattern: null,
          },
        ],
      },
      {
        documentId: "DOC_BUILDER",
        title: "시공사 정보",
        blocks: [
          {
            blockId: "BLD_01",
            text: "시공사 시공능력평가 순위 30위권 중견 건설사 (국토교통부 2026년 발표 기준). 이 사업장에 대한 계약이행보증(공사이행보증) 가입 확인됨, 보증기관: ○○건설공제조합",
            evidencePattern: null,
          },
          {
            blockId: "BLD_02",
            text: "최근 5년간 시공한 현장 12곳 중 준공 지연 사례 1건 (2023년, 사유: 인허가 지연)",
            evidencePattern: null,
          },
        ],
      },
      {
        documentId: "DOC_YIELD",
        title: "수익보장 관련 자료",
        blocks: [
          {
            blockId: "YLD_01",
            text: "임대수익보장 계약 구조 — 분양대금과 별도로 수익보장금을 관리계좌(신탁계좌)에 예치하고, 위탁관리계약을 통해 매월 집행. 관리사: ○○자산관리(주)",
            evidencePattern: null,
          },
          {
            blockId: "YLD_02",
            text: "수익보장 조건 상세 — 월 180만원(연 7.2% 수익률 환산) 보장 기간은 분양계약일로부터 3년. 3년 경과 후에는 실제 임대차 시장 시세에 연동되며, 공실 발생 시 수익보장 대상에서 제외됨",
            evidencePattern: "LIMITED_GUARANTEE_PERIOD",
          },
          {
            blockId: "YLD_03",
            text: "현재까지(분양 개시 후 2개월) 계약자 148세대 중 132세대 계약 완료, 잔여 16세대",
            evidencePattern: null,
          },
        ],
      },
      {
        documentId: "DOC_LAND",
        title: "토지/건축 관련 정보",
        blocks: [
          {
            blockId: "LND_01",
            text: "건축 인허가 정상 완료 확인 (건축허가번호 2024-건축-0231호, 관할 ○○시청). 분양보증 보험 가입 확인됨 — 보증기관: 주택도시보증공사(HUG), 보증서번호 HUG-2025-04-1122",
            evidencePattern: null,
          },
          {
            blockId: "LND_02",
            text: "토지사용승낙서 및 소유권 확인 완료, 저당권 등 제한물권 설정 없음",
            evidencePattern: null,
          },
        ],
      },
      {
        documentId: "DOC_CONTRACT",
        title: "계약서",
        blocks: [
          {
            blockId: "CTR_01",
            text: "특약사항 제7조: '임대수익보장은 소유권이전등기일로부터 만 3년간 적용하며, 이후에는 실거래 임대차 시세에 따르고 이때 발생하는 공실 리스크는 매수인이 부담한다.'",
            evidencePattern: "LIMITED_GUARANTEE_PERIOD",
          },
          {
            blockId: "CTR_02",
            text: "특약사항 제9조: 관리비 및 수선충당금은 별도 정산하며 매수인이 부담한다.",
            evidencePattern: null,
          },
        ],
      },
    ],
    hiddenTruth: {
      fraudType: "NONE_LIMITED_RISK",
      riskPatterns: ["LIMITED_GUARANTEE_PERIOD"],
      requiredEvidence: ["LIMITED_GUARANTEE_PERIOD"],
      explanation:
        "이 사례는 위험 신호가 있었지만 치명적인 사기는 아니었습니다.\n\n인허가와 분양보증은 정상이었고, 유일하게 주의할 부분은 수익보장 기간이 3년으로 제한되어 있다는 점이었습니다. 이 조건을 정확히 이해하고 진행했다면 합리적인 선택일 수 있습니다 — 모든 위험 신호가 곧 사기를 의미하지는 않습니다.",
    },
    evidenceDefinitions: [
      {
        pattern: "LIMITED_GUARANTEE_PERIOD",
        importance: 2,
        description: "임대수익 보장 기간이 3년으로 제한되어 있어 이후 공실 위험을 매수인이 부담할 수 있음",
      },
    ],
    investigations: [
      {
        investigationId: "CHECK_DEVELOPER",
        name: "시행사 정보 확인",
        cost: 200,
        unlockCondition: null,
        documentId: "DOC_DEVELOPER",
        purpose:
          "분양을 맡은 시행사가 실제 등록된 곳이고 사업 실적이 있는지 확인합니다.",
      },
      {
        investigationId: "CHECK_BUILDER",
        name: "시공사 정보 확인",
        cost: 200,
        unlockCondition: null,
        documentId: "DOC_BUILDER",
        purpose:
          "시공을 맡은 건설사의 규모와 신용, 시공 능력을 확인합니다.",
      },
      {
        investigationId: "CHECK_YIELD",
        name: "수익보장 자료 확인",
        cost: 400,
        unlockCondition: null,
        documentId: "DOC_YIELD",
        purpose:
          "약속한 수익률의 근거가 무엇인지, 보장 주체가 책임질 수 있는지 확인합니다.",
      },
      {
        investigationId: "CHECK_LAND",
        name: "토지/건축 정보 확인",
        cost: 300,
        unlockCondition: null,
        documentId: "DOC_LAND",
        purpose:
          "토지 용도와 건축 인허가 상태가 분양 내용과 맞는지 확인합니다.",
      },
      {
        investigationId: "CHECK_CONTRACT",
        name: "계약서 확인",
        cost: 300,
        unlockCondition: { kind: "investigation", investigationId: "CHECK_YIELD" },
        documentId: "DOC_CONTRACT",
        purpose:
          "계약서 특약과 조건에 불리하거나 이상한 항목이 있는지 확인합니다.",
      },
    ],
    npc: {
      npcId: "NPC_01",
      displayName: "분양상담사 최상담",
      greeting: "고객님~ 뭐든 편하게 물어보세요! 제가 시원하게 답해드릴게요~",
      fallbackLine: "그건 저도 잘... 아무튼 지금 계약하시는 게 제일 좋아요!",
      statements: [
        {
          statementId: "S01",
          text: "수익보장은 평생 지속됩니다.",
          matchKeywords: ["수익보장", "언제까지", "기간", "몇 년"],
        },
        {
          statementId: "S02",
          text: "이 프로젝트는 인허가와 분양보증 모두 정상입니다.",
          matchKeywords: ["인허가", "분양보증", "허가"],
        },
      ],
      questions: [
        {
          questionId: "S01-q",
          prompt: "수익보장은 언제까지 되나요?",
          statementId: "S01",
        },
        {
          questionId: "S02-q",
          prompt: "인허가랑 분양보증은 문제없나요?",
          statementId: "S02",
        },
      ],
    },
    contradictions: [
      {
        contradictionId: "C01",
        statementId: "S01",
        evidencePattern: "LIMITED_GUARANTEE_PERIOD",
        score: 10,
        explanation:
          "계약서상 수익보장 기간은 3년으로 한정되어 있는데, 상담사는 '평생 지속된다'고 설명하여 실제 계약 조건과 모순된다.",
      },
    ],
    endingOptions: [
      {
        decision: "SAFE_TO_PROCEED",
        score: 15,
        comment: "인허가·분양보증이 정상이고 수익보장 기간(3년)을 정확히 이해했다면 진행할 수 있는 사안입니다.",
      },
      {
        decision: "NEED_MORE_VERIFICATION",
        score: 13,
        comment: "수익보장 기간 이후의 임대 전망을 조금 더 확인해보는 것도 신중한 선택입니다.",
      },
      {
        decision: "STOP_CONTRACT",
        score: 5,
        comment: "치명적인 위험 신호가 없는 상황에서 계약을 완전히 중단하는 것은 다소 과도한 선택일 수 있습니다.",
      },
    ],
  },
  {
    caseId: "FINAL_001",
    title: "가족의 계약을 막아라",
    domain: "JEONSE",
    initialPoints: 1200,
    scenario: {
      description:
        '동생이 오늘 전세 계약을 하겠다고 연락해왔다. "나 집 구했어. 신축인데 시세보다 싸게 나왔어. 오늘 계약하려고." 20분 안에 위험 요소를 확인해 동생을 설득해야 한다.',
      propertyLocation: "동생이 계약하려는 신축 오피스텔",
      propertyPriceDescription: "전세금 1억 8,400만 원",
      brokerLine:
        "중개사님이 완전 안전한 매물이라고 몇 번이나 강조하시더라고. 나도 이 정도면 딱히 걸리는 거 없어 보이는데?",
      speakerLabel: "동생",
      goal: "동생이 오늘 계약을 진행해도 되는지, 아니면 막아야 하는지 20분 안에 판단하십시오.",
    },
    documents: [
      {
        documentId: "DOC_REGISTRY",
        title: "등기 정보",
        blocks: [
          {
            blockId: "REG_00",
            text: "고유번호 1234-2026-009981 / 소재지: 신축 오피스텔 802호 / 전용면적 29.7㎡",
            evidencePattern: null,
          },
          {
            blockId: "REG_01",
            text: "국토교통부 실거래가 조회 — 동일 단지 매매 시세 약 2억원, 동생이 계약하려는 전세금 1억 8,400만원 → 전세가율 약 92% (통상 안전 기준 70% 이하 권고)",
            evidencePattern: "HIGH_JEONSE_RATIO",
          },
          {
            blockId: "REG_02",
            text: "【갑구】 순위 3번 소유권이전 2026.07.02 접수, 등기원인: 매매 — 계약 시점 기준 소유권 취득 불과 약 1개월 전",
            evidencePattern: "RECENT_OWNERSHIP_CHANGE",
          },
          {
            blockId: "REG_03",
            text: "【을구】 순위 1번 근저당권설정 채권최고액 8,000만원, 근저당권자: ○○저축은행 — 전세금과 합산 시 매매가에 근접 또는 초과 가능성",
            evidencePattern: "EXCESSIVE_MORTGAGE",
          },
        ],
      },
      {
        documentId: "DOC_AGENT",
        title: "중개사 대응",
        blocks: [
          {
            blockId: "AGT_01",
            text: "동생과의 통화 메모 — 중개사가 '오늘 계약금 안 넣으시면 다른 손님한테 넘어간다', '이런 매물 지금 아니면 못 구한다'고 반복해서 재촉함",
            evidencePattern: "URGENCY",
          },
          {
            blockId: "AGT_02",
            text: "동생 말로는 중개사가 등기부등본은 '나중에 보여주겠다'며 계약부터 먼저 진행하자고 했다 함",
            evidencePattern: null,
          },
        ],
      },
      {
        documentId: "DOC_GUARANTEE",
        title: "보증보험 관련 서류",
        blocks: [
          {
            blockId: "GUR_01",
            text: "HUG(주택도시보증공사) 안심전세포털에서 전세보증금반환보증 가입 가능 여부 조회 시도 — 임대인 정보 불일치로 조회 불가, 중개사에게 요청한 보증 가입 확인서류는 아직 미제공 상태",
            evidencePattern: "VERIFICATION_BLOCK",
          },
          {
            blockId: "GUR_02",
            text: "동생이 보유한 계약서 초안에는 보증보험 관련 특약이 기재되어 있지 않음",
            evidencePattern: null,
          },
        ],
      },
    ],
    hiddenTruth: {
      fraudType: "COMPOUND_JEONSE_RISK",
      riskPatterns: [
        "HIGH_JEONSE_RATIO",
        "RECENT_OWNERSHIP_CHANGE",
        "EXCESSIVE_MORTGAGE",
        "URGENCY",
        "VERIFICATION_BLOCK",
      ],
      requiredEvidence: ["HIGH_JEONSE_RATIO", "EXCESSIVE_MORTGAGE", "VERIFICATION_BLOCK"],
      explanation:
        "전세가율 92%, 최근 소유권 변경, 근저당권 설정, 보증보험 미확인까지 여러 위험 신호가 동시에 발견된 사례입니다.\n\n이렇게 위험 요소가 겹칠 때는 확신 없이 '사기다'라고 단정하기보다, 오늘 계약을 보류하고 추가로 확인하는 것이 가장 안전한 판단입니다.",
    },
    evidenceDefinitions: [
      {
        pattern: "HIGH_JEONSE_RATIO",
        importance: 2,
        description: "{{term:전세가율}} 92% — 매매가 대비 전세금 비중이 매우 높음",
      },
      {
        pattern: "RECENT_OWNERSHIP_CHANGE",
        importance: 1,
        description: "최근 소유권이 변경됨",
      },
      {
        pattern: "EXCESSIVE_MORTGAGE",
        importance: 2,
        description: "{{term:근저당권}}이 설정되어 있어 경매 시 보증금 회수가 어려울 수 있음",
      },
      {
        pattern: "URGENCY",
        importance: 1,
        description: "계약을 서두르도록 압박함",
      },
      {
        pattern: "VERIFICATION_BLOCK",
        importance: 2,
        description: "{{term:보증보험}} 가입 여부를 확인할 서류가 제공되지 않음",
      },
    ],
    investigations: [
      {
        investigationId: "CHECK_REGISTRY",
        name: "등기 정보 확인",
        cost: 500,
        unlockCondition: null,
        documentId: "DOC_REGISTRY",
        purpose:
          "소유자가 누구인지, 근저당·압류 같은 권리관계가 있는지 확인합니다.",
      },
      {
        investigationId: "CHECK_AGENT",
        name: "중개사 대응 확인",
        cost: 200,
        unlockCondition: null,
        documentId: "DOC_AGENT",
        purpose:
          "중개를 맡은 곳이 정식 등록된 공인중개사무소이고 설명이 서류와 맞는지 확인합니다.",
      },
      {
        investigationId: "CHECK_GUARANTEE",
        name: "보증보험 서류 확인",
        cost: 300,
        unlockCondition: null,
        documentId: "DOC_GUARANTEE",
        purpose:
          "보증보험 가입 서류가 실제 유효한지, 조건이 충족되는지 확인합니다.",
      },
    ],
    npc: {
      npcId: "NPC_01",
      displayName: "동생",
      greeting: "왜 그렇게 걱정해~ 궁금한 거 있으면 물어봐.",
      fallbackLine: "그건 나도 잘 모르겠는데?",
      statements: [
        {
          statementId: "S01",
          text: "중개사가 완전 안전한 매물이라고 했어.",
          matchKeywords: ["중개사", "뭐래", "뭐라고"],
        },
      ],
      questions: [
        {
          questionId: "S01-q",
          prompt: "중개사가 뭐라고 했어?",
          statementId: "S01",
        },
      ],
    },
    contradictions: [
      {
        contradictionId: "C01",
        statementId: "S01",
        evidencePattern: "VERIFICATION_BLOCK",
        score: 15,
        explanation:
          "보증보험 가입 여부를 확인할 서류가 제공되지 않았는데 '완전 안전한 매물'이라고 단정하는 것은 근거가 부족하다. 중개사의 주장은 서류로 뒷받침되지 않아 모순된다.",
      },
    ],
    endingOptions: [
      {
        decision: "SAFE_TO_PROCEED",
        score: 3,
        comment: "전세가율, 근저당, 보증보험 미확인이 겹친 상태에서 진행하는 것은 매우 위험합니다.",
      },
      {
        decision: "NEED_MORE_VERIFICATION",
        score: 15,
        comment: "확인되지 않은 위험 요소가 있으므로 오늘 계약하지 말고 추가로 확인하는 것이 가장 안전한 판단입니다.",
      },
      {
        decision: "STOP_CONTRACT",
        score: 12,
        comment: "'사기다'라고 단정하는 것도 나쁜 선택은 아니지만, 아직 확인이 끝나지 않은 상태에서 성급한 단정일 수 있습니다.",
      },
    ],
  },
];
