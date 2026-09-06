# Step 10: result-merge-remediation

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ADR.md`의 ADR-016 (결과 페이지 콘텐츠 라벨링 — 유형 라벨 노출은 허용)
- `/src/app/result/page.tsx` (전체) — 현재 섹션 순서: ① 종합 정답률 게이지 → ② 유형별 점수(`ScoreBarChart`) → ③ **문항별 리뷰**(`results.map` → `<li>`: ✓/✗ + `{index+1}번 · {EXPERIENCE_TYPE_LABELS[typeId]}` + `내 선택 … · 정답 …` + `<HighlightedText text={result.explanation} />`) → ④ **대응 방안**(별도 `<section>`, `incorrectResults`만, `getRemediationEntry(result.mistakeTag)` → `entry.bullets` + `entry.links`; `entry.message`는 렌더 안 함)
- `/src/app/result/page.test.tsx` (전체) — `vi.mock` 팩토리, `completeResults()` 픽스처 헬퍼, `EXPERIENCE_TYPE_LABELS` 라벨 카운트 어서션, "**로 감싼 핵심 문구만 강조" 케이스(정답 결과 `i === 0` 기준)
- `/src/data/remediation.ts` — `RemediationEntry { message, bullets, links? }`, `getRemediationEntry(mistakeTag)`, `DEFAULT_REMEDIATION_ENTRY`
- `/src/components/ui/Prose.tsx` (step0), `/src/components/ui/HighlightedText.tsx`
- `/src/types/experience.ts` — `ModuleResult` (`isCorrect`, `mistakeTag?`, `explanation`, `typeId`, `contentId`)

## 배경

사용자 피드백: "결과 페이지에서 문항별 리뷰, 그 다음에 그거에 대한 대응 방안이 바로 나올 수 있도록."

현재는 "문항별 리뷰"와 "대응 방안"이 서로 떨어진 두 섹션이라 어떤 문항의 대응인지 눈으로 잇기 어렵다. **각 오답 문항의 대응 방안을 그 문항 리뷰 `<li>` 안으로 넣고**, 독립 "대응 방안" 섹션을 없앤다. 정답 문항은 설명만.

## 작업

### `src/app/result/page.tsx`

1. 독립 `대응 방안` `<section>`(대략 103~151행, `{incorrectResults.length > 0 && (...)}`)과 그와만 쓰이는 `incorrectResults` 지역변수를 **삭제**한다.
2. "문항별 리뷰"의 `results.map((result, index) => <li>...)` 안, `explanation` `<p>` 다음에 오답일 때만 대응 블록을 렌더한다:
   ```tsx
   {!result.isCorrect && (() => {
     const entry = getRemediationEntry(result.mistakeTag);
     return (
       <div className="space-y-2 rounded-lg border border-border bg-surface-muted p-3">
         <p className="text-xs font-medium text-accent">이렇게 대응하세요</p>
         <Prose text={entry.message} size="sm" />
         <ul className="flex flex-col gap-1.5">
           {entry.bullets.map((b) => (
             <li key={b} className="flex gap-2 text-sm leading-relaxed text-muted">
               <span aria-hidden="true" className="text-accent">·</span>{b}
             </li>
           ))}
         </ul>
         {entry.links && entry.links.length > 0 && (
           <ul className="flex flex-wrap gap-2">
             {entry.links.map((link) => (
               <li key={link.url}>
                 <a href={link.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
                   {link.label} ↗
                 </a>
               </li>
             ))}
           </ul>
         )}
       </div>
     );
   })()}
   ```
   (IIFE는 예시일 뿐 — 상단에서 `const entry = ...`를 뽑아 써도 된다.)
3. 정답 문항(`result.isCorrect === true`)은 `explanation`만, 대응 블록 없음.
4. 리뷰 `<li>`의 `key`는 기존대로 `` `${result.typeId}-${result.contentId}` ``. 삭제되는 섹션의 `` `${typeId}-remediation-${index}` `` 키도 함께 사라진다.
5. `explanation` 렌더도 `<HighlightedText>` → `<Prose text={result.explanation} size="sm" />`로 바꾼다(문단 분리 혜택). `HighlightedText`가 하던 `**` 강조는 `Prose` → `renderInlineMarkup`이 그대로 처리한다.

### `src/app/result/page.test.tsx` 갱신

- "대응 방안" `<h2>` 섹션을 검사하던 케이스: `getByText("대응 방안")`을 제거하고, 대신 "이렇게 대응하세요"가 오답 문항 `<li>` 안에 있는지로 바꾼다.
- `getAllByText(new RegExp(EXPERIENCE_TYPE_LABELS.jeonse))` 류 라벨 카운트: 대응 방안 섹션이 사라지면서 해당 유형 라벨 노출 횟수가 하나 줄어든다(막대그래프 + 리뷰 `<li>` = 2). 실제 렌더를 확인해 기대값을 맞춘다.
- "대응 방안은 짧은 불릿 목록과 공식 링크(새 탭)로 렌더된다": 불릿 텍스트·링크 `href`/`target="_blank"`/`rel="noopener noreferrer"` 검증은 유지하되, 그 불릿/링크가 해당 오답 유형 리뷰 `<li>` **안쪽**에 있는지(DOM 포함관계) 추가 검증.
- "**로 감싼 핵심 문구만 강조" 케이스: 계속 **정답 결과**(`i === 0`, `isCorrect: true`)를 대상으로 두어 대응 블록의 `<strong>`과 셀렉터가 충돌하지 않게 한다. 픽스처에서 i=0을 정답으로 유지.
- 신규: 정답 결과 `<li>`에는 "이렇게 대응하세요"·대응 불릿이 없다.
- 신규: 오답 결과의 대응 블록이 그 문항(`{index+1}번 · {라벨}`) `<li>` 안에 위치한다.
- `completeResults()` 등 기존 픽스처 헬퍼는 최대한 재사용한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다. **`result/page.test.tsx` 전체 + 프로젝트 전체가 통과해야 한다.**
2. `npm run dev`로 세션을 한 번 완주해 `/result`를 연다:
   - 오답 문항 카드 안에 바로 "이렇게 대응하세요" + 불릿 + 공식 링크가 붙어 있다.
   - 화면에 별도 "대응 방안" 섹션이 없다.
   - 정답 문항은 설명만 있다.
3. 체크리스트:
   - 독립 "대응 방안" `<section>`을 완전히 제거했는가?
   - 링크에 `target="_blank" rel="noopener noreferrer"`가 유지되는가?
   - `getRemediationEntry` / `remediation.ts`를 수정하지 않았는가? (카피 정리는 step12)
4. 결과에 따라 `phases/10-intro-modals-and-readability/index.json`의 `step: 10`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `src/data/remediation.ts`를 이 step에서 수정하지 마라. 이유: 카피 축약/재작성은 step12에서 데이터 테스트와 함께 다룬다. 이 step은 렌더 구조만 바꾼다.
- 정답 문항에 대응 블록을 렌더하지 마라. 이유: `getRemediationEntry(undefined)`는 기본 문구를 주므로 정답에도 뭔가 붙어버린다 — `!result.isCorrect` 가드를 반드시 둔다.
- `EXPERIENCE_TYPE_LABELS` 노출 자체를 없애지 마라. 이유: 결과 페이지에서 유형명 노출은 ADR-016으로 허용된 것이고, 오답 원인을 유형과 잇는 학습 목적이다.
- 링크의 `rel="noopener noreferrer"`를 빼지 마라. 이유: 외부 탭 보안.
- `result/page.test.tsx` 외의 테스트를 깨뜨리지 마라.
