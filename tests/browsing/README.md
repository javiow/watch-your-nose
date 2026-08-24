# 브라우징 테스트 (dev-browser)

`npm run test`(Vitest + RTL)는 `next/navigation`과 `useSession`을 mock 처리하기 때문에
실제 브라우저 라우팅·새로고침·화면에 보이는 텍스트를 검증하지 못한다. 이 디렉토리의
스크립트들은 [dev-browser](https://github.com/sawyerhood/dev-browser) CLI로 실제
(헤드리스) 브라우저를 띄워 그 부분을 보완한다.

## 사전조건

1. `dev-browser`가 설치되어 있어야 한다: `npm install -g dev-browser && dev-browser install`
2. 로컬 dev 서버가 **별도 터미널에서 실행 중**이어야 한다:
   ```bash
   npm run dev
   ```
   기본 포트는 3000이다. 다른 포트로 뜨면 각 스크립트 상단의 `BASE_URL` 상수를 수정한다.

스크립트는 QuickJS 샌드박스에서 실행되어 `require`/`import`/`fs`/`process`가 없다 —
서로 파일을 공유하지 않는 완전히 독립된 스크립트다. dev 서버를 스크립트가 대신
띄워주지 않으므로 반드시 먼저 켜둬야 한다.

## 실행

개별 실행 — `--headless`/`--timeout` 등 옵션은 반드시 `run`보다 **앞에** 온다:
```bash
dev-browser --headless --timeout 20 run tests/browsing/01-landing-no-type-leak.js
```

전체 순차 실행 (하나라도 실패하면 멈춤):
```bash
for f in tests/browsing/0*.js; do
  echo "== $f =="
  dev-browser --headless --timeout 20 run "$f" || { echo "FAILED: $f"; break; }
done
```

`--headless`를 빼면 브라우저 창이 뜨는 걸 직접 보면서 디버깅할 수 있다.

dev-browser 데몬이 처음 뜨는 첫 실행은 Chromium 콜드 스타트 때문에 "Daemon failed to
start within 5 seconds" 에러가 날 수 있다 — 데몬 자체는 백그라운드에서 계속 떠 있으므로
바로 한 번 더 실행하면 된다.

## 결과 읽는 법

각 스크립트는 성공 시 `PASS: <시나리오 이름>`을 출력하고 정상 종료(exit 0)한다.
실패하면 `throw new Error(...)`로 즉시 멈추고 dev-browser가 에러와 함께 0이 아닌
코드로 종료한다 — 별도의 assert 라이브러리는 쓰지 않는다.

## 시나리오 목록

| 스크립트 | 검증 대상 |
|---|---|
| `01-landing-no-type-leak.js` | 랜딩 텍스트/URL/링크 어디에도 체험 유형명이 노출되지 않는다. |
| `02-happy-path-full-session.js` | 시작 → 3단계 완주 → 결과. "다음" 비활성/즉시 피드백 없음/`N/3` 진행률/URL에 유형명 없음/0~100% 점수/리뷰 3건. |
| `03-direct-nav-guards.js` | 세션 없이 `/result` 직접 접근 시 `/`로 리다이렉트됨. `/session` 직접 접근은 리다이렉트되지 않고 1단계가 바로 플레이 가능하다(실제 소스 확인 결과 — 아래 "발견한 점" 참고). |
| `04-refresh-resets-mid-session.js` | 세션 도중 새로고침해도 `/session`에 남아있지만 진행 상태는 이어지지 않고 처음(1/3)부터 다시 시작한다. `/result`에서 새로고침하면 `/`로 리다이렉트된다. |
| `05-retry-flow-from-result.js` | "다시 체험하기" → 랜딩을 건너뛰고 바로 `/session`, 리셋된 세션도 정상적으로 다시 완주된다. (아래 "발견하고 고친 버그" 참고.) |
| `06-mobile-viewport-smoke.js` | 375×812 뷰포트에서 `/`, `/session`, `/result` 모두 가로 스크롤이 없다. |

## 발견하고 고친 버그: "다시 체험하기"가 `/session`이 아니라 랜딩으로 되돌아감

`05-retry-flow-from-result.js`를 작성하면서 실제로 실행해보니, "다시 체험하기"
버튼이 항상 `/session`이 아니라 `/`(랜딩)로 이동하는 버그가 있었다.
`src/app/result/page.tsx`의 원래 코드:

```tsx
const isComplete = results.length === EXPERIENCE_MODULES.length;
useEffect(() => {
  if (!isComplete) router.replace("/");
}, [isComplete, router]);

const handleRetry = () => {
  resetSession();       // results를 []로 만든다 (같은 렌더에서 batch됨)
  router.push("/session");
};
```

`handleRetry`가 `resetSession()`(→ `results = []`)과 `router.push("/session")`을 같은
이벤트 핸들러 안에서 호출하는데, `results`가 `[]`가 되는 순간 (아직 `/result`
컴포넌트가 마운트된 채로) `isComplete`가 `false`가 되어 위 `useEffect`가
`router.replace("/")`를 호출한다. 이 `replace`가 `push`보다 나중에 커밋되어 항상
이겨버려서, 사용자가 "다시 체험하기"를 눌러도 곧장 새 세션으로 들어가지 못하고
랜딩으로 튕겨나갔다.

`isRetryingRef` 플래그로 고쳤다 — 의도된 재시작 중에는 가드 `useEffect`가
리다이렉트하지 않도록 건너뛴다:

```tsx
const isRetryingRef = useRef(false);

useEffect(() => {
  if (!isComplete && !isRetryingRef.current) {
    router.replace("/");
  }
}, [isComplete, router]);

const handleRetry = () => {
  isRetryingRef.current = true;
  resetSession();
  router.push("/session");
};
```

`tests/browsing/05-retry-flow-from-result.js`는 이 시나리오를 정확히 잡아내도록
작성돼 있어 — 재시도 없이 한 번만 클릭하고 최종 URL을 확인 — 수정 전에는 항상
결정적으로 실패했고 수정 후에는 안정적으로 통과한다.

## 발견한 점: `/session`의 "빈 sessionPlan 리다이렉트"는 실제로 발동하지 않음

`src/lib/session-context.tsx`의 `SessionProvider`는 `useState(() => pickSessionPlan())`로
sessionPlan을 마운트 시점에 항상 즉시(3개 모두) 채운다. 따라서 `src/app/session/page.tsx`의
`if (sessionPlan.length === 0) router.replace("/")` 가드는 실제 브라우저 동작에서는
절대 참이 되지 않는다 — `/session`에 새로고침하거나 직접 URL로 들어와도 항상 1단계가
바로 플레이 가능한 상태로 뜬다. 이건 버그라기보다 "새로고침해도 다시 시작 가능"이라는
ADR-003 설계 의도와 자연스럽게 맞아떨어지는 동작이라 `03-direct-nav-guards.js`는 이
실제 동작을 검증하도록 작성했다(리다이렉트를 기대하지 않음). 반면 `/result`의
`results.length === EXPERIENCE_MODULES.length` 가드는 `results`가 항상 빈 배열로
시작하므로 실제로 동작한다.
