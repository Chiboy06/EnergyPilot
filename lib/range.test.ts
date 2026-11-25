import { expect, test } from "vitest";
import { calendarMonth, lastDays, recentMonths } from "./range";

// 2026-11-25 12:00 WAT
const NOW = Date.UTC(2026, 10, 25, 11, 0, 0) / 1000;

test("calendar months start and end at WAT midnight", () => {
  const oct = calendarMonth(NOW, "2026-10");
  expect(new Date((oct.from + 3600) * 1000).toISOString()).toBe("2026-10-01T00:00:00.000Z");
  expect(new Date((oct.to + 1 + 3600) * 1000).toISOString()).toBe("2026-11-01T00:00:00.000Z");
  expect(oct.label).toBe("October 2026");
});

test("the current month ends now, not in the future", () => {
  expect(calendarMonth(NOW, "2026-11").to).toBe(NOW);
});

test("recent months cross the year boundary, newest first", () => {
  const jan = Date.UTC(2027, 0, 10) / 1000;
  expect(recentMonths(jan, 3)).toEqual(["2027-01", "2026-12", "2026-11"]);
});

test("last N days", () => {
  expect(lastDays(NOW, 7)).toMatchObject({ from: NOW - 7 * 86400, to: NOW, label: "the last 7 days" });
});
