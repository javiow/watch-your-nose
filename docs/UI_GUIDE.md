# UI 디자인 가이드

## 디자인 원칙
1. 랜딩(`/`)만 예외적으로 "이목을 끄는" 페이지 — 도발적·자신감을 자극하는 카피(예: "나는 절대 안 속아? 확인해보자")와 헤드라인 "눈 뜨고 코 베인다"를 크게 활용한다.
2. 랜딩을 벗어난 `/session`, `/result`는 도구처럼 담백하게 — 화려한 장식보다 판단에 집중하게 만드는 레이아웃.
3. 유형(보이스피싱/사례선택/전세매물) 이름이나 다음 단계 힌트를 세션 진행 중 UI 어디에도 노출하지 않는다.

## AI 슬롭 안티패턴 — 하지 마라
| 금지 사항 | 이유 |
|-----------|------|
| backdrop-filter: blur() | glass morphism은 AI 템플릿의 가장 흔한 징후 |
| gradient-text (배경 그라데이션 텍스트) | AI가 만든 SaaS 랜딩의 1번 특징 |
| "Powered by AI" 배지 | 기능이 아니라 장식. 사용자에게 가치 없음 |
| box-shadow 글로우 애니메이션 | 네온 글로우 = AI 슬롭 |
| 보라/인디고 브랜드 색상 | "AI = 보라색" 클리셰 |
| 모든 카드에 동일한 rounded-2xl | 균일한 둥근 모서리는 템플릿 느낌 |
| 배경 gradient orb (blur-3xl 원형) | 모든 AI 랜딩 페이지에 있는 장식 |

## 색상
### 배경
| 용도 | 값 |
|------|------|
| 페이지 | #0a0a0a |
| 카드 | #141414 |

### 텍스트
| 용도 | 값 |
|------|------|
| 주 텍스트 | text-white |
| 본문 | text-neutral-300 |
| 보조 | text-neutral-400 |
| 비활성 | text-neutral-500 |

### 브랜드/시맨틱 색상
| 용도 | 값 |
|------|------|
| 브랜드/포인트(버튼·강조) | blue-500 계열 (#3b82f6) — 보라색 클리셰 회피, 정답/오답 색과 분리 |
| 정답/안전 | #22c55e (green) |
| 오답/위험 | #ef4444 (red) |
| 중립/기본 | #525252 |

### 등급 라벨 구간 (`lib/scoring.ts`에 상수로 정의)
| 정답률 | 라벨 | 색상 |
|--------|------|------|
| 80% 이상 | 안전 | green |
| 50~79% | 주의 | amber/neutral |
| 50% 미만 | 위험 | red |

## 컴포넌트
### 카드
```
rounded-lg bg-[#141414] border border-neutral-800 p-6
```

### 버튼
```
Primary: rounded-lg bg-blue-500 text-white hover:bg-blue-400
Text:    text-neutral-500 hover:text-neutral-300
선택지(ChoiceButton), 미선택: border border-neutral-800 bg-[#141414]
선택지, 선택됨: border border-blue-500 bg-blue-500/10
```

### 진행률 바 (`/session` 전용)
```
얇은 바(h-1) + blue-500 채움. "N/3" 텍스트는 노출하되 유형명은 절대 노출하지 않는다.
```

## 레이아웃
- 전체 너비: max-w-5xl (랜딩 히어로만 예외적으로 더 넓게 사용 가능)
- 정렬: 좌측 정렬 기본. 중앙 정렬 금지 (랜딩 히어로는 예외적으로 중앙 정렬 허용)
- 간격: gap-3~4, 섹션 간 space-y-8
- **반응형 필수**: 모바일 우선으로 작업한다. 카드/선택지는 모바일에서 세로 스택(`flex-col`), 데스크톱(`md:` 이상)에서 가로 배치(`md:flex-row`)로 전환. 터치 타깃(버튼)은 최소 44px 높이 확보.

## 타이포그래피
| 용도 | 스타일 |
|------|--------|
| 랜딩 헤드라인 ("눈 뜨고 코 베인다") | text-5xl~6xl font-bold text-white |
| 페이지 제목 (session/result) | text-4xl font-semibold text-white |
| 카드 제목 | text-sm font-medium text-neutral-400 |
| 본문 | text-sm text-neutral-300 leading-relaxed |

## 애니메이션
- fade-in (0.4s), slide-up (0.5s)만 허용
- 그 외 모든 애니메이션(글로우, 무한 반복 등) 금지

## 아이콘 / 일러스트
- SVG 인라인, strokeWidth 1.5. 아이콘 컨테이너(둥근 배경 박스)로 감싸지 않는다.
- 랜딩의 일러스트도 동일하게 라인 아트 SVG로 제작한다 — 사진·그라데이션·블러 배경 orb 금지(anti-slop 규칙과 동일하게 적용).
