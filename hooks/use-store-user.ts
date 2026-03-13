"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useStoreUserEffect() {
  const { user, isLoaded } = useUser();
  const storeUser = useMutation(api.users.storeUser);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) return;

    const syncUser = async () => {
      try {
        await storeUser({
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress || "",
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          imageUrl: user.imageUrl || undefined,
        });
      } catch (error) {
        console.error("Error syncing user to Convex:", error);
      }
    };

    syncUser();
  }, [user, isLoaded, storeUser]);
}
