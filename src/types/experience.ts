import type { ComponentType } from "react";

export type ExperienceTypeId =
  | "voice-phishing"
  | "case-investigation"
  | "jeonse"
  | "fraud-judgment";

export type Grade = "safe" | "caution" | "danger";

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
  pickRandomContent(): TContent;
  Component: ComponentType<ExperienceComponentProps<TContent>>;
}

export type ChoiceRisk = "safe" | "caution" | "danger";

export interface DialogueChoice {
  id: string;
  text: string;
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
}

export type JeonseFieldStatus = "정상" | "주의" | "위험";
export type JeonseField = [label: string, value: string, status: JeonseFieldStatus];
export type JeonseBuildingType = "다가구주택" | "아파트" | "오피스텔" | "빌라" | "단독주택";

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
  fields: JeonseField[];
  explain: string;
  lesson: string;
  reason: string;
}

export type FraudJudgmentAnswer = "fraud" | "safe";

// 원본 레포(fraudtest)의 15개 사기 유형을 그대로 옮긴 것. UI에는 절대 노출하지 않는다 —
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
  | "티켓_되팔이_사기";

export interface FraudJudgmentCard {
  id: string;
  category: FraudJudgmentCategory; // 렌더링 금지 — 내부 메타데이터 (step2에서 강제)
  title: string;
  content: string; // 판단 시점에서 끝나는 서술형 지문 (단일 문단)
  answer: FraudJudgmentAnswer; // 정답: fraud=사기, safe=정상
  explanation: string; // /result에서만 노출 (체험 중 노출 금지, step2에서 강제)
  source: string; // 출처 — 사기 예방기관명이 정답을 암시하므로 /result에서만 노출 (step2에서 강제)
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
}

export interface CaseNpcStatement {
  statementId: string;
  text: string;
}

export interface CaseNpcQuestion {
  questionId: string; // `${statementId}-q` 형식
  prompt: string; // 버튼 라벨 — 원본 suggested_questions 중 아래 매핑표로 선별한 것만
  statementId: string; // 클릭 시 노출되는 고정 대사
}

export interface CaseNpcPersona {
  npcId: string;
  displayName: string; // "공인중개사 박중개", "동생" 등 원본 그대로. "중개사" 하드코딩 금지 — 케이스마다 다르다.
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
}
