// app/articles/[slug]/page.tsx
import connectMongoDB from "@/lib/mongodb";
import Article, { IArticle } from "@/models/Article";
import { notFound } from "next/navigation";
import ArticleActionsClient from "@/components/ArticleActionsClient";
import { format } from "date-fns";
import BackButton from "@/components/BackButton";

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

  const createdAt = article.createdAt ? new Date(article.createdAt) : null;
  const updatedAt = article.updatedAt ? new Date(article.updatedAt) : null;

  const safeArticle = {
    ...article,
    _id: article._id.toString(),
    createdAtFormatted: createdAt ? format(createdAt, "MMMM d, yyyy h:mm a") : "",
    updatedAtFormatted:
      updatedAt && updatedAt.getTime() !== createdAt?.getTime()
        ? format(updatedAt, "MMMM d, yyyy h:mm a")
        : null,
    upvotesCount: article.upvotes?.length ?? 0,
    downvotesCount: article.downvotes?.length ?? 0,
  };

  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <BackButton/>
      <h1 className="text-4xl font-bold mb-2 text-center">{safeArticle.title}</h1>
      <h2 className="text-lg text-gray-600 mb-4 text-center dark:text-white">{safeArticle.subject}</h2>

      <article className="prose prose-lg mt-6">{safeArticle.content}</article>

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
    </main>
  );
}
