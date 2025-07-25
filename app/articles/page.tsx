
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import connectMongoDB from "@/lib/mongodb";
import Article, { IArticle } from "@/models/Article";
import { Types } from "mongoose";
import ArticlesSearchClient from "@/components/ArticlesSearchClient";

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email?.endsWith("@gmail.com")) {
    redirect("/login");
  }

  const searchQuery = searchParams?.q?.toLowerCase() || "";

  await connectMongoDB();

  const articles = (await Article.find()
    .sort({ upvotes: -1, createdAt: -1 })
    .lean()) as unknown as (IArticle & { _id: Types.ObjectId })[];

  const filteredArticles = articles
    .filter((a) => a.title && a.subject && a.content)
    .filter((article) => {
      const titleMatch = article.title.toLowerCase().includes(searchQuery);
      const subjectMatch = article.subject.toLowerCase().includes(searchQuery);
      const tagMatch =
        article.tags &&
        article.tags.some((tag) => tag.toLowerCase().includes(searchQuery));

      return titleMatch || subjectMatch || tagMatch;
    });

  const serialized = filteredArticles.map((article) => ({
    _id: article._id.toString(),
    slug: article.slug,
    title: article.title,
    subject: article.subject,
    content: article.content,
    tags: article.tags || [],
    attachments: article.attachments || [],
    createdAt: article.createdAt ? article.createdAt.toISOString() : "",
    createdAtFormatted: article.createdAt
      ? new Date(article.createdAt).toLocaleDateString("en-GB")
      : "",
    updatedAt: article.updatedAt ? article.updatedAt.toISOString() : "",
    updatedAtFormatted: article.updatedAt
      ? new Date(article.updatedAt).toLocaleDateString("en-GB")
      : "",
    upvotesCount: article.upvotes?.length ?? 0,
    downvotesCount: article.downvotes?.length ?? 0,
  }));

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl text-center font-bold mb-6">All Articles</h1>
      <ArticlesSearchClient  articles={serialized} />
    </main>
  );
}
