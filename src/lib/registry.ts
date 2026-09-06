import type {
  Difficulty,
  ExperienceModule,
  ExperienceTypeId,
  FraudJudgmentCard,
  JeonseHouse,
} from "@/types/experience";
import { VOICE_PHISHING_SCENARIOS } from "@/data/voice-phishing";
import { CASE_INVESTIGATION_CASES } from "@/data/case-investigation";
import { JEONSE_HOUSES, JEONSE_HOUSE_SETS } from "@/data/jeonse";
import { FRAUD_JUDGMENT_CARDS } from "@/data/fraud-judgment";
import { VoicePhishingExperience } from "@/components/experiences/VoicePhishingExperience";
import { CaseInvestigationExperience } from "@/components/experiences/CaseInvestigationExperience";
import { JeonseExperience } from "@/components/experiences/JeonseExperience";
import { FraudJudgmentExperience } from "@/components/experiences/FraudJudgmentExperience";

function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function pickByDifficulty<T extends { difficulty?: Difficulty }>(
  pool: T[],
  difficulty?: Difficulty,
): T {
  const matching = difficulty ? pool.filter((x) => x.difficulty === difficulty) : [];
  const source = matching.length > 0 ? matching : pool;
  return source[Math.floor(Math.random() * source.length)];
}

// 난이도가 올라갈수록 판정할 매물이 늘고 힌트는 줄어든다(힌트 예산은
// JeonseExperience가 매물 수에서 파생). 난이도 미지정 경로는 정적 세트(5채)를 쓴다.
const JEONSE_SET_SIZE_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 3,
  medium: 4,
  hard: 5,
};

function pickJeonseSet(difficulty?: Difficulty): JeonseHouse[] {
  if (difficulty) {
    const size = JEONSE_SET_SIZE_BY_DIFFICULTY[difficulty];
    const pool = JEONSE_HOUSES.filter((h) => h.difficulty === difficulty);
    if (pool.length >= size) {
      return shuffle(pool).slice(0, size);
    }
  }
  return JEONSE_HOUSE_SETS[Math.floor(Math.random() * JEONSE_HOUSE_SETS.length)];
}

const FRAUD_JUDGMENT_SET_SIZE = 4;

function pickFraudJudgmentSet(difficulty?: Difficulty): FraudJudgmentCard[] {
  const matching = difficulty
    ? FRAUD_JUDGMENT_CARDS.filter((c) => c.difficulty === difficulty)
    : [];
  const source = matching.length >= FRAUD_JUDGMENT_SET_SIZE ? matching : FRAUD_JUDGMENT_CARDS;
  return shuffle(source).slice(0, FRAUD_JUDGMENT_SET_SIZE);
}

export const EXPERIENCE_MODULES: ExperienceModule[] = [
  {
    typeId: "voice-phishing",
    contentPool: VOICE_PHISHING_SCENARIOS,
    pickRandomContent: (difficulty?: Difficulty) =>
      pickByDifficulty(VOICE_PHISHING_SCENARIOS, difficulty),
    Component: VoicePhishingExperience,
  },
  {
    typeId: "case-investigation",
    contentPool: CASE_INVESTIGATION_CASES,
    pickRandomContent: (difficulty?: Difficulty) =>
      pickByDifficulty(CASE_INVESTIGATION_CASES, difficulty),
    Component: CaseInvestigationExperience,
  },
  {
    typeId: "jeonse",
    contentPool: JEONSE_HOUSE_SETS,
    pickRandomContent: (difficulty?: Difficulty) => pickJeonseSet(difficulty),
    Component: JeonseExperience,
  },
  {
    typeId: "fraud-judgment",
    contentPool: FRAUD_JUDGMENT_CARDS,
    pickRandomContent: (difficulty?: Difficulty) => pickFraudJudgmentSet(difficulty),
    Component: FraudJudgmentExperience,
  },
] as ExperienceModule[];

function assertContentPools(modules: ExperienceModule[]): void {
  for (const mod of modules) {
    if (mod.contentPool.length === 0) {
      throw new Error(
        `[registry] "${mod.typeId}" 유형의 contentPool이 비어 있습니다. 콘텐츠 데이터를 추가하세요.`
      );
    }
  }
}

export function pickSessionPlan(
  modules: ExperienceModule[] = EXPERIENCE_MODULES
): { typeId: ExperienceTypeId }[] {
  assertContentPools(modules);

  return shuffle(modules).map((mod) => ({ typeId: mod.typeId }));
}
