import connectMongoDB from "@/lib/mongodb";
import Article, { IArticleDocument } from "@/models/Article";
import { Types } from "mongoose";
import HomeClient from "@/components/HomeClient"; // <-- new client component
import { Metadata } from "next";


export const metadata: Metadata = {
  title: "Mawaridhi-Knowledge Home",
  description: "Internal Knowledge Base for Mawaridhi",
};

export default async function Home() {
  await connectMongoDB();

  const articlesFromDb = (await Article.find()
    .sort({ upvotes: -1, createdAt: -1 })
    .lean()) as unknown as IArticleDocument[];

  const articles = articlesFromDb.map((article) => ({
    _id: (article._id as Types.ObjectId).toString(),
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

  return <HomeClient articles={articles} />;
}
