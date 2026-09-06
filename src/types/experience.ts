import type { ComponentType } from "react";

export type ExperienceTypeId =
  | "voice-phishing"
  | "case-investigation"
  | "jeonse"
  | "fraud-judgment";

export type Grade = "safe" | "caution" | "danger";

// 난이도 선택 필터 전용 코드 값. 화면 표시용 한글 라벨은 src/data/difficulty.ts.
export type Difficulty = "easy" | "medium" | "hard";

export interface ModuleResult {
  typeId: ExperienceTypeId;
  contentId: string;
  score: number; // 0~100
  grade: Grade;
  userChoice: string; // 사용자가 고른 선택지 id/텍스트
  correctChoice: string; // 정답 선택지 id/텍스트
  isCorrect: boolean;
  explanation: string; // 왜 그게 정답인지 (결과 리뷰용)
  mistakeTag?: string; // 오답일 때만: remediation.ts 매핑 키
}

export interface ExperienceComponentProps<TContent> {
  content: TContent;
  onComplete: (result: ModuleResult) => void;
}

export interface ExperienceModule<TContent = unknown> {
  typeId: ExperienceTypeId;
  contentPool: TContent[];
  pickRandomContent(difficulty?: Difficulty): TContent;
  Component: ComponentType<ExperienceComponentProps<TContent>>;
}

export type ChoiceRisk = "safe" | "caution" | "danger";

export interface DialogueChoice {
  id: string;
  text: string; // 선택지 버튼에 노출되는 설명 문구
  spokenText?: string; // 채팅 말풍선에 노출될 실제 발화체 문구. 없으면 text를 그대로 사용한다.
  next?: string; // 다음 DialogueNode의 id. 없으면 해당 시점에서 시나리오 종료.
  risk: ChoiceRisk; // 이 선택이 이 시나리오에서 얼마나 부적절한 대응인지 (시나리오 상대적 기준)
}

export interface DialogueNode {
  id: string;
  speaker: string;
  line: string;
  choices: DialogueChoice[];
}

// 렌더링 금지 — 내부 메타데이터. FraudJudgmentCategory와 동일 패턴.
export type VoicePhishingCategory =
  | "기관사칭형"
  | "대출빙자형"
  | "납치협박형"
  | "메신저피싱형"
  | "환불결제사칭형"
  | "택배배송사칭형"
  | "정상금융확인형"
  | "정상생활안내형";

export interface VoicePhishingScenario {
  id: string;
  isNormalCase: boolean; // true면 정상 케이스(거절이 오답으로 채점됨)
  category: VoicePhishingCategory;
  startNodeId: string;
  nodes: DialogueNode[];
  // 렌더링 금지 — 난이도 필터 전용 내부 메타데이터. 이번 범위에서는 미태깅(후속 작업).
  difficulty?: Difficulty;
}

export type JeonseFieldStatus = "정상" | "주의" | "위험";
export type JeonseField = [label: string, value: string, status: JeonseFieldStatus];
export type JeonseBuildingType = "다가구주택" | "아파트" | "오피스텔" | "빌라" | "단독주택";

// 렌더링 금지 — 내부 메타데이터. FraudJudgmentCategory와 동일 패턴.
// easy: risky/safe 판정을 뒷받침하는 위험 신호가 다수·명확. medium: 항목을 종합하거나 계산해야 판정 가능.
// hard: 숫자·용어만 보면 반대로 오판하기 쉬운 반전형(예: 전세가율은 안전권인데 숨은 위험이 있는 경우, 또는 그 반대).
export type JeonseDifficulty = Difficulty;

export interface JeonseHouse {
  id: string;
  short: string;
  name: string;
  addr: string;
  buildingType: JeonseBuildingType;
  deposit: string;
  monthlyRent?: string; // 반전세 매물일 때만 존재
  market: string;
  ratio: string;
  ratioBad: boolean;
  risky: boolean; // true = 정답 O(위험 있음), false = 정답 X(안전)
  difficulty: JeonseDifficulty;
  fields: JeonseField[];
  explain: string;
  lesson: string;
  reason: string;
}

export type FraudJudgmentAnswer = "fraud" | "safe";

// 원본 레포(fraudtest)의 19개 사기 유형을 그대로 옮긴 것. UI에는 절대 노출하지 않는다 —
// 콘텐츠 커버리지 테스트용 내부 메타데이터일 뿐이다.
export type FraudJudgmentCategory =
  | "중고거래_사기"
  | "투자리딩방_사기"
  | "로맨스스캠"
  | "스미싱"
  | "대환작업대출_사기"
  | "몸캠피싱"
  | "가짜쇼핑몰"
  | "대리입금"
  | "지인사칭_메신저피싱"
  | "취업사기"
  | "전세사기"
  | "택배기사_사칭피싱"
  | "중고차_사기"
  | "반려동물_분양사기"
  | "티켓_되팔이_사기"
  | "가상자산_사기"
  | "파밍_사기"
  | "보험사기"
  | "명의도용_사기";

