import { useEffect, useRef, useState } from "react";
import type { Route } from "./+types/dashboard";
import { useAgent } from "../lib/agent";
import {
  clock,
  held,
  multiple,
  pnlClass,
  shortKey,
  signedSol,
  sol,
  ticker,
} from "../lib/format";
import type { Snapshot } from "../lib/types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Desk · Aiden" },
    {
      name: "description",
      content: "Aiden watches Pump.fun and trades from this desk.",
    },
  ];
}

export default function Dashboard() {
  const { status, snapshot } = useAgent();
  const ready = status === "ready" && snapshot;

  return (
    <div>
      <Hero snapshot={ready ? snapshot : null} status={status} />
      {ready ? <Desk snapshot={snapshot} /> : null}
    </div>
  );
}

function Hero({
  snapshot,
  status,
}: {
  snapshot: Snapshot | null;
  status: "loading" | "ready" | "offline";
}) {
  const plate = plateFor(snapshot, status);
  const open = snapshot?.usage.openPositions ?? 0;
  const cap = snapshot?.risk.maxOpenPositions ?? 0;
  const fill = cap > 0 ? Math.max(0, Math.min(100, (open / cap) * 100)) : 0;

  return (
    <section className="grid items-start gap-8 lg:grid-cols-[minmax(16rem,0.78fr)_minmax(0,1.22fr)]">
      <div className="order-2 lg:order-1 sticky top-[80px]">
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-xs tracking-[0.16em] text-screen">
            Day trader
          </p>

          <a
            className="font-mono text-xs tracking-wide text-curve"
            href="https://x.com/AidenDayTrader"
            target="_blank"
            rel="noreferrer"
          >
            Aiden on X
          </a>
        </div>

        <h1 className="mt-2 font-display text-7xl leading-[0.8] sm:text-8xl">
          Aiden
        </h1>

        <p className="mt-4 max-w-md text-lg text-ink-soft">{plate.aside}</p>

        {snapshot ? (
          <div className="mt-6 max-w-sm">
            <div className="flex justify-between font-mono text-xs text-mute">
              <span>Open tickets</span>
              <span>
                {open} / {cap}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 bg-line">
              <div className="h-full bg-curve" style={{ width: `${fill}%` }} />
            </div>
          </div>
        ) : null}

        {snapshot ? (
          <dl className="mt-8 grid max-w-lg grid-cols-2 gap-px bg-line">
            <Stat
              label="Today"
              value={signedSol(snapshot.pnl.daySol)}
              className={pnlClass(snapshot.pnl.daySol)}
            />
            <Stat
              label="Open pnl"
              value={signedSol(snapshot.pnl.openSol)}
              className={pnlClass(snapshot.pnl.openSol)}
            />
            <Stat
              label="Tape"
              value={snapshot.feed.connected ? "Live" : "Reconnecting"}
              className={snapshot.feed.connected ? "text-screen" : "text-halt"}
            />
            <Stat label="Seen" value={`${snapshot.feed.seen}`} />
          </dl>
        ) : null}
      </div>

      <figure className="hero-stage order-1 lg:order-2">
        <div className="hero-glow" aria-hidden="true" />
        <HeroMedia />

        <figcaption className="relative z-10 px-1 pt-4" aria-live="polite">
          <p className={`font-display text-3xl leading-none ${plate.tone}`}>
            {plate.word}
          </p>
          <p className="mt-1 text-sm text-ink-soft">{plate.line}</p>
          {plate.detail ? (
            <p className="mt-1 font-mono text-xs text-mute">{plate.detail}</p>
          ) : null}
        </figcaption>
      </figure>
    </section>
  );
}

