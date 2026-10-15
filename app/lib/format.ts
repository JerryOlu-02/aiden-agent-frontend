export function ticker(symbol: string) {
  const clean = symbol.trim();
  if (!clean) return "—";
  return clean.startsWith("$") ? clean : `$${clean}`;
}

export function sol(value: number | null | undefined, digits = 4) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)} SOL`;
}

export function signedSol(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  if (value === 0) return "0 SOL";
  const body = sol(Math.abs(value));
  if (value > 0) return `+${body}`;
  if (value < 0) return `−${body}`;
  return body;
}

export function pnlClass(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value) || value === 0) return "text-ink-soft";
  return value > 0 ? "text-fill" : "text-halt";
}

export function clock(ms: number) {
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function held(openedAt: number, now: number) {
  const seconds = Math.max(0, Math.round((now - openedAt) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function shortKey(value: string) {
  if (value.length <= 10) return value;
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export function multiple(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${value.toFixed(2)}×`;
}
