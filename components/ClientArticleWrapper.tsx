"use client";

import { useState, useEffect } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

import Translate from "./TranslateComponent"; // your client translate component
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
  title: string;
  subject: string;
  content: string;
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
  const [displayContent, setDisplayContent] =
    useState<ArticlePayload>(initialContent);
  const [markdownHtml, setMarkdownHtml] = useState("");

  useEffect(() => {
    const rawMarkdownHtml = marked.parse(displayContent.content || "", {
      async: false,
    }) as string;
    const cleanHtml = DOMPurify.sanitize(rawMarkdownHtml);

    setMarkdownHtml(cleanHtml);
  }, [displayContent.content]);

  return (
    <main className="max-w-3xl mx-auto py-12 px-4 relative">
      <div className="w-full flex justify-start fixed top-40 left-82 z-50">
        <BackButton />
      </div>

      <div className="fixed top-20 right-8 z-50 bg-white dark:bg-gray-900 p-2 rounded-md shadow-md">
        <Translate
          articleId={articleId}
          original={initialContent}
          onTranslate={setDisplayContent}
        />
      </div>

      <h1 className="text-4xl font-bold mb-6 mt-[-25px] text-center">
        {displayContent.title}
      </h1>

      {displayContent.subject && (
        <h2 className="text-lg text-gray-600 mb-4 dark:text-white">
          Subject: {displayContent.subject}
        </h2>
      )}

      <article
        className="prose prose-lg mt-6 dark:prose-invert max-w-none [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-5"
        dangerouslySetInnerHTML={{ __html: markdownHtml }}
      />

      <div className="mt-8 text-sm text-gray-500">
        <p>Created: {createdAtFormatted}</p>
        {updatedAtFormatted && <p>Last updated: {updatedAtFormatted}</p>}
      </div>

      <div className="mt-8">
        <ArticleActionsClient
          articleId={slug}
          initialUpvotes={upvotesCount}
          initialDownvotes={downvotesCount}
          title={displayContent.title}
        />
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Attachments</h3>

        {attachments && attachments.length > 0 ? (
          <ul className="space-y-4">
            {attachments.map((attachment, index) => (
              <li key={index} className="flex items-start gap-3">
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

                <div className="flex flex-col">
                  {attachment.type === "image" ? (
                    <img
                      src={attachment.url}
                      alt={attachment.name || "Image"}
                      className="max-w-xs rounded shadow"
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
