"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useFacility } from "./use-facility";

export function useHubData() {
  const {
    activeHub,
    activeFacility,
    facilityName,
    facilityType,
    isLoading: facilityLoading,
  } = useFacility();

  const hubId = activeHub?._id;

  const hubState = useQuery(
    api.telemetry.getHubState,
    hubId ? { hubId } : "skip"
  );

  const circuitStates = useQuery(
    api.telemetry.getCircuitStates,
    hubId ? { hubId } : "skip"
  );

  const hubReadings = useQuery(
    api.telemetry.getHubReadings,
    hubId ? { hubId, limit: 48 } : "skip"
  );

  const relayStates = useQuery(
    api.relay.getRelayStates,
    hubId ? { hubId } : "skip"
  );

  const sendCommand = useMutation(api.relay.sendCommand);

  const breakerCapacity = activeFacility?.breakerCapacity ?? 20;

  const relayStateMap: Record<number, boolean> = Object.fromEntries(
    (relayStates ?? []).map((rs) => [rs.relayNum, rs.state])
  );

  const userRole: 'owner' | 'controller' | 'viewer' = (activeHub as any)?.role ?? 'owner';

  return {
    hubState: hubState ?? null,
    circuitStates: circuitStates ?? [],
    hubReadings: hubReadings ?? [],
    relayStates: relayStates ?? [],
    relayStateMap,
    sendCommand,
    breakerCapacity,
    facilityName,
    facilityType,
    activeHub,
    userRole: activeHub ? userRole : 'owner',
    isLoading:
      facilityLoading ||
      (!!hubId && (hubState === undefined || circuitStates === undefined)),
    hasHub: !!hubId,
  };
}
