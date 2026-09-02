# Step 0: docs-update

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 기획·아키텍처·설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/PRD.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md` (특히 ADR-002 정적 데이터, ADR-004 유형 비노출·랜덤 선택, ADR-005 피해자 관점 전용, ADR-012 난이도 선택 단계·태깅 후속화)
- `/docs/research/voice-phishing-case-bank/README.md` (사례 뱅크 스키마·원칙)

이 step은 문서만 다룬다. `src/` 코드와 `docs/research/` 아래 사례 뱅크 본문은 이 step에서 전혀 건드리지 않는다(사례 뱅크 갱신은 step1, 태깅·시나리오는 step2~4).

## 배경

ADR-012에서 난이도 선택 메커니즘(`/difficulty` → `SessionProvider.difficulty` → `ExperienceModule.pickRandomContent(difficulty?)` → `pickByDifficulty` 필터)은 넣었지만, 실제 콘텐츠 난이도 태깅은 전세매물(`jeonse`)만 완료하고 나머지 3개 유형은 후속 작업으로 미뤄 뒀다. 이번 phase는 그중 **보이스피싱**을 완료한다:

1. 기존 시나리오 6개(`src/data/voice-phishing.ts`의 `VOICE_PHISHING_SCENARIOS`) 전부에 `difficulty` 부여.
2. 실제 공개 자료 기반으로 사례 뱅크(`docs/research/voice-phishing-case-bank/`)의 빈 카테고리 3종(납치협박형·메신저피싱형·택배배송사칭형)과 정상 통화 패턴 1건을 채운다.
3. 그 근거로 사기 시나리오 3개 + 정상 시나리오 1개를 추가한다.
4. 최종 풀은 **정상 4 + 사기 6 = 10개**. easy/medium/hard 각 난이도에 정상·사기가 모두 1개 이상 존재하도록 배분한다.

난이도 배정 기준(`src/data/difficulty.ts` 정의):

- **easy** = 위험 신호가 뚜렷해 비교적 알아채기 쉬움
- **medium** = 여러 정보를 함께 따져봐야 판단
- **hard** = 겉으로 보이는 것과 실제가 달라 헷갈림

확정된 난이도 배정(참고용 — 실제 필드 반영은 step2~4):

| id | isNormalCase | 난이도 | 비고 |
|---|---|---|---|
| `scam-fake-prosecutor-safe-account` | false | easy | 검찰 사칭 + "안전계좌" 이체 = 가장 유명한 전형 |
| `scam-government-loan-program` | false | medium | 저금리 대환대출 전제로 점진적 정보 요구 에스컬레이션 |
| `scam-refund-remote-app` | false | medium | 환불 전제는 자연스럽고 원격 앱 요구를 종합 판단해야 함 |
| `normal-overseas-payment-alert` | true | medium | 사기처럼 들리나 정상 — 요청 내용(이름·생년월일만)을 따져야 함 |
| `normal-delivery-address-confirm` | true | hard | 반송·회수 압박으로 사기처럼 느껴지나 위험한 요구가 전혀 없음 |
| `normal-sim-reissue-alert` | true | hard | 유심 재발급 차단 통보가 이례적이라 반사적으로 끊으면 오답 |
| `scam-family-emergency-transfer` (신규) | false | easy | 납치협박형 — 가족 사고/납치 빙자 + 즉시 송금 |
| `scam-customs-fee-delivery` (신규) | false | medium | 택배배송사칭형 — 통관/관세 미납 빙자 |
| `scam-messenger-impersonation-giftcard` (신규) | false | hard | 메신저피싱형 — 지인 사칭 + 급전/상품권, 통화 회피 |
| `normal-card-fraud-block` (신규) | true | easy | 정상금융확인형 — 카드사 부정사용 자동 정지 통보, 추가 정보 요구 없음 |

## 작업

아래 3개 문서를 정확히 다음 내용으로 수정한다. 명시된 변경만 반영하라 — 이 문서들은 팀원 여러 명이 참조하는 합의된 설계 기록이다. 기존 항목의 번호·문구는 아래에 지시된 것 외에는 건드리지 않는다.

### 1. `docs/ADR.md` — ADR-013 뒤에 새 항목 추가

파일 맨 끝(ADR-013 트레이드오프 단락 다음)에 아래를 그대로 추가한다:

```markdown

