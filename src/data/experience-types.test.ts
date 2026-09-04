import { describe, expect, it } from "vitest";
import type { ExperienceTypeId } from "@/types/experience";
import { EXPERIENCE_TYPE_LABELS } from "./experience-types";

const ALL_TYPE_IDS: ExperienceTypeId[] = [
  "voice-phishing",
  "case-investigation",
  "jeonse",
  "fraud-judgment",
];

describe("EXPERIENCE_TYPE_LABELS", () => {
  it.each(ALL_TYPE_IDS)("%s에 대해 빈 문자열이 아닌 라벨이 존재한다", (typeId) => {
    expect(EXPERIENCE_TYPE_LABELS[typeId]).toBeTruthy();
  });

  it("PRD 표기와 정확히 일치하는 4개 라벨을 갖는다", () => {
    expect(EXPERIENCE_TYPE_LABELS).toEqual({
      "voice-phishing": "보이스피싱",
      "case-investigation": "케이스 조사",
      jeonse: "전세매물",
      "fraud-judgment": "사기 판별 카드",
    });
  });
});
