import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import Article from "@/models/Article";
import { requireAdmin } from "@/lib/adminAuth";

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(req: Request) {
  // Admin auth check
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  await connectMongoDB();

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);
  const sortField = url.searchParams.get("sortField") || "createdAt";
  const sortOrder = url.searchParams.get("sortOrder") === "asc" ? 1 : -1;

  const query = search
    ? {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { subject: { $regex: search, $options: "i" } },
          { tags: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  try {
    const total = await Article.countDocuments(query);
    const articles = await Article.find(query)
      .sort({ [sortField]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .select(
        "title slug subject tags createdAt updatedAt upvotes downvotes"
      )
      .lean();

    return NextResponse.json({ total, articles });
  } catch (error) {
    console.error("Failed to fetch articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  const body = await req.json();
  const { title, subject = "", content, tags = [], attachments = [] } = body;

  if (!title || !content) {
    return NextResponse.json(
      { error: "Title and content are required" },
      { status: 400 }
    );
  }

  await connectMongoDB();

  try {
    let slug = generateSlug(title);
    let exists = await Article.findOne({ slug });
    let count = 1;
    while (exists) {
      slug = `${generateSlug(title)}-${count++}`;
      exists = await Article.findOne({ slug });
    }

    const newArticle = new Article({
      title,
      slug,
      subject,
      content,
      tags,
      attachments,
      upvotes: [],
      downvotes: [],
    });

    await newArticle.save();

    return NextResponse.json(newArticle, { status: 201 });
  } catch (error) {
    console.error("Failed to create article:", error);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
