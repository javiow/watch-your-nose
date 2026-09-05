# Step 1: experience-intro-data

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ADR.md`의 ADR-004 (체험 유형·유형 목록을 체험 전/중에 사전 노출하지 않는다), ADR-005 (피해자 관점만)
- `/src/data/experience-format.ts` (전체) — `EXPERIENCE_FORMAT: Record<ExperienceTypeId, ExperienceFormatMeta>` 패턴. 이 파일과 같은 스타일로 만든다.
- `/src/data/experience-format.test.ts` (전체) — 특히 `formatLabel`이 `EXPERIENCE_TYPE_LABELS` 값과 겹치지 않는지 검사하는 가드레일 테스트. 같은 패턴을 이 step에서 더 강하게 만든다.
- `/src/data/experience-types.ts` — `EXPERIENCE_TYPE_LABELS`(결과 페이지 전용 유형명: 보이스피싱 / 케이스 조사 / 전세매물 / 사기 판별 카드)
- `/src/types/experience.ts` — `ExperienceTypeId` 유니온(`"voice-phishing" | "case-investigation" | "jeonse" | "fraud-judgment"`)
- `/src/data/difficulty.ts` — 데이터 파일 + 인터페이스 공존 스타일 참고

## 배경

각 체험은 지금 시작 화면에서 한 줄 힌트(`EXPERIENCE_FORMAT[...].hint`, 예: "듣고 바로 답해보세요")만 보여주고 바로 시작한다. 사용자가 "지금 무슨 상황이고 뭘 해야 하는지 모르겠다"고 했다. step2에서 만들 시작 전 모달(`IntroDialog`)에 채울, 유형별 **상황 설명 + 할 일 목록** 카피를 담는 데이터 파일을 만든다.

`EXPERIENCE_FORMAT`에 필드를 더하지 않고 **별도 파일**을 만드는 이유: `EXPERIENCE_FORMAT`의 필드는 짧은 길이 예산(`hint` 5~10자 등)과 전용 가드레일 테스트가 걸려 있어 긴 상황 문장이 어울리지 않는다. `ExperienceModule` 인터페이스(`src/types/experience.ts`)에도 넣지 않는다 — 오케스트레이션은 레지스트리만 순회한다는 원칙(ADR-004) 때문이며, 인트로 카피는 각 체험 컴포넌트가 로컬에서 import한다.

## 작업

### 1. `src/data/experience-intro.ts` 신규

```ts
import type { ExperienceTypeId } from "@/types/experience";

export interface ExperienceIntroMeta {
  /** 지금 어떤 상황에 놓였는지. \n\n로 구분된 2개 정도의 짧은 문단. 사기 유형명 금지. */
  situation: string;
  /** 이번 체험에서 사용자가 할 일. 명령형 3~4개. */
  task: string[];
}

