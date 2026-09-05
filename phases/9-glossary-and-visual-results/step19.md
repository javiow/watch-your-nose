# Step 19: case-investigation-question-limit-hint

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/src/components/experiences/CaseInvestigationExperience.tsx` (전체) — `handleSubmitQuestion`의 `chatLog.length >= MAX_NPC_QUESTIONS` 분기, 그리고 화면 하단 `questionLimitReached ? (<p>질문 횟수를 모두 사용했어요.</p>) : ...` 렌더 부분
- `/src/components/experiences/CaseInvestigationExperience.test.tsx` (전체) — 위 문자열을 assert하는 테스트가 있는지 확인
- `/src/lib/npc-chat.ts`의 `MAX_NPC_QUESTIONS`

## 배경

케이스 조사에서 NPC 질문 횟수를 다 쓰면 "질문 횟수를 모두 사용했어요."만 뜨고, 그래서 뭘 해야 하는지 안내가 없다. 다음 행동을 한 줄 덧붙인다.

## 작업

`src/components/experiences/CaseInvestigationExperience.tsx`에서 `"질문 횟수를 모두 사용했어요."` 문자열이 나오는 두 지점을 모두 아래로 바꾼다:

```
질문 횟수를 모두 사용했어요. 지금까지 확인한 내용과 서류를 바탕으로 판단해보세요.
```

- `handleSubmitQuestion` 안의 `setInputError("질문 횟수를 모두 사용했어요.")`
- 하단 렌더의 `<p ...>질문 횟수를 모두 사용했어요.</p>`

두 곳이 같은 문구를 쓰도록 상수로 뽑아도 되고, 문자열을 그대로 두 곳에 써도 된다(재량).

`CaseInvestigationExperience.test.tsx`에서 옛 문자열을 정확히 매칭하던 테스트가 있으면 새 문구에 맞게 갱신한다. 없으면, "질문을 다 쓰면 다음 행동 안내(`/판단해보세요/`)가 보인다"는 케이스를 1개 추가한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 옛 문자열("질문 횟수를 모두 사용했어요."만 있고 뒤 문장이 없는 형태)이 코드에 더 이상 남아있지 않은가? (`grep -n "모두 사용했어요" src/components/experiences/CaseInvestigationExperience.tsx`로 확인 — 나오는 모든 줄에 뒤 문장이 붙어 있어야 함)
   - 다른 체험 컴포넌트나 데이터 파일을 건드리지 않았는가?
3. 결과에 따라 `phases/9-glossary-and-visual-results/index.json`의 `step: 19`를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- step9에서 추가한 `FormatBadge` 관련 코드를 되돌리거나 바꾸지 마라.
- 질문 횟수 제한 로직(`MAX_NPC_QUESTIONS` 비교) 자체를 바꾸지 마라. 이유: 이 step은 문구만 손본다.
- 기존 테스트를 깨뜨리지 마라.
