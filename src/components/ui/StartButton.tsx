"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";

export function StartButton() {
  const router = useRouter();
  const { resetSession } = useSession();

  const handleStart = () => {
    resetSession();
    router.push("/how-it-works");
  };

  return (
    <button
      type="button"
      onClick={handleStart}
      className="min-h-11 rounded-xl bg-accent px-8 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
    >
      시작하기
    </button>
  );
}
