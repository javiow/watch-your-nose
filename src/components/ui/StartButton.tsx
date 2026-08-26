"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";

export function StartButton() {
  const router = useRouter();
  const { resetSession } = useSession();

  const handleStart = () => {
    resetSession();
    router.push("/setup");
  };

  return (
    <button
      type="button"
      onClick={handleStart}
      className="min-h-11 rounded-lg bg-blue-500 px-8 text-sm font-medium text-white transition-colors hover:bg-blue-400"
    >
      시작하기
    </button>
  );
}
