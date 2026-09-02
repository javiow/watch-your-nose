# Step 0: docs-update

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 기획·아키텍처·설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/PRD.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md` (특히 ADR-002 외부 의존성 없음, ADR-004 유형 비노출, ADR-013 — 이번 phase에서 이미 추가돼 있을 수 있다)
- `/README.md`
- `/src/app/page.tsx`, `/src/app/layout.tsx` (수정하지 말 것 — 문구 위치 확인용)

이 step은 **문서만** 다룬다. `src/` 아래 코드는 이 step에서 절대 건드리지 않는다(애셋·CSS·타입·훅·컴포넌트·페이지는 step1~8에서 다룬다).

## 배경

랜딩(`/`)을 풀 히어로로 개편하고, 마스코트를 팀 제공 픽셀아트 코끼리 표정 6종으로 교체하며, 한글 서비스명(헤드라인)을 **"눈 뜨고 코 베인다" → "코심코심"** 로 바꾼다. 영문명 "Watch Your Nose"와 리포지토리명은 유지한다.

이번 phase 설계 과정에서 `docs/ADR.md`에 **ADR-013**이, `docs/ARCHITECTURE.md`에 관련 변경이 이미 추가돼 있을 수 있다. 이 step은 그 두 문서를 **검증**하고(누락 시 아래 명세대로 채우고), `docs/PRD.md`와 `README.md`를 갱신한다.

핵심 제약:

- PRD 「디자인」 섹션은 현재 "다크모드 고정 / 미니멀 / 장식적 그라데이션·블러 글로우 지양 / 포인트 컬러 블루"라고 적혀 있으나, **실제 코드(`src/app/globals.css`)는 이미 라이트 크림(`#fdf8f0`) + 번트오렌지(`#e8623a`) 테마**다. 문서가 현실과 어긋난 지 오래다. 이 step에서 현실 + 새 방향에 맞춰 개정한다.
- 새 방향: **브랜드 토큰(`globals.css`의 `--accent` 등) 범위 내의 은은한 모션·그레인·그라디언트는 허용**하되, 보라색 글로우·블러·"AI 템플릿 티"는 계속 지양한다.
- 서비스명 치환은 **문서와 README에서만** 한다. `src/`의 문구(`page.tsx` H1, `layout.tsx` metadata)는 step7에서 리디자인과 함께 바꾼다.

## 작업

### 1. `docs/PRD.md` — 「디자인」 섹션 교체

현재 파일 맨 아래 `## 디자인` 섹션 전체(불릿 3개)를 아래로 교체한다:

```markdown
## 디자인
- 라이트 테마 고정. 배경은 따뜻한 크림(`--background`), 텍스트는 짙은 브라운(`--foreground`), 카드 표면은 흰색. 색·폰트·간격은 `src/app/globals.css`의 디자인 토큰(`:root` + `@theme inline`)을 단일 출처로 쓴다.
- 메인 포인트 컬러: 번트오렌지(`--accent` `#e8623a`). 시맨틱 색: 정답/안전 green(`--safe`), 오답/위험 red(`--danger`).
- 랜딩은 히어로 중심의 몰입형 화면을 허용한다 — 인터랙티브 마스코트, 브랜드 토큰 범위 내의 은은한 배경 그라디언트/그레인, 커서 반응, 스크롤 유도. 단 보라색 브랜드 컬러·블러 글로우·과한 그림자 등 "AI 템플릿 티"가 나는 장식은 계속 지양하고, `prefers-reduced-motion`을 존중한다.
- 모바일 반응형 필수 (전화·문자 상황을 다루는 서비스 특성상 모바일 사용 비중이 높을 것으로 예상).
```

### 2. `docs/PRD.md` — 핵심 기능 1번 교체

현재 "핵심 기능" 목록의 1번을 아래로 교체한다(2~9번은 건드리지 않는다):

```markdown
1. 랜딩 — 서비스명 "Watch Your Nose" + 헤드라인 "코심코심"("코 조심"을 반복한 말놀이)으로 도발적으로 이목을 끄는 히어로 화면. 진행 규칙(여러 단계 · 선택하면 진행됨 · 결과는 마지막에 공개)은 히어로 아래 스크롤 섹션에서 간단히 안내한다. 어떤 유형이 나올지는 알려주지 않는다.
```

### 3. `README.md`

- 1행 `# Watch Your Nose — 눈 뜨고 코 베인다` → `# Watch Your Nose — 코심코심`
- 본문에서 "눈 뜨고 코 베인다"를 grep해 남은 참조가 있으면 모두 "코심코심"로 치환한다. 단 코드 블록·명령어·경로는 바꾸지 않는다.

### 4. `docs/ADR.md` — ADR-013 검증

파일에 `### ADR-013:` 항목이 이미 있는지 확인한다. **있으면**: 그 안에 (a) 서비스명 "눈 뜨고 코 베인다" → "코심코심" 변경 결정과 (b) 라이트/오렌지 팔레트·모션 허용이 언급돼 있는지 확인하고, 빠졌으면 기존 ADR 형식(**결정 / 이유 / 트레이드오프** 3단락)에 맞춰 보완한다. **없으면**: ADR-012 뒤에 아래 골자로 새로 추가한다.

