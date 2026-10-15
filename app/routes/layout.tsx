import { NavLink, Outlet } from "react-router";
import { AgentProvider, useAgent } from "../lib/agent";
import { pnlClass, shortKey, signedSol, sol } from "../lib/format";
import { useState } from "react";
import { MenuBarClose, MenuBarOpen } from "~/components/menu-buttons";

const links = [
  { to: "/", label: "Desk", end: true },
  { to: "/strategy", label: "Strategy", end: false },
  { to: "/trades", label: "Trades", end: false },
  { to: "/risk", label: "Limits", end: false },
  { to: "/logs", label: "Log", end: false },
];

export default function Layout() {
  return (
    <AgentProvider>
      <div className="min-h-screen">
        <DeskHeader />

        <main className="mx-auto w-full max-w-6xl px-5 pt-8 pb-20">
          <Outlet />
        </main>
      </div>
    </AgentProvider>
  );
}

function DeskHeader() {
  const { status, snapshot, error, halt } = useAgent();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen((prev) => (prev ? false : !prev));

  const ready = status === "ready" && snapshot;

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-wash">
      {ready && snapshot.mode === "live" ? (
        <p className="bg-curve px-5 py-2 text-center text-sm font-semibold text-night">
          Live wallet. A buy spends real SOL.
        </p>
      ) : null}

      <div className="mx-auto w-full max-w-6xl flex flex-col md:flex-row justify-between gap-x-8 gap-y-3 px-5 py-4">
        <div className="w-full md:w-max flex justify-between items-center gap-x-8">
          <NavLink to="/" end className="font-display text-4xl leading-none">
            Aiden
            <span
              className={`ml-2 inline-block h-2 w-2 translate-y-[-3px] rounded-full ${
                ready && snapshot.feed.connected ? "bg-curve lamp" : "bg-mute"
              }`}
            />
          </NavLink>

          <button
            type="button"
            onClick={toggleMenu}
            className="relative z-20 md:hidden"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <MenuBarClose /> : <MenuBarOpen />}
          </button>

          <nav
            data-hidden={!isMenuOpen}
            className="fixed md:relative top-0 left-0 w-full md:w-auto bg-wash h-full md:h-auto bg-wash md:bg-transparent flex flex-col justify-center items-center md:justify-start md:items-start md:flex-row gap-x-5 gap-y-1 text-[24px] md:text-sm font-semibold data-[hidden=true]:hidden md:data-[hidden=true]:flex"
          >
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  isActive
                    ? "border-b-2 border-curve pb-0.5 text-ink w-min"
                    : "pb-0.5 text-ink-soft w-min"
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {ready ? (
            <>
              <span
                className={
                  snapshot.mode === "live"
                    ? "border border-curve px-2 py-0.5 font-mono text-xs tracking-wide text-curve-deep"
                    : "border border-line px-2 py-0.5 font-mono text-xs tracking-wide text-mute"
                }
              >
                {snapshot.mode}
              </span>

              <span className="font-mono text-ink-soft shrink-0">
                {snapshot.wallet.publicKey
                  ? shortKey(snapshot.wallet.publicKey)
                  : "No wallet"}
                {snapshot.wallet.sol != null
                  ? ` · ${sol(snapshot.wallet.sol, 3)}`
                  : ""}
              </span>

              <span
                className={`font-mono ${pnlClass(snapshot.pnl.daySol)} shrink-0`}
              >
                {signedSol(snapshot.pnl.daySol)}
                <span className="ml-1 text-mute">today</span>
              </span>

              <button
                type="button"
                onClick={() => void halt(!snapshot.halted)}
                className={
                  snapshot.halted
                    ? "border border-ink bg-transparent px-3 py-1.5 text-sm font-semibold text-ink"
                    : "border border-halt bg-transparent px-3 py-1.5 text-sm font-semibold text-halt"
                }
              >
                {snapshot.halted ? "Resume buys" : "Halt buys"}
              </button>
            </>
          ) : (
            <span className="font-mono text-xs text-mute">
              {status === "loading" ? "Opening" : "Agent off"}
            </span>
          )}
        </div>
      </div>

      {error ? <p className="px-5 pb-3 text-sm text-halt">{error}</p> : null}
    </header>
  );
}
