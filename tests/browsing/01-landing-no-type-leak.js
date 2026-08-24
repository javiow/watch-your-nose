// 검증 대상: 랜딩(`/`)의 텍스트/URL/링크 어디에도 체험 유형명이 노출되지 않는다.
// (CLAUDE.md CRITICAL, docs/UI_GUIDE.md 디자인 원칙 3)
// 사전조건: `npm run dev`가 로컬에서 실행 중이어야 한다.
// 실행: dev-browser run tests/browsing/01-landing-no-type-leak.js --headless

const BASE_URL = "http://localhost:3000";
const FORBIDDEN_WORDS = ["보이스피싱", "사례선택", "전세매물"];

const page = await browser.getPage("browsing-01");
await page.bringToFront();
await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

const url = page.url();
if (url.replace(/\/$/, "") !== BASE_URL) {
  throw new Error(`랜딩 URL이 예상과 다릅니다: ${url}`);
}

const bodyText = await page.textContent("body");
for (const word of FORBIDDEN_WORDS) {
  if (bodyText.includes(word)) {
    throw new Error(`랜딩 페이지 텍스트에 유형 식별 문구 "${word}"가 노출되어 있습니다.`);
  }
}

const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
for (const href of hrefs) {
  if (!href) continue;
  for (const word of FORBIDDEN_WORDS) {
    if (href.includes(word)) {
      throw new Error(`랜딩 페이지 링크 href에 유형 식별 문구 "${word}"가 노출되어 있습니다: ${href}`);
    }
  }
}

console.log("PASS: 01-landing-no-type-leak");