function HeroMedia() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [useStill, setUseStill] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setUseStill(true);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    const start = () => {
      void video.play().catch(() => setUseStill(true));
    };
    if (video.readyState >= 2) start();
    else video.addEventListener("canplay", start, { once: true });
    return () => video.removeEventListener("canplay", start);
  }, []);

  return (
    <div className="hero-media">
      <img
        src="/aiden-trading.png"
        alt="Aiden in a hoodie at a night desk, hands on the keys, candlestick charts across three monitors"
        className="hero-still"
      />
      {useStill ? null : (
        <video
          ref={videoRef}
          className={playing ? "hero-video is-on" : "hero-video"}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/aiden-trading.png"
          aria-hidden="true"
          onPlaying={() => setPlaying(true)}
          onError={() => setUseStill(true)}
        >
          <source src="/aiden-trading.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  );
}

function Desk({ snapshot }: { snapshot: Snapshot }) {
  return (
    <div className="mt-12 grid items-start gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
      <section>
        <h2 className="font-display text-3xl">Open tickets</h2>

        <TicketList snapshot={snapshot} />
      </section>

      <aside>
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-3xl font-bold">Tape</h2>

          <p
            className={`font-mono text-xs ${snapshot.feed.connected ? "text-screen" : "text-halt"}`}
          >
            {snapshot.feed.connected ? "Connected" : "Reconnecting"}
          </p>
        </div>

        {!snapshot.hasModelKey ? (
          <p className="mt-3 text-sm text-halt">
            No OpenRouter key. Mints are screened, then passed.
          </p>
        ) : null}
        <ol className="mt-4 divide-y divide-line border-y border-line">
          {snapshot.candidates.length === 0 ? (
            <li className="py-6 text-sm text-ink-soft">
              The tape is quiet. New Pump.fun mints land here.
            </li>
          ) : (
            snapshot.candidates.slice(0, 12).map((candidate) => (
              <li
                key={candidate.mint}
                className="grid grid-cols-[6.5rem_1fr] gap-3 py-3"
              >
                <time className="font-mono text-xs whitespace-nowrap text-mute">
                  {clock(candidate.at)}
                </time>

                <div>
                  <p className="flex items-baseline gap-2">
                    <a
                      className="font-display text-lg hover:text-screen"
                      href={`https://pump.fun/coin/${candidate.mint}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {ticker(candidate.symbol)}
                    </a>

                    <span
                      className={`font-mono text-xs ${actionClass(candidate.action)}`}
                    >
                      {candidate.action}
                    </span>

                    <span className="ml-auto font-mono text-xs text-curve-deep">
                      {candidate.marketCapSol.toFixed(1)} SOL
                    </span>
                  </p>

                  <p className="mt-0.5 text-sm text-ink-soft">
                    {candidate.thesis}
                  </p>
                </div>
              </li>
            ))
          )}
        </ol>
      </aside>
    </div>
  );
}

function TicketList({ snapshot }: { snapshot: Snapshot }) {
  const { sell } = useAgent();
  const [armed, setArmed] = useState<number | null>(null);
  const [selling, setSelling] = useState<number | null>(null);
  const [sellError, setSellError] = useState<string | null>(null);

  if (snapshot.positions.length === 0) {
    return (
      <p className="mt-4 max-w-md text-ink-soft">
        {snapshot.halted
          ? "No open tickets. Buys stay off until you resume."
          : "No open tickets. A mint has to clear strategy, then the model has to say buy."}
      </p>
    );
  }

  return (
    <ol className="mt-4 grid gap-3">
      {snapshot.positions.map((position) => (
        <li
          key={position.id}
          className="border border-line border-l-[3px] border-l-curve bg-paper px-4 py-3"
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <a
              className="font-display text-2xl hover:text-screen"
              href={`https://pump.fun/coin/${position.mint}`}
              target="_blank"
              rel="noreferrer"
            >
              {ticker(position.symbol)}
            </a>

            <span className={`font-mono text-sm ${pnlClass(position.pnlSol)}`}>
              {signedSol(position.pnlSol)}
            </span>

            <span className="font-mono text-sm text-ink-soft">
              {multiple(position.multiple)}
            </span>

            <span className="ml-auto font-mono text-xs text-mute">
              {position.status === "pending"
                ? "Sending"
                : held(position.openedAt, snapshot.now)}
              {position.dryRun ? " · paper" : " · live"}
            </span>
          </div>

          <p className="mt-1 text-sm text-ink-soft">{position.thesis}</p>

          <p className="mt-2 font-mono text-xs text-mute">
            In {sol(position.entrySol)} · take profit{" "}
            {multiple(position.tpMultiple)} · stop{" "}
            {multiple(position.slMultiple)} · {position.maxHoldMinutes}m
          </p>

          {position.status === "open" ? (
            <div className="mt-3">
              {armed === position.id ? (
                <button
                  type="button"
                  disabled={selling === position.id}
                  onClick={() => {
                    setSelling(position.id);
                    setSellError(null);
                    void sell(position.id)
                      .catch((caught: unknown) => {
                        setSellError(
                          caught instanceof Error
                            ? caught.message
                            : "Sell failed.",
                        );
                      })
                      .finally(() => {
                        setSelling(null);
                        setArmed(null);
                      });
                  }}
                  className="border border-halt bg-transparent px-3 py-1.5 text-sm font-semibold text-halt"
                >
                  {selling === position.id ? "Selling…" : "Confirm sell"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setArmed(position.id)}
                  className="border border-ink bg-transparent px-3 py-1.5 text-sm font-semibold"
                >
                  Sell
                </button>
              )}
            </div>
          ) : null}
        </li>
      ))}
      {sellError ? <p className="text-sm text-halt">{sellError}</p> : null}
    </ol>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="bg-paper px-3 py-3">
      <dt className="text-xs text-mute">{label}</dt>

      <dd className={`mt-1 font-mono text-sm ${className ?? "text-ink"}`}>
        {value}
      </dd>
    </div>
  );
}

function plateFor(
  snapshot: Snapshot | null,
  status: "loading" | "ready" | "offline",
) {
  if (status === "loading" || (status === "ready" && !snapshot)) {
    return {
      word: "Opening",
      line: "Connecting to the desk.",
      aside: "The desk is connecting.",
      detail: null,
      tone: "text-mute",
    };
  }

  if (!snapshot) {
    return {
      word: "Offline",
      line: "The desk cannot reach the agent.",
      aside: "From apps/agent, run pnpm start. The desk reads 127.0.0.1:8787.",
      detail: null,
      tone: "text-halt",
    };
  }

  const decision = snapshot.lastDecision;

  if (snapshot.halted) {
    return {
      word: "Halted",
      line: "Buys are off. Open tickets can still be sold.",
      aside: decision
        ? `Last call ${clock(decision.at)} · ${decision.action} ${ticker(decision.symbol)}. ${decision.thesis}`
        : "Resume buys when you want him back on the tape.",
      detail: null,
      tone: "text-halt",
    };
  }

  if (!decision) {
    return {
      word: "Watching",
      line: snapshot.hasModelKey
        ? "On the tape. A pass or a buy shows up here."
        : "The tape is moving. Add an OpenRouter key before he can buy.",
      aside: snapshot.hasModelKey
        ? "New mints are screened, then he decides."
        : "Screening still runs. Buys wait on the key.",
      detail: null,
      tone: "text-screen",
    };
  }

  const detail = `${clock(decision.at)} · ${ticker(decision.symbol)} · ${shortKey(decision.mint)}`;

  if (decision.action === "buy") {
    return {
      word: "Bought",
      line: decision.thesis,
      aside: "The ticket is in the list below.",
      detail,
      tone: "text-fill",
    };
  }

  if (decision.action === "pass") {
    return {
      word: "Passed",
      line: decision.thesis,
      aside:
        snapshot.positions.length > 0
          ? "The last mint was a pass. Open tickets stay in the list."
          : "No ticket was opened.",
      detail,
      tone: "text-ink",
    };
  }

  return {
    word: "Skipped",
    line: decision.thesis,
    aside:
      snapshot.positions.length > 0
        ? "The last mint was skipped. Open tickets stay in the list."
        : "It did not reach a buy.",
    detail,
    tone: "text-mute",
  };
}

function actionClass(action: "buy" | "pass" | "skip") {
  if (action === "buy") return "text-fill";
  if (action === "pass") return "text-ink-soft";
  return "text-mute";
}
