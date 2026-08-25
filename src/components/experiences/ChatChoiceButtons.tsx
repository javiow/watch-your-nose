"use client";

import { useRef, useState } from "react";
import type { DialogueChoice } from "@/types/experience";

interface ChatChoiceButtonsProps {
  choices: DialogueChoice[];
  onSelect: (choiceId: string) => void;
}

export function ChatChoiceButtons({ choices, onSelect }: ChatChoiceButtonsProps) {
  const [locked, setLocked] = useState(false);
  const lockedRef = useRef(false);

  const handleClick = (choiceId: string) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setLocked(true);
    onSelect(choiceId);
  };

  return (
    <div className="flex flex-col gap-3">
      {choices.map((choice) => (
        <button
          key={choice.id}
          type="button"
          onClick={() => handleClick(choice.id)}
          disabled={locked}
          className="min-h-11 rounded-lg border border-neutral-800 bg-[#141414] p-4 text-left text-sm text-neutral-300 transition-colors hover:border-blue-500 disabled:cursor-not-allowed"
        >
          {choice.text}
        </button>
      ))}
    </div>
  );
}
