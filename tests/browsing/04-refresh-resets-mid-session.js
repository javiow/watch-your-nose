// 검증 대상: localStorage 등 영속화가 없다는 설계(ADR-003)가 실제로 지켜지는지.
//
// 실제 소스(src/lib/session-context.tsx) 확인 결과: 새로고침은 `SessionProvider`를
// 통째로 다시 마운트시키므로 sessionPlan은 새로 셔플되고 results는 다시 빈 배열이
// 된다. 즉:
//   - 세션 진행 중(`/session`) 새로고침 -> `/`로 리다이렉트되는 게 아니라,
//     "이어서" 진행되지도 않고, 진행률이 "1/3"인 완전히 새 세션으로 되돌아간다.
//   - 완주 후(`/result`) 새로고침 -> results가 다시 []가 되어 `isComplete`가
//     false이므로 `/`로 리다이렉트된다.
// 이 스크립트는 위 두 가지 실제 동작을 모두 검증한다.
//
// 사전조건: `npm run dev`가 로컬에서 실행 중이어야 한다.
// 실행: dev-browser run tests/browsing/04-refresh-resets-mid-session.js --headless

const BASE_URL = "http://localhost:3000";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 새로고침(특히 /result처럼 정적 프리렌더된 페이지)은 서버 응답 + 하이드레이션 +
// 가드 useEffect 실행까지 걸리는 시간이 시스템 부하에 따라 들쭉날쭉하다. 고정
// sleep 하나로는 가끔 놓칠 수 있어, 조건이 참이 될 때까지 짧은 간격으로 폴링한다.
async function waitUntilTrue(fn, timeoutMs = 3000, intervalMs = 150) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await fn()) return true;
    await wait(intervalMs);
  }
  return false;
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

// --- 1. 세션 1단계를 완료해 2단계("2/3")까지 진행한 뒤 새로고침 ---
const midPage = await browser.getPage("browsing-04-mid");
await midPage.bringToFront();
await midPage.goto(`${BASE_URL}/session`, { waitUntil: "domcontentloaded" });
await wait(400);

const outcome = await completeCurrentSessionStep(midPage);
if (outcome !== "advanced") {
  throw new Error(`1단계 완료 후 2단계로 넘어가지 못했습니다 (outcome=${outcome}).`);
}
const progressBeforeReload = await getProgressText(midPage);
if (progressBeforeReload !== "2/3") {
  throw new Error(`1단계 완료 직후 진행률이 "2/3"이어야 하는데 "${progressBeforeReload}" 입니다.`);
}

await midPage.reload({ waitUntil: "domcontentloaded" });

const staysOnSession = await waitUntilTrue(() => /\/session\/?$/.test(midPage.url()));
if (!staysOnSession) {
  throw new Error(
    `세션 도중 새로고침했는데 /session에 남아있지 않습니다 (리다이렉트됨): ${midPage.url()}`
  );
}
let progressAfterReload = null;
await waitUntilTrue(async () => {
  progressAfterReload = await getProgressText(midPage);
  return progressAfterReload !== null;
});
if (progressAfterReload !== "1/3") {
  throw new Error(
    `새로고침 후 이전 진행 상태("2/3")가 이어지면 안 되는데 진행률이 "${progressAfterReload}" 입니다. ` +
      `(진행 상태는 영속화되지 않아야 하고, 새 세션은 항상 1단계부터 시작해야 함)`
  );
}

// --- 2. 세션을 완주해 /result에 도달한 뒤 새로고침 -> / 로 리다이렉트 ---
const resultPage = await browser.getPage("browsing-04-result");
await resultPage.bringToFront();
await resultPage.goto(`${BASE_URL}/session`, { waitUntil: "domcontentloaded" });
await wait(400);
for (let step = 0; step < 3; step++) {
  const stepOutcome = await completeCurrentSessionStep(resultPage);
  if (stepOutcome === "result") break;
}
if (!/\/result\/?$/.test(resultPage.url())) {
  throw new Error(`3단계 완료 후 /result에 도달하지 못했습니다: ${resultPage.url()}`);
}

await resultPage.reload({ waitUntil: "domcontentloaded" });

const redirectedHome = await waitUntilTrue(
  () => resultPage.url().replace(/\/$/, "") === BASE_URL
);
if (!redirectedHome) {
  throw new Error(
    `/result에서 새로고침했는데 /로 리다이렉트되지 않았습니다: ${resultPage.url()} ` +
      `(results는 영속화되지 않으므로 새로고침하면 완주 기록이 사라져야 함)`
  );
}

console.log("PASS: 04-refresh-resets-mid-session");
