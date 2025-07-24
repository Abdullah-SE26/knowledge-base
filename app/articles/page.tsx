// app/articles/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import connectMongoDB from "@/lib/mongodb";
import Article, { IArticle } from "@/models/Article";
import ArticleSection from "@/components/ArticleSection";
import { Types } from "mongoose";

export default async function ArticlesPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email?.endsWith("@gmail.com")) { //change this later to @mawaridhi.com
    redirect("/login");
  }

  await connectMongoDB();

  const articles = (await Article.find()
    .sort({ upvotes: -1, createdAt: -1 })
    .lean()) as (IArticle & { _id: Types.ObjectId })[];

  const filteredArticles = articles.filter(a => a.title && a.subject && a.content);

  const serialized = filteredArticles.map(article => ({
    _id: article._id.toString(),
    slug: article.slug,
    title: article.title,
    subject: article.subject,
    content: article.content,
    tags: article.tags || [],
    createdAt: article.createdAt.toISOString(),
    createdAtFormatted: new Date(article.createdAt).toLocaleDateString("en-GB"),
    updatedAt: article.updatedAt.toISOString(),
    updatedAtFormatted: new Date(article.updatedAt).toLocaleDateString("en-GB"),
    upvotesCount: article.upvotes?.length ?? 0,
    downvotesCount: article.downvotes?.length ?? 0,
  }));

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Articles</h1>
      <ArticleSection articles={serialized} />
    </main>
  );
}
