import type { ExperienceModule, ExperienceTypeId } from "@/types/experience";
import { VOICE_PHISHING_SCENARIOS } from "@/data/voice-phishing";
import { CASE_INVESTIGATION_CASES } from "@/data/case-investigation";
import { JEONSE_HOUSE_SETS } from "@/data/jeonse";
import { FRAUD_JUDGMENT_CARDS } from "@/data/fraud-judgment";
import { VoicePhishingExperience } from "@/components/experiences/VoicePhishingExperience";
import { CaseInvestigationExperience } from "@/components/experiences/CaseInvestigationExperience";
import { JeonseExperience } from "@/components/experiences/JeonseExperience";
import { FraudJudgmentExperience } from "@/components/experiences/FraudJudgmentExperience";

export const EXPERIENCE_MODULES: ExperienceModule[] = [
  {
    typeId: "voice-phishing",
    contentPool: VOICE_PHISHING_SCENARIOS,
    pickRandomContent: () =>
      VOICE_PHISHING_SCENARIOS[
        Math.floor(Math.random() * VOICE_PHISHING_SCENARIOS.length)
      ],
    Component: VoicePhishingExperience,
  },
  {
    typeId: "case-investigation",
    contentPool: CASE_INVESTIGATION_CASES,
    pickRandomContent: () =>
      CASE_INVESTIGATION_CASES[Math.floor(Math.random() * CASE_INVESTIGATION_CASES.length)],
    Component: CaseInvestigationExperience,
  },
  {
    typeId: "jeonse",
    contentPool: JEONSE_HOUSE_SETS,
    pickRandomContent: () =>
      JEONSE_HOUSE_SETS[Math.floor(Math.random() * JEONSE_HOUSE_SETS.length)],
    Component: JeonseExperience,
  },
  {
    typeId: "fraud-judgment",
    contentPool: FRAUD_JUDGMENT_CARDS,
    pickRandomContent: () =>
      FRAUD_JUDGMENT_CARDS[Math.floor(Math.random() * FRAUD_JUDGMENT_CARDS.length)],
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

  const shuffled = [...modules];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.map((mod) => ({ typeId: mod.typeId }));
}
