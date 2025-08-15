"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function useTrackActive() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.email) return; // Only track for logged-in users

    const track = async () => {
      try {
        await fetch("/api/users/track-active", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        console.error("[useTrackActive] Failed to update lastActive:", err);
      }
    };

    // Initial ping
    track();

    // Set interval to ping every 5 minutes
    const interval = setInterval(track, 5 * 60 * 1000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [session]);
}
