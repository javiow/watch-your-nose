# 아키텍처

## 디렉토리 구조
```
src/
├── app/
│   ├── page.tsx                     # 랜딩: 헤드라인 + 규칙 안내 + "시작하기"
│   ├── setup/page.tsx               # 캐릭터 설정(나이대/직업/성별), 랜딩 이후 1회성 전역 단계
│   ├── session/page.tsx             # 체험 진행 (4단계, 수동 "다음" 전환, 즉시 피드백 없음)
│   └── result/page.tsx              # 종합 평가 + 문항별 리뷰 + 대응방안 + "다시 체험하기"
├── components/
│   ├── experiences/                 # VoicePhishingExperience(+ChatBubble/TypingIndicator/ChatChoiceButtons), CaseInvestigationExperience, JeonseExperience(+jeonse/ 하위: MapBoard/HouseDialogPanel/HouseSprite/PlayerSprite/sprites/boardConfig), FraudJudgmentExperience
│   └── ui/                          # 공용 컴포넌트 — 처음부터 만들지 않고, 2곳 이상에서 중복되면 그때 추출
├── types/                           # ExperienceModule, ModuleResult, DialogueNode, CaseInvestigationContent, JeonseHouse, FraudJudgmentCard
│   └── player.ts                    # PlayerInfo
├── lib/
│   ├── registry.ts                  # 유형 등록 + 세션용 랜덤 순서/콘텐츠 선택
│   ├── scoring.ts                   # 등급 계산, 종합 평균 집계
│   └── session-context.tsx          # SessionProvider (React Context, localStorage 없음)
└── data/
    ├── voice-phishing.ts
    ├── case-investigation.ts          # red-flag(팀원 레포) 부동산 사기 조사 케이스 6종
    ├── jeonse.ts                    # 매물 42종 + 5채씩 정적 분할한 세트
    ├── fraud-judgment.ts             # 팀원 레포(fraudtest) 사기 판별 카드 90종
    └── remediation.ts               # 오답 유형별 대응 방안 카피
```

## 패턴
- 백엔드/DB 없음. 모든 콘텐츠는 `src/data/`의 정적 TS 파일.
- 4개 체험 유형은 공통 인터페이스(`ExperienceModule`)를 구현해 `lib/registry.ts`에 등록하는 플러그인 패턴 — 홈/세션 오케스트레이션은 레지스트리만 순회, 유형을 직접 import하지 않는다.
- 인터랙션이 있는 화면(session, result)은 Client Component. 랜딩은 정적 콘텐츠라 Server Component로 유지 가능.

## 데이터 흐름
```
"/" 랜딩에서 "시작하기" 클릭
→ "/setup": 나이대/직업/성별 선택 (1회, 화면 미노출 저장 — SessionProvider.playerInfo)
→ 세션 초기화: 4개 유형 순서 셔플 + 유형별 콘텐츠 풀에서 1개씩 랜덤 선택 (registry.ts)
→ "/session": 단계별로 해당 유형 Experience 컴포넌트 렌더, 진행률(N/4) 표시
   → 사용자가 선택 → 케이스 조사/전세매물은 "다음" 버튼 클릭 시, 보이스피싱은 채팅형 UI로 선택 즉시 다음 대사/단계로 진행 (자동 전환/즉시 피드백 없음은 공통)
   → 각 단계 완료 시 ModuleResult를 SessionProvider Context에 누적
→ 4단계 완료 → "/result": 평균 점수/등급 + 문항별 리뷰 + mistakeTag→대응방안(remediation.ts) 렌더
→ "다시 체험하기" → 세션 재초기화 → 랜딩·설정 화면 모두 건너뛰고 바로 "/session"
```

## 상태 관리
- 세션 상태는 root layout에 마운트된 `SessionProvider`(React Context)에만 존재. localStorage 등 영속화 계층 없음 — 새로고침 시 처음부터 재시작되는 것이 의도된 동작. 세션 도중 브라우저 뒤로가기로 이탈해도 경고 없이 그대로 허용한다(동일한 이유). 세션에는 `playerInfo: PlayerInfo | null` 필드도 함께 보관한다 — 캐릭터 설정 화면에서 한 번 저장되면 `resetSession()`으로도 초기화되지 않는다.
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

## 보안
- 모든 체험 콘텐츠는 피해자 관점(방어)만 다룬다 — 가해자 관점 콘텐츠 금지 (`docs/ADR.md` ADR-005).
- 팀원이 채워 넣는 정적 콘텐츠(사례·매물·대화 본문)를 렌더링할 때 `dangerouslySetInnerHTML`을 쓰지 않는다 — React 기본 이스케이프 경로로만 렌더링해 XSS를 원천 차단.
- `next.config`에 기본 보안 헤더를 추가한다: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`(또는 `frame-ancestors 'none'`), `Referrer-Policy: strict-origin-when-cross-origin`.
- `package-lock.json`을 커밋해 의존성 버전을 고정한다. `npm audit`은 참고용으로만 사용하고 빌드를 막는 하드 게이트로 두지 않는다.
- API 키·시크릿은 이번 MVP에서 필요 없다(완전 정적, LLM 미사용). 나중에 추가되면 `.env*`로만 다루고 코드에 하드코딩하지 않는다.
- 정적 익스포트(`output: 'export'`) 여부는 아직 고정하지 않는다 — 배포 방식이 정해지는 단계에서 재검토.
