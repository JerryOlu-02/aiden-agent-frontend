import type {
  Book,
  LogView,
  Mode,
  RiskLimits,
  Snapshot,
  StrategySettings,
} from "./types";

export class AgentError extends Error {}

export function agentUrl(path: string) {
  const base = (import.meta.env.VITE_AGENT_URL ?? "").replace(/\/$/, "");
  return `${base}${path}`;
}

async function send<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(agentUrl(path), {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
      },
    });
  } catch {
    throw new AgentError("The desk can't reach the agent.");
  }

  const text = await response.text();

  let data: { error?: string } = {};

  if (text) {
    try {
      data = JSON.parse(text) as { error?: string };
    } catch {
      throw new AgentError("The agent returned something that was not JSON.");
    }
  }

  if (!response.ok)
    throw new AgentError(data.error ?? `Agent responded ${response.status}.`);

  return data as T;
}

export const getState = () => send<Snapshot>("/api/state");

export const getTrades = () => send<Book>("/api/trades");

export const getLogs = () => send<{ logs: LogView[] }>("/api/logs");

export const saveStrategy = (strategy: StrategySettings) =>
  send<Snapshot>("/api/strategy", {
    method: "PUT",
    body: JSON.stringify(strategy),
  });

export const saveRisk = (risk: RiskLimits) =>
  send<Snapshot>("/api/risk", { method: "PUT", body: JSON.stringify(risk) });

export const setHalted = (halted: boolean) =>
  send<Snapshot>("/api/halt", {
    method: "POST",
    body: JSON.stringify({ halted }),
  });

export const setMode = (mode: Mode, confirm?: string) =>
  send<Snapshot>("/api/mode", {
    method: "POST",
    body: JSON.stringify({ mode, confirm }),
  });

export const flatten = () => send<Snapshot>("/api/flatten", { method: "POST" });

export const sellPosition = (id: number) =>
  send<Snapshot>(`/api/positions/${id}/sell`, { method: "POST" });
