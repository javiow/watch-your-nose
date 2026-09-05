# Step 16: remediation-bullets-and-links

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/src/data/remediation.ts` (전체) — 현재 `REMEDIATION_COPY: Record<string, string>` + `getRemediation`/`getRemediationsForResults`
- `/src/data/remediation.test.ts` (전체) — 기존 9개 케이스가 `getRemediation(tag)`가 문자열을 반환한다고 가정
- `/src/app/result/page.tsx` — `getRemediation`을 호출하는 곳(step17에서 렌더를 바꾸므로 이 step에서는 result 페이지를 건드리지 마라)

## 배경

대응 방안 카피가 긴 문단이라 읽기 힘들고("텍스트가 많다" 피드백), 실제 신고·확인 채널 링크가 없다. 이 step은 데이터 구조만 바꾼다 — 짧은 불릿 배열 + 공식 링크. 결과 페이지 렌더 변경은 step17.

**하위 호환 필수**: `getRemediation(tag): string`의 시그니처와 반환 타입(문자열)은 그대로 유지한다. 기존 9개 테스트와 다른 호출부가 이 계약에 의존한다.

## 작업

### 1. `src/data/remediation.ts` 재구조화

```ts
export interface RemediationLink {
  label: string;
  url: string;
}

export interface RemediationEntry {
  message: string;   // 1문장 요약. getRemediation()이 이 값을 반환한다.
  bullets: string[];  // 기억할 핵심 2~3개. 각 항목 20자 내외.
  links?: RemediationLink[];
}

export const DEFAULT_REMEDIATION_MESSAGE: string; // 기존 문자열 그대로 유지
export const REMEDIATION_ENTRIES: Record<string, RemediationEntry>; // 기존 REMEDIATION_COPY를 대체
export function getRemediationEntry(mistakeTag: string | undefined): RemediationEntry;
export function getRemediation(mistakeTag: string | undefined): string; // = getRemediationEntry(tag).message
export function getRemediationsForResults(results: ModuleResult[]): string[]; // 기존과 동일 동작(문자열 배열)
```

- `getRemediationEntry(undefined)` 또는 매핑에 없는 태그 → `{ message: DEFAULT_REMEDIATION_MESSAGE }` (bullets 없음, links 없음).
- `getRemediation(tag)`는 반드시 `getRemediationEntry(tag).message`를 반환한다.
- 기존 `REMEDIATION_COPY`라는 이름을 외부에서 import하는 곳이 없으므로(확인: `grep -rn "REMEDIATION_COPY" src/`) 이름을 `REMEDIATION_ENTRIES`로 바꿔도 된다.

### 2. 6개 mistakeTag 내용

각 태그의 `message`는 기존 `REMEDIATION_COPY`의 첫 문장을 짧게 다듬어 쓰고, `bullets`는 기존 문단에서 핵심 행동 2~3개를 20자 내외로 뽑아낸다. `links`는 아래 표를 따른다(모두 실접속 확인된 공식 URL).

| mistakeTag | links |
|---|---|
| `blind-refusal` | 금융감독원 보이스피싱지킴이 · `https://www.fss.or.kr/fss/main/sub1voice.do?menuNo=200012` |
| `missed-scam-signal` | 경찰청 사이버범죄 신고시스템(ECRM) · `https://ecrm.police.go.kr` / KISA 118 사이버민원 · `https://www.kisa.or.kr/303` |
| `missed-lease-fraud-signal` | 인터넷등기소 · `https://www.iros.go.kr` / 주택도시보증공사(HUG) · `https://www.khug.or.kr` |
| `fell-for-scam` | 금융감독원 보이스피싱지킴이 · `https://www.fss.or.kr/fss/main/sub1voice.do?menuNo=200012` / 경찰청 사이버범죄 신고시스템(ECRM) · `https://ecrm.police.go.kr` |
| `false-alarmed-safe-case` | 금융감독원 파인(통합 민원·상담) · `https://fine.fss.or.kr` |
| `missed-realestate-investigation-signal` | 인터넷등기소 · `https://www.iros.go.kr` / 주택도시보증공사(HUG) · `https://www.khug.or.kr` |

### 3. `src/data/remediation.test.ts` 갱신

- 기존 9개 케이스: `getRemediation(tag)`가 여전히 문자열을 반환하고 `DEFAULT_REMEDIATION_MESSAGE`와의 관계도 그대로여야 한다. 필요하면 기대 문자열만 새 `message`로 갱신한다.
- 신규 케이스:
  - 6개 태그 각각 `getRemediationEntry(tag).bullets`가 2~3개이고 각 항목 길이가 25자 이하다.
  - 6개 태그 각각 `getRemediationEntry(tag).links`가 1개 이상이고, 각 `url`이 `https://`로 시작한다.
  - `getRemediationEntry(undefined).links`는 `undefined`(기본 문구엔 링크 없음), `getRemediationEntry(undefined).message === DEFAULT_REMEDIATION_MESSAGE`.
  - 모든 태그에서 `getRemediation(tag) === getRemediationEntry(tag).message` (회귀 방지).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `getRemediation`/`getRemediationsForResults`의 시그니처·반환 타입이 그대로인가?
   - 표의 URL을 오타 없이 그대로 넣었는가?
   - `src/app/result/page.tsx`를 수정하지 않았는가? (그건 step17)
3. 결과에 따라 `phases/9-glossary-and-visual-results/index.json`의 `step: 16`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `getRemediation(tag)`의 반환 타입을 문자열 외의 것으로 바꾸지 마라. 이유: 다른 호출부와 9개 기존 테스트가 문자열 계약에 의존한다.
- 표에 없는 URL을 임의로 추가하지 마라(특히 "안심전세포털" 같은 특정 하위 페이지). 이유: 실접속 검증이 안 된 링크를 사용자에게 노출하면 안 된다.
- `src/app/result/page.tsx`를 수정하지 마라. 이유: 렌더 변경은 step17.
- 기존 테스트를 (갱신이 명시된 `remediation.test.ts` 외에는) 깨뜨리지 마라.
