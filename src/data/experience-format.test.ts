import { describe, expect, it } from "vitest";
import { EXPERIENCE_FORMAT } from "./experience-format";
import { EXPERIENCE_TYPE_LABELS } from "./experience-types";
import { EXPERIENCE_MODULES } from "@/lib/registry";

describe("EXPERIENCE_FORMAT", () => {
  it("등록된 모든 체험 유형에 대한 항목이 있다", () => {
    const registered = new Set(EXPERIENCE_MODULES.map((m) => m.typeId));
    const declared = new Set(Object.keys(EXPERIENCE_FORMAT));
    expect(declared).toEqual(registered);
  });

  it("각 항목의 icon/formatLabel/hint/learningPhrase가 비어있지 않다", () => {
    for (const meta of Object.values(EXPERIENCE_FORMAT)) {
      expect(meta.icon.trim().length).toBeGreaterThan(0);
      expect(meta.formatLabel.trim().length).toBeGreaterThan(0);
      expect(meta.hint.trim().length).toBeGreaterThan(0);
      expect(meta.learningPhrase.trim().length).toBeGreaterThan(0);
    }
  });

  it("formatLabel은 결과 페이지 전용 유형명(EXPERIENCE_TYPE_LABELS)과 절대 겹치지 않는다", () => {
    const typeLabels = new Set(Object.values(EXPERIENCE_TYPE_LABELS));
    for (const meta of Object.values(EXPERIENCE_FORMAT)) {
      expect(typeLabels.has(meta.formatLabel)).toBe(false);
    }
  });
});
