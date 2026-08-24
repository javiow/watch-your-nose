# Step 0: project-setup

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/docs/UI_GUIDE.md`

이 리포는 현재 `.claude/`, `docs/`, `scripts/`만 있는 빈 스캐폴드다. `src/` 디렉토리와 Next.js 프로젝트 자체가 아직 없다.

## 작업

Next.js 15(App Router) + TypeScript(strict) + Tailwind CSS 프로젝트를 리포 루트에 새로 세팅한다.

1. `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `.eslintrc`(또는 `eslint.config.js`)를 생성한다. `tsconfig.json`은 `strict: true`로 설정.
2. `package.json`의 `scripts`는 `CLAUDE.md`의 명령어와 정확히 일치해야 한다: `dev`, `build`, `lint`, `test`.
3. 테스트 러너는 **Vitest + @testing-library/react + jsdom**로 세팅한다 (`vitest.config.ts`, `test`/`test:setup` 관련 devDependencies 포함).
4. `src/app/layout.tsx`: 다크모드 고정 배경(`#0a0a0a`, `docs/UI_GUIDE.md` 색상표 참고), 기본 폰트, `<html lang="ko">`. 이 step에서는 `SessionProvider`를 아직 마운트하지 않는다 (step5에서 추가).
5. `src/app/page.tsx`: 이 step에서는 최소 placeholder만 — "Watch Your Nose" 텍스트를 렌더하는 정도로 두고, 실제 랜딩 디자인은 step5에서 교체한다.
6. `src/app/globals.css`: Tailwind 지시어 + 기본 배경/텍스트 색상.

## Acceptance Criteria

```bash
npm install
npm run build   # 컴파일 에러 없음
npm run lint    # 린트 에러 없음
npm test        # 테스트 통과 (이 step은 아직 테스트할 로직이 없으므로, vitest가 "테스트 없음"으로 정상 종료되게 설정하거나 layout 렌더 smoke test 1개만 추가)
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `docs/ARCHITECTURE.md`의 디렉토리 구조(`src/app`, `src/components`, `src/types`, `src/lib`, `src/data`)를 따르는가?
   - `docs/ADR.md`의 ADR-001(Next.js+TS+Tailwind) 기술 스택을 벗어나지 않았는가?
   - `CLAUDE.md` CRITICAL 규칙(백엔드/DB 없음, localStorage 없음)을 위반하지 않았는가?
3. 결과에 따라 `phases/0-mvp/index.json`의 `step: 0` 항목을 업데이트한다.

## 금지사항

- `src/app/session`, `src/app/result` 라우트나 실제 게임 로직, 타입, 데이터를 이 step에서 만들지 마라. 이유: step 범위를 프로젝트 스캐폴딩으로 최소화하기 위함 — 이후 step에서 다룬다.
- `localStorage`나 다른 영속화 로직을 추가하지 마라. 이유: `docs/ADR.md` ADR-003.
- 백엔드 서버, API 라우트, DB 클라이언트를 추가하지 마라. 이유: `docs/ADR.md` ADR-002.
