"use client";

import dynamic from "next/dynamic";
import React from "react";

// Dynamically import with SSR disabled
const GraphsSection = dynamic(() => import("./GraphsSection"), {
  ssr: false,
});

export default function GraphsClientWrapper() {
  return <GraphsSection />;
}
