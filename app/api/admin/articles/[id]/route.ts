import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import connectMongoDB from "@/lib/mongodb";
import Article from "@/models/Article";
import { translateArticleFields } from "@/lib/azureTranslate";

function logDebug(...args: any[]) {
  console.debug("[DEBUG]", ...args);
}

type AttachmentType =
  | "pdf"
  | "image"
  | "form"
  | "docx"
  | "ppt"
  | "pptx"
  | "xlsx"
  | "video";

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

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
              // Normalize jpg/png to image
              if (type === "jpg" || type === "png") type = "image";
              // Normalize mp4/webm to video
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
        logDebug("Failed to parse attachments JSON:", err);
      }
    }

    const article = await Article.findById(params.id);
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Track if main text fields changed
    const textChanged =
      title !== article.title ||
      content !== article.content ||
      subject !== article.subject;

    // Update English fields
    article.title = title;
    article.content = content;
    article.subject = subject;
    article.tags = tags;
    article.attachments = attachments;
    article.updatedAt = new Date();

    // Use normalized slug or generate from title
    const slugToUse = slug ? generateSlug(slug) : generateSlug(title);

    // Normalize the article’s current slug too for safe comparison
    const currentArticleSlugNormalized = generateSlug(article.slug || "");

    logDebug("Input slug:", slug);
    logDebug("Normalized slug to use:", slugToUse);
    logDebug("Current article slug:", article.slug);
    logDebug("Current article slug normalized:", currentArticleSlugNormalized);

    // Only check for slug conflict if slug actually changed
    if (slugToUse !== currentArticleSlugNormalized) {
      const slugConflict = await Article.findOne({
        slug: slugToUse,
        _id: { $ne: article._id },
      });
      if (slugConflict) {
        return NextResponse.json(
          { error: "Slug already in use by another article" },
          { status: 400 }
        );
      }
    }

    article.slug = slugToUse;

    // Log before translation
    logDebug("Translating article fields", { title, subject, content });

    // If main text changed, re-translate to Arabic
    if (textChanged) {
      try {
        const translationResult = await translateArticleFields(
          title,
          subject,
          content
        );

        logDebug(
          "Full translationResult:",
          JSON.stringify(translationResult, null, 2)
        );

        // Destructure translated fields
        const { title_ar, subject_ar, content_ar } = translationResult;

        logDebug("Assigning translations to article:", {
          title_ar,
          subject_ar,
          content_ar,
        });

        article.title_ar = title_ar;
        article.subject_ar = subject_ar;
        article.content_ar = content_ar;

        logDebug("Article after assignment:", {
          title_ar: article.title_ar,
          subject_ar: article.subject_ar,
          content_ar: article.content_ar,
        });
      } catch (translationError) {
        logDebug("Translation update failed:", translationError);
        // Don't fail the update if translation fails
      }
    }

    await article.save();

    logDebug("Article saved successfully:", article);

    return NextResponse.json(article, { status: 200 });
  } catch (err) {
    logDebug("Failed to update article:", err);
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
