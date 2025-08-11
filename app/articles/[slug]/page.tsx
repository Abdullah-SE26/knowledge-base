import connectMongoDB from "@/lib/mongodb";
import Article, { IArticleDocument } from "@/models/Article";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Types } from "mongoose";

import ClientArticleWrapper from "@/components/ClientArticleWrapper";

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

  return (
    <ClientArticleWrapper
      articleId={safeArticle._id}
      slug={safeArticle.slug}
      createdAtFormatted={safeArticle.createdAtFormatted}
      updatedAtFormatted={safeArticle.updatedAtFormatted}
      upvotesCount={safeArticle.upvotesCount}
      downvotesCount={safeArticle.downvotesCount}
      attachments={safeArticle.attachments}
      initialContent={{
        title: safeArticle.title,
        subject: safeArticle.subject || "",
        content: safeArticle.content || "",
      }}
    />
  );
}
