import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import connectMongoDB from "@/lib/mongodb";
import Article, { IArticleDocument } from "@/models/Article";
import { Types } from "mongoose";
import ArticlesSearchClient from "@/components/ArticlesSearchClient";
import { format } from "date-fns";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Articles",
  description: "Search for articles",
};

interface SerializedArticle {
  _id: string;
  slug: string;
  title: string;
  subject?: string;
  content: string;
  tags: string[];
  attachments: any[];
  createdAt: string;
  createdAtFormatted: string;
  updatedAt: string;
  updatedAtFormatted: string;
  upvotesCount: number;
  downvotesCount: number;
}

const PAGE_SIZE = 9;

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams?: { q?: string; page?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = session.user?.role ?? "user";

  if (!["user", "admin", "superadmin"].includes(role)) {
    redirect("/unauthorized");
  }

  const searchQuery = searchParams?.q?.toLowerCase() || "";
  const currentPage = parseInt(searchParams?.page || "1", 10);
  const skip = (currentPage - 1) * PAGE_SIZE;

  await connectMongoDB();

  // Build MongoDB filter for search
  const mongoFilter = searchQuery
    ? {
        $or: [
          { title: { $regex: searchQuery, $options: "i" } },
          { subject: { $regex: searchQuery, $options: "i" } },
          { tags: { $elemMatch: { $regex: searchQuery, $options: "i" } } },
        ],
      }
    : {};

  // Get total count for pagination
  const totalArticles = await Article.countDocuments(mongoFilter);

  // Fetch paginated + sorted articles directly from MongoDB
  const articles = (await Article.find(mongoFilter)
    .sort({ createdAt: -1 }) // Newest first
    .skip(skip)
    .limit(PAGE_SIZE)
    .lean()) as unknown as (IArticleDocument & { _id: Types.ObjectId })[];

  const totalPages = Math.ceil(totalArticles / PAGE_SIZE);

  const serialized: SerializedArticle[] = articles.map((article) => ({
    _id: article._id.toString(),
    slug: article.slug,
    title: article.title,
    subject: article.subject,
    content: article.content,
    tags: article.tags || [],
    attachments: article.attachments || [],
    createdAt: article.createdAt ? article.createdAt.toISOString() : "",
    createdAtFormatted: article.createdAt
      ? format(new Date(article.createdAt), "MMMM d, yyyy")
      : "",
    updatedAt: article.updatedAt ? article.updatedAt.toISOString() : "",
    updatedAtFormatted: article.updatedAt
      ? format(new Date(article.updatedAt), "MMMM d, yyyy")
      : "",
    upvotesCount: article.upvotes?.length ?? 0,
    downvotesCount: article.downvotes?.length ?? 0,
  }));

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl text-center font-bold mb-6">All Articles</h1>

      <ArticlesSearchClient
        articles={serialized}
        currentPage={currentPage}
        totalPages={totalPages}
        initialSearchQuery={searchQuery}
      />
    </main>
  );
}
