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

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

type AttachmentType = "pdf" | "image" | "form" | "docx";

interface Attachment {
  type: AttachmentType;
  url: string;
  name?: string;
}

interface UploadedFile {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

const allowedAttachmentTypes: AttachmentType[] = ["image", "pdf", "form", "docx"];

function getAttachmentType(mimeType: string): AttachmentType {
  if (!mimeType) return "pdf";
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  return "pdf";
}

function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  folder: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename.replace(/\.[^/.]+$/, ""),
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

    const reader = req.body?.getReader?.();
    if (!reader) return reject(new Error("Request body reader is not available"));

    const pump = () => {
      reader
        .read()
        .then(({ done, value }) => {
          if (done) return busboy.end();
          if (value) busboy.write(Buffer.from(value));
          pump();
        })
        .catch(reject);
    };

    pump();
  });
}

async function parseAttachments(
  fields: Record<string, any>,
  files: UploadedFile[]
): Promise<Attachment[]> {
  const seen = new Set<string>();
  const result: Attachment[] = [];

  // Parse existing (if any)
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
            typeof att.url === "string" &&
            allowedAttachmentTypes.includes(att.type) &&
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
    } catch (e) {
      console.warn("Could not parse existing attachments:", e);
    }
  }

  // Upload new files
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

function normalizeTags(input: unknown): string[] {
  let tags: string[] = [];
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
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
      tags = [input];
    }
  } else if (Array.isArray(input)) {
    tags = input
      .map((t) =>
        typeof t === "string" ? t : typeof t?.value === "string" ? t.value : ""
      )
      .filter(Boolean);
  }
  return tags;
}

// PUT - Update Article
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  await connectMongoDB();

  try {
    const { fields, files } = await parseFormData(req);

    const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
    const content = Array.isArray(fields.content) ? fields.content[0] : fields.content;
    const subject = Array.isArray(fields.subject) ? fields.subject[0] : fields.subject || "";

    const tags = normalizeTags(fields.tags);
    const attachments = await parseAttachments(fields, files);

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

// DELETE - Delete Article
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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
