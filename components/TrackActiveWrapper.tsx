// app/components/TrackActiveWrapper.tsx
"use client";

import useTrackActive from "@/app/hooks/useTrackActive"; // <-- correct import path

export default function TrackActiveWrapper({ children }: { children: React.ReactNode }) {
  useTrackActive(); // hook runs here

  return <>{children}</>;
}