export interface FraudJudgmentCard {
  id: string;
  category: FraudJudgmentCategory; // 렌더링 금지 — 내부 메타데이터 (step2에서 강제)
  title: string;
  content: string; // 판단 시점에서 끝나는 서술형 지문 (단일 문단)
  answer: FraudJudgmentAnswer; // 정답: fraud=사기, safe=정상
  explanation: string; // /result에서만 노출 (체험 중 노출 금지, step2에서 강제)
  source: string; // 출처 — 사기 예방기관명이 정답을 암시하므로 /result에서만 노출 (step2에서 강제)
  // 렌더링 금지 — 난이도 필터 전용 내부 메타데이터. 이번 범위에서는 미태깅(후속 작업).
  difficulty?: Difficulty;
}

export type CaseDomain = "JEONSE" | "CHEONGYAK" | "BUNYANG";

// 렌더링 금지 — 내부 채점/식별용. FraudJudgmentCategory와 동일 패턴.
export type CaseFraudType =
  | "HIGH_JEONSE_RATIO_RISK"
  | "GAP_INVESTMENT_RISK"
  | "TRUST_PROPERTY"
  | "PRESALE_IMPERSONATION"
  | "NONE_LIMITED_RISK"
  | "COMPOUND_JEONSE_RISK";

export interface CaseDocumentBlock {
  blockId: string;
  text: string;
  evidencePattern: string | null; // null이면 증거 등록 불가한 일반 정보 텍스트
}

export interface CaseDocument {
  documentId: string;
  title: string;
  blocks: CaseDocumentBlock[];
}

export interface CaseEvidenceDefinition {
  pattern: string;
  importance: 1 | 2;
  description: string;
}

export type CaseInvestigationUnlock =
  | { kind: "evidence"; pattern: string }
  | { kind: "investigation"; investigationId: string };

export interface CaseInvestigation {
  investigationId: string;
  name: string;
  cost: number;
  documentId: string;
  unlockCondition: CaseInvestigationUnlock | null;
  hiddenUntilUnlocked?: boolean; // true면 unlock 전 조사 목록 자체에서 숨김. 원본에 없으면 생략(비활성 표시만).
  // 체험자에게 보여줄 "이 조사를 왜 하는가" 한 줄 설명. 사기 유형·케이스 제목·정답을 암시하지 않는다.
  purpose: string;
}

export interface CaseNpcStatement {
  statementId: string;
  text: string;
  matchKeywords: string[]; // 자유 입력 질문에 이 중 하나라도 부분 문자열로 포함되면 이 대사로 응답한다.
}

export interface CaseNpcQuestion {
  questionId: string; // `${statementId}-q` 형식
  prompt: string; // 추천 질문 칩 라벨. 클릭하면 이 문구 그대로 자유 입력 매칭 로직을 통과해 질문된다.
  statementId: string; // 이 prompt가 매칭되어야 하는 대사 — 데이터 완결성 테스트에서 실제 매칭 여부를 검증한다.
}

export interface CaseNpcPersona {
  npcId: string;
  displayName: string; // "공인중개사 박중개", "동생" 등 원본 그대로. "중개사" 하드코딩 금지 — 케이스마다 다르다.
  greeting: string; // 조사 화면 진입 시 NPC가 먼저 건네는 인사말. 정답/오답을 암시하는 문구 금지, 톤으로만 페르소나를 드러낸다.
  fallbackLine: string; // 입력이 어떤 statement의 matchKeywords와도 매칭되지 않을 때 보여줄 회피 대사. 페르소나 톤 유지, 정답 암시 금지.
  statements: CaseNpcStatement[];
  questions: CaseNpcQuestion[];
}

export interface CaseContradiction {
  contradictionId: string;
  statementId: string; // 원본 contradictions[].left
  evidencePattern: string; // 원본 contradictions[].right
  score: number;
  explanation: string; // /result 전용
}

export type CaseFinalDecision =
  | "SAFE_TO_PROCEED"
  | "NEED_MORE_VERIFICATION"
  | "STOP_CONTRACT";

export interface CaseEndingOption {
  decision: CaseFinalDecision;
  score: number;
  comment: string; // /result 전용 — 정답을 암시하므로 체험 중 노출 금지
}

export interface CaseHiddenTruth {
  fraudType: CaseFraudType; // 렌더링 금지
  riskPatterns: string[];
  requiredEvidence: string[];
  explanation: string; // /result 전용
}

export interface CaseInvestigationContent {
  caseId: string;
  title: string; // 렌더링 금지 — 내부 식별용, 스포일러성 문구 포함 (step3에서 강제)
  domain: CaseDomain;
  initialPoints: number;
  scenario: {
    description: string;
    propertyLocation: string;
    propertyPriceDescription: string;
    brokerLine: string;
    speakerLabel: string; // "중개사" | "분양상담사" | "발신 문자" | "동생" 등 — 하드코딩 금지
    goal: string;
  };
  documents: CaseDocument[];
  hiddenTruth: CaseHiddenTruth;
  evidenceDefinitions: CaseEvidenceDefinition[];
  investigations: CaseInvestigation[];
  npc: CaseNpcPersona; // 6개 케이스 전부 npc_personas 길이 1 → 배열이 아닌 단일 필드
  contradictions: CaseContradiction[];
  endingOptions: CaseEndingOption[]; // 정확히 3개, decision 3종 각 1개
  // 렌더링 금지 — 난이도 필터 전용 내부 메타데이터. 이번 범위에서는 미태깅(후속 작업).
  difficulty?: Difficulty;
}
