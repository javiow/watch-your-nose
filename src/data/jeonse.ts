import type { ListingPair } from "@/types/experience";

export const JEONSE_LISTING_PAIRS: ListingPair[] = [
  {
    id: "listing-hapjeong-officetel",
    normalListing: {
      title: "합정동 오피스텔 전세 1억 8천",
      details:
        "등기부등본상 근저당 없음(깨끗한 매물). 임대인 명의와 등기부등본 소유자 명의 일치 확인 완료. 계약 전 등기부등본·건축물대장 열람 가능하며, 전세보증금 반환보증 가입 협조 가능. 잔금은 계약서상 임대인 명의 계좌로만 입금.",
    },
    scamListing: {
      title: "합정동 오피스텔 전세 1억 8천 (급매)",
      details:
        "시세보다 3천만원 저렴하게 급하게 내놓음. 등기부등본상 근저당이 매매가의 80%까지 설정되어 있음. 임대인이 지방에 있어 계약은 '대리인'과 진행하며, 위임장 원본 확인 불가. 잔금은 임대인 명의가 아닌 대리인 개인 계좌로 입금 요청.",
    },
    correctSide: "normal",
  },
  {
    id: "listing-sanggye-villa",
    normalListing: {
      title: "상계동 빌라 전세 9천 5백",
      details:
        "선순위 근저당 없음. 확정일자·전입신고 즉시 가능하도록 협조. 공인중개사를 통한 정식 계약이며 중개대상물 확인설명서 제공. 집주인 신분증과 등기부등본 소유자 명의가 일치함을 직접 확인시켜줌.",
    },
    scamListing: {
      title: "상계동 신축 빌라 전세 9천 (풀옵션)",
      details:
        "신축이라 등기부등본이 아직 정리되지 않았다며 열람을 미룸. 집주인이 아닌 '건물 관리인'이라는 사람이 계약을 대행하며 위임 관계 서류 요청 시 얼버무림. 근저당 설정 여부를 물어도 '문제없다'는 구두 답변만 반복. 계약금 입금을 서두르라고 재촉함.",
    },
    correctSide: "normal",
  },
];
