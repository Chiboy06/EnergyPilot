"use client";

import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";

export function useFacility() {
  const { user } = useUser();

  const currentUser = useQuery(
    api.users.getCurrentUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const facilities = useQuery(
    api.onboarding.listFacilities,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const hubs = useQuery(
    api.onboarding.listHubs,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const activeFacility =
    facilities?.find((f) => f._id === currentUser?.activeFacilityId) ??
    facilities?.[0] ??
    null;

  const activeHub = hubs?.[0] ?? null;

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
