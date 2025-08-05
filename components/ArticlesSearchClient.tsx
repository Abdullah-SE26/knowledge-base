"use client";

import { useState } from "react";
import ArticleSection from "./ArticleSection";
import SearchBar from "@/components/SearchBar";
import { ArticleSerialized } from "@/models/Article";
import BackButton from "./BackButton";

export default function ArticlesSearchClient({
  articles,
}: {
  articles: ArticleSerialized[];
}) {
  const [query, setQuery] = useState("");
  const filtered = articles.filter((article) => {
    const q = query.toLowerCase();
    const subject = article.subject ?? "";
    const tags = article.tags ?? [];

    return (
      article.title.toLowerCase().includes(q) ||
      subject.toLowerCase().includes(q) ||
      tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 px-4 sm:px-8 md:px-12 lg:px-16 py-6">
      <div className="mb-20 flex items-center gap-2">
        <BackButton />
        <SearchBar onSearch={(value) => setQuery(value)} />
      </div>

      {filtered.length > 0 ? (
        <ArticleSection articles={filtered} />
      ) : (
        <p className="text-gray-500 text-center">No articles found.</p>
      )}
    </div>
  );
}
