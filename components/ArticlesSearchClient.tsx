"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  const [query, setQuery] = useState(initialSearchQuery || "");

  // Debounce helper for router updates
  const debounce = (fn: (...args: any[]) => void, delay: number) => {
    let timer: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  // Debounced search handler
  const onSearch = useCallback(
    debounce((value: string) => {
      setQuery(value);
      const params = new URLSearchParams();
      if (value.trim()) params.set("q", value.trim());
      params.set("page", "1");
      router.replace(`?${params.toString()}`, { scroll: false });
    }, 200),
    []
  );

  // Pagination handler
  const onPageChange = (page: number) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    params.set("page", page.toString());
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6 px-4 sm:px-8 md:px-12 lg:px-16 py-6">
      <div className="mb-20 flex flex-col sm:flex-row items-center justify-center gap-4">
        <BackButton />
        <SearchBar onSearch={onSearch} initialValue={query} />
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
