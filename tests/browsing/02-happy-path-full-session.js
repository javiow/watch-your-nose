// 검증 대상: `/`에서 시작 -> 3단계 세션 완주 -> `/result` 도달까지의 정상 경로.
//   - 선택 전엔 "다음" 버튼이 비활성화되어 있다.
//   - 선택 후 클릭 전까지 정답/오답 피드백이 뜨지 않는다 (즉시 피드백 금지).
//   - `/session`의 진행률 텍스트는 "N/3" 형식뿐이고 URL에 유형명이 없다 (유형 비노출).
//   - 3단계 완료 후 `/result`에 0~100% 점수와 문항별 리뷰 3건이 보인다.
// 사전조건: `npm run dev`가 로컬에서 실행 중이어야 한다.
// 실행: dev-browser run tests/browsing/02-happy-path-full-session.js --headless

const BASE_URL = "http://localhost:3000";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 갓 goto()한 페이지는 HTML은 떠 있어도 클라이언트 컴포넌트(React) 하이드레이션이
// 아직 끝나지 않았을 수 있다 — 그 틈에 클릭하면 이벤트 핸들러가 아직 안 붙어있어
// 조용히 아무 일도 안 일어난다. 그래서 단순 1회 클릭이 아니라, URL이 바뀔 때까지
// (하이드레이션이 끝나 있을 시점을 노려) 몇 차례 재시도한다.
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

function assertNoTypeLeakInUrl(url) {
  if (!/\/session\/?$/.test(url) || url.includes("?")) {
    throw new Error(`/session URL에 유형명 등 예상치 못한 요소가 있습니다: ${url}`);
  }
}

// 현재 화면(대화형 노드 또는 사례/매물 카드)에서 한 턴을 진행한다:
// 선택지 클릭 -> (즉시 피드백 없는지 확인) -> "다음" 클릭.
async function playOneTurn(page) {
  const nextInitiallyDisabled = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("main button"));
    const nextBtn = buttons.find((b) => b.textContent.trim() === "다음");
    return nextBtn ? nextBtn.disabled : null;
  });
  if (nextInitiallyDisabled !== true) {
    throw new Error(
      `선택 전에는 "다음" 버튼이 비활성화되어 있어야 하는데 disabled=${nextInitiallyDisabled} 입니다.`
    );
  }

  // 주의: page.evaluate 안에서 DOM 요소의 .click()을 직접 호출하면 신뢰된(trusted)
  // 이벤트가 아니라서 React의 합성 이벤트 핸들러가 반응하지 않는다(라우팅이 안 일어남).
  // 반드시 page.locator(...).click()으로 실제 입력 이벤트를 시뮬레이션해야 한다.
  await page.locator('main button:not(:text-is("다음"))').first().click();

  const hasImmediateFeedback = await page.evaluate(() => {
    const mainText = document.querySelector("main")?.textContent ?? "";
    return mainText.includes("정답") || mainText.includes("오답");
  });
  if (hasImmediateFeedback) {
    throw new Error("선택 직후(다음 클릭 전) 정답/오답 피드백이 노출되었습니다.");
  }

  await page.locator('main button:text-is("다음")').click();
}

// 보이스피싱은 대화가 여러 턴에 걸쳐 이어질 수 있으므로,
// 진행률("N/3")이 바뀌거나 /result로 넘어갈 때까지 턴을 반복한다.
async function completeCurrentSessionStep(page) {
  const startProgress = await getProgressText(page);
  for (let turn = 0; turn < 8; turn++) {
    if (/\/result\/?$/.test(page.url())) return "result";
    assertNoTypeLeakInUrl(page.url());

    await playOneTurn(page);
    await wait(400);

    if (/\/result\/?$/.test(page.url())) return "result";
    const progress = await getProgressText(page);
    if (progress !== startProgress) return "advanced";
  }
  throw new Error("세션 단계가 8턴 내에 끝나지 않았습니다 (무한 루프 의심).");
}

const page = await browser.getPage("browsing-happy-path");
await page.bringToFront();
await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

await clickUntilNavigated(page, 'button:text-is("시작하기")', /\/session\/?$/);

if (!/\/session\/?$/.test(page.url())) {
  throw new Error(`"시작하기" 클릭 후 /session으로 이동하지 않았습니다: ${page.url()}`);
}

for (let step = 0; step < 3; step++) {
  const outcome = await completeCurrentSessionStep(page);
  if (outcome === "result") break;
}

if (!/\/result\/?$/.test(page.url())) {
  throw new Error(`3단계 완료 후 /result로 이동하지 않았습니다: ${page.url()}`);
}

const resultCheck = await page.evaluate(() => {
  const mainText = document.querySelector("main")?.textContent ?? "";
  const percentMatch = mainText.match(/(\d{1,3})%/);
  const reviewCount = Array.from(document.querySelectorAll("main p")).filter((p) =>
    /^\d+번$/.test(p.textContent.trim())
  ).length;
  return {
    percent: percentMatch ? Number(percentMatch[1]) : null,
    reviewCount,
  };
});

if (
  resultCheck.percent === null ||
  resultCheck.percent < 0 ||
  resultCheck.percent > 100
) {
  throw new Error(`결과 페이지에서 0~100% 점수를 찾지 못했습니다: ${JSON.stringify(resultCheck)}`);
}
if (resultCheck.reviewCount !== 3) {
  throw new Error(`결과 페이지의 문항별 리뷰가 정확히 3개가 아닙니다: ${resultCheck.reviewCount}`);
}

console.log("PASS: 02-happy-path-full-session");
