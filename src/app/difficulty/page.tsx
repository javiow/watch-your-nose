"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DifficultySelectForm } from "@/components/ui/DifficultySelectForm";
import { useSession } from "@/lib/session-context";
import type { Difficulty } from "@/types/experience";

export default function DifficultyPage() {
  const router = useRouter();
  const { playerInfo, setDifficulty } = useSession();

  useEffect(() => {
    if (playerInfo === null) {
      router.replace("/");
    }
  }, [playerInfo, router]);

  if (playerInfo === null) {
    return null;
  }

  const handleComplete = (difficulty: Difficulty) => {
    setDifficulty(difficulty);
    router.push("/session");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-10 px-4 py-16">
      <DifficultySelectForm onComplete={handleComplete} />
    </main>
  );
}
