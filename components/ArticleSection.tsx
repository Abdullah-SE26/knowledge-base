"use client";

import React from "react";

interface Article {
  _id: string;
  title: string;
  content: string;
  tags?: string[];
}

interface ArticleSectionProps {
  articles?: Article[]; // Mark it as optional to be safe
}

const ArticleSection: React.FC<ArticleSectionProps> = ({ articles }) => {
  if (!articles || !Array.isArray(articles)) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl text-left font-bold mb-6">Getting Started</h2>
          <p>No articles found.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">Getting Started</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {articles.map((article) => (
            <div
              key={article._id}
              className="bg-white shadow-md rounded-xl p-6 hover:shadow-lg transition"
            >
              <div className="flex items-center justify-center w-10 h-10 mb-4 bg-gray-100 rounded-full">
                📄
              </div>
              <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-3">
                {article.content}
              </p>
              <div className="mt-4 text-blue-600 text-sm font-medium">
                {article.tags?.length || 0} article
                {article.tags?.length === 1 ? "" : "s"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArticleSection;
