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
  if (!session || !session.user?.email?.endsWith("@gmail.com")) {
    redirect("/login");
  }

  const searchQuery = searchParams?.q?.toLowerCase() || "";
  const currentPage = parseInt(searchParams?.page || "1", 10);
  const skip = (currentPage - 1) * PAGE_SIZE;

  await connectMongoDB();

  // Fetch all articles sorted by latest
  const allArticles = (await Article.find()
    .sort({ createdAt: -1 }) // Show latest first
    .lean()) as unknown as (IArticleDocument & { _id: Types.ObjectId })[];

  const filteredArticles = allArticles
    .filter((a) => a.title && a.subject && a.content)
    .filter((article) => {
      const titleMatch = article.title.toLowerCase().includes(searchQuery);
      const subjectMatch =
        article.subject?.toLowerCase().includes(searchQuery) ?? false;
      const tagMatch =
        article.tags?.some((tag) => tag.toLowerCase().includes(searchQuery)) ??
        false;
      return titleMatch || subjectMatch || tagMatch;
    });

  const paginatedArticles = filteredArticles.slice(skip, skip + PAGE_SIZE);
  const totalPages = Math.ceil(filteredArticles.length / PAGE_SIZE);

  const serialized: SerializedArticle[] = paginatedArticles.map((article) => ({
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
