// Reporting ranges in Unix seconds. Calendar boundaries follow WAT (UTC+1, no DST),
// matching the daily energy rollups on the server.

const WAT_OFFSET = 3600;

export type Range = { from: number; to: number; label: string; key: string };

export function lastDays(nowSec: number, days: number): Range {
  return { from: nowSec - days * 86400, to: nowSec, label: `the last ${days} days`, key: `d${days}` };
}

// month = "YYYY-MM". The current month ends now; past months end at their last second.
export function calendarMonth(nowSec: number, month: string): Range {
  const [y, m] = month.split("-").map(Number);
  const from = Date.UTC(y, m - 1, 1) / 1000 - WAT_OFFSET;
  const next = Date.UTC(y, m, 1) / 1000 - WAT_OFFSET;
  const label = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  return { from, to: Math.min(next - 1, nowSec), label, key: `m${month}` };
}

// The current WAT month and the `count - 1` months before it, newest first.
export function recentMonths(nowSec: number, count: number): string[] {
  const d = new Date((nowSec + WAT_OFFSET) * 1000);
  return Array.from({ length: count }, (_, i) => {
    const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1));
    return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}
