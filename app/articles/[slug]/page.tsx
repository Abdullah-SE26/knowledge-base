import connectMongoDB from "@/lib/mongodb";
import Article, { IArticleDocument } from "@/models/Article";
import { notFound } from "next/navigation";
import ArticleActionsClient from "@/components/ArticleActionsClient";
import { format } from "date-fns";
import BackButton from "@/components/BackButton";
import { Types } from "mongoose";
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FilePieChart,
  FileVideo,
  File,
  FileSignature,
} from "lucide-react";

import { marked } from "marked";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const purify = DOMPurify(window);

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  await connectMongoDB();

  const article = (await Article.findOne({ slug: params.slug }).lean()) as
    | (IArticleDocument & {
        _id: Types.ObjectId;
        createdAt?: Date;
        updatedAt?: Date;
      })
    | null;

  if (!article) {
    notFound();
  }

  const createdAt = article.createdAt ? new Date(article.createdAt) : null;
  const updatedAt = article.updatedAt ? new Date(article.updatedAt) : null;

  const safeArticle = {
    ...article,
    _id: article._id.toString(),
    createdAtFormatted: createdAt
      ? format(createdAt, "MMMM d, yyyy h:mm a")
      : "",
    updatedAtFormatted:
      updatedAt && createdAt && updatedAt.getTime() !== createdAt.getTime()
        ? format(updatedAt, "MMMM d, yyyy h:mm a")
        : null,
    upvotesCount: article.upvotes?.length ?? 0,
    downvotesCount: article.downvotes?.length ?? 0,
  };

  // ✅ Convert Markdown to safe HTML
 const rawMarkdownHtml = await marked.parse(safeArticle.content || "");
const markdownHtml = purify.sanitize(rawMarkdownHtml);


  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <div className="w-full flex justify-start fixed top-40 left-20 z-50">
        <BackButton />
      </div>

      <h1 className="text-4xl font-bold mb-6 mt-[-25px] text-center">
        {safeArticle.title}
      </h1>

      {safeArticle.subject && (
        <h2 className="text-lg text-gray-600 mb-4 dark:text-white">
          Subject: {safeArticle.subject}
        </h2>
      )}

      <article
        className="prose prose-lg mt-6 dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: markdownHtml }}
      />

      <div className="mt-8 text-sm text-gray-500">
        <p>Created: {safeArticle.createdAtFormatted}</p>
        {safeArticle.updatedAtFormatted && (
          <p>Last updated: {safeArticle.updatedAtFormatted}</p>
        )}
      </div>

      <div className="mt-8">
        <ArticleActionsClient
          articleId={article.slug}
          initialUpvotes={safeArticle.upvotesCount}
          initialDownvotes={safeArticle.downvotesCount}
          title={safeArticle.title}
        />
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Attachments</h3>

        {Array.isArray(article.attachments) &&
        article.attachments.length > 0 ? (
          <ul className="space-y-4">
            {article.attachments.map((attachment, index) => (
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
