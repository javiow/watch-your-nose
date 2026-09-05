# Step 3: wire-glossary-voice-phishing

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/src/data/glossary.ts` (step0) — `GLOSSARY_TERMS`에 등록된 정확한 키 목록
- `/src/components/ui/GlossaryTermText.tsx` (step2) — `{{term:키}}` / `{{term:키|표시텍스트}}` 마커 문법
- `/src/data/voice-phishing.ts` (전체) — `DialogueNode.line` 필드 구조
- `/src/components/experiences/ChatBubble.tsx` (전체)
- `/src/types/experience.ts`의 `DialogueNode`/`DialogueChoice` 정의

## 배경

보이스피싱 대화 시나리오의 대사(`DialogueNode.line`)에 "이상거래탐지", "대포통장", "자금세탁", "명의도용", "원격지원 앱", "대환대출" 같은 용어가 설명 없이 등장한다. 이 용어들이 등장하는 모든 `line`에 `{{term:...}}` 마커를 심고, 화면에 렌더되는 지점을 `GlossaryTermText`로 바꾼다.

## 작업

### 1. `src/data/voice-phishing.ts`

`grep -n "이상거래탐지\|대포통장\|자금세탁\|명의도용\|원격지원 앱\|대환대출" src/data/voice-phishing.ts`로 모든 출현 지점을 직접 찾아라(문서에 적힌 줄 번호를 믿지 말고 지금 코드 기준으로 다시 찾아라 — 이전 phase 작업으로 줄 번호가 바뀌었을 수 있다).

각 출현 지점에서 해당 용어를 `{{term:용어}}`로 감싼다. 예: `"환불 처리를 위해 원격지원 앱을 하나 설치해주시면..."` → `"환불 처리를 위해 {{term:원격지원 앱}}을 하나 설치해주시면..."`. 조사(을/를/이/가 등)는 마커 **밖**에 남겨둔다.

`DialogueChoice.text`/`spokenText`(선택지 버튼 문구)에는 마커를 넣지 마라 — 이 step은 `DialogueNode.line`(상대방 대사)만 대상으로 한다.

### 2. `src/components/experiences/ChatBubble.tsx`

`import { GlossaryTermText } from "@/components/ui/GlossaryTermText";`를 추가하고, `{text}`로 순수 렌더하던 부분을 `<GlossaryTermText text={text} />`로 바꾼다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `grep -c "{{term:" src/data/voice-phishing.ts`가 1 이상인가?
   - `src/data/voice-phishing.test.ts`(존재한다면)가 그대로 통과하는가? (콘텐츠 구조 검증 테스트는 정확 문자열 비교가 아니어야 정상이다 — 만약 실패한다면 그 테스트가 `line`의 정확한 문자열을 assert하고 있다는 뜻이니, 마커 삽입 후의 실제 문자열로 테스트 기대값을 갱신해라)
   - `DialogueChoice.text`/`spokenText`에는 마커가 없는가?
3. 결과에 따라 `phases/9-glossary-and-visual-results/index.json`의 `step: 3`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `DialogueChoice.text`/`spokenText`(선택지 버튼 문구)에는 마커를 넣지 마라. 이유: 버튼 라벨은 짧고 즉각적이어야 하며, 이 step의 대상은 상대방 대사뿐이다.
- `src/data/jeonse.ts`, `src/data/case-investigation.ts`, `src/data/fraud-judgment.ts`를 수정하지 마라. 이유: 각각 step4~6에서 다룬다.
- `glossary.ts`에 없는 용어로 마커를 만들지 마라. 이유: `GlossaryTermText`는 미존재 키를 조용히 무시하므로, 오타가 있으면 `(?)` 버튼이 그냥 안 뜨는 방식으로 조용히 실패한다 — 마커를 넣기 전 `glossary.ts`의 키 철자와 정확히 대조하라.
- 기존 테스트를 깨뜨리지 마라(문자열 정확 비교 테스트는 갱신, 그 외는 그대로 통과해야 한다).
