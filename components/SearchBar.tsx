"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

export interface SearchBarProps {
  onSearch: (value: string) => void;
  initialValue?: string;
}

export default function SearchBar({
  onSearch,
  initialValue = "",
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);

  // Keep input synced with initialValue
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Call onSearch immediately on each input change
  useEffect(() => {
    onSearch(value.trim());
  }, [value, onSearch]);

  return (
    <div className="flex justify-center w-full">
      <div className="relative w-full max-w-md">
        <Search
          size={20}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search articles..."
          className="
            w-full
            rounded-md
            border border-gray-300
            bg-white
            dark:bg-gray-800
            px-10 py-2
            text-gray-900
            dark:text-gray-100
            placeholder-gray-400
            dark:placeholder-gray-400
            focus:outline-none
            focus:ring-2 focus:ring-blue-500
            focus:border-blue-500
          "
        />
        {value && (
          <button
            type="button"
            onClick={() => setValue("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
