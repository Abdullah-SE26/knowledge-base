"use client";

import React from "react";
import Link from "next/link";
import ArticleActionsClient from "./ArticleActionsClient";

interface Article {
  _id: string;
  slug: string;
  title: string;
  subject: string;
  content: string;
  tags: string[];
  createdAt: string;
  createdAtFormatted: string;
  updatedAt: string;
  updatedAtFormatted: string;
  upvotesCount: number;
  downvotesCount: number;
}

interface ArticleSectionProps {
  articles: Article[];
}

const ArticleSection: React.FC<ArticleSectionProps> = ({ articles }) => {
  return (
    <section className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 ">
      {articles.map((article) => (
        <div
          key={article._id}
          className="border rounded-lg p-6 shadow hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800"
        >
          <Link href={`/articles/${article.slug}`}>
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 cursor-pointer hover:underline">
              {article.title}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-2">{article.subject}</p>
            <div className="text-sm text-gray-500 mb-4 dark:text-white ">
              <time dateTime={article.createdAt}>{article.createdAtFormatted}</time>
            </div>
          </Link>

          <ArticleActionsClient
            articleId={article.slug} // Pass slug for voting & copying
            initialUpvotes={article.upvotesCount}
            initialDownvotes={article.downvotesCount}
            title={article.title}
          />

          {article.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {article.tags.map((tag) => (
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
      ))}
    </section>
  );
};

export default ArticleSection;
