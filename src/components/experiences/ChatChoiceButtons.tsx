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
          className="min-h-11 rounded-xl border border-border bg-surface p-4 text-left text-sm text-muted transition-colors hover:border-accent disabled:cursor-not-allowed"
        >
          {choice.text}
        </button>
      ))}
    </div>
  );
}
