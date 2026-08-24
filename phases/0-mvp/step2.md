# Step 2: experience-voice-phishing

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/docs/UI_GUIDE.md`
- `src/types/experience.ts`, `src/lib/registry.ts`, `src/lib/scoring.ts` (step1에서 생성됨)

이전 step에서 만들어진 `ExperienceModule`/`ModuleResult`/`DialogueNode` 타입과 `registry.ts`의 등록 방식을 꼼꼼히 읽고, 그 설계를 따라 작업하라.

## 작업

보이스피싱 체험 유형을 구현한다.

1. `src/data/voice-phishing.ts`: 시나리오 최소 2개를 채운다 — **사기 시나리오 1개 이상 + 정상(스팸 아닌 진짜) 통화 시나리오 1개 이상**. `DialogueNode` 기반 분기 대화로 구성하되, 이 스캐폴딩에서는 시나리오당 2~4턴 정도의 짧은 분량으로 충분하다(실제 분량 확장은 담당 팀원 재량 — `docs/ADR.md` 참고). 콘텐츠는 실제 보이스피싱 사례를 참고해 각색하되, 실명 기관명·개인정보는 쓰지 않고 가상화한다 (예: "OO은행" 대신 "△△저축은행" 같은 가상 기관명). **항상 사용자가 전화를 받는 피해자 시점으로만 작성한다** — 가해자가 어떻게 접근하면 성공하는지를 알려주는 식의 "효과적인 사기 스크립트"가 되지 않도록, 각 대사는 방어자가 판단·대응하는 데 필요한 만큼만 담는다(`docs/ADR.md` ADR-005).
2. `src/components/experiences/VoicePhishingExperience.tsx` (`"use client"`):
   - props: `content: VoicePhishingScenario`, `onComplete: (result: ModuleResult) => void`.
   - 턴마다 상대방 대사 + 선택지를 보여주고, 사용자가 선택하면 "다음" 버튼이 활성화되며, **사용자가 "다음"을 눌러야** 다음 턴/최종 판정으로 넘어간다. 선택 직후 정답/오답 피드백은 절대 보여주지 않는다.
   - 채점 규칙: **사기 시나리오에서 거절/전화 끊기 선택 = 정답. 정상 시나리오에서 거절/전화 끊기 선택 = 오답** ("무조건 거절" 패널티). 오답일 때 `mistakeTag`는 `"blind-refusal"`로 설정.
   - 방어 로직: 선택지의 `next` 노드 참조가 존재하지 않는 경우(데이터 오타 등) 크래시시키지 말고 그 시점에서 시나리오를 종료 처리(최종 판정으로 진행)한다.
3. `src/lib/registry.ts`에 이 모듈을 `EXPERIENCE_MODULES`에 등록한다 (`typeId: "voice-phishing"`, `contentPool`, `pickRandomContent()`).

**TDD 필수**: `VoicePhishingExperience`의 채점 로직(정상 케이스 거절 시 오답, 사기 케이스 거절 시 정답)에 대한 테스트를 먼저 작성한 뒤 구현하라.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `docs/ARCHITECTURE.md`의 `components/experiences/`, `data/` 구조를 따르는가?
   - `docs/ADR.md` ADR-002(선택지 기반 분기, LLM 자유대화 아님) 위반 없는가?
3. 유닛 테스트로 다음을 검증한다: 정상 케이스에서 매 턴 "거절"만 선택 시 `isCorrect: false`, 사기 케이스에서 "거절" 선택 시 `isCorrect: true`, 존재하지 않는 `next` 참조를 만나도 크래시 없이 시나리오가 종료되는지.
4. 결과에 따라 `phases/0-mvp/index.json`의 `step: 2` 항목을 업데이트한다.

## 금지사항

- 선택 직후 정답/오답을 보여주는 즉시 피드백 UI를 넣지 마라. 이유: 제품 결정 — 결과는 `/result`에서만 공개.
- 화면의 사용자 노출 텍스트에 "보이스피싱"이라는 유형명을 직접 쓰지 마라. 이유: `docs/ADR.md` ADR-004 — 유형을 사전 노출하지 않는다.
- 실제 기관명(은행명, 정부기관명 등)이나 실존 인물/사건을 그대로 쓰지 마라. 이유: 법적/명예훼손 리스크.
- 가해자 관점 콘텐츠(예: "성공적인 사기 수법" 튜토리얼처럼 읽히는 대사)를 만들지 마라. 이유: `docs/ADR.md` ADR-005.
- 대사·선택지 텍스트를 렌더링할 때 `dangerouslySetInnerHTML`을 쓰지 마라. 이유: XSS 방지, `CLAUDE.md` 보안 규칙.
- 기존 테스트를 깨뜨리지 마라.