### ADR-014: 보이스피싱 콘텐츠에 난이도 태깅 완료 + 실제 사례 기반 시나리오 4종 확장
**결정**: ADR-012에서 메커니즘만 넣고 미룬 보이스피싱 콘텐츠 난이도 태깅을 이번에 완료한다. 기존 시나리오 6개(`VOICE_PHISHING_SCENARIOS`)에 `difficulty`(`"easy" | "medium" | "hard"`)를 전부 부여하고, 실제 공개 자료(금융감독원 보이스피싱 지킴이·경찰청 사이버수사국·KISA·은행/카드사 공식 보도자료·신뢰할 수 있는 언론 보도)만 근거로 사례 뱅크(`docs/research/voice-phishing-case-bank/`)의 빈 카테고리 3종(납치협박형·메신저피싱형·택배배송사칭형)과 정상 통화 패턴 1건을 채운 뒤, 그 근거로 사기 시나리오 3개 + 정상 시나리오 1개를 추가한다. 최종 풀은 정상 4 + 사기 6 = 10개이며, easy/medium/hard 각 난이도에 정상·사기가 모두 1개 이상 존재하도록 배분해 `pickByDifficulty`가 난이도별로 의미 있는 부분집합에서 랜덤 선택하게 한다. 난이도 배정 기준은 `src/data/difficulty.ts`의 정의(easy=위험 신호가 뚜렷 / medium=여러 정보를 종합해야 판단 / hard=표면 인상과 실제 정답이 어긋남)를 따른다. 사례 뱅크 갱신·시나리오 작성은 `.claude/agents/`의 `voice-phishing-case-researcher` / `voice-phishing-scam-scenario-writer` / `voice-phishing-normal-scenario-writer` 가드레일을 그대로 준수한다(가해자 대사는 노드당 1~2문장, 실제 계좌번호·악성 앱 이름·피싱 URL·구체 범행 절차 재현 금지, 기관/상호명은 "OO은행"식 익명형만, 각 사례에 공개 출처 명시, 실제 대사 verbatim 금지 — ADR-005).
**이유**: ADR-012 트레이드오프에 명시된 "콘텐츠가 태깅될 때까지 난이도 선택이 실질 효과 없음"을 보이스피싱부터 해소한다. 보이스피싱은 선택지 기반 분기라 난이도 판정이 비교적 안정적이고, 사례 뱅크와 전용 에이전트 인프라가 이미 갖춰져 있어 실제 사례 기반 확장을 콘텐츠 안전 원칙을 지키며 할 수 있다.
**트레이드오프**: `src/data/voice-phishing.test.ts`의 하드코딩 카운트(6개 = 정상 3 + 사기 3)를 10개 = 정상 4 + 사기 6으로 갱신해야 한다. 케이스 조사·사기 판별 카드는 여전히 난이도 미태깅으로 남아 전체 풀 랜덤 fallback을 탄다(ADR-012 상태 유지). 난이도 배정값은 도메인 판단이라 팀 리뷰로 조정될 수 있다 — 이 ADR은 배분 구조(각 난이도에 정상·사기 공존)만 고정한다. 사례 뱅크가 늘어도 런타임 연동은 두지 않으며(ADR-002) 시나리오 반영은 수동이다.
```

### 2. `docs/PRD.md`

**2-1. 핵심 기능 5번** — 아래 문장을

> 콘텐츠 풀은 "사기같은 정상 케이스" 2개 + "정상같은 사기 케이스" 2개로 구성해 표면적 인상과 실제 정답이 어긋나도록 설계한다.

다음으로 교체한다:

```markdown
콘텐츠 풀은 "사기같은 정상 케이스"와 "정상같은 사기 케이스"를 섞어 표면적 인상과 실제 정답이 어긋나도록 설계하며(정상 4 + 사기 6, 총 10개), 각 시나리오에 난이도(쉬움/중간/어려움)를 매겨 easy/중간/hard마다 정상·사기가 모두 포함되도록 배분한다.
```

(뒤에 이어지는 "사기 시나리오를 거절하면 정답 …" 채점 문장은 그대로 둔다.)

**2-2. "MVP 제외 사항"** 목록의 아래 항목을

> - 보이스피싱·케이스 조사·사기 판별 카드 콘텐츠의 난이도 태깅 — 이번 범위에서는 전세매물만 난이도별 필터가 실제로 동작하고, 나머지 3개 유형은 전체 콘텐츠에서 랜덤(난이도 태깅은 후속 작업)

다음으로 교체한다:

```markdown
- 케이스 조사·사기 판별 카드 콘텐츠의 난이도 태깅 — 전세매물·보이스피싱은 난이도별 필터가 실제로 동작하고, 이 2개 유형은 아직 전체 콘텐츠에서 랜덤(난이도 태깅은 후속 작업)
```

### 3. `docs/ARCHITECTURE.md`

**3-1. 디렉토리 구조 코드블록** — `data/` 트리의

```
    ├── voice-phishing.ts
