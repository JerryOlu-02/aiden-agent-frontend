export type Mode = "paper" | "live";

export type StrategySettings = {
  buySizeSol: number;
  minMarketCapSol: number;
  maxMarketCapSol: number;
  minInitialBuySol: number;
  maxInitialBuySol: number;
  minConfidence: number;
  takeProfitMultiple: number;
  stopLossMultiple: number;
  maxHoldMinutes: number;
  slippagePercent: number;
  priorityFeeSol: number;
};

export type RiskLimits = {
  maxSolPerTrade: number;
  maxOpenPositions: number;
  dailyLossLimitSol: number;
};

export type RiskSettings = RiskLimits & {
  ceilings: RiskLimits;
};

export type PositionView = {
  id: number;
  mint: string;
  symbol: string;
  name: string;
  status: "pending" | "open" | "closed" | "failed";
  entrySol: number;
  entryPrice: number;
  markPrice: number | null;
  tokens: number;
  openedAt: number;
  closedAt: number | null;
  exitSol: number | null;
  exitReason: string | null;
  pnlSol: number | null;
  multiple: number | null;
  tpMultiple: number;
  slMultiple: number;
  maxHoldMinutes: number;
  thesis: string;
  dryRun: boolean;
  signature: string | null;
  error: string | null;
};

export type CandidateView = {
  mint: string;
  symbol: string;
  name: string;
  action: "buy" | "pass" | "skip";
  thesis: string;
  marketCapSol: number;
  initialBuySol: number;
  at: number;
};

export type TradeView = {
  id: number;
  mint: string;
  symbol: string;
  side: "buy" | "sell";
  solAmount: number;
  signature: string | null;
  dryRun: boolean;
  status: string;
  createdAt: number;
  error: string | null;
};

export type LogView = {
  id: number;
  level: "info" | "warn" | "error";
  message: string;
  createdAt: number;
};

export type Snapshot = {
  mode: Mode;
  halted: boolean;
  model: string;
  hasModelKey: boolean;
  wallet: { publicKey: string | null; sol: number | null };
  solUsd: number | null;
  startedAt: number;
  lastDecision: {
    at: number;
    mint: string;
    symbol: string;
    name: string;
    action: "buy" | "pass" | "skip";
    thesis: string;
  } | null;
  positions: PositionView[];
  candidates: CandidateView[];
  pnl: { daySol: number; openSol: number };
  risk: RiskSettings;
  strategy: StrategySettings;
  usage: { openPositions: number; dayLossSol: number };
  feed: { connected: boolean; seen: number; queued: number };
  now: number;
};

export type Book = {
  fills: TradeView[];
  closed: PositionView[];
};
