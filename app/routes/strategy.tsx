import { useEffect, useRef, useState } from "react";
import { useAgent } from "../lib/agent";
import type { StrategySettings } from "../lib/types";

const fields: Array<{
  key: keyof StrategySettings;
  label: string;
  hint: string;
  step: string;
}> = [
  {
    key: "buySizeSol",
    label: "Buy size (SOL)",
    hint: "Each buy uses this much, and never more than the limit.",
    step: "0.001",
  },
  {
    key: "minConfidence",
    label: "Confidence floor",
    hint: "The model must clear this or the mint is a pass.",
    step: "0.01",
  },
  {
    key: "minMarketCapSol",
    label: "Min market cap (SOL)",
    hint: "Ignore mints still under this curve.",
    step: "1",
  },
  {
    key: "maxMarketCapSol",
    label: "Max market cap (SOL)",
    hint: "Ignore mints that already ran.",
    step: "1",
  },
  {
    key: "minInitialBuySol",
    label: "Min creator buy (SOL)",
    hint: "The launch buy has to show some size.",
    step: "0.01",
  },
  {
    key: "maxInitialBuySol",
    label: "Max creator buy (SOL)",
    hint: "A huge creator buy can dump the curve.",
    step: "0.1",
  },
  {
    key: "takeProfitMultiple",
    label: "Take profit",
    hint: "Sell when price reaches this multiple of entry.",
    step: "0.05",
  },
  {
    key: "stopLossMultiple",
    label: "Stop loss",
    hint: "Sell when price falls to this multiple of entry.",
    step: "0.05",
  },
  {
    key: "maxHoldMinutes",
    label: "Max hold (minutes)",
    hint: "Sell when the ticket has been open this long.",
    step: "1",
  },
  {
    key: "slippagePercent",
    label: "Slippage (%)",
    hint: "Capped at 25. Wider fills get a worse price.",
    step: "1",
  },
  {
    key: "priorityFeeSol",
    label: "Priority fee (SOL)",
    hint: "Capped at 0.001 SOL.",
    step: "0.00001",
  },
];

export function meta() {
  return [{ title: "Strategy · Aiden" }];
}

export default function Strategy() {
  const { status, snapshot, saveStrategy } = useAgent();
  const [draft, setDraft] = useState<StrategySettings | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [bad, setBad] = useState(false);
  const dirty = useRef(false);
  const remote = snapshot ? JSON.stringify(snapshot.strategy) : "";

  useEffect(() => {
    if (!dirty.current && snapshot) setDraft(snapshot.strategy);
    // remote is the serialized strategy, so a poll with the same values does not reset the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote]);

  if (status === "loading")
    return <p className="text-ink-soft">Opening the desk…</p>;
  if (!snapshot || !draft) {
    return (
      <p className="text-ink-soft">Strategy loads once the agent is running.</p>
    );
  }

  return (
    <section className="max-w-3xl">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">
        Strategy
      </h1>

      <p className="mt-3 max-w-xl text-ink-soft">
        These rules run before the model. A mint that fails them never reaches a
        buy.
      </p>

      <p className="mt-2 font-mono text-sm text-mute">
        Model {snapshot.model}
        {snapshot.hasModelKey ? "" : " · key missing"}
      </p>

      <form
        className="mt-8 grid gap-5 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          setNote(null);
          void saveStrategy(draft)
            .then(() => {
              dirty.current = false;
              setBad(false);
              setNote("Saved.");
            })
            .catch((caught: unknown) => {
              setBad(true);
              setNote(
                caught instanceof Error ? caught.message : "Could not save.",
              );
            });
        }}
      >
        {fields.map((field) => (
          <label key={field.key} className="block text-sm">
            <span className="font-semibold">{field.label}</span>
            <input
              className="mt-1 w-full border border-line bg-paper px-3 py-2 font-mono text-sm"
              type="number"
              step={field.step}
              value={draft[field.key]}
              onChange={(event) => {
                dirty.current = true;
                setDraft({ ...draft, [field.key]: Number(event.target.value) });
              }}
            />
            <span className="mt-1 block text-ink-soft">{field.hint}</span>
          </label>
        ))}

        <div className="flex items-center gap-4 sm:col-span-2">
          <button
            type="submit"
            className="bg-ink px-4 py-2 text-sm font-semibold text-wash"
          >
            Save strategy
          </button>

          {note ? (
            <p className={bad ? "text-sm text-halt" : "text-sm text-fill"}>
              {note}
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
