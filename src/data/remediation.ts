import type { ModuleResult } from "@/types/experience";

export const DEFAULT_REMEDIATION_MESSAGE =
  "이번 선택에서 놓친 위험 신호가 있었습니다. 낯선 연락처의 금전·개인정보 요청, 지나치게 유리한 조건, 서두르라는 재촉은 대표적인 사기 신호이니 다음에는 한 번 더 의심해 보세요.";

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
      "정상적인 절차였는데도 무조건 전화를 끊었습니다. 모든 연락을 의심하기보다, 상대가 개인정보·금전·앱 설치를 요구하는지부터 확인하는 습관을 들이세요. 의심스러우면 안내받은 번호가 아니라 **카드 뒷면이나 공식 홈페이지에 적힌 대표번호로 직접 걸어 재확인**하세요.",
    bullets: [
      "개인정보·금전·앱 설치 요구인지부터 확인",
      "의심되면 카드 뒷면 대표번호로 직접 재확인",
    ],
    links: [FSS_VOICE],
  },
  "missed-scam-signal": {
    message:
      "사기 정황이 있는 사례를 정상으로 판단했습니다. **예치금·활동비 선입금 요구, 개인정보·보안카드 전체 입력 요구, 지나치게 짧은 시간 제한**(예: '1시간 내 조치') 등은 대표적인 위험 신호입니다. 실제 기관은 이런 방식으로 급하게 정보를 요구하지 않으니, 공식 채널로 별도 확인하는 습관을 들이세요.",
    bullets: [
      "선입금·보안카드 전체 입력 요구는 거절",
      "'몇 시간 내' 재촉은 사기 신호",
      "공식 채널로 별도 확인",
    ],
    links: [POLICE_ECRM, KISA_118],
  },
  "missed-lease-fraud-signal": {
    message:
      "위험 신호가 있는 매물을 정상으로 판단했습니다. **소유자와 계약 상대방 명의 불일치, 과도한 근저당, 대리인 명의 계좌로의 잔금 입금 요구**는 전세사기의 대표적인 징후입니다. 계약 전 등기부등본으로 소유자·근저당을 직접 확인하고, 잔금은 반드시 등기부등본상 소유자 명의 계좌로만 입금하세요.",
    bullets: [
      "등기부등본으로 소유자·근저당 직접 확인",
      "잔금은 등기부상 소유자 명의 계좌로만 입금",
      "명의 불일치·대리인 계좌 요구는 중단 사유",
    ],
    links: [IROS, HUG],
  },
  "fell-for-scam": {
    message:
      "실제로 사기성 정황이 있는 전화였는데 요청에 응했습니다. **원격제어 앱 설치, 계좌 비밀번호나 보안카드 번호 요구, '정부지원·저금리' 같은 솔깃한 조건**은 대표적인 보이스피싱 수법입니다. 전화로 이런 요청을 받으면 그 자리에서 응하지 말고, 반드시 끊은 뒤 공식 대표번호로 직접 확인하세요.",
    bullets: [
      "원격제어 앱·비밀번호 요구엔 응하지 말 것",
      "전화를 끊고 공식 대표번호로 직접 확인",
      "이미 응했다면 즉시 132·112에 신고",
    ],
    links: [FSS_VOICE, POLICE_ECRM],
  },
  "false-alarmed-safe-case": {
    message:
      "정상적인 상황을 사기로 잘못 판단했습니다. 낯선 연락이나 다급한 문구만으로 바로 사기라고 단정하기보다, **실제로 개인정보·금전·앱 설치를 요구하는지, 공식 채널로 재확인이 가능한지**부터 살펴보는 습관을 들이세요. 과도한 의심은 정작 필요한 순간에 필요한 조치를 놓치게 만들 수 있습니다.",
    bullets: [
      "실제로 금전·개인정보를 요구하는지부터 확인",
      "공식 채널로 재확인이 가능한지 살펴보기",
    ],
    links: [FSS_FINE],
  },
  "missed-realestate-investigation-signal": {
    message:
      "부동산 계약을 판단할 때 놓친 위험 신호가 있었습니다. **전세가율이 지나치게 높거나, 소유권이 최근 짧은 기간에 바뀌었거나, 계약 권한을 확인할 서류가 빠져 있다면** 모두 대표적인 위험 신호입니다. 중개사·상담사의 '안전하다'는 말만 믿지 말고 등기부등본·실거래가·공식 채널을 직접 확인한 뒤 결정하세요.",
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
