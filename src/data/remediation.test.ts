import { describe, expect, it } from "vitest";
import type { ModuleResult } from "@/types/experience";
import {
  DEFAULT_REMEDIATION_MESSAGE,
  REMEDIATION_ENTRIES,
  getRemediation,
  getRemediationEntry,
  getRemediationsForResults,
} from "./remediation";

const TAGS = Object.keys(REMEDIATION_ENTRIES);

describe("getRemediation", () => {
  it("blind-refusal 태그에 대한 대응 방안을 반환한다", () => {
    const message = getRemediation("blind-refusal");
    expect(message).not.toBe(DEFAULT_REMEDIATION_MESSAGE);
    expect(message.length).toBeGreaterThan(0);
  });

  it("missed-scam-signal 태그에 대한 대응 방안을 반환한다", () => {
    const message = getRemediation("missed-scam-signal");
    expect(message).not.toBe(DEFAULT_REMEDIATION_MESSAGE);
    expect(message.length).toBeGreaterThan(0);
  });

  it("missed-lease-fraud-signal 태그에 대한 대응 방안을 반환한다", () => {
    const message = getRemediation("missed-lease-fraud-signal");
    expect(message).not.toBe(DEFAULT_REMEDIATION_MESSAGE);
    expect(message.length).toBeGreaterThan(0);
  });

  it("fell-for-scam 태그에 대한 대응 방안을 반환한다", () => {
    const message = getRemediation("fell-for-scam");
    expect(message).not.toBe(DEFAULT_REMEDIATION_MESSAGE);
    expect(message.length).toBeGreaterThan(0);
  });

  it("false-alarmed-safe-case 태그에 대한 대응 방안을 반환한다", () => {
    const message = getRemediation("false-alarmed-safe-case");
    expect(message).not.toBe(DEFAULT_REMEDIATION_MESSAGE);
    expect(message.length).toBeGreaterThan(0);
  });

  it("missed-realestate-investigation-signal 태그에 대한 대응 방안을 반환한다", () => {
    const message = getRemediation("missed-realestate-investigation-signal");
    expect(message).not.toBe(DEFAULT_REMEDIATION_MESSAGE);
    expect(message.length).toBeGreaterThan(0);
  });

  it("매핑이 없는 태그는 기본 안내 문구를 반환한다", () => {
    expect(getRemediation("some-typo-tag")).toBe(DEFAULT_REMEDIATION_MESSAGE);
  });

  it("태그가 없으면 기본 안내 문구를 반환한다", () => {
    expect(getRemediation(undefined)).toBe(DEFAULT_REMEDIATION_MESSAGE);
  });
});

describe("getRemediationEntry", () => {
  it("모든 태그가 짧은 불릿 2~3개를 가진다 (각 25자 이내)", () => {
    for (const tag of TAGS) {
      const { bullets } = getRemediationEntry(tag);
      expect(bullets.length).toBeGreaterThanOrEqual(2);
      expect(bullets.length).toBeLessThanOrEqual(3);
      for (const b of bullets) expect(b.length).toBeLessThanOrEqual(25);
    }
  });

  it("모든 태그가 https 공식 링크를 1개 이상 가진다", () => {
    for (const tag of TAGS) {
      const links = getRemediationEntry(tag).links ?? [];
      expect(links.length).toBeGreaterThanOrEqual(1);
      for (const link of links) {
        expect(link.url.startsWith("https://")).toBe(true);
        expect(link.label.length).toBeGreaterThan(0);
      }
    }
  });

  it("태그가 없으면 기본 엔트리(링크 없음)를 반환하고 message가 기본 문구와 같다", () => {
    const entry = getRemediationEntry(undefined);
    expect(entry.links).toBeUndefined();
    expect(entry.message).toBe(DEFAULT_REMEDIATION_MESSAGE);
  });

  it("getRemediation은 항상 getRemediationEntry(tag).message와 동일하다", () => {
    for (const tag of [...TAGS, undefined, "typo"]) {
      expect(getRemediation(tag)).toBe(getRemediationEntry(tag).message);
    }
  });
});

describe("getRemediationsForResults", () => {
  const makeResult = (overrides: Partial<ModuleResult>): ModuleResult => ({
    typeId: "voice-phishing",
    contentId: "c1",
    score: 0,
    grade: "danger",
    userChoice: "a",
    correctChoice: "b",
    isCorrect: false,
    explanation: "",
    ...overrides,
  });

  it("오답 결과에 대해서만 대응 방안을 반환한다", () => {
    const results: ModuleResult[] = [
      makeResult({ isCorrect: true, mistakeTag: undefined }),
      makeResult({ isCorrect: false, mistakeTag: "blind-refusal" }),
      makeResult({ isCorrect: false, mistakeTag: "missed-scam-signal" }),
    ];
    const remediations = getRemediationsForResults(results);
    expect(remediations).toHaveLength(2);
    expect(remediations[0]).toBe(getRemediation("blind-refusal"));
    expect(remediations[1]).toBe(getRemediation("missed-scam-signal"));
  });

  it("모두 정답이면 빈 배열을 반환한다", () => {
    const results: ModuleResult[] = [makeResult({ isCorrect: true })];
    expect(getRemediationsForResults(results)).toEqual([]);
  });
});
