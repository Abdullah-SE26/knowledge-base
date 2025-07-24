import mongoose from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Article from "@/models/Article";
import { getServerSession } from "next-auth/next"; // Note the /next import
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  try {
    // IMPORTANT: create a 'req' and 'res' shim for getServerSession
    const req = {
      headers: Object.fromEntries(request.headers.entries()),
      cookies: request.cookies,
    };

    // Since you don't have NextApiResponse in App Router,
    // create a dummy 'res' object with minimal methods
    const res = {
      getHeader() {},
      setHeader() {},
      // If needed, add more dummy functions here
    };

    // Get user session - pass the shim objects and your authOptions
    const session = await getServerSession(req as any, res as any, authOptions);
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

    // You said slug is generated automatically, so find by slug
    const article = await Article.findOne({ slug: articleId });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Remove user from vote arrays
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
