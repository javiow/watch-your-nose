# Step 4: wire-glossary-jeonse

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/src/data/glossary.ts` (step0) — `GLOSSARY_TERMS`에 등록된 정확한 키 목록
- `/src/components/ui/GlossaryTermText.tsx` (step2)
- `/src/data/jeonse.ts` (전체) — `JeonseField` = `[label, value, status]` 튜플 구조
- `/src/components/experiences/jeonse/HouseDialogPanel.tsx` (전체)
- `/src/types/experience.ts`의 `JeonseField`/`JeonseHouse` 정의

## 배경

전세매물 서류(`JeonseHouse.fields`)에 근저당권, 선순위 보증금, 전세가율, 전입세대열람, 확정일자, 신탁등기, 신탁원부, 수탁자, 공동담보, 가압류 같은 용어가 설명 없이 등장한다. 이 step에서 그 용어들에 `{{term:...}}` 마커를 심고 렌더 지점을 `GlossaryTermText`로 바꾼다.

## 작업

### 1. `src/data/jeonse.ts`

`grep -n "근저당\|선순위 보증금\|전세가율\|전입세대열람\|확정일자\|신탁등기\|신탁원부\|수탁자\|수탁사\|공동담보\|가압류" src/data/jeonse.ts`로 모든 `fields` 배열의 `value`(각 튜플의 두 번째 요소) 안 출현 지점을 찾아라.

각 출현 지점에서 용어를 `{{term:용어}}`로 감싼다. "수탁사"로 표기된 곳은 `{{term:수탁사}}`로 그대로 두면 된다(step0에서 만든 별칭 테이블이 "수탁자" 정의로 해석한다). `label`(튜플의 첫 번째 요소, 예: `"등기부등본"`, `"선순위 보증금"`)이나 `explain`/`lesson`/`reason` 필드에는 마커를 넣지 마라 — 이 필드들은 결과 페이지 전용이거나 스포일러이므로 이 step의 대상이 아니다. 오직 체험 중 노출되는 `fields[].value`만 대상이다.

### 2. `src/components/experiences/jeonse/HouseDialogPanel.tsx`

`import { GlossaryTermText } from "@/components/ui/GlossaryTermText";`를 추가한다.

- `house.fields.map(([label, value, status]) => ...)` 안, `<p className="mt-1 text-sm leading-relaxed text-muted">{value}</p>`를 `<p className="mt-1 text-sm leading-relaxed text-muted"><GlossaryTermText text={value} /></p>`로 바꾼다.
- "전세가율" 통계 라벨(`<p className="text-[10px] uppercase tracking-wide text-subtle">전세가율</p>`)도 `<GlossaryTermText text="{{term:전세가율}}" />`로 바꿔, 이 라벨 자체에도 탭 설명이 붙게 한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `grep -c "{{term:" src/data/jeonse.ts`가 1 이상인가?
   - `label`, `explain`, `lesson`, `reason` 필드에는 마커가 없는가?
3. 결과에 따라 `phases/9-glossary-and-visual-results/index.json`의 `step: 4`를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `fields[].label`, `explain`, `lesson`, `reason` 필드에 마커를 넣지 마라. 이유: `label`은 짧은 항목명이라 굳이 필요 없고(전세가율 라벨은 위에서 별도로 처리), 나머지 셋은 결과 페이지 전용/스포일러성 필드다.
- `src/data/voice-phishing.ts`, `src/data/case-investigation.ts`, `src/data/fraud-judgment.ts`를 수정하지 마라. 이유: 각각 step3, step5, step6에서 다룬다.
- 기존 테스트를 깨뜨리지 마라.
