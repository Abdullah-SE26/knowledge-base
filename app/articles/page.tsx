import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import connectMongoDB from "@/lib/mongodb";
import Article, { IArticleDocument } from "@/models/Article";
import Settings from "@/models/Settings"; // Your Settings model
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

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  await connectMongoDB();

  // Load settings from DB
  const settings = await Settings.findOne({}).lean();
  const allowedDomains = (settings?.allowedDomains || []).map((d: string) =>
    d.toLowerCase()
  );
  const exceptionEmails = (settings?.exceptionEmails || []).map((e: string) =>
    e.toLowerCase()
  );

  const userEmail = session.user.email.toLowerCase();

  // Check if user email matches allowed domains or exception emails
  const domainAllowed = allowedDomains.some((domain) =>
    userEmail.endsWith(`@${domain}`)
  );
  const exceptionAllowed = exceptionEmails.includes(userEmail);

  if (!domainAllowed && !exceptionAllowed) {
    redirect("/login");
  }

  const searchQuery = searchParams?.q?.toLowerCase() || "";

  const articles = (await Article.find()
    .sort({ upvotes: -1, createdAt: -1 })
    .lean()) as unknown as (IArticleDocument & { _id: Types.ObjectId })[];

  const filteredArticles = articles
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

  const serialized: SerializedArticle[] = filteredArticles.map((article) => ({
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
      <ArticlesSearchClient articles={serialized} />
    </main>
  );
}
