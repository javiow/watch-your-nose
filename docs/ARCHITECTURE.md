# 아키텍처

## 디렉토리 구조
```
src/
├── app/
│   ├── page.tsx                     # 랜딩(서버 셸): <LandingHero> + 스크롤 아래 "진행 방식"(#how-it-works)
│   ├── setup/page.tsx               # 캐릭터 설정(나이대/직업/성별), 랜딩 이후 1회성 전역 단계
│   ├── difficulty/page.tsx          # 난이도 선택(쉬움/중간/어려움), /setup 이후 1회성 전역 단계
│   ├── session/page.tsx             # 체험 진행 (4단계, 수동 "다음" 전환, 즉시 피드백 없음)
│   └── result/page.tsx              # 종합 평가(등급별 마스코트 표정) + 문항별 리뷰 + 대응방안 + "다시 체험하기"
├── components/
│   ├── experiences/                 # VoicePhishingExperience(+ChatBubble/TypingIndicator/ChatChoiceButtons), CaseInvestigationExperience, JeonseExperience(+jeonse/ 하위: MapBoard/HouseDialogPanel/HouseSprite/PlayerSprite/sprites/boardConfig), FraudJudgmentExperience
│   └── ui/                          # 공용 컴포넌트 — 처음부터 만들지 않고 2곳 이상 중복 시 추출. 페이지 전용 폼(PlayerSetupForm, DifficultySelectForm), 랜딩 히어로 아일랜드(LandingHero, "use client"), 마스코트(Mascot — 표정 프레임 레이어드 next/image), StartButton도 여기 둔다.
├── types/                           # ExperienceModule, ModuleResult, DialogueNode, CaseInvestigationContent, JeonseHouse, FraudJudgmentCard, Difficulty
│   └── player.ts                    # PlayerInfo
├── lib/
│   ├── registry.ts                  # 유형 등록 + 세션용 랜덤 순서 + 난이도별 콘텐츠 선택
│   ├── scoring.ts                   # 등급 계산, 종합 평균 집계
│   ├── mascot-frames.ts             # 마스코트 표정→이미지 경로, 등급→표정 매핑, 모션 타이밍 상수 (순수 데이터)
│   ├── useReducedMotion.ts          # prefers-reduced-motion 구독 훅
│   ├── useMascotExpression.ts       # 마스코트 idle 깜빡임 루프 + 포인터 근접/hover 반응 상태 머신
│   └── session-context.tsx          # SessionProvider (React Context, localStorage 없음)
└── data/
    ├── voice-phishing.ts
    ├── case-investigation.ts          # red-flag(팀원 레포) 부동산 사기 조사 케이스 6종
    ├── jeonse.ts                    # 매물 42종 + 5채씩 정적 분할한 세트
    ├── fraud-judgment.ts             # 팀원 레포(fraudtest) 사기 판별 카드 90종
    ├── difficulty.ts               # 난이도 옵션(id/라벨/한 줄 설명) 3종
    └── remediation.ts               # 오답 유형별 대응 방안 카피
```

`public/mascot/`에 마스코트 표정 프레임 6종(`idle`/`blink`/`surprised`/`worried`/`sleepy`/`sad`, WebP)을 둔다. 원본(팀 제공 PNG 8장)을 투명화·트림·정사각 패딩·512px 변환하는 1회성 스크립트는 앱 코드로 커밋하지 않고 산출물만 커밋한다(`docs/ADR.md` ADR-013).

