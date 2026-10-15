import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as api from "./api";
import type { Mode, RiskLimits, Snapshot, StrategySettings } from "./types";

type AgentContextValue = {
  status: "loading" | "offline" | "ready";
  snapshot: Snapshot | null;
  error: string | null;
  halt: (halted: boolean) => Promise<void>;
  setMode: (mode: Mode, confirm?: string) => Promise<void>;
  saveStrategy: (strategy: StrategySettings) => Promise<void>;
  saveRisk: (risk: RiskLimits) => Promise<void>;
  flatten: () => Promise<void>;
  sell: (id: number) => Promise<void>;
};

const AgentContext = createContext<AgentContextValue | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AgentContextValue["status"]>("loading");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const pull = () => {
      api
        .getState()
        .then((next) => {
          if (!alive) return;
          setSnapshot(next);
          setStatus("ready");
        })
        .catch(() => {
          if (!alive) return;
          setStatus("offline");
        });
    };

    pull();

    const timer = window.setInterval(pull, 2000);

    const events = new EventSource(api.agentUrl("/api/events"));

    events.addEventListener("state", (event) => {
      if (!alive) return;

      try {
        setSnapshot(
          JSON.parse((event as MessageEvent<string>).data) as Snapshot,
        );

        setStatus("ready");
      } catch {
        // A bad frame should not blank the desk. The poll will correct it.
      }
    });

    return () => {
      alive = false;
      window.clearInterval(timer);
      events.close();
    };
  }, []);

  async function run(action: () => Promise<unknown>) {
    setError(null);

    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Request failed.");

      throw caught;
    }
  }

  const value: AgentContextValue = {
    status,
    snapshot,
    error,
    halt: (halted) => run(() => api.setHalted(halted)),
    setMode: (mode, confirm) => run(() => api.setMode(mode, confirm)),
    saveStrategy: (strategy) => run(() => api.saveStrategy(strategy)),
    saveRisk: (risk) => run(() => api.saveRisk(risk)),
    flatten: () => run(() => api.flatten()),
    sell: (id) => run(() => api.sellPosition(id)),
  };

  return (
    <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
  );
}

export function useAgent() {
  const value = useContext(AgentContext);
  if (!value) throw new Error("useAgent must be used inside the desk layout");
  return value;
}
