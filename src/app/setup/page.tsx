"use client";

import { useRouter } from "next/navigation";
import { PlayerSetupForm } from "@/components/ui/PlayerSetupForm";
import { useSession } from "@/lib/session-context";
import type { PlayerInfo } from "@/types/player";

export default function SetupPage() {
  const router = useRouter();
  const { setPlayerInfo } = useSession();

  const handleComplete = (info: PlayerInfo) => {
    setPlayerInfo(info);
    router.push("/difficulty");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-10 px-4 py-16">
      <PlayerSetupForm onComplete={handleComplete} />
    </main>
  );
}
