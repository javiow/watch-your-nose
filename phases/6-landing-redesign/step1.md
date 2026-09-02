# Step 1: mascot-assets

## 읽어야 할 파일

- `/docs/ARCHITECTURE.md` (디렉토리 구조 코드블록 아래 `public/mascot/` note, 「보안」 절)
- `/docs/ADR.md` ADR-013 (마스코트 프레임 결정)
- `/src/components/ui/Mascot.tsx` (현재 `/mascot.png` 480×444를 쓰는 방식 확인 — 이 step에선 수정하지 않음)
- `/next.config.ts` (수정 금지 — `images` 키가 없고 로컬 `public/` 경로만 쓴다는 사실 확인용)

## 배경

마스코트를 팀 제공 픽셀아트 코끼리(노란 후드) 표정 프레임으로 교체한다. 이 step은 **정적 애셋만** 만든다. `src/` 코드는 건드리지 않는다(컴포넌트 배선은 step6).

### 소스 이미지 (팀 제공, 8장)

절대 경로:

```
C:\Users\jmsu0\.claude\uploads\fbf6cb7b-1c1c-439b-9c7b-ffc38eea9c77\a0472fbe-image.png
C:\Users\jmsu0\.claude\uploads\fbf6cb7b-1c1c-439b-9c7b-ffc38eea9c77\fb8790e8-image.png
C:\Users\jmsu0\.claude\uploads\fbf6cb7b-1c1c-439b-9c7b-ffc38eea9c77\69955000-image.png
C:\Users\jmsu0\.claude\uploads\fbf6cb7b-1c1c-439b-9c7b-ffc38eea9c77\ddf6e949-image.png
C:\Users\jmsu0\.claude\uploads\fbf6cb7b-1c1c-439b-9c7b-ffc38eea9c77\662609fd-image.png
C:\Users\jmsu0\.claude\uploads\fbf6cb7b-1c1c-439b-9c7b-ffc38eea9c77\cc7dd0ba-image.png
C:\Users\jmsu0\.claude\uploads\fbf6cb7b-1c1c-439b-9c7b-ffc38eea9c77\f1210d03-image.png
C:\Users\jmsu0\.claude\uploads\fbf6cb7b-1c1c-439b-9c7b-ffc38eea9c77\96b0ffb3-image.png
```

- 모두 1254×1254, RGB, **알파 채널 없음**, 배경 불투명(6장은 흰끼 도는 회백색, 2장은 중간 회색), ~1.3MB.
- 중복 2쌍: `a0472fbe` == `f1210d03`, `fb8790e8` == `ddf6e949`. 실제 고유 표정은 6종.
- 소스 파일 중 하나라도 존재하지 않으면 즉시 `phases/6-landing-redesign/index.json`의 이 step을 `"status": "blocked"`, `"blocked_reason": "마스코트 소스 PNG를 찾을 수 없음: <경로>. 사용자가 재업로드해야 함"` 으로 바꾸고 중단하라.

### 도구

- ImageMagick 없음. **`sharp`가 `node_modules`에 있음.** **Python `PIL`(Pillow) 12.3 사용 가능.**
- 배경 제거는 **모서리 flood-fill**로 한다(`PIL.ImageDraw.floodfill`). 전역 컬러키(특정 색을 일괄 투명화)를 쓰지 마라 — 이유: 눈 하이라이트·상아 끝이 거의 흰색이라 전역 키로 지우면 구멍이 뚫린다.

## 작업

### 1. 가공 스크립트 작성 (스크래치패드, 커밋 안 함)

`scripts/` 아래가 **아니라** OS 임시 디렉토리(예: `%TEMP%\mascot_build\process_mascot.py`)에 Python 스크립트를 만들어 실행한다. 스크립트 파일 자체는 리포에 커밋하지 않는다 — 산출물 WebP만 커밋한다.

고유 6장 각각에 대해:

