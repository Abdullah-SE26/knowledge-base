"use client";

import React from "react";
import Link from "next/link";
import ArticleActionsClient from "./ArticleActionsClient";
import { ArticleSerialized } from "@/models/Article"; // import shared interface

interface ArticleSectionProps {
  articles: ArticleSerialized[];
}

const ArticleSection: React.FC<ArticleSectionProps> = ({ articles }) => {
  return (
    <div>
      
      <section className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 ">
        {articles.map((article) => (
          <div
            key={article._id}
            className="border rounded-lg p-6 shadow hover:shadow-lg transition-shadow duration-300 dark:bg-blue-950"
          >
            <Link href={`/articles/${article.slug}`}>
              <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 cursor-pointer hover:underline">
                {article.title}
              </h2>
              <p className="text-gray-700 dark:text-white mb-2">{article.subject}</p>
              <div className="text-sm text-gray-500 mb-4 dark:text-white ">
                Published on -&nbsp;
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
    </div>
  );
};

export default ArticleSection;
