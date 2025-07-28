"use client";

import React, { useState } from "react";
import type { ArticleSerialized } from "@/models/Article";
import HeroSection from "@/components/HeroSection"; // only search + hero UI, no cards
import ArticleSection from "@/components/ArticleSection";
import FaqAccordion from "./Accordion";

interface HomeClientProps {
  articles: ArticleSerialized[];
}

export default function HomeClient({ articles }: HomeClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredArticles = articles.filter((article) => {
    const q = searchQuery.toLowerCase();
    return (
      article.title.toLowerCase().includes(q) ||
      article.subject.toLowerCase().includes(q) ||
      article.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <HeroSection onSearch={setSearchQuery} />

      <div className="max-w-6xl mx-auto px-4 mt-8 mb-20">
        {searchQuery && filteredArticles.length > 0 && (
          <ArticleSection articles={filteredArticles} />
        )}
        {searchQuery && filteredArticles.length === 0 && (
          <p className="text-center text-gray-500">No articles found.</p>
        )}
      </div>

      <FaqAccordion/>
    </>
  );
}