## 패턴
- 백엔드/DB 없음. 모든 콘텐츠는 `src/data/`의 정적 TS 파일.
- 4개 체험 유형은 공통 인터페이스(`ExperienceModule`)를 구현해 `lib/registry.ts`에 등록하는 플러그인 패턴 — 홈/세션 오케스트레이션은 레지스트리만 순회, 유형을 직접 import하지 않는다.
- 인터랙션이 있는 화면(session, result)은 Client Component. 랜딩은 서버 컴포넌트 셸로 두되, 애니메이션·포인터 반응이 필요한 히어로만 `LandingHero`(`"use client"`) 아일랜드로 분리한다.
- 마스코트는 장식 요소다 — 항상 `aria-hidden`, `alt=""`. 표정 프레임(`public/mascot/*.webp`)을 `next/image`로 전부 겹쳐 렌더하고 opacity로 크로스페이드하며, 모션은 `globals.css`의 `@keyframes`로만 구현한다(모션 라이브러리 미사용). 마스코트 상태 로직은 `src/lib/`의 훅(`useMascotExpression`, `useReducedMotion`)에 두고 `Mascot` 컴포넌트는 렌더만 맡는다.

## 데이터 흐름
```
"/" 랜딩(히어로: 인터랙티브 마스코트 + 스크롤 아래 "진행 방식" 안내)에서 "시작하기" 클릭
→ "/setup": 나이대/직업/성별 선택 (1회, 화면 미노출 저장 — SessionProvider.playerInfo)
→ "/difficulty": 쉬움/중간/어려움 중 1개 선택 (SessionProvider.difficulty, 유형명 비노출)
→ 세션 초기화: 4개 유형 순서 셔플 + 유형별 콘텐츠 풀을 선택 난이도로 좁혀 1개씩 랜덤 선택 (registry.ts)
→ "/session": 단계별로 해당 유형 Experience 컴포넌트 렌더, 진행률(N/4) 표시
   → 사용자가 선택 → 케이스 조사/전세매물은 "다음" 버튼 클릭 시, 보이스피싱은 채팅형 UI로 선택 즉시 다음 대사/단계로 진행 (자동 전환/즉시 피드백 없음은 공통)
   → 각 단계 완료 시 ModuleResult를 SessionProvider Context에 누적
→ 4단계 완료 → "/result": 평균 점수/등급(등급별 마스코트 표정 — safe→relieved / caution→worried / danger→sad) + 문항별 리뷰 + mistakeTag→대응방안(remediation.ts) 렌더
→ "다시 체험하기" → 세션 재초기화 → 랜딩·설정·난이도 화면 모두 건너뛰고 바로 "/session" (playerInfo·difficulty 유지)
```

## 상태 관리
- 세션 상태는 root layout에 마운트된 `SessionProvider`(React Context)에만 존재. localStorage 등 영속화 계층 없음 — 새로고침 시 처음부터 재시작되는 것이 의도된 동작. 세션 도중 브라우저 뒤로가기로 이탈해도 경고 없이 그대로 허용한다(동일한 이유). 세션에는 `playerInfo: PlayerInfo | null` 필드도 함께 보관한다 — 캐릭터 설정 화면에서 한 번 저장되면 `resetSession()`으로도 초기화되지 않는다. 세션에는 `difficulty: Difficulty | null` 필드도 함께 보관하며, `/difficulty`에서 한 번 저장되면 `playerInfo`와 마찬가지로 `resetSession()`으로 초기화되지 않는다.
- 서버 상태 없음(백엔드 미사용).

