export type PlayerAgeGroup = "10대" | "20대" | "30대" | "40대" | "50대 이상";
export type PlayerGender = "남성" | "여성" | "선택 안 함";

export interface PlayerInfo {
  ageGroup: PlayerAgeGroup;
  job: string;
  gender: PlayerGender;
}
