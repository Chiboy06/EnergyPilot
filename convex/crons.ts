// convex/crons.ts
// Scheduled jobs — registered here, Convex runs them automatically.

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily forecast generation — 01:00 WAT (00:00 UTC).
// Schedules one forecast per recently active hub.
crons.cron("generate forecasts", "0 0 * * *", internal.forecasts.generateForAllHubs, {});

export default crons;
