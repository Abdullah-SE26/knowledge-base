import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BoxesProps {
  className?: string;
  [key: string]: any; // rest props
}

const Boxes: React.FC<BoxesProps> = ({ className, ...rest }) => {
  const dimensions = useMemo(() => ({
    rows: new Array(75).fill(1),
    cols: new Array(50).fill(1),
  }), []);

  const colors = useMemo(() => [
    "#E6E6FF",
    "#B8B8FF",
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
  ], []);

  const getRandomColor = () => {
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div
      style={{
        transform: `translate(-40%,-60%) scale(0.675) rotate(0deg) translateZ(0)`,
      }}
      className={cn(
        "absolute -top-1/4 left-1/4 z-0 flex h-full w-full -translate-x-1/2 -translate-y-1/2 p-4",
        className
      )}
      {...rest}
    >
      {dimensions.rows.map((_, i) => (
        <motion.div
          key={`row${i}`}
          className="relative h-8 w-16 border-l border-slate-200 dark:border-slate-800"
        >
          {dimensions.cols.map((_, j) => (
            <motion.div
              whileHover={{
                backgroundColor: getRandomColor(),
                transition: { duration: 0 },
              }}
              key={`col${j}`}
              className="relative h-8 w-16 border-t border-r border-slate-200 dark:border-slate-800"
            />
          ))}
        </motion.div>
      ))}
    </div>
  );
};

export default React.memo(Boxes);
