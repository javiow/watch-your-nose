# 프로젝트: Grill Me — 금융 사기 교육 서비스

## 기술 스택
- Next.js 16 (App Router)
- TypeScript strict mode
- Tailwind CSS

## 아키텍처 규칙
- CRITICAL: 백엔드/DB를 두지 않는다. 모든 콘텐츠(보이스피싱 시나리오, 사례 쌍, 매물 쌍, 대응 방안 카피)는 `src/data/`의 정적 TS 파일로만 관리한다.
- CRITICAL: 세션 상태는 `src/lib/session-context.tsx`의 React Context로만 보관한다. localStorage 등 영속화 계층을 추가하지 않는다 — 새로고침 시 처음부터 재시작되는 것이 의도된 동작이다.
- CRITICAL: 3개 체험 유형(보이스피싱/사례선택/전세매물)은 `src/types/`의 `ExperienceModule` 공통 인터페이스를 구현하고 `src/lib/registry.ts`에 등록하는 방식으로만 추가한다. 오케스트레이션(홈/세션/결과 페이지)은 레지스트리만 순회하며 특정 유형을 직접 import하지 않는다.
- CRITICAL: 사용자에게 체험 유형 목록이나 다음 단계가 무엇인지 사전에 노출하지 않는다 (홈 화면, URL, 진행률 표시 모두 유형명을 드러내면 안 됨).
- CRITICAL: 모든 체험 콘텐츠(특히 보이스피싱)는 피해자 관점(방어)만 다룬다. 가해자 관점 체험이나 실제로 통할 수 있는 사기 대화 스크립트로 오용될 만한 콘텐츠는 절대 만들지 않는다.
- CRITICAL: 시크릿·API 키는 코드에 하드코딩하지 않는다. 필요해지면 `.env*`(gitignore 대상)로만 다룬다. (이번 MVP는 완전 정적이라 원래 시크릿이 필요 없다.)
- 컴포넌트는 `src/components/` (공용 UI는 `ui/`, 유형별 체험 컴포넌트는 `experiences/`), 타입은 `src/types/`, 순수 로직은 `src/lib/`에 분리한다.
- 팀원이 채워 넣는 정적 콘텐츠(사례·매물·대화 본문 등)를 렌더링할 때 `dangerouslySetInnerHTML`을 쓰지 않는다 — React의 기본 이스케이프 경로로만 렌더링한다.

## 개발 프로세스
- CRITICAL: 새 기능 구현 시 반드시 테스트를 먼저 작성하고, 테스트가 통과하는 구현을 작성할 것 (TDD)
- 커밋 메시지는 conventional commits 형식을 따를 것 (feat:, fix:, docs:, refactor:)

## 명령어
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
npm run test     # 테스트 (Vitest + React Testing Library)
