"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      onSearch(query.trim().toLowerCase());
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, onSearch]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <label htmlFor="search-input" className="sr-only">
        Search articles
      </label>
      <Search
        size={20}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        id="search-input"
        type="text"
        value={query}
        autoComplete="off"
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
          pr-10
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
      {query && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
