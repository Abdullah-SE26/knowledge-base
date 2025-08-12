import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import connectMongoDB from "@/lib/mongodb";
import Article from "@/models/Article";
import { translateArticleFields } from "@/lib/azureTranslate";

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
  public_id?: string; // optional, e.g., UploadThing fileKey or id
}

function normalizeAttachmentType(type: string): AttachmentType {
  const lower = type.toLowerCase();
  if (["jpg", "png"].includes(lower)) return "image";
  if (["mp4", "webm"].includes(lower)) return "video";
  if (lower === "xlsx") return "xlsx";
  if (lower === "pptx") return "pptx";
  if (lower === "ppt") return "ppt";
  if (lower === "docx") return "docx";
  if (lower === "pdf") return "pdf";
  // Default fallback
  return "form";
}

function normalizeTags(input: unknown): string[] {
  if (!input) return [];
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed))
        return parsed
          .map((t) => (typeof t === "string" ? t : t?.value))
          .filter(Boolean);
      if (typeof parsed === "string") return [parsed];
    } catch {
      return [input];
    }
  }
  if (Array.isArray(input))
    return input
      .map((t) => (typeof t === "string" ? t : t?.value))
      .filter(Boolean);
  return [];
}

function sanitizeAttachments(input: unknown): Attachment[] {
  if (!input) return [];
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((att) => att && typeof att === "object")
          .map((att) => {
            const type =
              att.type && typeof att.type === "string"
                ? normalizeAttachmentType(att.type)
                : "form";
            const url = att.url && typeof att.url === "string" ? att.url : "";
            const name = att.name && typeof att.name === "string" ? att.name : "";
            return { type, url, name, public_id: att.public_id };
          })
          .filter((att) => att.url && att.name);
      }
    } catch {
      return [];
    }
  }
  if (Array.isArray(input)) {
    return input
      .filter((att) => att && typeof att === "object")
      .map((att) => {
        const type =
          att.type && typeof att.type === "string"
            ? normalizeAttachmentType(att.type)
            : "form";
        const url = att.url && typeof att.url === "string" ? att.url : "";
        const name = att.name && typeof att.name === "string" ? att.name : "";
        return { type, url, name, public_id: (att as any).public_id };
      })
      .filter((att) => att.url && att.name);
  }
  return [];
}

export async function POST(req: Request) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  await connectMongoDB();

  try {
    const formData = await req.formData();
    const title = formData.get("title") as string | null;
    const content = formData.get("content") as string | null;
    const subject = (formData.get("subject") as string) || "";
    const tagsInput = formData.getAll("tags");
    const attachmentsInput = formData.get("attachments");

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existing = await Article.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 400 }
      );
    }

    const tags = normalizeTags(tagsInput);
    const attachments = sanitizeAttachments(attachmentsInput);

    // Translate first
    let title_ar = "";
    let subject_ar = "";
    let content_ar = "";
    try {
      const result = await translateArticleFields(title, subject, content);
      console.log("Translation result:", result);

      title_ar = result.title_ar;
      subject_ar = result.subject_ar;
      content_ar = result.content_ar;
    } catch (translationError) {
      console.error("Translation failed:", translationError);
    }

    // Create and save article with Arabic fields included
    const newArticle = new Article({
      title,
      slug,
      subject,
      content,
      tags,
      attachments,
      title_ar,
      subject_ar,
      content_ar,
    });

    console.log("Before save, article data:", {
      title_ar: newArticle.title_ar,
      subject_ar: newArticle.subject_ar,
      content_ar: newArticle.content_ar,
    });

    await newArticle.save();

    // Re-fetch saved article to get fresh document with all fields
    const savedArticle = await Article.findById(newArticle._id).lean();

    console.log("Saved article:", savedArticle);

    return NextResponse.json(savedArticle, { status: 201 });
  } catch (err) {
    console.error("Create article error:", err);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  await connectMongoDB();

  try {
    const formData = await req.formData();
    const title = formData.get("title") as string | null;
    const content = formData.get("content") as string | null;
    const subject = (formData.get("subject") as string) || "";
    const tagsInput = formData.getAll("tags");
    const attachmentsInput = formData.get("attachments");
    const slug = formData.get("slug") as string | null;
    const id = formData.get("id") as string;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing article ID" },
        { status: 400 }
      );
    }

    const article = await Article.findById(id);
    if (!article) {
      return NextResponse.json(
        { success: false, message: "Article not found" },
        { status: 404 }
      );
    }

    // Update English fields first (or keep old if null)
    article.title = title ?? article.title;
    article.content = content ?? article.content;
    article.subject = subject;

    const generatedSlug = (title ?? article.title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check slug uniqueness (exclude current article)
    const slugToCheck = slug || generatedSlug;
    const slugConflict = await Article.findOne({
      slug: slugToCheck,
      _id: { $ne: id },
    });
    if (slugConflict) {
      return NextResponse.json(
        {
          success: false,
          message: "Slug already in use by another article",
        },
        { status: 400 }
      );
    }
    article.slug = slugToCheck;

    article.tags = normalizeTags(tagsInput);

    if (attachmentsInput) {
      article.attachments = sanitizeAttachments(attachmentsInput);
    }

    // Translate updated fields before save
    try {
      const result = await translateArticleFields(
        article.title,
        article.subject,
        article.content
      );
      article.title_ar = result.title_ar;
      article.subject_ar = result.subject_ar;
      article.content_ar = result.content_ar;
    } catch (translationError) {
      console.error("Translation failed on update:", translationError);
      // Proceed even if translation fails
    }

    await article.save();

    // Re-fetch updated article for complete data
    const updatedArticle = await Article.findById(id).lean();

    console.log("Saved article:", updatedArticle);

    return NextResponse.json({ success: true, article: updatedArticle });
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update article" },
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
  } catch (error) {
    console.error("Failed to delete article:", error);
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  await connectMongoDB();

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const search = url.searchParams.get("search")?.trim() || "";
    const sortParam = url.searchParams.get("sort") || "-createdAt";
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");

    // Build filter
    const filter: Record<string, any> = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // Parse sort like "-title" or "createdAt"
    let sort: Record<string, 1 | -1> = { createdAt: -1 }; // default
    if (sortParam.startsWith("-")) {
      sort = { [sortParam.slice(1)]: -1 };
    } else {
      sort = { [sortParam]: 1 };
    }

    const skip = (page - 1) * limit;

    const total = await Article.countDocuments(filter);
    const articles = await Article.find(filter)
      .select("title slug subject createdAt upvotes downvotes tags content attachments title_ar subject_ar content_ar")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      articles,
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error("Failed to fetch articles:", err);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}