## 엣지 케이스 / 방어 로직
- `registry.ts`는 각 유형의 `contentPool`이 비어있으면 앱 로드 시점에 즉시 에러를 던진다 (팀원이 데이터 추가를 깜빡한 경우를 빈 화면이 아니라 눈에 띄는 에러로 드러내기 위함).
- `pickSessionPlan()`은 등록된 유형 각각을 정확히 1회씩만 포함해야 한다 (동일 유형 중복 금지).
- `/result`는 `results.length`가 등록된 유형 수와 정확히 일치할 때만 렌더하고, 그 외(0개 또는 일부만 완료)에는 `/`로 리다이렉트한다.
- "다음" 버튼은 클릭 후 다음 화면으로 전환되기 전까지 비활성화해 중복 클릭으로 `ModuleResult`가 두 번 쌓이는 것을 막는다. (보이스피싱의 채팅 선택지는 "다음" 버튼이 없는 대신, 선택지 클릭 시 즉시 잠금 처리해 동일한 중복 클릭 방지를 보장한다.)
- 보이스피싱 오답은 원인에 따라 두 가지 mistakeTag로 구분한다 — 정상 케이스를 거절: blind-refusal, 사기 케이스에 응함: fell-for-scam.
- `mistakeTag`가 `remediation.ts`에 없는 경우(오타 등) 빈 화면 대신 일반 기본 안내 문구를 보여준다.
- 점수는 화면 표시 시 정수(%)로 반올림한다.
- 보이스피싱 `DialogueNode`의 `next` 참조가 존재하지 않으면 크래시 대신 해당 시점에서 시나리오를 종료 처리한다.
- "다시 체험하기"는 직전 콘텐츠를 제외하지 않는 순수 랜덤이다 (의도된 동작).
- `/session`은 `playerInfo`가 없으면(직접 URL 진입 등) `/`로 리다이렉트한다 — 기존 빈 세션 리다이렉트와 동일한 패턴.
- 전세매물은 5채 판정을 하나의 `ModuleResult`로 집계한다 — `score`는 정답수/5*100, `isCorrect`는 등급이 "safe"(80%↑)일 때만 true, 그 외에는 `mistakeTag: "missed-lease-fraud-signal"`.
- 전세매물 진행 중에는 헤더 카운터·맵 위 집 배지·사이드바 점검기록 배지 어디에도 정오답을 노출하지 않는다 — "완료/미점검" 여부만 표시한다(즉시 피드백 금지 원칙의 연장).
- 사기 판별 카드는 오답 원인에 따라 두 가지 mistakeTag로 구분한다 — 실제 사기를 정상으로 오판: `missed-scam-signal`(기존 재사용), 정상을 사기로 오판: `false-alarmed-safe-case`(신규).
- 사기 판별 카드의 `source`(출처)는 정답을 암시할 수 있어 `explanation`과 결합해 결과 페이지에서만 노출하고, 체험 중에는 절대 렌더링하지 않는다.
- 케이스 조사는 조사 포인트가 부족하거나 언락 조건이 충족되지 않은 조사 항목을 비활성화/비노출하며, 부분 조사만 하고 최종 판단으로 넘어가는 것도 허용한다(원작과 동일한 UX).
- 케이스 조사의 모순 발견은 자동 판정이다 — 관련 NPC 질문을 클릭하고 관련 증거를 등록하면 자동으로 모순 점수를 획득하며, 모순 설명은 `/result`에서만 노출한다.
- 케이스 조사의 `isCorrect`는 점수 임계치가 아니라 "사용자가 고른 최종 판단이 해당 케이스의 최고점 선택지와 일치하는가"로 정의한다 — 케이스에 따라 "진행 가능"이 최고점일 수 있다(원작의 교육 철학 보존).
- 케이스 조사 오답은 두 가지 mistakeTag로 구분한다 — 최고점이 "진행 가능"인 케이스를 과도하게 의심해 오답 처리된 경우: `false-alarmed-safe-case`(기존 재사용), 그 외 위험 신호를 놓친 경우: `missed-realestate-investigation-signal`(신규).
- 케이스 조사 진행 중에는 케이스 제목(스포일러성 문구)·최종판단 코멘트·정답 해설을 화면에 렌더링하지 않는다 — 헤딩은 매물/상황 위치 설명을 대신 쓴다.
- 케이스 조사는 원작의 시간제한(`time_limit_seconds`) 카운트다운을 구현하지 않는다 — 시나리오 텍스트로만 서사적으로 유지한다.
- `/difficulty`는 `playerInfo`가 없으면(직접 URL 진입 등) `/`로 리다이렉트한다 — `/session`의 기존 가드와 동일 패턴.
- `/session`은 `difficulty`가 없으면(직접 URL 진입 등) `/`로 리다이렉트한다 — `playerInfo` 가드와 함께 확인한다.
- 난이도 선택 화면의 라벨·설명 문구는 체험 유형명이나 다음 단계를 드러내지 않는다 — 일반적 표현만 쓴다(ADR-004의 연장, `page.test.tsx`의 유형명 비노출 테스트와 같은 원칙).
- `pickRandomContent(difficulty)`는 해당 난이도로 태깅된 콘텐츠가 없는 풀(태깅이 아예 없는 유형 포함)에서는 전체 풀 랜덤으로 fallback한다 — 이번 범위에서 난이도가 실제 반영되는 유형은 전세매물뿐이고, 나머지 3개 유형의 동작은 난이도 도입 전과 동일하다.
- 전세매물은 난이도 선택 시 `JEONSE_HOUSES`에서 해당 난이도 매물만 골라 랜덤 5채로 세트를 즉석 구성한다 — 해당 난이도 매물이 5채 미만이면 기존 `JEONSE_HOUSE_SETS` 세트로 fallback한다. 세트 내 위험/안전 매물 균형은 보장하지 않는다(기존 정적 세트도 동일).
- `Mascot`은 `SessionProvider` 없이·props 없이도 장식용 `img`(`aria-hidden`)로 렌더된다 — 기존 `Mascot.test.tsx` 계약을 깨지 않는다. 정오답·등급은 마스코트가 텍스트로 대신 말하지 않고 기존 등급 라벨/색이 담당한다.
- 마스코트 표정 프레임은 마운트 시 전부 프리로드해 첫 표정 전환 시 깜빡임이 없도록 한다. 프레임 파일이 없거나 로드 실패해도 레이아웃은 빈 박스로 유지되고 앱은 크래시하지 않는다.
- `prefers-reduced-motion: reduce` 환경에서는 마스코트 idle 루프·bob·크로스페이드와 히어로 배경/떠다니는 카드/CTA 애니메이션을 모두 끄고 정적으로 렌더한다. `useMascotExpression`은 이때 타이머를 걸지 않고 `baseExpression`을 고정 반환한다.
- 마스코트 포인터 근접 반응은 `proximityRef` 요소의 `pointermove`로만 동작하며 `typeof window`/`PointerEvent` 가드 뒤에 둔다 — 미지원 환경(SSR·jsdom)에서는 hover/focus 반응만 남고 근접 감지는 조용히 비활성화된다.
- 랜딩 히어로의 떠다니는 "가짜 스캠 알림" 카드는 장식이다(`aria-hidden`, `pointer-events-none`) — CTA 클릭을 가로막지 않고, 문구는 체험 유형명이나 다음 단계를 드러내지 않는다(ADR-004, `page.test.tsx` 유형명 비노출과 같은 원칙).

