export type ExperienceTypeId = "voice-phishing" | "case-select" | "jeonse";

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

export interface ExperienceModule<TContent = unknown> {
  typeId: ExperienceTypeId;
  contentPool: TContent[];
  pickRandomContent(): TContent;
}

export interface DialogueChoice {
  id: string;
  text: string;
  next?: string; // 다음 DialogueNode의 id. 없으면 해당 시점에서 시나리오 종료.
}

export interface DialogueNode {
  id: string;
  speaker: string;
  line: string;
  choices: DialogueChoice[];
}

export interface VoicePhishingScenario {
  id: string;
  isNormalCase: boolean; // true면 정상 케이스(거절이 오답으로 채점됨)
  startNodeId: string;
  nodes: DialogueNode[];
}

export interface ScamCaseSide {
  title: string;
  body: string;
}

export interface ScamCasePair {
  id: string;
  scamCase: ScamCaseSide;
  normalCase: ScamCaseSide;
  correctSide: "scam" | "normal"; // 확장성을 위한 필드. 이 유형은 항상 "scam"
}

export interface ListingSide {
  title: string;
  details: string;
}

export interface ListingPair {
  id: string;
  normalListing: ListingSide;
  scamListing: ListingSide;
  correctSide: "normal" | "scam"; // 확장성을 위한 필드. 이 유형은 항상 "normal"
}
