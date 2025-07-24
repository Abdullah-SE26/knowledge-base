// app/articles/[slug]/page.tsx
import connectMongoDB from "@/lib/mongodb";
import Article, { IArticle } from "@/models/Article";
import { notFound } from "next/navigation";
import { Types } from "mongoose";
import ArticleActionsClient from "@/components/ArticleActionsClient";

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  await connectMongoDB();

  const article = (await Article.findOne({ slug: params.slug }).lean()) as IArticle | null;

  if (!article) {
    notFound();
  }

  const safeArticle = {
    ...article,
    _id: article._id.toString(),
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    upvotesCount: article.upvotes?.length ?? 0,
    downvotesCount: article.downvotes?.length ?? 0,
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4">{safeArticle.title}</h1>
      <h2 className="text-lg font-semibold mb-4">{safeArticle.subject}</h2>
      <article className="prose prose-lg mt-6">{safeArticle.content}</article>

      <ArticleActionsClient
        articleId={safeArticle.slug} // use slug here too
        initialUpvotes={safeArticle.upvotesCount}
        initialDownvotes={safeArticle.downvotesCount}
        title={safeArticle.title}
      />
    </main>
  );
}
