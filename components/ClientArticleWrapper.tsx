"use client";

import { useState, useEffect } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

import BackButton from "./BackButton";
import ArticleActionsClient from "./ArticleActionsClient";

import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FilePieChart,
  FileVideo,
  FileSignature,
} from "lucide-react";

interface ArticlePayload {
  title_en: string;
  subject_en: string;
  content_en: string;
  title_ar: string;
  subject_ar: string;
  content_ar: string;
}

interface ClientArticleWrapperProps {
  articleId: string;
  slug: string;
  createdAtFormatted: string;
  updatedAtFormatted: string | null;
  upvotesCount: number;
  downvotesCount: number;
  attachments?: any[];
  initialContent: ArticlePayload;
}

export default function ClientArticleWrapper({
  articleId,
  slug,
  createdAtFormatted,
  updatedAtFormatted,
  upvotesCount,
  downvotesCount,
  attachments,
  initialContent,
}: ClientArticleWrapperProps) {
  const [language, setLanguage] = useState<"en" | "ar">("en");

  const title =
    language === "ar"
      ? initialContent.title_ar || initialContent.title_en
      : initialContent.title_en;
  const subject =
    language === "ar"
      ? initialContent.subject_ar || initialContent.subject_en
      : initialContent.subject_en;
  const content =
    language === "ar"
      ? initialContent.content_ar || initialContent.content_en
      : initialContent.content_en;

  const [markdownHtml, setMarkdownHtml] = useState("");

  useEffect(() => {
    const rawMarkdownHtml = marked.parse(content || "", {
      async: false,
    }) as string;
    const cleanHtml = DOMPurify.sanitize(rawMarkdownHtml);
    setMarkdownHtml(cleanHtml);
  }, [content]);

  return (
    <main className="max-w-6xl mx-auto py-12 px-4 relative">
      {/* Back button aligned to card */}
      <div className="mb-6">
        <BackButton />
      </div>

      {/* Article card */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
        {/* Translate toggle */}
        <div className="absolute top-4 right-6 flex items-center gap-2">
          <button
            className={`px-3 py-1 rounded ${
              language === "en"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700"
            }`}
            onClick={() => setLanguage("en")}
            disabled={language === "en"}
          >
            English
          </button>
          <button
            className={`px-3 py-1 rounded ${
              language === "ar"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700"
            }`}
            onClick={() => setLanguage("ar")}
            disabled={language === "ar"}
          >
            العربية
          </button>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-semibold text-center mb-2 text-gray-900 dark:text-gray-100 leading-tight">
          {title}
        </h1>

        {/* Subject */}
        {subject && (
          <h2 className="text-lg text-gray-600 dark:text-gray-300 italic text-center mb-8">
          {subject}
          </h2>
        )}

        {/* Content */}
        <article
          className="prose prose-lg dark:prose-invert max-w-5xl mx-auto leading-relaxed text-gray-800 dark:text-gray-100 [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-6 prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: markdownHtml }}
          dir={language === "ar" ? "rtl" : "ltr"}
        />

        {/* Bottom row aligned perfectly */}
        <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-3 mt-8">
          <ArticleActionsClient
            articleId={slug}
            initialUpvotes={upvotesCount}
            initialDownvotes={downvotesCount}
            title={title}
          />
          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
            <span>Created: {createdAtFormatted}</span>
            {updatedAtFormatted && (
              <span className="ml-2">| Updated: {updatedAtFormatted}</span>
            )}
          </div>
        </div>
      </div>

      {/* Attachments section matches card width */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
          Attachments
        </h3>

        {attachments && attachments.length > 0 ? (
          <ul className="space-y-4">
            {attachments.map((attachment, index) => (
              <li
                key={index}
                className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg shadow-sm"
              >
                {/* Icon */}
                {attachment.type === "image" ? (
                  <ImageIcon className="w-5 h-5 text-blue-600 mt-1" />
                ) : attachment.type === "pdf" ? (
                  <FileText className="w-5 h-5 text-red-600 mt-1" />
                ) : attachment.type === "docx" ? (
                  <FileText className="w-5 h-5 text-blue-800 mt-1" />
                ) : attachment.type === "ppt" || attachment.type === "pptx" ? (
                  <FilePieChart className="w-5 h-5 text-orange-500 mt-1" />
                ) : attachment.type === "xlsx" ? (
                  <FileSpreadsheet className="w-5 h-5 text-green-600 mt-1" />
                ) : attachment.type === "video" ? (
                  <FileVideo className="w-5 h-5 text-purple-600 mt-1" />
                ) : (
                  <FileSignature className="w-5 h-5 text-gray-600 mt-1" />
                )}

                {/* File preview / link */}
                <div className="flex flex-col">
                  {attachment.type === "image" ? (
                    <img
                      src={attachment.url}
                      alt={attachment.name || "Image"}
                      className="max-w-sm rounded shadow"
                    />
                  ) : attachment.type === "video" ? (
                    <>
                      <video
                        controls
                        className="w-full max-w-xl rounded shadow-md"
                      >
                        <source src={attachment.url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                      <p className="text-sm text-gray-500 mt-1">
                        {attachment.name || "Video File"}
                      </p>
                    </>
                  ) : (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {attachment.name || "View File"}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">
            No attachments for this article
          </p>
        )}
      </div>
    </main>
  );
}