- **결정**: 랜딩을 `min-h-screen` 히어로로 재구성(중앙 애니메이션 마스코트 + 떠다니는 장식 "가짜 스캠 알림" 카드 + 브랜드 토큰 그라디언트·CSS 그레인 + CTA pulse), "진행 방식"은 스크롤 아래 `#how-it-works`로 이동하되 문구 불변. 마스코트를 픽셀아트 표정 6종(`idle`/`blink`/`surprised`/`worried`/`sleepy`/`sad`, WebP, `public/mascot/`)으로 교체하고 가공 스크립트는 커밋하지 않음. `Mascot` 컴포넌트를 레이어드 `next/image` + opacity 크로스페이드로 재작성하되 props 없이·`SessionProvider` 없이 장식용 `img`(`aria-hidden`)로 렌더되는 기존 계약 유지. 모션 상태 머신은 `src/lib/`의 순수 훅 3개(`mascot-frames.ts`·`useReducedMotion.ts`·`useMascotExpression.ts`)로 분리, 새 npm 의존성 없이 `globals.css` `@keyframes`만 사용. `/result` 종합 정답률에 등급별 정적 마스코트(`safe`→`relieved`/`caution`→`worried`/`danger`→`sad`). 히어로는 `LandingHero`(`"use client"`) 아일랜드로 분리하고 `page.tsx`는 서버 셸 유지. 한글 서비스명을 "눈 뜨고 코 베인다"→"코심코심"로 변경(영문명·리포명 유지).
- **이유**: 유형 비노출(ADR-004)이라 랜딩 첫인상은 마스코트·모션·카피로만 만들 수 있음. CSS·`next/image`만으로 처리해 ADR-002 기조 유지.
- **트레이드오프**: 서버 셸+클라 아일랜드로 분리; 이미지 1→6장(프리로드); 소스에 웃는 프레임이 없어 `relieved`는 감은 눈 재사용; `sad`는 원본 그림자 클리핑 필요(잔여 시 `danger`→`surprised` 폴백); 가공 스크립트 비커밋이라 원본 변경 시 수동 재가공; jsdom `matchMedia` 없어 `tests/setup.ts` shim 필요; 한글 웹폰트 부재로 큰 H1은 시스템 폴백; 랜딩이 "한 화면"이 아니게 되나 유형 비노출 원칙은 유지.

### 5. `docs/ARCHITECTURE.md` — 검증

아래가 반영돼 있는지 확인하고, 빠진 항목만 채운다(기존 문장 재작성 금지):

- 디렉토리 트리: `page.tsx`가 "서버 셸: `<LandingHero>` + 스크롤 아래 진행 방식", `result/page.tsx`에 "등급별 마스코트 표정", `components/ui/`에 `LandingHero`·`Mascot`, `lib/`에 `mascot-frames.ts`·`useReducedMotion.ts`·`useMascotExpression.ts`.
- 트리 아래에 `public/mascot/` 프레임 6종 + 가공 스크립트 비커밋 note.
- 「패턴」: 랜딩 = 서버 셸 + `LandingHero`(`"use client"`) 아일랜드; 마스코트는 장식(`aria-hidden`), 모션은 `@keyframes`만, 상태 로직은 `src/lib` 훅.
- 「데이터 흐름」: 랜딩 히어로 + 스크롤 "진행 방식"; `/result` 등급→표정.
- 「엣지 케이스」: `Mascot` zero-prop/provider 없는 렌더, 프레임 프리로드/로드 실패 내성, `prefers-reduced-motion`이면 정적, 포인터 근접은 `PointerEvent` 가드, 떠다니는 카드는 `aria-hidden`·`pointer-events-none`·유형명 비노출.
- 「보안」: 히어로 그레인은 인라인 SVG/`dangerouslySetInnerHTML` 없이 CSS `radial-gradient`.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

(코드 변경이 없으므로 이 커맨드들이 변경 전과 동일하게 통과하는지만 확인한다.)

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 문서 체크리스트:
   - `git status`에 `src/` 아래 변경이 하나도 없는가?
   - `grep -n "다크모드" docs/PRD.md` 결과가 비어 있는가?
   - `grep -rn "눈 뜨고 코 베인다" docs/ README.md` 결과가 비어 있는가? (완료된 phase의 `phases/**/step*.md`는 검색·수정 대상 아님)
   - ADR-013이 기존 ADR와 형식(결정/이유/트레이드오프)이 일관되는가?
   - ARCHITECTURE에 `mascot-frames` / `useReducedMotion` / `useMascotExpression` / `LandingHero` / `public/mascot` 문자열이 존재하는가?
3. 결과에 따라 `phases/6-landing-redesign/index.json`의 `step: 0`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "..."`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "..."` 후 중단

## 금지사항

- `src/` 아래 어떤 파일도 수정하지 마라. 이유: 코드 변경은 step1~8에서 다루며, 지금 건드리면 이후 step의 diff가 지저분해진다.
- `phases/0-mvp/`, `phases/1-*` 등 **완료된 phase의 `step*.md`·`*-output.json`·`index.json`을 수정하지 마라.** 이유: 실행 이력 기록물이라 사후 변조하면 안 된다. 서비스명 치환은 `docs/`와 루트 `README.md`에만 적용한다.
- 영문 서비스명 "Watch Your Nose", 리포지토리명 `watch-your-nose`, CLAUDE.md의 코드네임 "Grill Me"는 바꾸지 마라. 이유: 사용자가 요청한 건 한글 헤드라인뿐이다.
- ADR-001~012, PRD/ARCHITECTURE의 기존 항목을 삭제하거나 재작성하지 마라 — 위에 명시된 부분만 교체/추가한다.
- 기존 테스트를 깨뜨리지 마라.
