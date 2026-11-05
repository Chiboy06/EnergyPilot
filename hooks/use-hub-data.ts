"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useFacility } from "./use-facility";
import { isFresh } from "@/lib/circuit-status";

// Re-renders every few seconds so "stale" shows even when no new data arrives.
function useNow(intervalMs = 5000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function useHubData() {
  const {
    activeHub,
    activeFacility,
    facilityName,
    facilityType,
    isLoading: facilityLoading,
  } = useFacility();

  const hubId = activeHub?._id;
  const now = useNow();

  const hubState = useQuery(api.telemetry.getHubState, hubId ? { hubId } : "skip");
  const circuitStates = useQuery(api.telemetry.getCircuitStates, hubId ? { hubId } : "skip");
  const hubReadings = useQuery(api.telemetry.getHubReadings, hubId ? { hubId, limit: 60 } : "skip");
  const relayStates = useQuery(api.relay.getRelayStates, hubId ? { hubId } : "skip");

  const sendCommand = useMutation(api.relay.sendCommand);

  // Relays with no stored state are absent from the map → "unknown", never assumed on/off.
  const relayStateMap: Record<number, boolean> = Object.fromEntries(
    (relayStates ?? []).map((rs) => [rs.relayNum, rs.state])
  );
  const relayPendingMap: Record<number, boolean> = Object.fromEntries(
    (relayStates ?? []).map((rs) => [rs.relayNum, !!rs.pending])
  );

  const lastUpdated = hubState?.lastUpdated ?? null;

  return {
    hubState: hubState ?? null,
    circuitStates: circuitStates ?? [],
    hubReadings: hubReadings ?? [],
    relayStates: relayStates ?? [],
    relayStateMap,
    relayPendingMap,
    sendCommand,
    breakerCapacity: activeFacility?.breakerCapacity ?? null,
    facilityName,
    facilityType,
    activeHub,
    userRole: activeHub?.role ?? "owner",
    lastUpdated,
    isFresh: isFresh(lastUpdated, now),
    now,
    isLoading:
      facilityLoading ||
      (!!hubId && (hubState === undefined || circuitStates === undefined)),
    hasHub: !!hubId,
  };
}
