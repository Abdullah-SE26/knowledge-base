import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import connectMongoDB from "@/lib/mongodb";
import Article from "@/models/Article";

type AttachmentType =
  | "pdf"
  | "image"
  | "form"
  | "docx"
  | "ppt"
  | "pptx"
  | "xlsx"
  | "video"
  | "jpg"
  | "png";

interface Attachment {
  type: AttachmentType;
  url: string;
  name: string;
  public_id?: string;
}

const VALID_ATTACHMENT_TYPES: AttachmentType[] = [
  "pdf",
  "image",
  "form",
  "docx",
  "ppt",
  "pptx",
  "xlsx",
  "video",
  "jpg",
  "png",
];

function normalizeTags(input: unknown): string[] {
  if (!input) return [];

  try {
    if (typeof input === "string") {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed
          .map((t) => (typeof t === "string" ? t : t?.value))
          .filter(Boolean);
      }
      return [String(parsed)];
    }

    if (Array.isArray(input)) {
      return input
        .map((t) => (typeof t === "string" ? t : t?.value))
        .filter(Boolean);
    }
  } catch (err) {
    console.warn("Failed to parse tags:", err);
    return typeof input === "string" ? [input] : [];
  }

  return [];
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  await connectMongoDB();

  try {
    const form = await req.formData();

    const title = form.get("title") as string | null;
    const content = form.get("content") as string | null;
    const subject = (form.get("subject") as string) || "";
    const slug = form.get("slug") as string | null;
    const tagsRaw = form.getAll("tags");
    const attachmentsRaw = form.get("attachments") as string | null;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const tags = normalizeTags(tagsRaw);

    let attachments: Attachment[] = [];
    if (attachmentsRaw && typeof attachmentsRaw === "string") {
      try {
        const parsed = JSON.parse(attachmentsRaw);
        if (Array.isArray(parsed)) {
          attachments = parsed
            .map((att) => {
              if (!att?.url || !att?.name) return null;

              let type = att.type;

              // Normalize extensions to general types
              if (type === "jpg" || type === "png") type = "image";
              if (type === "mp4" || type === "webm") type = "video";

              if (!VALID_ATTACHMENT_TYPES.includes(type)) {
                type = "form";
              }

              return {
                type,
                url: att.url,
                name: att.name,
                public_id: att.public_id,
              };
            })
            .filter(Boolean) as Attachment[];
        }
      } catch (err) {
        console.warn("Failed to parse attachments JSON:", err);
      }
    }

    const article = await Article.findById(params.id);
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    article.title = title;
    article.content = content;
    article.subject = subject;
    article.tags = tags;
    article.attachments = attachments;
    article.updatedAt = new Date();
    if (slug) article.slug = slug;

    await article.save();

    return NextResponse.json(article, { status: 200 });
  } catch (err) {
    console.error("Failed to update article:", err);
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  await connectMongoDB();

  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { error: "Article ID is required" },
      { status: 400 }
    );
  }

  try {
    const deleted = await Article.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Article deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Failed to delete article:", err);
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
