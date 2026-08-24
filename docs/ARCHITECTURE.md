# 아키텍처

## 디렉토리 구조
```
src/
├── app/
│   ├── page.tsx                     # 랜딩: 헤드라인 + 규칙 안내 + "시작하기"
│   ├── session/page.tsx             # 체험 진행 (3단계, 수동 "다음" 전환, 즉시 피드백 없음)
│   └── result/page.tsx              # 종합 평가 + 문항별 리뷰 + 대응방안 + "다시 체험하기"
├── components/
│   ├── experiences/                 # VoicePhishingExperience, CaseSelectExperience, JeonseExperience
│   └── ui/                          # ProgressBar, Card, ChoiceButton 등 공용 컴포넌트
├── types/                           # ExperienceModule, ModuleResult, DialogueNode, ScamCasePair, ListingPair
├── lib/
│   ├── registry.ts                  # 유형 등록 + 세션용 랜덤 순서/콘텐츠 선택
│   ├── scoring.ts                   # 등급 계산, 종합 평균 집계
│   └── session-context.tsx          # SessionProvider (React Context, localStorage 없음)
└── data/
    ├── voice-phishing.ts
    ├── case-select.ts
    ├── jeonse.ts
    └── remediation.ts               # 오답 유형별 대응 방안 카피
```

## 패턴
- 백엔드/DB 없음. 모든 콘텐츠는 `src/data/`의 정적 TS 파일.
- 3개 체험 유형은 공통 인터페이스(`ExperienceModule`)를 구현해 `lib/registry.ts`에 등록하는 플러그인 패턴 — 홈/세션 오케스트레이션은 레지스트리만 순회, 유형을 직접 import하지 않는다.
- 인터랙션이 있는 화면(session, result)은 Client Component. 랜딩은 정적 콘텐츠라 Server Component로 유지 가능.

## 데이터 흐름
```
"/" 랜딩에서 "시작하기" 클릭
→ 세션 초기화: 3개 유형 순서 셔플 + 유형별 콘텐츠 풀에서 1개씩 랜덤 선택 (registry.ts)
→ "/session": 단계별로 해당 유형 Experience 컴포넌트 렌더, 진행률(N/3) 표시
   → 사용자가 선택 → "다음" 버튼 활성화 → 사용자가 "다음" 클릭 시에만 다음 단계로 (자동 전환/즉시 피드백 없음)
   → 각 단계 완료 시 ModuleResult를 SessionProvider Context에 누적
→ 3단계 완료 → "/result": 평균 점수/등급 + 문항별 리뷰 + mistakeTag→대응방안(remediation.ts) 렌더
→ "다시 체험하기" → 세션 재초기화 → 랜딩을 거치지 않고 바로 "/session"
```

## 상태 관리
- 세션 상태는 root layout에 마운트된 `SessionProvider`(React Context)에만 존재. localStorage 등 영속화 계층 없음 — 새로고침 시 처음부터 재시작되는 것이 의도된 동작.
- 서버 상태 없음(백엔드 미사용).
