"use client";

import React, { HTMLAttributes } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WarpBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  perspective?: number;
  panelSizePercent?: number; // size of each grid panel in %
  gridColors?: [string, string, string, string]; // top, right, bottom, left colors
}

const WarpBackground: React.FC<WarpBackgroundProps> = ({
  children,
  perspective = 120,
  panelSizePercent = 8,
  gridColors = [
    "rgba(138, 138, 255, 0.12)",
    "rgba(138, 138, 255, 0.12)",
    "rgba(138, 138, 255, 0.12)",
    "rgba(138, 138, 255, 0.12)",
  ],
  className,
  ...props
}) => {
  const [topColor, rightColor, bottomColor, leftColor] = gridColors;

  // Shared style for grid backgrounds (size and grid lines)
  const gridBackgroundStyle = {
    backgroundSize: `${panelSizePercent}% ${panelSizePercent}%`,
    backgroundImage: `
      linear-gradient(${topColor} 0.5px, transparent 0.5px),
      linear-gradient(90deg, ${topColor} 0.5px, transparent 0.5px)
    `,
  };

  return (
    <div
      className={cn("relative rounded p-20", className)}
      style={{ perspective: perspective, WebkitPerspective: perspective }}
      {...props}
    >
      {/* Container for 3D grids */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ perspective: perspective }}
      >
        {/* Top grid */}
        <div
          className="absolute left-0 top-0 w-full"
          style={{
            height: "100vh",
            transformOrigin: "50% 0%",
            transform: "rotateX(-90deg)",
            ...gridBackgroundStyle,
            backgroundImage: `
              linear-gradient(${topColor} 1px, transparent 1px),
              linear-gradient(90deg, ${topColor} 1px, transparent 1px)
            `,
          }}
        />

        {/* Bottom grid */}
        <div
          className="absolute left-0 bottom-0 w-full"
          style={{
            height: "100vh",
            transformOrigin: "50% 100%",
            transform: "rotateX(90deg)",
            ...gridBackgroundStyle,
            backgroundImage: `
              linear-gradient(${bottomColor} 1px, transparent 1px),
              linear-gradient(90deg, ${bottomColor} 1px, transparent 1px)
            `,
          }}
        />

        {/* Left grid */}
        <div
          className="absolute left-0 top-0 h-full"
          style={{
            width: "100vh",
            transformOrigin: "0% 50%",
            transform: "rotateY(90deg)",
            ...gridBackgroundStyle,
            backgroundImage: `
              linear-gradient(${leftColor} 1px, transparent 1px),
              linear-gradient(90deg, ${leftColor} 1px, transparent 1px)
            `,
          }}
        />

        {/* Right grid */}
        <div
          className="absolute right-0 top-0 h-full"
          style={{
            width: "100vh",
            transformOrigin: "100% 50%",
            transform: "rotateY(-90deg)",
            ...gridBackgroundStyle,
            backgroundImage: `
              linear-gradient(${rightColor} 1px, transparent 1px),
              linear-gradient(90deg, ${rightColor} 1px, transparent 1px)
            `,
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default WarpBackground;
