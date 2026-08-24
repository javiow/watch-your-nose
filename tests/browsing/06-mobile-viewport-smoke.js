// 검증 대상: 모바일 뷰포트(375x812)에서 `/`, `/session`, `/result` 모두 가로 스크롤이
// 발생하지 않는다 (docs/UI_GUIDE.md "반응형 필수 — 모바일 우선" 요구사항).
// 사전조건: `npm run dev`가 로컬에서 실행 중이어야 한다.
// 실행: dev-browser run tests/browsing/06-mobile-viewport-smoke.js --headless

const BASE_URL = "http://localhost:3000";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 갓 goto()한 페이지는 하이드레이션이 아직 끝나지 않았을 수 있다 — 그 틈에
// 클릭하면 조용히 씹힌다. URL이 바뀔 때까지 몇 차례 재시도한다.
async function clickUntilNavigated(page, selector, urlPattern, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    await page.locator(selector).click();
    await page.waitForURL(urlPattern, { timeout: 800 }).catch(() => {});
    if (urlPattern.test(page.url())) return;
    await wait(300);
  }
}

async function getProgressText(page) {
  return page.evaluate(() => {
    const ps = Array.from(document.querySelectorAll("main p"));
    const match = ps.find((p) => /^\d+\/\d+$/.test(p.textContent.trim()));
    return match ? match.textContent.trim() : null;
  });
}

async function playOneTurn(page) {
  // page.evaluate 안에서의 raw .click()은 React 합성 이벤트를 트리거하지 않으므로
  // 반드시 page.locator(...).click()으로 실제 입력을 시뮬레이션한다.
  await page.locator('main button:not(:text-is("다음"))').first().click();
  await page.locator('main button:text-is("다음")').click();
}

async function completeCurrentSessionStep(page) {
  const startProgress = await getProgressText(page);
  for (let turn = 0; turn < 8; turn++) {
    if (/\/result\/?$/.test(page.url())) return "result";
    await playOneTurn(page);
    await wait(400);
    if (/\/result\/?$/.test(page.url())) return "result";
    const progress = await getProgressText(page);
    if (progress !== startProgress) return "advanced";
  }
  throw new Error("세션 단계가 8턴 내에 끝나지 않았습니다 (무한 루프 의심).");
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (overflow.scrollWidth > overflow.clientWidth) {
    throw new Error(
      `${label} 페이지에서 가로 스크롤이 발생합니다 (scrollWidth=${overflow.scrollWidth} > clientWidth=${overflow.clientWidth}).`
    );
  }
}

const page = await browser.getPage("browsing-06");
await page.bringToFront();
await page.setViewportSize({ width: 375, height: 812 });

await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
await assertNoHorizontalOverflow(page, "/");

await clickUntilNavigated(page, 'button:text-is("시작하기")', /\/session\/?$/);
if (!/\/session\/?$/.test(page.url())) {
  throw new Error(`"시작하기" 클릭 후 /session으로 이동하지 않았습니다: ${page.url()}`);
}
await assertNoHorizontalOverflow(page, "/session");

for (let step = 0; step < 3; step++) {
  const outcome = await completeCurrentSessionStep(page);
  if (outcome === "result") break;
}
if (!/\/result\/?$/.test(page.url())) {
  throw new Error(`3단계 완료 후 /result로 이동하지 않았습니다: ${page.url()}`);
}
await assertNoHorizontalOverflow(page, "/result");

console.log("PASS: 06-mobile-viewport-smoke");
