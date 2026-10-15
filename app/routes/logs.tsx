import { useEffect, useState } from "react";
import { getLogs } from "../lib/api";
import { useAgent } from "../lib/agent";
import { clock } from "../lib/format";
import type { LogView } from "../lib/types";

export function meta() {
  return [{ title: "Log · Aiden" }];
}

export default function Logs() {
  const { status } = useAgent();
  const [logs, setLogs] = useState<LogView[] | null>(null);
  const [level, setLevel] = useState<"all" | LogView["level"]>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      getLogs()
        .then((next) => {
          if (alive) setLogs(next.logs);
        })
        .catch((caught: unknown) => {
          if (alive) setError(caught instanceof Error ? caught.message : "Could not load the log.");
        });
    };
    load();
    const timer = window.setInterval(load, 3000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  if (status === "loading") return <p className="text-ink-soft">Opening the desk…</p>;
  if (status === "offline" && !logs) return <p className="text-ink-soft">The log loads once the agent is running.</p>;

  const shown = (logs ?? []).filter((entry) => level === "all" || entry.level === level);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Log</h1>
          <p className="mt-3 text-ink-soft">What the agent did, newest first.</p>
        </div>
        <div className="flex gap-2 text-sm">
          {(["all", "info", "warn", "error"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLevel(item)}
              className={
                level === item
                  ? "border border-ink bg-ink px-2 py-1 font-mono text-xs text-wash"
                  : "border border-line bg-transparent px-2 py-1 font-mono text-xs text-ink-soft"
              }
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {error ? <p className="mt-4 text-sm text-halt">{error}</p> : null}
      {shown.length === 0 ? (
        <p className="mt-8 text-ink-soft">Nothing in this view.</p>
      ) : (
        <ol className="mt-6 divide-y divide-line border-y border-line font-mono text-sm">
          {shown.map((entry) => (
            <li key={entry.id} className="grid gap-2 py-2 sm:grid-cols-[6.5rem_4rem_1fr] sm:gap-4">
              <time className="text-mute">{clock(entry.createdAt)}</time>
              <span className={entry.level === "error" ? "text-halt" : entry.level === "warn" ? "text-curve-deep" : "text-mute"}>
                {entry.level}
              </span>
              <span>{entry.message}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
