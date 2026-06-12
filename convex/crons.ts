// convex/crons.ts
// Scheduled jobs — registered here, Convex runs them automatically.

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily forecast generation — runs at 01:00 WAT (00:00 UTC)
// Iterates all active hubs and enqueues a forecast for each.
crons.daily(
  "generate forecasts",
  { hourUTC: 0, minuteUTC: 0 },
  internal.forecasts.generateForAllHubs
);

export default crons;
