"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Keeps the Convex user record in sync with Clerk (identity comes from the JWT).
export function useStoreUserEffect() {
  const { user, isLoaded } = useUser();
  const storeUser = useMutation(api.users.storeUser);

  useEffect(() => {
    if (!isLoaded || !user) return;
    storeUser({
      email: user.primaryEmailAddress?.emailAddress || "",
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      imageUrl: user.imageUrl || undefined,
    }).catch((error) => console.error("Error syncing user to Convex:", error));
  }, [user, isLoaded, storeUser]);
}
