"use client";

import { useState } from "react";
import type { PlayerAgeGroup, PlayerGender, PlayerInfo } from "@/types/player";

const AGE_GROUPS: PlayerAgeGroup[] = ["10대", "20대", "30대", "40대", "50대 이상"];
const JOBS = ["학생", "직장인", "자영업자", "프리랜서", "무직", "전업주부"];
const GENDERS: PlayerGender[] = ["남성", "여성", "선택 안 함"];

interface PlayerSetupFormProps {
  onComplete: (info: PlayerInfo) => void;
}

interface ChoiceGroupProps<T extends string> {
  label: string;
  options: T[];
  value: T | null;
  onSelect: (value: T) => void;
}

function ChoiceGroup<T extends string>({
  label,
  options,
  value,
  onSelect,
}: ChoiceGroupProps<T>) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted">{label}</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={`min-h-11 rounded-xl border px-3 text-sm transition-colors ${
              value === option
                ? "border-accent bg-accent-soft text-foreground"
                : "border-border bg-surface text-muted"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PlayerSetupForm({ onComplete }: PlayerSetupFormProps) {
  const [ageGroup, setAgeGroup] = useState<PlayerAgeGroup | null>(null);
  const [job, setJob] = useState<string | null>(null);
  const [gender, setGender] = useState<PlayerGender | null>(null);

  const isComplete = ageGroup !== null && job !== null && gender !== null;

  const handleStart = () => {
    if (!ageGroup || !job || !gender) return;
    onComplete({ ageGroup, job, gender });
  };

  return (
    <div className="w-full space-y-8">
      <ChoiceGroup
        label="나이대"
        options={AGE_GROUPS}
        value={ageGroup}
        onSelect={setAgeGroup}
      />
      <ChoiceGroup label="직업" options={JOBS} value={job} onSelect={setJob} />
      <ChoiceGroup
        label="성별"
        options={GENDERS}
        value={gender}
        onSelect={setGender}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleStart}
          disabled={!isComplete}
          className="min-h-11 rounded-xl bg-accent px-8 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-subtle"
        >
          다음
        </button>
      </div>
    </div>
  );
}
