import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import Article from "@/models/Article";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  await connectMongoDB();

  const article = await Article.findById(params.id).lean();

  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  return NextResponse.json(article);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  const body = await req.json();

  const {
    title,
    slug,
    subject,
    content,
    tags = [],
    attachments = [],
  } = body;

  if (!title || !slug || !content) {
    return NextResponse.json(
      { error: "Title, slug, and content are required" },
      { status: 400 }
    );
  }

  await connectMongoDB();

  // Check if slug is used by another article
  const existing = await Article.findOne({ slug, _id: { $ne: params.id } });
  if (existing) {
    return NextResponse.json(
      { error: "Slug already exists" },
      { status: 400 }
    );
  }

  const updated = await Article.findByIdAndUpdate(
    params.id,
    {
      title,
      slug,
      subject,
      content,
      tags,
      attachments,
      updatedAt: new Date(),
    },
    { new: true }
  );

  if (!updated) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  await connectMongoDB();

  const deleted = await Article.findByIdAndDelete(params.id);

  if (!deleted) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Article deleted" });
}