export const EXPERIENCE_INTRO: Record<ExperienceTypeId, ExperienceIntroMeta> = { ... };
```

### 2. 카피 내용 (초안 — 팀이 다듬을 수 있음, 단 제약은 지켜라)

톤: 담담하게 "무슨 일이 벌어지고 있는지"를 묘사. **사기 유형명(보이스피싱·전세사기·깡통전세·스미싱·메신저피싱·로맨스스캠·몸캠 등)이나 `EXPERIENCE_TYPE_LABELS` 값(보이스피싱/케이스 조사/전세매물/사기 판별 카드)을 쓰지 마라.** 정답을 암시하지 마라("이건 사기입니다" 류 금지).

- **`voice-phishing`**
  - `situation`: "모르는 번호로 전화가 걸려 옵니다. 상대는 공공기관이나 금융회사 직원이라고 자신을 소개합니다.\n\n통화는 자동으로 이어집니다. 상대의 말을 듣고 매 순간 어떻게 반응할지 고르세요."
  - `task`: ["상대의 말을 끝까지 들어본다", "개인정보·계좌·앱 설치를 요구하는지 살핀다", "각 순간에 할 대답을 고른다"]
- **`case-investigation`**
  - `situation`: "계약을 앞둔 매물 하나가 있습니다. 계약 전에 이 건을 조사할 수 있습니다.\n\n조사에는 예산(포인트)이 있습니다. 서류를 열람하거나 관계자에게 질문할 때마다 포인트가 듭니다. 조사를 많이 할수록 단서는 늘지만 예산이 줄고, 너무 아끼면 핵심 단서를 놓칩니다."
  - `task`: ["예산 안에서 필요한 서류를 골라 열람한다", "서류에서 이상한 부분을 눌러 증거로 등록한다", "관계자에게 질문해 말과 서류가 맞는지 본다", "조사한 내용을 근거로 계약 여부를 판단한다"]
- **`jeonse`**
  - `situation`: "골목에 매물 다섯 곳이 있습니다. 각 집의 서류를 확인하고 계약해도 될지 판정합니다.\n\n매물을 클릭하면 바로 들어갑니다. 원하면 방향키로 걸어가 붉은 문 앞에 서도 됩니다."
  - `task`: ["매물을 클릭해 서류를 연다", "보증금·시세·등기 등 서류를 읽는다", "위험 신호가 있으면 O, 없으면 X로 판정한다", "다섯 곳을 모두 판정한다"]
- **`fraud-judgment`**
  - `situation`: "짧은 상황 카드가 연달아 나옵니다. 문자, 메신저 대화, 안내문 같은 장면입니다.\n\n각 카드를 보고 곧바로 판정합니다."
  - `task`: ["카드의 상황을 읽는다", "사기인지 정상인지 바로 고른다", "다음 카드로 넘어간다"]

### 3. `src/data/experience-intro.test.ts` 신규

- 모든 `ExperienceTypeId` 키에 엔트리가 있다(레지스트리 키와 1:1). `Object.keys(EXPERIENCE_INTRO)`를 `EXPERIENCE_FORMAT` 키와 비교.
- 각 엔트리: `situation.trim().length > 0`, `task.length >= 3`, `task`의 모든 항목이 비어있지 않다.
- **ADR-004 가드레일**: 모든 `situation`과 모든 `task` 항목 문자열이
  - `Object.values(EXPERIENCE_TYPE_LABELS)` 중 어떤 것도 부분 문자열로 포함하지 않는다.
  - 정규식 `/전세사기|보이스피싱|피싱|스미싱|깡통전세|로맨스\s?스캠|몸캠|메신저피싱/`에 매치되지 않는다.
- `situation`에 `\n\n`가 들어간 경우 split 결과 문단이 2개 이상이고 각 문단이 비어있지 않다(형식 확인, 전 유형 필수는 아님).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트:
   - `experience-intro.ts`가 `src/data/`에 있고 `EXPERIENCE_FORMAT`과 같은 형태(`Record<ExperienceTypeId, ...>`)인가?
   - `src/types/experience.ts`의 `ExperienceModule`이나 `src/lib/registry.ts`를 건드리지 않았는가?
   - 카피에 사기 유형명·유형 라벨·정답 암시가 없는가?
3. 결과에 따라 `phases/10-intro-modals-and-readability/index.json`의 `step: 1`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `src/types/experience.ts`의 `ExperienceModule` 인터페이스에 필드를 추가하지 마라. 이유: 오케스트레이션(홈/세션/결과)은 레지스트리만 순회해야 하며 프레젠테이션 카피는 플러그인 계약에 들어가면 안 된다(ADR-004).
- `EXPERIENCE_FORMAT`에 필드를 끼워넣지 마라. 이유: 짧은 길이 예산과 전용 가드레일이 있는 별개 관심사다.
- 카피에서 사기 유형이나 정답을 드러내지 마라. 이유: 사용자는 사전 안내 없이 상황을 마주해야 한다(ADR-004).
- 기존 테스트를 깨뜨리지 마라.
