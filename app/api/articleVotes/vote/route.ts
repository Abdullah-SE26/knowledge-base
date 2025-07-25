import mongoose from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import Article from "@/models/Article";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    console.log("Session user:", session?.user);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const { articleId, type } = await request.json();

    if (!articleId || !["upvote", "downvote"].includes(type)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    await connectToDatabase();

    const article = await Article.findOne({ slug: articleId });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Remove existing votes from the user
    article.upvotes = article.upvotes.filter(id => id.toString() !== userId);
    article.downvotes = article.downvotes.filter(id => id.toString() !== userId);

    if (type === "upvote") {
      article.upvotes.push(userObjectId);
    } else {
      article.downvotes.push(userObjectId);
    }

    await article.save();

    return NextResponse.json({
      upvotes: article.upvotes.length,
      downvotes: article.downvotes.length,
    });
  } catch (error) {
    console.error("Vote API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
