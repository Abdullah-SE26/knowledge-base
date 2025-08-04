"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const BoxesComponent: React.FC<{ className?: string }> = ({ className }) => {
  const rows = useMemo(() => Array.from({ length: 75 }), []);
  const cols = useMemo(() => Array.from({ length: 50 }), []);
  const colors = useMemo(
    () => [
      "#E6E6FF", "#B8B8FF", "#8A8AFF", "#5C5CFF", "#2E2EFF", "#0000FF",
      "#0000D1", "#0000A3", "#00008B", "#000047", "#00001A",
    ],
    []
  );

  const getRandomColor = () =>
    colors[Math.floor(Math.random() * colors.length)];

  return (
    <div
      className={cn(
        "absolute -top-1/4 left-1/4 z-0 flex h-full w-full -translate-x-1/2 -translate-y-1/2 p-4",
        className
      )}
      style={{
        transform: "translate(-40%,-60%) scale(0.675) rotate(0deg) translateZ(0)",
      }}
    >
      {rows.map((_, rowIdx) => (
        <div
          key={`row-${rowIdx}`}
          className="relative h-8 w-16 border-l border-slate-200 dark:border-slate-800"
        >
          {cols.map((_, colIdx) => (
            <motion.div
              key={`col-${colIdx}`}
              whileHover={{
                backgroundColor: getRandomColor(),
                transition: { duration: 0 },
              }}
              className="relative h-8 w-16 border-t border-r border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const Boxes = React.memo(BoxesComponent);
