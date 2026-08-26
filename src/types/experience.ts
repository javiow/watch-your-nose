import type { ComponentType } from "react";

export type ExperienceTypeId =
  | "voice-phishing"
  | "case-select"
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
