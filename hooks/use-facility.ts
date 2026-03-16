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

  const hubs = useQuery(
    api.onboarding.listHubs,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const activeHub =
    hubs && currentUser?.activeFacilityId
      ? hubs.find((h) => h.serialNumber === currentUser.activeFacilityId) ?? hubs[0]
      : hubs?.[0] ?? null;

  const rooms: string[] = (() => {
    if (!activeHub?.facilityRooms) return [];
    try {
      return JSON.parse(activeHub.facilityRooms);
    } catch {
      return [];
    }
  })();

  return {
    activeHub,
    facilityName: activeHub?.facilityName ?? null,
    facilityType: activeHub?.facilityType ?? null,
    rooms,
    isLoading: currentUser === undefined || hubs === undefined,
  };
}
