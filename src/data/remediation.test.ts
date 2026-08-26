import { describe, expect, it } from "vitest";
import type { ModuleResult } from "@/types/experience";
import {
  DEFAULT_REMEDIATION_MESSAGE,
  getRemediation,
  getRemediationsForResults,
} from "./remediation";

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
