import type { ModuleResult } from "@/types/experience";

export const DEFAULT_REMEDIATION_MESSAGE =
  "이번 선택에서 놓친 위험 신호가 있었습니다. 낯선 연락처의 금전·개인정보 요청, 지나치게 유리한 조건, 서두르라는 재촉은 대표적인 사기 신호이니 다음에는 한 번 더 의심해 보세요.";

export const REMEDIATION_COPY: Record<string, string> = {
  "blind-refusal":
    "정상적인 절차였는데도 무조건 전화를 끊었습니다. 모든 연락을 의심하기보다, 상대가 개인정보·금전·앱 설치를 요구하는지부터 확인하는 습관을 들이세요. 의심스러우면 안내받은 번호가 아니라 카드 뒷면이나 공식 홈페이지에 적힌 대표번호로 직접 걸어 재확인하세요.",
  "missed-scam-signal":
    "사기 정황이 있는 사례를 정상으로 판단했습니다. 예치금·활동비 선입금 요구, 개인정보·보안카드 전체 입력 요구, 지나치게 짧은 시간 제한(예: '1시간 내 조치') 등은 대표적인 위험 신호입니다. 실제 기관은 이런 방식으로 급하게 정보를 요구하지 않으니, 공식 채널로 별도 확인하는 습관을 들이세요.",
  "missed-lease-fraud-signal":
    "위험 신호가 있는 매물을 정상으로 판단했습니다. 소유자와 계약 상대방 명의 불일치, 과도한 근저당, 대리인 명의 계좌로의 잔금 입금 요구는 전세사기의 대표적인 징후입니다. 계약 전 등기부등본으로 소유자·근저당을 직접 확인하고, 잔금은 반드시 등기부등본상 소유자 명의 계좌로만 입금하세요.",
  "fell-for-scam":
    "실제로 사기성 정황이 있는 전화였는데 요청에 응했습니다. 원격제어 앱 설치, 계좌 비밀번호나 보안카드 번호 요구, '정부지원·저금리' 같은 솔깃한 조건은 대표적인 보이스피싱 수법입니다. 전화로 이런 요청을 받으면 그 자리에서 응하지 말고, 반드시 끊은 뒤 공식 대표번호로 직접 확인하세요.",
};

export function getRemediation(mistakeTag: string | undefined): string {
  if (!mistakeTag) return DEFAULT_REMEDIATION_MESSAGE;
  return REMEDIATION_COPY[mistakeTag] ?? DEFAULT_REMEDIATION_MESSAGE;
}

export function getRemediationsForResults(results: ModuleResult[]): string[] {
  return results
    .filter((result) => !result.isCorrect)
    .map((result) => getRemediation(result.mistakeTag));
}
