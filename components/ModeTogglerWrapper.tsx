"use client";

import dynamic from "next/dynamic";

// Disable SSR because ModeToggle uses useTheme()
const ModeToggle = dynamic(() => import("./ModeToggle"), { ssr: false });

export default function ModeToggleWrapper() {
  return <ModeToggle />;
}
