# Step 0: review-result-types

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` (특히 "타입은 `src/types/`", "순수 로직은 `src/lib/`" 분리 규칙)
- `/docs/ARCHITECTURE.md` (디렉토리 구조)
- `/docs/ADR.md`의 ADR-004 (레지스트리 기반 플러그인, 유형 사전 비공개)
- `/src/types/experience.ts` (전체) — `ModuleResult`(L14-24: `typeId`, `contentId`, `score`, `grade`, `userChoice`, `correctChoice`, `isCorrect`, `explanation`, `mistakeTag?`), `ExperienceComponentProps.onComplete`, `ExperienceModule`
- `/src/lib/scoring.ts` — `aggregateResults`가 `result.score`만 읽는다는 점 확인
- `/src/lib/session-context.tsx` — `addResult`가 `results` 배열에 append만 한다는 점 확인

## 배경

결과 페이지(`/result`)의 "문항별 리뷰"가 지금은 집계 문자열(`"4장 중 2장 정답 판정"`)과, 놓친 항목들을 `; `로 이어붙여 문장 전체를 `**…**`로 감싼 `explanation` 한 덩어리만 보여준다. `Prose`가 이걸 한 문단·전체 볼드로 렌더해 읽기 어렵다.

앞으로 결과 페이지에서 (1) 카드/매물 단위 **O/X 표**와 (2) **놓친 위험 신호만 불릿 목록**으로 분해해 보여주려면 `ModuleResult`에 구조화된 데이터가 필요하다. 이 step은 **타입(계약)만** 추가한다. 값을 채우는 체험 컴포넌트는 step1~4, 렌더는 step5~6에서 다룬다.

## 작업

### `src/types/experience.ts`

1. `export interface` 2개 추가 (시그니처만 — 필드 순서·주석은 아래를 따르되 구현 재량 없음, 그대로 박아라):

   ```ts
   /** 결과 페이지 "문항별 리뷰"의 O/X 표 한 행. 단일 판정 체험(보이스피싱·케이스조사)도 1행짜리로 채운다. */
   export interface ReviewItem {
     label: string;          // 행 제목: "1번 — 먼저 입금해주면…" / "빌라 A" / "이 계약 판단"
     userVerdict: string;    // 표시용 판정: "사기" | "정상" | "O (위험 있음)" | "계약 중단" …
     correctVerdict: string; // userVerdict와 같은 어휘 체계
     isCorrect: boolean;
     detail?: string;        // 단일 판정 체험에서 놓쳤을 때만: 평문 해설 (\n\n 허용)
   }

   /** 결과 페이지 "놓친 위험 신호" 불릿 한 개. 오답일 때만 존재. */
   export interface MissedSignal {
     title: string;          // 굵게 표시할 제목 한 줄
     description?: string;    // 짧은 설명 (별도 줄)
     source?: string;         // 있으면 "(출처: …)" 별도 줄
   }
   ```

2. `ModuleResult`에 **optional 필드 2개만** 추가한다. `explanation`은 필수로 그대로 둔다:

   ```ts
   export interface ModuleResult {
     // …기존 필드 전부 그대로…
     explanation: string;             // 유지(필수). 이후 step에서 짧은 평문 요약으로 축소됨
     mistakeTag?: string;
     reviewItems?: ReviewItem[];      // 신규 (선택)
     missedSignals?: MissedSignal[];  // 신규 (선택) — 오답일 때만 채움
   }
   ```

### 왜 optional인가 (지켜야 할 설계 의도)

- `ModuleResult`를 생성하는 곳은 체험 컴포넌트 4개(`VoicePhishing`/`FraudJudgment`/`Jeonse`/`CaseInvestigation`)와 테스트 픽스처뿐이다.
- 두 필드를 optional로 두면 이 step에서는 **어떤 소비처도 수정할 필요가 없고**, strict 모드에서 기존 코드·픽스처가 그대로 컴파일된다.
- `explanation`을 제거하거나 필수 필드를 추가하면 17개가 넘는 소비처·픽스처가 전부 컴파일 에러난다. 이번 phase는 하위호환을 유지한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

기능 변화가 없으므로 **기존 테스트가 한 개도 바뀌지 않고 전부 통과해야 한다.**

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트:
   - `git diff --name-only` 결과가 `src/types/experience.ts` 한 개뿐인가?
   - 새 필드가 둘 다 `?:` optional인가?
   - `ModuleResult.explanation`이 여전히 필수(옵셔널 아님)인가?
   - 테스트 개수가 이전과 동일한가? (신규/삭제 0)
3. 결과에 따라 `phases/11-review-breakdown-and-phase-nav/index.json`의 `step: 0`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

`summary`에는 추가한 `ReviewItem` / `MissedSignal` 인터페이스의 **필드 전체 시그니처**와, 두 필드가 `ModuleResult`에 optional로 붙었다는 사실을 적어라(step1~6이 이 계약을 참조한다).

## 금지사항

- `ModuleResult.explanation`을 삭제하거나 non-optional 필드를 새로 추가하지 마라. 이유: 4개 체험 컴포넌트 + `scoring.test.ts` / `session-context.test.tsx` / `session/page.test.tsx` / `ScoreBarChart.test.tsx` / `remediation.test.ts` / `result/page.test.tsx` 픽스처가 전부 깨진다.
- 새 필드를 non-optional로 만들지 마라. 이유: 값을 채우는 건 step1~4다. 이 step에서 필수로 두면 그 4개 컴포넌트가 즉시 컴파일 에러난다.
- `src/types/` 밖의 어떤 파일도 수정하지 마라. 이유: 이 step은 계약(타입)만 정의한다. 소비·렌더는 이후 step.
- `src/lib/scoring.ts` / `session-context.tsx`를 건드리지 마라. 이유: 채점·세션 저장 로직은 이번 phase에서 불변이다.
