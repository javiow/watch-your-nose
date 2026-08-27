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
    <div className="flex flex-col items-end gap-2">
      <p className="self-end text-xs font-medium text-subtle">어떻게 답할까요?</p>
      {choices.map((choice) => (
        <button
          key={choice.id}
          type="button"
          onClick={() => handleClick(choice.id)}
          disabled={locked}
          className="min-h-11 max-w-[85%] rounded-xl border-2 border-dashed border-accent/50 bg-accent-soft p-4 text-left text-sm text-foreground transition-colors hover:border-accent hover:bg-accent-soft/70 disabled:cursor-not-allowed"
        >
          {choice.text}
        </button>
      ))}
    </div>
  );
}
