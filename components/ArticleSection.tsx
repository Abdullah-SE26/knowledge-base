"use client";

import React from "react";
import Link from "next/link";
import ArticleActionsClient from "./ArticleActionsClient";
import { ArticleSerialized } from "@/models/Article";

interface ArticleSectionProps {
  articles: ArticleSerialized[];
}

const ArticleSection: React.FC<ArticleSectionProps> = ({ articles }) => {
  return (
    <section className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => {
        // Make sure _id is string
        const id = typeof article._id === "string" ? article._id : String(article._id);

        // Parse createdAt date for dateTime attribute (can be null)
        const createdAtDate = article.createdAt ? new Date(article.createdAt) : null;

        // Use preformatted date string passed from server (must be present)
        const createdAtFormatted = article.createdAtFormatted ?? "Unknown date";

        // Default tags to empty array
        const tags = article.tags ?? [];

        return (
          <div
            key={id}
            className="border rounded-lg p-6 shadow hover:shadow-lg transition-shadow duration-300 dark:bg-blue-950"
          >
            <Link href={`/articles/${article.slug}`}>
              <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 cursor-pointer hover:underline">
                {article.title}
              </h2>
              {article.subject && (
                <p className="text-gray-700 dark:text-white mb-2">{article.subject}</p>
              )}
              <div className="text-sm text-gray-500 mb-4 dark:text-white">
                Published on -&nbsp;
                <time dateTime={createdAtDate?.toISOString() ?? ""}>
                  {createdAtFormatted}
                </time>
              </div>
            </Link>

            <ArticleActionsClient
              articleId={article.slug} // Or article._id if voting uses id
              initialUpvotes={article.upvotesCount ?? 0}
              initialDownvotes={article.downvotesCount ?? 0}
              title={article.title}
            />

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-sm bg-blue-100 text-blue-800 rounded px-2 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
};

export default ArticleSection;
