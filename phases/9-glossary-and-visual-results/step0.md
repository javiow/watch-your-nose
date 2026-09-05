# Step 0: glossary-data

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ADR.md`
- `/src/data/difficulty.ts` — 이 phase에서 참고할 "정적 데이터 + 짧은 한글 설명" 파일 패턴의 기존 예시
- `/src/types/experience.ts`

## 배경

체험 콘텐츠(보이스피싱 대사, 전세매물 서류, 케이스 조사 등기부, 사기 판별 카드)에 근저당권·전세가율·이상거래탐지 같은 금융·부동산 전문 용어가 설명 없이 그대로 등장한다는 피드백을 받았다. 이 phase는 그 용어들을 탭하면 뜨는 짧은 설명("인라인 (?) 툴팁")으로 보강한다.

이 step은 그 용어 사전 데이터만 만든다. 툴팁 UI 컴포넌트(step1), 마커 파서(step2), 실제 콘텐츠에 마커 삽입(step3~6)은 이후 step에서 처리한다 — 이 step에서는 `src/components/`, `src/data/voice-phishing.ts`, `src/data/jeonse.ts`, `src/data/case-investigation.ts`, `src/data/fraud-judgment.ts`를 건드리지 마라.

추가 피드백: "글이 너무 많다"는 지적이 있었다. 정의 문장은 반드시 **1문장, 70자 이내**로 짧게 쓴다. "왜 위험 신호가 되는지"까지 한 문장에 압축해라.

## 작업

`src/data/glossary.ts`를 신규 생성한다.

```ts
export interface GlossaryEntry {
  term: string;       // 문장 안에 실제로 노출되는 용어 원문. GLOSSARY_TERMS의 key와 동일해야 한다.
  definition: string; // 1문장, 70자 이내. "무엇인지 + 왜 위험 신호인지"를 압축.
}

export const GLOSSARY_TERMS: Record<string, GlossaryEntry>;
export function resolveGlossaryKey(key: string): GlossaryEntry | undefined;
```

`GLOSSARY_TERMS`에 아래 20개 키를 모두 포함한다: `근저당권`, `선순위 보증금`, `전세가율`, `전입세대열람`, `확정일자`, `신탁등기`, `신탁원부`, `수탁자`, `공동담보`, `가압류`, `갑구`, `을구`, `채권최고액`, `이상거래탐지`, `대포통장`, `자금세탁`, `명의도용`, `원격지원 앱`, `대환대출`, `WHOIS 조회`, `HUG`.

정의 예시(톤 참고용, 그대로 써도 됨):
- 근저당권: `"돈을 못 갚으면 집이 경매로 넘어갈 수 있게 은행이 걸어둔 담보. 금액이 클수록 내 보증금이 위험해요."`
- 전세가율: `"매매가 대비 전세금 비율. 100%에 가까우면 '깡통전세' 위험이 커요."`
- 이상거래탐지: `"평소와 다른 입출금을 은행이 자동으로 잡아내는 시스템."`

나머지 17개도 같은 원칙(1문장, 70자 이내, 무엇인지+왜 위험한지)으로 직접 작성한다.

`resolveGlossaryKey(key)`는 `GLOSSARY_TERMS[key]`를 우선 반환하고, 없으면 별칭 테이블을 거쳐 재조회한다. 별칭 테이블에는 최소 `"수탁사" → "수탁자"`를 포함한다(콘텐츠에서 "수탁사"라는 표기가 쓰이는 곳이 있다). 존재하지 않는 키는 `undefined`를 반환한다(에러를 던지지 마라 — 이후 step에서 오타 방어용으로 쓰인다).

TDD로 먼저 `src/data/glossary.test.ts`를 작성해 레드 상태를 확인한 뒤 구현한다. 최소한 아래를 검증한다:

- `GLOSSARY_TERMS`의 모든 항목에서 `term`/`definition`이 비어있지 않다.
- 모든 `definition`의 길이가 70자 이하다.
- 각 키는 자기 항목의 `term`과 문자열이 일치한다.
- `resolveGlossaryKey("근저당권")`은 `GLOSSARY_TERMS["근저당권"]`을 그대로 반환한다.
- `resolveGlossaryKey("수탁사")`는 `GLOSSARY_TERMS["수탁자"]`를 반환한다(별칭 해석).
- `resolveGlossaryKey("존재하지않는키")`는 `undefined`를 반환한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `src/components/`, `src/data/voice-phishing.ts`, `src/data/jeonse.ts`, `src/data/case-investigation.ts`, `src/data/fraud-judgment.ts` 중 어떤 것도 수정하지 않았는가? (`git status`로 확인)
   - 모든 `definition`이 실제로 70자 이내인가?
3. 결과에 따라 `phases/9-glossary-and-visual-results/index.json`의 `step: 0`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `src/components/` 아래 어떤 파일도 만들거나 수정하지 마라. 이유: 툴팁 UI는 step1~2에서 다룬다.
- 콘텐츠 데이터 파일(`voice-phishing.ts`/`jeonse.ts`/`case-investigation.ts`/`fraud-judgment.ts`)에 `{{term:...}}` 마커를 삽입하지 마라. 이유: 그건 step3~6의 작업이다.
- 정의 문장을 2문장 이상으로 늘리지 마라. 이유: "텍스트가 너무 많다"는 피드백에 대한 직접적 대응이 이 phase의 목적이다.
- 기존 테스트를 깨뜨리지 마라.
