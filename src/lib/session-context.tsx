"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ExperienceTypeId, ModuleResult } from "@/types/experience";
import type { PlayerInfo } from "@/types/player";
import { pickSessionPlan } from "@/lib/registry";

interface SessionContextValue {
  sessionPlan: { typeId: ExperienceTypeId }[];
  results: ModuleResult[];
  addResult: (result: ModuleResult) => void;
  resetSession: () => void;
  playerInfo: PlayerInfo | null;
  setPlayerInfo: (info: PlayerInfo) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionPlan, setSessionPlan] = useState(() => pickSessionPlan());
  const [results, setResults] = useState<ModuleResult[]>([]);
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);

  const addResult = useCallback((result: ModuleResult) => {
    setResults((prev) => [...prev, result]);
  }, []);

  const resetSession = useCallback(() => {
    setSessionPlan(pickSessionPlan());
    setResults([]);
  }, []);

  const value = useMemo(
    () => ({
      sessionPlan,
      results,
      addResult,
      resetSession,
      playerInfo,
      setPlayerInfo,
    }),
    [sessionPlan, results, addResult, resetSession, playerInfo]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession은 SessionProvider 내부에서만 사용할 수 있습니다.");
  }
  return context;
}
