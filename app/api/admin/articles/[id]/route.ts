import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import connectMongoDB from "@/lib/mongodb";
import Article from "@/models/Article";
import Busboy from "busboy";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

export const config = {
  api: { bodyParser: false },
};

// Configure Cloudinary (make sure your env vars are set!)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

type AttachmentType = "pdf" | "image" | "link";

// Get attachment type by mime
function getAttachmentType(mimeType: string): AttachmentType {
  if (!mimeType) return "pdf";
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  return "pdf";
}

// Upload Buffer to Cloudinary and return secure URL
function uploadToCloudinary(buffer: Buffer, filename: string, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename.replace(/\.[^/.]+$/, ""), // filename without extension
        resource_type: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url) return reject(new Error("Cloudinary upload failed"));
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

// Parse multipart form data with Busboy and stream request body properly
async function parseFormData(req: Request): Promise<{
  fields: Record<string, string | string[]>;
  files: { buffer: Buffer; filename: string; mimeType: string }[];
}> {
  return new Promise((resolve, reject) => {
    const headers = Object.fromEntries(req.headers.entries()) as Record<string, string>;
    const busboy = Busboy({ headers });

    const fields: Record<string, string | string[]> = {};
    const files: { buffer: Buffer; filename: string; mimeType: string }[] = [];

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

    busboy.on("finish", () => {
      resolve({ fields, files });
    });

    const reader = req.body?.getReader?.();
    if (!reader) {
      reject(new Error("Request body reader is not available"));
      return;
    }

    if (!reader) return reject(new Error("Stream reader unavailable"));

    const pump = () => {
      reader.read().then(({ done, value }) => {
        if (done) return busboy.end();
        if (value) busboy.write(Buffer.from(value));
        pump();
      }).catch(reject);
    };
        pump();
  });
}

// Parse attachments including links + Cloudinary uploaded files
async function parseAttachments(
  fields: Record<string, any>,
  files: { buffer: Buffer; filename: string; mimeType: string }[]
): Promise<
  {
    type: AttachmentType;
    url: string;
    name?: string;
  }[]
> {
  const result: { type: AttachmentType; url: string; name?: string }[] = [];
  const seen = new Set<string>();

  try {
    const attachmentsField = Array.isArray(fields.attachments)
      ? fields.attachments[0]
      : fields.attachments;

    if (attachmentsField) {
      const parsed = JSON.parse(attachmentsField);
      if (Array.isArray(parsed)) {
        for (const att of parsed) {
          if (
            att &&
            typeof att.url === "string" &&
            ["link", "image", "pdf"].includes(att.type) &&
            !seen.has(att.url)
          ) {
            seen.add(att.url);
            result.push({
              type: att.type as AttachmentType,
              url: att.url,
              name: att.name,
            });
          }
        }
      }
    }
  } catch (e) {
    console.warn("Could not parse existing attachments:", e);
  }

  // Upload all files to Cloudinary and add to result
  for (const file of files) {
    const url = await uploadToCloudinary(file.buffer, file.filename, "articles");
    if (seen.has(url)) continue;
    seen.add(url);
    result.push({
      type: getAttachmentType(file.mimeType),
      url,
      name: file.filename,
    });
  }

  return result;
}

// Normalize tags from various formats to string[]
function normalizeTags(tagsField: unknown): string[] {
  let tags: string[] = [];
  if (typeof tagsField === "string") {
    try {
      const parsed = JSON.parse(tagsField);
      if (Array.isArray(parsed)) {
        tags = parsed
          .map((t) => (typeof t === "string" ? t : typeof t?.value === "string" ? t.value : ""))
          .filter(Boolean);
      } else if (typeof parsed === "string") {
        tags = [parsed];
      }
    } catch {
      tags = [tagsField];
    }
  } else if (Array.isArray(tagsField)) {
    tags = tagsField
      .map((t) => (typeof t === "string" ? t : typeof t?.value === "string" ? t.value : ""))
      .filter(Boolean);
  }
  return tags;
}

// POST - Create Article
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

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

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
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}

// PUT - Update Article
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

    // Parse existing attachments from fields.attachments JSON string
    let existingAttachments: typeof newUploads = [];
    const existingField = Array.isArray(fields.attachments) ? fields.attachments[0] : fields.attachments;

    if (existingField && typeof existingField === "string") {
      try {
        const parsed = JSON.parse(existingField);
        if (Array.isArray(parsed)) {
          existingAttachments = parsed.filter(
            (att) =>
              att &&
              typeof att.url === "string" &&
              ["link", "image", "pdf"].includes(att.type)
          );
        }
      } catch (e) {
        console.warn("Could not parse existing attachments:", e);
      }
    }

    // Combine existing + new uploads, deduplicate by type+url+name
    const allAttachments = [...existingAttachments, ...newUploads];
    const seen = new Set<string>();
    const attachments = allAttachments.filter((att) => {
      const key = `${att.type}-${att.url}-${att.name || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const article = await Article.findById(params.id);
    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });

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
