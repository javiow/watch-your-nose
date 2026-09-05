import { describe, expect, it } from "vitest";
import { EXPERIENCE_INTRO } from "./experience-intro";
import { EXPERIENCE_FORMAT } from "./experience-format";
import { EXPERIENCE_TYPE_LABELS } from "./experience-types";

const TYPE_IDS = Object.keys(EXPERIENCE_FORMAT) as (keyof typeof EXPERIENCE_FORMAT)[];

// 체험 전/중에 노출되면 안 되는 사기 유형 어휘 (ADR-004)
const BANNED = /전세사기|보이스피싱|피싱|스미싱|깡통전세|로맨스\s?스캠|몸캠|메신저피싱/;

describe("EXPERIENCE_INTRO", () => {
  it("모든 ExperienceTypeId에 엔트리가 있다 (레지스트리 키와 1:1)", () => {
    expect(Object.keys(EXPERIENCE_INTRO).sort()).toEqual([...TYPE_IDS].sort());
  });

  it("각 엔트리는 비어있지 않은 situation과 3개 이상의 task를 가진다", () => {
    for (const id of TYPE_IDS) {
      const intro = EXPERIENCE_INTRO[id];
      expect(intro.situation.trim().length).toBeGreaterThan(0);
      expect(intro.task.length).toBeGreaterThanOrEqual(3);
      for (const step of intro.task) {
        expect(step.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("어떤 문자열도 결과 페이지 전용 유형 라벨을 포함하지 않는다 (ADR-004)", () => {
    const labels = Object.values(EXPERIENCE_TYPE_LABELS);
    for (const id of TYPE_IDS) {
      const strings = [EXPERIENCE_INTRO[id].situation, ...EXPERIENCE_INTRO[id].task];
      for (const s of strings) {
        for (const label of labels) {
          expect(s.includes(label)).toBe(false);
        }
      }
    }
  });

  it("어떤 문자열도 사기 유형 어휘를 노출하지 않는다 (ADR-004)", () => {
    for (const id of TYPE_IDS) {
      const strings = [EXPERIENCE_INTRO[id].situation, ...EXPERIENCE_INTRO[id].task];
      for (const s of strings) {
        expect(BANNED.test(s)).toBe(false);
      }
    }
  });

  it("situation에 \\n\\n가 있으면 split 결과 문단이 2개 이상이고 각 문단이 비어있지 않다", () => {
    for (const id of TYPE_IDS) {
      const { situation } = EXPERIENCE_INTRO[id];
      if (!situation.includes("\n\n")) continue;
      const paragraphs = situation.split(/\n{2,}/).map((p) => p.trim());
      expect(paragraphs.length).toBeGreaterThanOrEqual(2);
      for (const p of paragraphs) {
        expect(p.length).toBeGreaterThan(0);
      }
    }
  });
});
