import { describe, expect, it } from "vitest";
import { GLOSSARY_TERMS, resolveGlossaryKey } from "./glossary";

const REQUIRED_KEYS = [
  "근저당권",
  "선순위 보증금",
  "전세가율",
  "전입세대열람",
  "확정일자",
  "신탁등기",
  "신탁원부",
  "수탁자",
  "공동담보",
  "가압류",
  "갑구",
  "을구",
  "채권최고액",
  "이상거래탐지",
  "대포통장",
  "자금세탁",
  "명의도용",
  "원격지원 앱",
  "대환대출",
  "WHOIS 조회",
  "HUG",
  "등기부등본",
  "전세권",
  "대항력",
  "전입신고",
  "우선변제",
  "위임장",
  "역전세",
  "깡통전세",
  "갭투자",
  "보증보험",
  "분양보증",
  "가등기",
  "선순위",
  "다가구주택",
];

describe("GLOSSARY_TERMS", () => {
  it("요구된 키를 모두 포함한다", () => {
    for (const key of REQUIRED_KEYS) {
      expect(GLOSSARY_TERMS[key]).toBeDefined();
    }
  });

  it("모든 항목의 term과 definition이 비어있지 않다", () => {
    for (const entry of Object.values(GLOSSARY_TERMS)) {
      expect(entry.term.trim().length).toBeGreaterThan(0);
      expect(entry.definition.trim().length).toBeGreaterThan(0);
    }
  });

  it("모든 definition이 70자 이하다", () => {
    for (const entry of Object.values(GLOSSARY_TERMS)) {
      expect(entry.definition.length).toBeLessThanOrEqual(70);
    }
  });

  it("각 키는 자기 항목의 term과 문자열이 일치한다", () => {
    for (const [key, entry] of Object.entries(GLOSSARY_TERMS)) {
      expect(entry.term).toBe(key);
    }
  });
});

describe("resolveGlossaryKey", () => {
  it("직접 키는 해당 항목을 그대로 반환한다", () => {
    expect(resolveGlossaryKey("근저당권")).toBe(GLOSSARY_TERMS["근저당권"]);
  });

  it("별칭 '수탁사'는 '수탁자' 항목을 반환한다", () => {
    expect(resolveGlossaryKey("수탁사")).toBe(GLOSSARY_TERMS["수탁자"]);
  });

  it("별칭 '근저당'은 '근저당권' 항목을 반환한다", () => {
    expect(resolveGlossaryKey("근저당")).toBe(GLOSSARY_TERMS["근저당권"]);
  });

  it("별칭 '전세보증금반환보증'은 '보증보험' 항목을 반환한다", () => {
    expect(resolveGlossaryKey("전세보증금반환보증")).toBe(GLOSSARY_TERMS["보증보험"]);
  });

  it("존재하지 않는 키는 undefined를 반환한다 (에러를 던지지 않는다)", () => {
    expect(resolveGlossaryKey("존재하지않는키")).toBeUndefined();
  });
});