## 보안
- 모든 체험 콘텐츠는 피해자 관점(방어)만 다룬다 — 가해자 관점 콘텐츠 금지 (`docs/ADR.md` ADR-005).
- 팀원이 채워 넣는 정적 콘텐츠(사례·매물·대화 본문)를 렌더링할 때 `dangerouslySetInnerHTML`을 쓰지 않는다 — React 기본 이스케이프 경로로만 렌더링해 XSS를 원천 차단. 랜딩 히어로 배경 그레인도 인라인 SVG/`dangerouslySetInnerHTML` 없이 CSS `radial-gradient`로만 만든다.
- `next.config`에 기본 보안 헤더를 추가한다: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`(또는 `frame-ancestors 'none'`), `Referrer-Policy: strict-origin-when-cross-origin`.
- `package-lock.json`을 커밋해 의존성 버전을 고정한다. `npm audit`은 참고용으로만 사용하고 빌드를 막는 하드 게이트로 두지 않는다.
- API 키·시크릿은 이번 MVP에서 필요 없다(완전 정적, LLM 미사용). 나중에 추가되면 `.env*`로만 다루고 코드에 하드코딩하지 않는다.
- 정적 익스포트(`output: 'export'`) 여부는 아직 고정하지 않는다 — 배포 방식이 정해지는 단계에서 재검토.
