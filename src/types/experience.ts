import type { ComponentType } from "react";

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
