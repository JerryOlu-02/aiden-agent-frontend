import { useEffect, useState } from "react";
import { getTrades } from "../lib/api";
import { useAgent } from "../lib/agent";
import { clock, multiple, pnlClass, shortKey, signedSol, sol, ticker } from "../lib/format";
import type { Book } from "../lib/types";

export function meta() {
  return [{ title: "Trades · Aiden" }];
}

export default function Trades() {
  const { status, snapshot } = useAgent();
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      getTrades()
        .then((next) => {
          if (alive) setBook(next);
        })
        .catch((caught: unknown) => {
          if (alive) setError(caught instanceof Error ? caught.message : "Could not load trades.");
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
  if (status === "offline") return <p className="text-ink-soft">Trades load once the agent is running.</p>;

  return (
    <section>
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Trades</h1>
      <p className="mt-3 max-w-xl text-ink-soft">Fills the wallet actually sent, including paper fills.</p>

      <h2 className="mt-10 font-display text-2xl font-bold">Closed</h2>
      {!book || book.closed.length === 0 ? (
        <p className="mt-3 text-ink-soft">Nothing closed yet.</p>
      ) : (
        <ol className="mt-4 divide-y divide-line border-y border-line">
          {book.closed.map((position) => (
            <li key={position.id} className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr_auto] sm:items-baseline">
              <time className="font-mono text-xs text-mute">{position.closedAt ? clock(position.closedAt) : "—"}</time>
              <p>
                <span className="font-display text-xl font-bold">{ticker(position.symbol)}</span>
                <span className="ml-2 text-sm text-ink-soft">{position.exitReason}</span>
              </p>
              <p className={`font-mono text-sm ${pnlClass(position.pnlSol)}`}>
                {signedSol(position.pnlSol)}
                <span className="ml-2 text-mute">{multiple(position.multiple)}</span>
              </p>
            </li>
          ))}
        </ol>
      )}

      <h2 className="mt-10 font-display text-2xl font-bold">Fills</h2>
      {error ? <p className="mt-3 text-sm text-halt">{error}</p> : null}
      {!book || book.fills.length === 0 ? (
        <p className="mt-3 text-ink-soft">No fills yet. Paper mode records one when the model buys.</p>
      ) : (
        <div className="mt-4 overflow-x-auto border-y border-line">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="font-mono text-xs text-mute">
              <tr>
                <th className="py-2 pr-4 font-normal">Time</th>
                <th className="py-2 pr-4 font-normal">Side</th>
                <th className="py-2 pr-4 font-normal">Mint</th>
                <th className="py-2 pr-4 font-normal">SOL</th>
                <th className="py-2 pr-4 font-normal">Status</th>
                <th className="py-2 font-normal">Tx</th>
              </tr>
            </thead>
            <tbody>
              {book.fills.map((fill) => (
                <tr key={fill.id} className="border-t border-line">
                  <td className="py-2 pr-4 font-mono text-xs text-mute">{clock(fill.createdAt)}</td>
                  <td className="py-2 pr-4">{fill.side}</td>
                  <td className="py-2 pr-4 font-display text-lg font-bold">{ticker(fill.symbol)}</td>
                  <td className="py-2 pr-4 font-mono">{sol(fill.solAmount)}</td>
                  <td className={`py-2 pr-4 ${fill.status === "failed" ? "text-halt" : "text-ink-soft"}`}>
                    {fill.dryRun ? "paper" : fill.status}
                    {fill.error ? ` · ${fill.error}` : ""}
                  </td>
                  <td className="py-2 font-mono text-xs">
                    {fill.signature ? (
                      <a
                        className="underline decoration-line underline-offset-2"
                        href={`https://solscan.io/tx/${fill.signature}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {shortKey(fill.signature)}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {snapshot && snapshot.positions.length > 0 ? (
        <p className="mt-6 text-sm text-mute">{snapshot.positions.length} still open on the desk.</p>
      ) : null}
    </section>
  );
}
