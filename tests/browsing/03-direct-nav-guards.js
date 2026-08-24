// 검증 대상: 세션을 거치지 않고 `/session`·`/result`에 직접 접근했을 때의 실제 동작.
//
// 주의 — 이 스크립트를 작성하며 실제 소스(src/lib/session-context.tsx)를 확인한 결과,
// 문서/이전 요약에 있던 "sessionPlan이 비어있으면 /session이 /로 리다이렉트한다"는
// 설명은 실제 구현과 다르다: `SessionProvider`는 `useState(() => pickSessionPlan())`로
// sessionPlan을 마운트 시점에 항상 즉시 채운다. 즉 `/session`에 새로고침이나 직접
// URL 접근으로 들어와도 sessionPlan은 절대 비어있지 않고, 바로 1단계가 플레이 가능한
// 상태로 렌더링된다 — 이는 리다이렉트되지 않는 것이 실제(그리고 "새로고침해도 처음부터
// 다시 시작 가능"이라는 ADR-003 설계 의도와도 부합하는) 정상 동작이다.
// 반면 `/result`는 `results`가 빈 배열(`[]`)로 시작하므로, 완주한 세션 없이 직접
// 접근하면 항상 `/`로 리다이렉트된다 — 이건 실제로 동작하는 가드다.
//
// 그래서 이 스크립트는 다음을 검증한다:
//   1. 완주한 세션 없이 `/result`에 직접 접근 -> `/`로 리다이렉트된다. (실제 가드)
//   2. 세션을 거치지 않고 `/session`에 직접 접근 -> 리다이렉트되지 않고,
//      1단계가 정상적으로 플레이 가능한 상태(진행률 "1/3", 선택지 존재)로 뜬다. (실제 동작)
//
// 사전조건: `npm run dev`가 로컬에서 실행 중이어야 한다.
// 실행: dev-browser run tests/browsing/03-direct-nav-guards.js --headless

const BASE_URL = "http://localhost:3000";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 정적 프리렌더된 페이지의 리다이렉트 가드는 하이드레이션 이후 useEffect가
// 실행돼야 발동한다 — 부하에 따라 들쭉날쭉할 수 있어 고정 sleep 대신 폴링한다.
async function waitUntilTrue(fn, timeoutMs = 3000, intervalMs = 150) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await fn()) return true;
    await wait(intervalMs);
  }
  return false;
}

// --- 1. /result 직접 접근 -> / 로 리다이렉트 ---
const resultPage = await browser.getPage("browsing-03-result");
await resultPage.bringToFront();
await resultPage.goto(`${BASE_URL}/result`, { waitUntil: "domcontentloaded" });

const redirectedHome = await waitUntilTrue(
  () => resultPage.url().replace(/\/$/, "") === BASE_URL
);
if (!redirectedHome) {
  throw new Error(
    `완주한 세션 없이 /result에 직접 접근했는데 /로 리다이렉트되지 않았습니다: ${resultPage.url()}`
  );
}

// --- 2. /session 직접 접근 -> 리다이렉트 없이 1단계가 정상 렌더링됨 ---
const sessionPage = await browser.getPage("browsing-03-session");
await sessionPage.bringToFront();
await sessionPage.goto(`${BASE_URL}/session`, { waitUntil: "domcontentloaded" });
await wait(500);

if (!/\/session\/?$/.test(sessionPage.url())) {
  throw new Error(
    `/session에 직접 접근했는데 리다이렉트되었습니다: ${sessionPage.url()} (설계상 리다이렉트되면 안 됨)`
  );
}

const sessionState = await sessionPage.evaluate(() => {
  const ps = Array.from(document.querySelectorAll("main p"));
  const progress = ps.find((p) => /^\d+\/\d+$/.test(p.textContent.trim()));
  const choiceButtons = Array.from(document.querySelectorAll("main button")).filter(
    (b) => b.textContent.trim() !== "다음"
  );
  return {
    progress: progress ? progress.textContent.trim() : null,
    choiceCount: choiceButtons.length,
  };
});

if (sessionState.progress !== "1/3") {
  throw new Error(
    `/session 직접 접근 시 진행률이 "1/3"이어야 하는데 "${sessionState.progress}" 입니다.`
  );
}
if (sessionState.choiceCount < 2) {
  throw new Error(
    `/session 직접 접근 시 선택 가능한 선택지가 보이지 않습니다 (choiceCount=${sessionState.choiceCount}).`
  );
}

console.log("PASS: 03-direct-nav-guards");
