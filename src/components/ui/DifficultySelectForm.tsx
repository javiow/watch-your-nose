"use client";

import { useState } from "react";
import { DIFFICULTY_OPTIONS } from "@/data/difficulty";
import type { Difficulty } from "@/types/experience";

interface DifficultySelectFormProps {
  onComplete: (difficulty: Difficulty) => void;
}

export function DifficultySelectForm({ onComplete }: DifficultySelectFormProps) {
  const [selected, setSelected] = useState<Difficulty | null>(null);

  return (
    <div className="w-full space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted">난이도</p>
        <div className="space-y-3">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelected(opt.id)}
              className={`min-h-11 w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                selected === opt.id
                  ? "border-accent bg-accent-soft text-foreground"
                  : "border-border bg-surface text-muted"
              }`}
            >
              <span className="block text-sm font-medium">{opt.label}</span>
              <span className="block text-sm text-subtle">{opt.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={selected === null}
          onClick={() => selected && onComplete(selected)}
          className="min-h-11 rounded-xl bg-accent px-8 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-subtle"
        >
          체험 시작하기
        </button>
      </div>
    </div>
  );
}