```

줄을 다음으로 교체한다:

```
    ├── voice-phishing.ts             # 채팅형 분기 시나리오 10종(정상 4 + 사기 6), easy/medium/hard 태깅
```

**3-2. "패턴" 절** 끝에 아래 불릿을 추가한다:

```markdown
- 보이스피싱 시나리오는 `docs/research/voice-phishing-case-bank/`의 실제 사례 요약(공개 출처 기반, 유형·흐름·심리압박 패턴 수준으로 추상화)을 근거로 작성한다 — 실제 대사·계좌번호·악성 앱 이름·피싱 URL은 옮기지 않는다(ADR-005, ADR-014).
```

**3-3. "엣지 케이스 / 방어 로직" 절**의 아래 불릿을

> - `pickRandomContent(difficulty)`는 해당 난이도로 태깅된 콘텐츠가 없는 풀(태깅이 아예 없는 유형 포함)에서는 전체 풀 랜덤으로 fallback한다 — 이번 범위에서 난이도가 실제 반영되는 유형은 전세매물뿐이고, 나머지 3개 유형의 동작은 난이도 도입 전과 동일하다.

다음으로 교체한다:

```markdown
- `pickRandomContent(difficulty)`는 해당 난이도로 태깅된 콘텐츠가 없는 풀(태깅이 아예 없는 유형 포함)에서는 전체 풀 랜덤으로 fallback한다 — 난이도가 실제 반영되는 유형은 전세매물·보이스피싱이고, 나머지 2개 유형(케이스 조사·사기 판별 카드)의 동작은 난이도 도입 전과 동일하다.
```

**3-4. "엣지 케이스 / 방어 로직" 절** 끝에 아래 항목들을 추가한다:

```markdown
- 보이스피싱 시나리오 10개는 전부 `difficulty`(`easy`/`medium`/`hard`)가 태깅돼 있고, 각 난이도에 정상·사기 시나리오가 최소 1개씩 존재한다 — `pickByDifficulty`가 난이도별 부분집합에서 랜덤 선택하며 fallback을 타지 않는다(`voice-phishing.test.ts`·`registry.test.ts`로 강제).
- `voice-phishing.ts` 시나리오 개수·정상/사기 비율은 `voice-phishing.test.ts`가 하드코딩 단언(현재 10개 = 정상 4 + 사기 6)으로 강제한다 — 시나리오를 추가/삭제하면 이 단언을 함께 갱신해야 한다.
```

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

(코드 변경이 없으므로 이번 step은 이 커맨드들이 변경 전과 동일하게 통과하는지만 확인하면 된다.)

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 문서 체크리스트를 확인한다:
   - `src/` 아래 파일과 `docs/research/` 아래 사례 뱅크 본문을 전혀 수정하지 않았는가?
   - ADR-014가 기존 ADR(001~013)과 형식(결정/이유/트레이드오프 3단락)이 일관되는가?
   - PRD 핵심 기능 번호가 1~9로 그대로 유지되는가? (이번 step은 번호 재정렬 없음, 5번 문장만 교체)
   - ARCHITECTURE의 디렉토리 구조·패턴·엣지 케이스에 변경이 빠짐없이 반영됐는가?
   - 난이도 코드값을 한글(`"쉬움"/"중간"/"어려움"`)로 문서에 적지 않았는가? (식별자는 `"easy"/"medium"/"hard"`, 한글은 화면 표시용 라벨)
3. 결과에 따라 `phases/7-voice-phishing-difficulty-content/index.json`의 `step: 0` 항목을 업데이트한다.

## 금지사항

- `src/` 아래 어떤 파일도 수정하지 마라. 이유: 타입/데이터/테스트는 step2~4에서 다룬다. 지금 건드리면 이후 step의 diff가 지저분해진다.
- `docs/research/voice-phishing-case-bank/` 아래 `.md` 사례 본문을 수정하지 마라. 이유: 사례 수집은 step1의 범위이며 웹 조사 절차를 거쳐야 한다.
- ADR-001~013, PRD/ARCHITECTURE의 기존 내용을 삭제하거나 재작성하지 마라 — 위에 명시된 diff만 적용한다. 특히 ADR-012는 그대로 두고 ADR-014를 새로 추가한다(ADR-012를 고쳐 쓰지 마라).
- 기존 테스트를 깨뜨리지 마라.
