"use client";

import React from "react";
import SearchBar from "@/components/SearchBar";
import Image from "next/image";

interface HeroSectionProps {
  onSearch: (query: string) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onSearch }) => {
  return (
    <div
      className="relative min-h-[450px] flex flex-col items-center justify-center px-4 bg-cover bg-center"
      style={{
        backgroundImage: "url('/coolbackgrounds-fractalize-clear_lagoon.png')",
      }}
    >
      {/* Optional dark overlay for text contrast */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Logo */}
      <div className="z-10 mb-6">
        <Image
          src="/logoForDark.svg"
          alt="Logo"
          width={160} // equivalent to w-40
          height={60} // adjust proportionally to your logo
          priority // ensures it loads immediately for above-the-fold content
        />
      </div>

      {/* Title */}
      <div className="z-10 text-center font-bold font-serif text-4xl mb-6 text-white">
        How can we help?
      </div>

      {/* Search Bar */}
      <div className="z-10 w-full max-w-md mb-6">
        <SearchBar onSearch={onSearch} />
      </div>

      {/* Help text */}
      <div className="z-10 mt-4 text-center max-w-md px-4">
        <h5 className="text-sm text-gray-200">
          Can’t find the article you’re looking for?{" "}
          <a
            href="https://helpdesk.mawaridhi.com/support/home"
            className="text-blue-300 underline hover:text-blue-400 transition"
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit IT Help Desk
          </a>{" "}
          and create a ticket for your problem.
        </h5>
      </div>
    </div>
  );
};

export default HeroSection;
