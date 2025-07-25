"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react"; // Using lucide-react for the search icon, you can replace with your own icon if needed

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      onSearch(query.trim().toLowerCase());
    }, 300); // debounce 300ms

    return () => clearTimeout(timeout);
  }, [query, onSearch]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <Search
        size={20}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search articles by title or tags..."
        className="
          w-full
          bg-white
          dark:bg-gray-800
          border
          border-gray-300
          dark:border-gray-600
          rounded-md
          shadow-sm
          pl-10
          pr-4
          py-2
          text-gray-900
          dark:text-gray-100
          placeholder-gray-400
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          focus:border-blue-500
          transition
          duration-200
        "
      />
    </div>
  );
};

export default SearchBar;
