// components/ui/use-toast.ts
"use client";

import { toast as hotToast } from "react-hot-toast";

export function useToast() {
  return (options: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => {
    const { title, description, variant } = options;

    if (variant === "destructive") {
      hotToast.error(`${title}${description ? `: ${description}` : ""}`);
    } else {
      hotToast.success(`${title}${description ? `: ${description}` : ""}`);
    }
  };
}
