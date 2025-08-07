"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ArticleSection from "./ArticleSection";
import SearchBar from "@/components/SearchBar";
import { ArticleSerialized } from "@/models/Article";
import BackButton from "./BackButton";
import { PaginationWrapper } from "@/components/ui/PaginationWrapper";

interface Props {
  articles: ArticleSerialized[];
  currentPage: number;
  totalPages: number;
  initialSearchQuery: string;
}

export default function ArticlesSearchClient({
  articles,
  currentPage,
  totalPages,
  initialSearchQuery,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state for the search input box, initialized with server query param
  const [query, setQuery] = useState(initialSearchQuery || "");

  // When user changes the search query:
  const onSearch = (value: string) => {
    setQuery(value);

    // Reset to page 1 on new search
    const params = new URLSearchParams();
    if (value.trim() !== "") {
      params.set("q", value);
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  // When user clicks a pagination page:
  const onPageChange = (page: number) => {
    const params = new URLSearchParams();
    if (query.trim() !== "") {
      params.set("q", query);
    }
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-6 px-4 sm:px-8 md:px-12 lg:px-16 py-6">
      <div className="mb-20 flex items-center gap-2">
        <BackButton />
        <SearchBar  onSearch={(value) => setQuery(value)}  />
      </div>

      {articles.length > 0 ? (
        <>
          <ArticleSection articles={articles} />

          <PaginationWrapper
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </>
      ) : (
        <p className="text-gray-500 text-center">No articles found.</p>
      )}
    </div>
  );
}
