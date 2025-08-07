"use client";

import React from "react";
import WarpBackground from "@/components/magicui/warp-background";
import SearchBar from "@/components/SearchBar";
import LogoSwitcher from "./LogoSwitcher";

interface HeroSectionProps {
  onSearch: (query: string) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onSearch }) => {
  return (
    <WarpBackground
      className="relative min-h-[450px] flex flex-col items-center justify-center
        bg-white dark:bg-[#0f0f0f] px-4"
      perspective={120}
      panelSizePercent={8}
      gridColors={[
        "rgba(138, 138, 255, 0.25)", // top
        "rgba(138, 138, 255, 0.25)", // right
        "rgba(138, 138, 255, 0.25)", // bottom
        "rgba(138, 138, 255, 0.25)", // left
      ]}
    >
      <div className="z-50">
        <LogoSwitcher />
      </div>

      <div className="z-10 text-center font-bold font-serif text-4xl mb-6 text-gray-900 dark:text-white">
        How can we help?
      </div>

      <div className="z-10 w-full max-w-md mb-6">
        <SearchBar onSearch={onSearch} />
      </div>

      <div className="z-10 mt-4 text-center max-w-md px-4">
        <h5 className="text-sm text-gray-600 dark:text-gray-400">
          Can’t find the article you’re looking for?{" "}
          <a
            href="https://helpdesk.mawaridhi.com/support/home"
            className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 transition"
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit IT Help Desk
          </a>{" "}
          and create a ticket for your problem.
        </h5>
      </div>
    </WarpBackground>
  );
};

export default HeroSection;
