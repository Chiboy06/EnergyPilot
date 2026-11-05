// One rule for circuit load and status, shared by every web view.
// Load % uses measured current against the circuit's configured rating (maxAmps),
// so it needs no voltage or power-factor assumption. No rating → no percentage.

export const HIGH_LOAD_PCT = 85;
export const STALE_AFTER_MS = 30_000;

export type CircuitStatus = "HIGH LOAD" | "ACTIVE" | "IDLE" | "NO DATA";

export function circuitLoad(c: { currentAmps: number; maxAmps?: number; hasReading?: boolean }): {
  pct: number | null;
  status: CircuitStatus;
} {
  if (c.hasReading === false) return { pct: null, status: "NO DATA" };
  const pct = c.maxAmps && c.maxAmps > 0 ? Math.round((c.currentAmps / c.maxAmps) * 100) : null;
  if (pct !== null && pct >= HIGH_LOAD_PCT) return { pct, status: "HIGH LOAD" };
  return { pct, status: c.currentAmps > 0 ? "ACTIVE" : "IDLE" };
}

export const STATUS_LEGEND: { status: CircuitStatus; meaning: string }[] = [
  { status: "HIGH LOAD", meaning: `current at or above ${HIGH_LOAD_PCT}% of the circuit's configured rating` },
  { status: "ACTIVE",    meaning: "drawing current" },
  { status: "IDLE",      meaning: "no current measured" },
  { status: "NO DATA",   meaning: "the hub hasn't reported this channel" },
];

export const STATUS_COLOR: Record<CircuitStatus, string> = {
  "HIGH LOAD": "rgba(255,181,71,1)",
  ACTIVE:      "#18e39a",
  IDLE:        "rgba(148,163,184,0.9)",
  "NO DATA":   "rgba(148,163,184,0.7)",
};

export function isFresh(lastUpdated: number | null | undefined, now: number): boolean {
  return !!lastUpdated && now - lastUpdated < STALE_AFTER_MS;
}

export function formatClock(ms: number): string {
  return new Date(ms).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