1. `Image.open(src).convert("RGBA")`.
2. 네 모서리 `(0,0)`, `(w-1,0)`, `(0,h-1)`, `(w-1,h-1)` 각각에서 `ImageDraw.floodfill(img, corner, (0,0,0,0), thresh=T)` 실행. `T`는 30~50 사이에서 조정(회색 배경 2장도 같은 로직으로 처리된다 — 모서리별로 그 모서리 색을 시드로 쓰므로).
3. **`96b0ffb3` 프레임만**: flood-fill 후, 세로 높이의 약 92% 지점 아래 모든 픽셀의 alpha를 0으로 만든다. 이유: 이 원본에는 발밑에 소프트 드롭섀도가 구워져 있어 그대로 두면 잘린 그림자 자국이 남는다.
4. `img.crop(img.getbbox())` 로 투명 여백 제거.
5. `side = round(max(w2, h2) * 1.06)` 크기의 **투명 정사각** 캔버스에 중앙 배치. 이유: 모든 프레임이 같은 baseline·스케일을 공유해야 step6의 opacity 크로스페이드가 어긋나 보이지 않는다.
6. `resize((512, 512), Image.LANCZOS)`.
7. `save(dst, "WEBP", quality=82, method=6)` — 알파 유지.

### 2. 산출물 배치 → `public/mascot/`

소스 → 파일명 매핑(정확히 이 6개, 이 이름):

| 소스 | `public/mascot/` 파일 | 표정 |
|---|---|---|
| `cc7dd0ba-image.png` | `idle.webp` | 열린 눈, 가장 잔잔 |
| `fb8790e8-image.png` | `blink.webp` | 눈 감음, 잔잔한 미소 |
| `662609fd-image.png` | `surprised.webp` | 크고 동그란 놀란 눈 |
| `69955000-image.png` | `worried.webp` | 걱정 눈썹 |
| `a0472fbe-image.png` | `sleepy.webp` | 반쯤 감은 눈 |
| `96b0ffb3-image.png` | `sad.webp` | 눈 감음 + 슬픈 눈썹 |

(중복본 `f1210d03`, `ddf6e949`는 사용하지 않는다.)

`public/mascot.png`(기존 파일)는 **삭제하지 마라** — step6에서 참조 제거 후 삭제한다.

### 3. 검증 스크립트로 AC 확인

`sharp` 또는 PIL로 6개 파일 각각을 열어 아래를 프로그램적으로 확인한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

추가로, 아래를 만족해야 한다(Node 또는 Python 스니펫으로 확인, 결과를 stdout에 출력):

- `public/mascot/` 에 정확히 `idle.webp`, `blink.webp`, `surprised.webp`, `worried.webp`, `sleepy.webp`, `sad.webp` 6개가 존재한다.
- 각 파일: `format === "webp"`, `width === 512 && height === 512`, `hasAlpha === true`.
- 각 파일의 네 모서리 픽셀(1,1 / 510,1 / 1,510 / 510,510)의 alpha가 모두 `0`.
- 각 파일에 불투명 픽셀(alpha > 10)이 존재한다(= 전부 투명한 빈 이미지가 아니다).
- 각 파일 크기 < 60 KB. `public/mascot/` 합계 < 300 KB.
- `git status`에 `scripts/` 아래 새 파일이 없다(가공 스크립트를 커밋하지 않았다).

## 검증 절차

1. 위 AC 커맨드 + 스니펫을 실행한다.
2. 아키텍처 체크리스트:
   - `next.config.ts`를 수정하지 않았는가? (로컬 `public/` 경로라 `images` 설정 불필요)
   - `src/` 아래 변경이 없는가?
   - CLAUDE.md CRITICAL(시크릿 하드코딩 금지 등) 위반이 없는가?
3. `phases/6-landing-redesign/index.json`의 `step: 1`을 업데이트한다(성공 시 `completed` + `summary`에 생성한 6개 파일명과 합계 용량 기재).

## 금지사항

- 가공 스크립트(`process_mascot.py` 등)를 `scripts/`나 리포 어디에도 커밋하지 마라. 이유: ADR-013에서 "가공 스크립트는 커밋하지 않고 산출물만 커밋"으로 결정했다.
- 전역 컬러키/`chroma-key` 방식으로 배경을 지우지 마라. 이유: 눈 하이라이트·상아가 흰색이라 구멍이 뚫린다. 반드시 모서리 flood-fill.
- `public/mascot.png`를 삭제하거나 덮어쓰지 마라. 이유: step6 전까지 기존 `Mascot`이 참조한다.
- `src/`·`next.config.ts`·`package.json`을 수정하지 마라. 이유: 이 step은 애셋 전용이다.
- 중복본(`f1210d03`, `ddf6e949`)으로 별도 프레임을 만들지 마라 — 6개만.
- 기존 테스트를 깨뜨리지 마라.
