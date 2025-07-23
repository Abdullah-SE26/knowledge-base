"use client";

import React from "react";
import { Boxes } from "@/components/ui/background-boxes";
import SearchBar from "@/components/SearchBar";
import LogoSwitcher from "./LogoSwitcher";
import Link from "next/link";

const HeroSection = () => {
  return (
    <div className="relative h-[450px] overflow-hidden flex flex-col items-center justify-center bg-white dark:bg-[#0f0f0f]">
      
      <Boxes />

      <div className="z-50">
        <LogoSwitcher />
      </div>

      <div className="z-10 text-center font-bold font-serif text-4xl mb-6">
        How can we help?
      </div>

      <div className="z-10 w-full max-w-md px-4">
        <SearchBar
          placeholder="Search articles..."
          aria-label="Search articles"
        />
      </div>

      <div className="z-10 mt-4 text-center max-w-md px-4">
        <h5 className="text-sm text-gray-600 dark:text-gray-400">
        Can’t find the article you’re looking for?{" "}
        <Link
        href="/help-desk"
        className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 transition"
        >
      Visit IT Help Desk
        </Link>{" "}
        and create a ticket for your problem.
    </h5>
    </div>
   </div>
  )
}
 
export default HeroSection