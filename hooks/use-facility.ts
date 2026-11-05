"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useFacility() {
  const currentUser = useQuery(api.users.getMe, {});
  const facilities = useQuery(api.onboarding.listFacilities, {});
  const hubs = useQuery(api.onboarding.listHubs, {});

  const activeFacility =
    facilities?.find((f) => f._id === currentUser?.activeFacilityId) ??
    facilities?.[0] ??
    null;

  // The hub in the active facility (owned or shared), else the first one.
  const activeHub =
    hubs?.find((h) => h.facilityId === activeFacility?._id) ?? hubs?.[0] ?? null;

  return {
    activeHub,
    activeFacility,
    facilityName: activeFacility?.name ?? null,
    facilityType: activeFacility?.type ?? null,
    rooms: activeFacility?.rooms ?? [],
    isLoading:
      currentUser === undefined ||
      hubs === undefined ||
      facilities === undefined,
  };
}
