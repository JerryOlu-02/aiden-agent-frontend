import { useEffect, useRef, useState } from "react";
import { useAgent } from "../lib/agent";
import { sol } from "../lib/format";
import type { RiskLimits } from "../lib/types";

export function meta() {
  return [{ title: "Limits · Aiden" }];
}

export default function Risk() {
  const { status, snapshot, saveRisk, setMode, flatten } = useAgent();
  const [draft, setDraft] = useState<RiskLimits | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [bad, setBad] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [arming, setArming] = useState(false);
  const [confirmFlatten, setConfirmFlatten] = useState(false);
  const dirty = useRef(false);
  const remote = snapshot
    ? JSON.stringify({
        maxSolPerTrade: snapshot.risk.maxSolPerTrade,
        maxOpenPositions: snapshot.risk.maxOpenPositions,
        dailyLossLimitSol: snapshot.risk.dailyLossLimitSol,
      })
    : "";

  useEffect(() => {
    if (!dirty.current && snapshot) {
      setDraft({
        maxSolPerTrade: snapshot.risk.maxSolPerTrade,
        maxOpenPositions: snapshot.risk.maxOpenPositions,
        dailyLossLimitSol: snapshot.risk.dailyLossLimitSol,
      });
    }
    // remote is the serialized limits, so a poll with the same values does not reset the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote]);

  if (status === "loading") return <p className="text-ink-soft">Opening the desk…</p>;
  if (!snapshot || !draft) return <p className="text-ink-soft">Limits load once the agent is running.</p>;

  const ceilings = snapshot.risk.ceilings;

  return (
    <section className="max-w-3xl">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Limits</h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        The agent can tighten these. It cannot raise them past the ceilings in the environment.
      </p>

      <div className="mt-8 grid gap-5">
        <Meter
          label="Open tickets"
          used={`${snapshot.usage.openPositions}`}
          cap={`${ceilings.maxOpenPositions}`}
          ratio={snapshot.usage.openPositions / snapshot.risk.maxOpenPositions}
        />
        <Meter
          label="Today's loss"
          used={sol(snapshot.usage.dayLossSol)}
          cap={sol(snapshot.risk.dailyLossLimitSol)}
          ratio={snapshot.risk.dailyLossLimitSol > 0 ? snapshot.usage.dayLossSol / snapshot.risk.dailyLossLimitSol : 0}
        />
      </div>

      <form
        className="mt-10 grid gap-5 sm:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          void saveRisk({ ...draft, maxOpenPositions: Math.floor(draft.maxOpenPositions) })
            .then(() => {
              dirty.current = false;
              setBad(false);
              setNote("Saved.");
            })
            .catch((caught: unknown) => {
              setBad(true);
              setNote(caught instanceof Error ? caught.message : "Could not save.");
            });
        }}
      >
        <Field
          label="Max SOL per buy"
          hint={`Ceiling ${ceilings.maxSolPerTrade}`}
          value={draft.maxSolPerTrade}
          step="0.001"
          onChange={(value) => {
            dirty.current = true;
            setDraft({ ...draft, maxSolPerTrade: value });
          }}
        />
        <Field
          label="Max open tickets"
          hint={`Ceiling ${ceilings.maxOpenPositions}`}
          value={draft.maxOpenPositions}
          step="1"
          onChange={(value) => {
            dirty.current = true;
            setDraft({ ...draft, maxOpenPositions: value });
          }}
        />
        <Field
          label="Daily loss (SOL)"
          hint={`Ceiling ${ceilings.dailyLossLimitSol}`}
          value={draft.dailyLossLimitSol}
          step="0.01"
          onChange={(value) => {
            dirty.current = true;
            setDraft({ ...draft, dailyLossLimitSol: value });
          }}
        />
        <div className="flex items-center gap-4 sm:col-span-3">
          <button type="submit" className="bg-ink px-4 py-2 text-sm font-semibold text-wash">
            Save limits
          </button>
          {note ? <p className={bad ? "text-sm text-halt" : "text-sm text-fill"}>{note}</p> : null}
        </div>
      </form>

      <div className="mt-12 border-t border-line pt-8">
        <h2 className="font-display text-2xl font-bold">Sell everything open</h2>
        <p className="mt-2 max-w-lg text-sm text-ink-soft">
          Paper tickets close at the curve. Live tickets send a 100% sell.
        </p>
        <button
          type="button"
          className="mt-4 border border-halt bg-transparent px-4 py-2 text-sm font-semibold text-halt"
          onClick={() => {
            if (!confirmFlatten) {
              setConfirmFlatten(true);
              return;
            }
            setConfirmFlatten(false);
            void flatten();
          }}
        >
          {confirmFlatten ? "Confirm sell" : "Sell open tickets"}
        </button>
      </div>

      <div className="mt-12 border-t border-line pt-8">
        <h2 className="font-display text-2xl font-bold">
          {snapshot.mode === "live" ? "Live is armed" : "Paper is on"}
        </h2>
        {snapshot.mode === "live" ? (
          <>
            <p className="mt-2 max-w-lg text-sm text-ink-soft">
              New buys send real transactions. Switching back to paper does not undo an open live ticket.
            </p>
            <button
              type="button"
              className="mt-4 border border-ink bg-transparent px-4 py-2 text-sm font-semibold"
              onClick={() => void setMode("paper")}
            >
              Switch to paper
            </button>
          </>
        ) : snapshot.wallet.publicKey ? (
          <>
            <p className="mt-2 max-w-lg text-sm text-ink-soft">
              Live lasts until you restart. The next boot follows <span className="font-mono">DRY_RUN</span>.
            </p>
            <label className="mt-4 block max-w-xs text-sm">
              <span className="font-semibold">Type LIVE to arm real buys</span>
              <input
                className="mt-1 w-full border border-line bg-paper px-3 py-2 font-mono"
                value={phrase}
                onChange={(event) => setPhrase(event.target.value)}
                autoComplete="off"
              />
            </label>
            <button
              type="button"
              disabled={phrase !== "LIVE" || arming}
              className="mt-4 bg-halt px-4 py-2 text-sm font-semibold text-wash disabled:opacity-40"
              onClick={() => {
                setArming(true);
                void setMode("live", "LIVE").finally(() => {
                  setArming(false);
                  setPhrase("");
                });
              }}
            >
              Switch to live
            </button>
          </>
        ) : (
          <p className="mt-2 max-w-lg text-sm text-ink-soft">
            Add <span className="font-mono">AGENT_WALLET_SECRET</span> for a dedicated wallet and restart before live
            trading. Paper keeps running without one.
          </p>
        )}
      </div>
    </section>
  );
}

function Meter({ label, used, cap, ratio }: { label: string; used: string; cap: string; ratio: number }) {
  const width = `${Math.max(0, Math.min(100, ratio * 100))}%`;
  return (
    <div>
      <div className="flex justify-between gap-4 font-mono text-sm">
        <span>{label}</span>
        <span>
          {used} / {cap}
        </span>
      </div>
      <div className="mt-2 h-1.5 bg-line">
        <div className="h-full bg-curve" style={{ width }} />
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  step,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  step: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="font-semibold">{label}</span>
      <input
        className="mt-1 w-full border border-line bg-paper px-3 py-2 font-mono"
        type="number"
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="mt-1 block text-ink-soft">{hint}</span>
    </label>
  );
}
