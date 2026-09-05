# Step 17: result-page-remediation-render

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/src/data/remediation.ts` (step16에서 재구조화됨) — `getRemediationEntry`, `RemediationEntry { message, bullets, links? }`
- `/src/app/result/page.tsx` (step15에서 재구성됨) — 현재 대응 방안 섹션은 `getRemediation` + `HighlightedText` 구조
- `/src/app/result/page.test.tsx` (step15에서 갱신됨)
- `/src/components/ui/HighlightedText.tsx`

## 배경

step16에서 대응 방안 데이터를 `{ message, bullets, links }` 구조로 바꿨다. 이 step은 결과 페이지의 대응 방안 섹션이 그 구조를 렌더하도록 바꾼다: 짧은 요약 캡션 + 불릿 목록 + 공식 링크 칩.

## 작업

### `src/app/result/page.tsx` 대응 방안 섹션

- `getRemediation(result.mistakeTag)` 대신 `getRemediationEntry(result.mistakeTag)`를 쓴다.
- 렌더 구조:
  - `entry.message` → 작은 캡션(옅은 톤) 한 줄. `HighlightedText`는 계속 써도 되고 안 써도 된다(message에 `**` 마커가 없다면 굳이 필요 없음).
  - `entry.bullets` → `<ul>` 짧은 목록. 각 항목 한 줄.
  - `entry.links`가 있으면 → 링크 칩 목록. 각 링크는 `<a href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>`. 새 탭 표시(아이콘/↗ 등)는 재량.
- 기존 유형 라벨(`EXPERIENCE_TYPE_LABELS[result.typeId]`)은 유지한다.
- 새 색상 값 하드코딩 금지 — 링크 칩은 `text-accent`/`bg-accent-soft` 등 기존 토큰 사용.

### `src/app/result/page.test.tsx` 갱신

- 오답 결과(예: `mistakeTag: "missed-lease-fraud-signal"`)를 포함한 완료 상태를 만들고:
  - 해당 태그의 `bullets` 중 하나가 화면에 보인다.
  - `getByRole("link", { name: /인터넷등기소/ })`의 `href`가 `"https://www.iros.go.kr"`, `target`이 `"_blank"`, `rel`에 `"noopener"`가 포함된다.
- 모두 정답인 경우 대응 방안 섹션 자체가 렌더되지 않는다(기존 동작 유지).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 링크에 `rel="noopener noreferrer"`가 빠짐없이 붙었는가?
   - `npm run dev`로 한 세션을 오답이 나오게 완주한 뒤 `/result`에서 불릿·링크 칩이 실제로 보이고, 링크 클릭 시 새 탭으로 해당 공식 사이트가 열리는지 확인했는가?
   - 모두 정답일 때 대응 방안 섹션이 안 뜨는가?
3. 결과에 따라 `phases/9-glossary-and-visual-results/index.json`의 `step: 17`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 외부 링크에 `rel="noopener noreferrer"` 없이 `target="_blank"`를 쓰지 마라. 이유: 탭 탈취(reverse tabnabbing) 방지.
- `src/data/remediation.ts`를 이 step에서 수정하지 마라. 이유: 데이터는 step16에서 확정됐고 이 step은 렌더만 담당한다.
- 게이지/막대/문항별 리뷰 등 step15에서 만든 다른 섹션을 되돌리거나 변경하지 마라.
- 기존 테스트를 (갱신이 명시된 `result/page.test.tsx` 외에는) 깨뜨리지 마라.
