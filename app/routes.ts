import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/dashboard.tsx"),
    route("strategy", "routes/strategy.tsx"),
    route("trades", "routes/trades.tsx"),
    route("risk", "routes/risk.tsx"),
    route("logs", "routes/logs.tsx"),
  ]),
] satisfies RouteConfig;
