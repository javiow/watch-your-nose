import type { ModuleResult } from "@/types/experience";

export const DEFAULT_REMEDIATION_MESSAGE =
  "이번 선택에서 놓친 위험 신호가 있었습니다.\n\n낯선 연락의 **금전·개인정보 요청, 지나치게 유리한 조건, 서두르라는 재촉**은 대표적인 사기 신호입니다.";

export interface RemediationLink {
  label: string;
  url: string;
}

export interface RemediationEntry {
  /** getRemediation()이 반환하는 문자열. **...**로 감싼 핵심 문구는 HighlightedText가 강조한다. */
  message: string;
  /** 결과 페이지에서 짧게 나열할 핵심 행동 2~3개. */
  bullets: string[];
  /** 실제 신고·확인용 공식 기관 링크(실접속 확인됨). */
  links?: RemediationLink[];
}

const DEFAULT_REMEDIATION_ENTRY: RemediationEntry = {
  message: DEFAULT_REMEDIATION_MESSAGE,
  bullets: [
    "금전·개인정보·앱 설치를 요구하는지 확인",
    "공식 대표번호로 직접 걸어 재확인",
  ],
};

const FSS_VOICE = {
  label: "금융감독원 보이스피싱지킴이",
  url: "https://www.fss.or.kr/fss/main/sub1voice.do?menuNo=200012",
};
const POLICE_ECRM = {
  label: "경찰청 사이버범죄 신고시스템(ECRM)",
  url: "https://ecrm.police.go.kr",
};
const KISA_118 = { label: "KISA 118 사이버민원", url: "https://www.kisa.or.kr/303" };
const IROS = { label: "인터넷등기소", url: "https://www.iros.go.kr" };
const HUG = { label: "주택도시보증공사(HUG)", url: "https://www.khug.or.kr" };
const FSS_FINE = {
  label: "금융감독원 파인(통합 민원·상담)",
  url: "https://fine.fss.or.kr",
};

// 문장 전체가 아니라 실제로 기억해야 할 핵심 부분만 **이렇게** 감싸 표시한다.
// 렌더링은 src/components/ui/HighlightedText.tsx가 담당한다.
export const REMEDIATION_ENTRIES: Record<string, RemediationEntry> = {
  "blind-refusal": {
    message:
      "정상적인 절차였는데도 무조건 전화를 끊었습니다. 먼저 상대가 개인정보·금전·앱 설치를 요구하는지 확인하세요.\n\n의심되면 안내받은 번호 말고 **카드 뒷면이나 공식 홈페이지의 대표번호로 직접 걸어 재확인**하면 됩니다.",
    bullets: [
      "개인정보·금전·앱 설치 요구인지부터 확인",
      "의심되면 카드 뒷면 대표번호로 직접 재확인",
    ],
    links: [FSS_VOICE],
  },
  "missed-scam-signal": {
    message:
      "사기 정황이 있는 사례를 정상으로 판단했습니다. **선입금 요구, 보안카드 전체 입력 요구, '1시간 내 조치' 같은 짧은 시간 제한**은 대표적인 위험 신호입니다.\n\n실제 기관은 이렇게 급하게 정보를 요구하지 않으니 공식 채널로 다시 확인하세요.",
    bullets: [
      "선입금·보안카드 전체 입력 요구는 거절",
      "'몇 시간 내' 재촉은 사기 신호",
      "공식 채널로 별도 확인",
    ],
    links: [POLICE_ECRM, KISA_118],
  },
  "missed-lease-fraud-signal": {
    message:
      "위험 신호가 있는 매물을 정상으로 판단했습니다. **소유자와 계약 상대 명의 불일치, 과도한 근저당, 대리인 계좌로 잔금 요구**는 전세사기의 대표적인 징후입니다.\n\n계약 전 등기부등본으로 소유자·근저당을 확인하고, 잔금은 등기부상 소유자 명의 계좌로만 보내세요.",
    bullets: [
      "등기부등본으로 소유자·근저당 직접 확인",
      "잔금은 등기부상 소유자 명의 계좌로만 입금",
      "명의 불일치·대리인 계좌 요구는 중단 사유",
    ],
    links: [IROS, HUG],
  },
  "fell-for-scam": {
    message:
      "사기성 정황이 있는 전화였는데 요청에 응했습니다. **원격제어 앱 설치, 계좌 비밀번호·보안카드 번호 요구, '정부지원·저금리' 같은 솔깃한 조건**은 대표적인 보이스피싱 수법입니다.\n\n전화로 이런 요청을 받으면 끊은 뒤 공식 대표번호로 직접 확인하세요.",
    bullets: [
      "원격제어 앱·비밀번호 요구엔 응하지 말 것",
      "전화를 끊고 공식 대표번호로 직접 확인",
      "이미 응했다면 즉시 132·112에 신고",
    ],
    links: [FSS_VOICE, POLICE_ECRM],
  },
  "false-alarmed-safe-case": {
    message:
      "정상적인 상황을 사기로 잘못 판단했습니다. 낯설거나 다급하다는 이유만으로 단정하지 말고, **개인정보·금전·앱 설치를 실제로 요구하는지, 공식 채널로 재확인이 되는지**부터 살펴보세요.\n\n과도한 의심은 정작 필요한 순간의 조치를 놓치게 만들 수 있습니다.",
    bullets: [
      "실제로 금전·개인정보를 요구하는지부터 확인",
      "공식 채널로 재확인이 가능한지 살펴보기",
    ],
    links: [FSS_FINE],
  },
  "missed-realestate-investigation-signal": {
    message:
      "부동산 계약을 판단할 때 놓친 위험 신호가 있었습니다. **높은 전세가율, 최근 짧은 기간의 소유권 변동, 계약 권한을 확인할 서류 누락**은 모두 위험 신호입니다.\n\n'안전하다'는 말만 믿지 말고 등기부등본·실거래가·공식 채널을 직접 확인한 뒤 결정하세요.",
    bullets: [
      "전세가율·소유권 변동 이력을 직접 확인",
      "계약 권한 서류(위임장·신탁원부 등) 확인",
      "'안전하다'는 말 대신 공식 채널로 검증",
    ],
    links: [IROS, HUG],
  },
};

export function getRemediationEntry(
  mistakeTag: string | undefined
): RemediationEntry {
  if (!mistakeTag) return DEFAULT_REMEDIATION_ENTRY;
  return REMEDIATION_ENTRIES[mistakeTag] ?? DEFAULT_REMEDIATION_ENTRY;
}

export function getRemediation(mistakeTag: string | undefined): string {
  return getRemediationEntry(mistakeTag).message;
}

export function getRemediationsForResults(results: ModuleResult[]): string[] {
  return results
    .filter((result) => !result.isCorrect)
    .map((result) => getRemediation(result.mistakeTag));
}
