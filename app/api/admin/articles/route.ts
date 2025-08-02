import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import connectMongoDB from "@/lib/mongodb";
import Article from "@/models/Article";
import Busboy from "busboy";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

export const config = {
  api: {
    bodyParser: false,
  },
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

type Attachment = {
  type: "pdf" | "image" | "form";
  public_id: string;
  url?: string; // <-- Add optional url here
  name?: string;
};

interface UploadedFile {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  url?: string;
  type?: string;
}

// Helper: Determine attachment type from mimeType
function getAttachmentType(mimeType: string): Attachment["type"] {
  if (!mimeType) return "pdf";
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  return "pdf";
}

// Upload to Cloudinary, return public_id (not full URL)
function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  folder: string
): Promise<{ public_id: string; type: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename.replace(/\.[^/.]+$/, ""),
        resource_type: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.public_id || !result.resource_type)
          return reject(new Error("Cloudinary upload failed"));
        resolve({ public_id: result.public_id, type: result.resource_type });
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

async function parseFormData(req: Request): Promise<{
  fields: Record<string, string | string[]>;
  files: UploadedFile[];
}> {
  return new Promise((resolve, reject) => {
    const headers = Object.fromEntries(req.headers.entries()) as Record<string, string>;
    const busboy = Busboy({ headers });

    const fields: Record<string, string | string[]> = {};
    const files: UploadedFile[] = [];

    busboy.on("field", (fieldname, val) => {
      if (fields[fieldname]) {
        if (Array.isArray(fields[fieldname])) {
          (fields[fieldname] as string[]).push(val);
        } else {
          fields[fieldname] = [fields[fieldname] as string, val];
        }
      } else {
        fields[fieldname] = val;
      }
    });

    busboy.on("file", (fieldname, file, info) => {
      const { filename, mimeType } = info;
      const chunks: Uint8Array[] = [];

      file.on("data", (data) => chunks.push(data));
      file.on("end", () => {
        const buffer = Buffer.concat(chunks);
        files.push({ buffer, filename, mimeType });
      });

      file.on("error", reject);
    });

    busboy.on("error", reject);

    busboy.on("finish", () => resolve({ fields, files }));

    if (!req.body) return reject(new Error("Request body is empty or not readable"));

    const reader = req.body.getReader();
    function read() {
      reader
        .read()
        .then(({ done, value }) => {
          if (done) return busboy.end();
          if (value) busboy.write(Buffer.from(value));
          read();
        })
        .catch(reject);
    }

    read();
  });
}

// Parse attachments, store public_id and add url property
async function parseAttachments(
  fields: Record<string, any>,
  files: UploadedFile[]
): Promise<Attachment[]> {
  const seen = new Set<string>();
  const extraAttachments: Attachment[] = [];

  const attachmentsField = Array.isArray(fields.attachments)
    ? fields.attachments[0]
    : fields.attachments;

  if (attachmentsField) {
    try {
      const parsed = JSON.parse(attachmentsField);
      if (Array.isArray(parsed)) {
        for (const att of parsed) {
          if (
            att &&
            typeof att.public_id === "string" &&
            ["form", "image", "pdf"].includes(att.type) &&
            !seen.has(att.public_id)
          ) {
            seen.add(att.public_id);
            extraAttachments.push({
              type: att.type,
              public_id: att.public_id,
              url: cloudinary.url(att.public_id),  // <-- ADD URL HERE
              name: att.name || undefined,
            });
          }
        }
      }
    } catch (e) {
      console.warn("Could not parse attachments JSON:", e);
    }
  }

  const fileAttachments: Attachment[] = [];

  for (const file of files) {
    let publicId = file.url;
    let type = file.type;

    if (!publicId) {
      const uploadResult = await uploadToCloudinary(file.buffer, file.filename, "articles");
      publicId = uploadResult.public_id;
      type = uploadResult.type;
    }

    if (seen.has(publicId)) continue;
    seen.add(publicId);

    fileAttachments.push({
      type: (type || getAttachmentType(file.mimeType)) as Attachment["type"],
      public_id: publicId,
      url: cloudinary.url(publicId), // <-- ADD URL HERE
      name: file.filename,
    });
  }

  return [...extraAttachments, ...fileAttachments];
}

// Normalize tags from input (string or array)
function normalizeTags(tagsField: unknown): string[] {
  let tags: string[] = [];
  if (typeof tagsField === "string") {
    try {
      const parsed = JSON.parse(tagsField);
      if (Array.isArray(parsed)) {
        tags = parsed
          .map((t) =>
            typeof t === "string" ? t : typeof t?.value === "string" ? t.value : ""
          )
          .filter(Boolean);
      } else if (typeof parsed === "string") {
        tags = [parsed];
      }
    } catch {
      tags = [tagsField];
    }
  } else if (Array.isArray(tagsField)) {
    tags = tagsField
      .map((t) =>
        typeof t === "string" ? t : typeof t?.value === "string" ? t.value : ""
      )
      .filter(Boolean);
  }
  return tags;
}

// POST - create article
export async function POST(req: Request) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  await connectMongoDB();

  try {
    const { fields, files } = await parseFormData(req);

    const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
    const content = Array.isArray(fields.content) ? fields.content[0] : fields.content;
    const subject = Array.isArray(fields.subject) ? fields.subject[0] : fields.subject || "";

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const tags = normalizeTags(fields.tags);
    const attachments = await parseAttachments(fields, files);

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const existing = await Article.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }

    const newArticle = new Article({
      title,
      slug,
      subject,
      content,
      tags,
      attachments,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newArticle.save();

    return NextResponse.json(newArticle, { status: 201 });
  } catch (err) {
    console.error("Create article error:", err);
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}

// PUT - update article
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  await connectMongoDB();

  try {
    const { fields, files } = await parseFormData(req);

    const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
    const content = Array.isArray(fields.content) ? fields.content[0] : fields.content;
    const subject = Array.isArray(fields.subject) ? fields.subject[0] : fields.subject || "";
    const tags = normalizeTags(fields.tags);
    const newUploads = await parseAttachments(fields, files);

    let existingAttachments: Attachment[] = [];
    const existingField = Array.isArray(fields.attachments) ? fields.attachments[0] : fields.attachments;

    if (existingField && typeof existingField === "string") {
      try {
        const parsed = JSON.parse(existingField);
        if (Array.isArray(parsed)) {
          existingAttachments = parsed
            .filter(
              (att) =>
                att &&
                typeof att.public_id === "string" &&
                ["form", "image", "pdf"].includes(att.type)
            )
            .map((att) => ({
              ...att,
              url: cloudinary.url(att.public_id), // <-- ADD URL HERE
            }));
        }
      } catch (e) {
        console.warn("Could not parse existing attachments:", e);
      }
    }

    const allAttachments = [...existingAttachments, ...newUploads];
    const seen = new Set<string>();
    const attachments = allAttachments.filter((att) => {
      if (seen.has(att.public_id)) return false;
      seen.add(att.public_id);
      return true;
    });

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

    await article.save();

    return NextResponse.json(article, { status: 200 });
  } catch (err) {
    console.error("Update error:", err);
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}

// DELETE - delete article
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  await connectMongoDB();

  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Article ID is required" }, { status: 400 });
  }

  try {
    const deleted = await Article.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Article deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete article:", error);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}

// GET - fetch articles list
export async function GET(req: Request) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  await connectMongoDB();

  try {
    const articles = await Article.find({})
      .select("title slug subject createdAt upvotes downvotes tags content attachments")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Failed to fetch articles:", error);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}
