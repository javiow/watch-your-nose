import type { ExperienceModule, ExperienceTypeId } from "@/types/experience";
import { VOICE_PHISHING_SCENARIOS } from "@/data/voice-phishing";

// step3~4에서 나머지 유형(사례선택/전세매물)이 여기 등록한다.
export const EXPERIENCE_MODULES: ExperienceModule[] = [
  {
    typeId: "voice-phishing",
    contentPool: VOICE_PHISHING_SCENARIOS,
    pickRandomContent: () =>
      VOICE_PHISHING_SCENARIOS[
        Math.floor(Math.random() * VOICE_PHISHING_SCENARIOS.length)
      ],
  },
];

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
