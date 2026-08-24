// 검증 대상: `/result`의 "다시 체험하기" 버튼.
//   - 랜딩(`/`)을 거치지 않고 바로 `/session`으로 이동한다.
//   - resetSession()이 실제로 유효한 새 세션을 만들어, 다시 3단계를 완주해
//     `/result`에 도달할 수 있다 (리셋 후 상태가 비어있거나 깨지지 않음).
// 사전조건: `npm run dev`가 로컬에서 실행 중이어야 한다.
// 실행: dev-browser run tests/browsing/05-retry-flow-from-result.js --headless

const BASE_URL = "http://localhost:3000";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function completeFullSession(page) {
  for (let step = 0; step < 3; step++) {
    const outcome = await completeCurrentSessionStep(page);
    if (outcome === "result") return;
  }
  if (!/\/result\/?$/.test(page.url())) {
    throw new Error(`3단계 완료 후 /result에 도달하지 못했습니다: ${page.url()}`);
  }
}

const page = await browser.getPage("browsing-retry-flow-v2");
await page.bringToFront();
await page.goto(`${BASE_URL}/session`, { waitUntil: "domcontentloaded" });
await wait(400);
await completeFullSession(page);

// 주의: 여기서는 clickUntilNavigated(재시도 클릭)를 쓰지 않는다. 아래에서 설명하는
// 실제 앱의 경쟁 상태 버그 때문에 재시도하면 "다시 체험하기" 버튼이 더 이상 없는
// `/`(랜딩) 화면에서 같은 버튼을 계속 찾다가 Playwright 기본 액션 타임아웃(30s)까지
// 멈춰버린다 — 재시도가 증상을 감추는 게 아니라 되레 행(hang)을 유발한다.
await page.locator('button:text-is("다시 체험하기")').click({ timeout: 5000 });
await wait(500);

if (!/\/session\/?$/.test(page.url())) {
  throw new Error(
    `"다시 체험하기" 클릭 후 바로 /session으로 이동해야 하는데 URL이 ${page.url()} 입니다. ` +
      `이는 테스트 버그가 아니라 실제 앱의 경쟁 상태로 보인다 — src/app/result/page.tsx의 ` +
      `handleRetry()가 resetSession() 직후 router.push("/session")을 호출하지만, 같은 렌더에서 ` +
      `results가 []로 바뀌며 isComplete가 false가 되어 컴포넌트의 리다이렉트 가드 useEffect가 ` +
      `router.replace("/")를 호출한다. 이 replace가 push보다 나중에 커밋되어 항상 이겨서, ` +
      `"다시 체험하기"를 눌러도 /session이 아니라 랜딩(/)으로 되돌아간다.`
  );
}
const progressAfterRetry = await getProgressText(page);
if (progressAfterRetry !== "1/3") {
  throw new Error(
    `재시작 직후 진행률이 "1/3"이어야 하는데 "${progressAfterRetry}" 입니다.`
  );
}

// 리셋된 세션도 정상적으로 다시 완주되어야 한다 (resetSession이 유효한 새
// sessionPlan을 만들었는지, 이전 results가 실제로 비워졌는지 확인).
await completeFullSession(page);
if (!/\/result\/?$/.test(page.url())) {
  throw new Error(`재시작한 세션을 완주했는데 /result에 도달하지 못했습니다: ${page.url()}`);
}

console.log("PASS: 05-retry-flow-from-result");
