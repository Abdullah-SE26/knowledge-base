"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const BoxesCore = ({ className }: { className?: string }) => {
  const rows = 30;
  const cols = 30;
  const totalBoxes = rows * cols;

  const colors = [
    "#E6E6FF",
    "#B8B8FF",
    "#8A8AFF",
    "#5C5CFF",
    "#2E2EFF",
    "#0000FF",
    "#0000D1",
    "#0000A3",
    "#00008B",
    "#000047",
    "#00001A",
  ];

  const getRandomColor = () =>
    colors[Math.floor(Math.random() * colors.length)];

  return (
    <div
      className={cn(
        "absolute inset-0 z-0 pointer-events-none overflow-hidden",
        className
      )}
    >
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {[...Array(totalBoxes)].map((_, i) => {
          const delay = (i % cols) * 0.05;

          return (
            <motion.div
              key={i}
              className="w-6 h-6 border border-slate-200 dark:border-slate-800"
              initial={{ backgroundColor: getRandomColor() }}
              animate={{
                backgroundColor: getRandomColor(),
              }}
              
            />
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(BoxesCore);
