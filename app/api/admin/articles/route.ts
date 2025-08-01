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

// Configure Cloudinary with env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// Helper to determine attachment type from mimeType
function getAttachmentType(mimeType: string): "pdf" | "image" | "link" | "form" {
  if (!mimeType) return "pdf";
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  return "pdf"; // fallback
}

// Upload a buffer to Cloudinary, return secure URL
function uploadToCloudinary(buffer: Buffer, filename: string, folder: string) {
  return new Promise<{ url: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename.replace(/\.[^/.]+$/, ""), // filename without extension
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url) return reject(new Error("Cloudinary upload failed"));
        resolve({ url: result.secure_url });
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

// Parse multipart form data with Busboy and collect buffers (no local saving)
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

      file.on("error", (err) => reject(err));
    });

    busboy.on("error", (err) => reject(err));

    busboy.on("finish", () => {
      resolve({ fields, files });
    });

    if (!req.body) {
      return reject(new Error("Request body is empty or not readable"));
    }

    const reader = req.body.getReader();

    function read() {
      reader
        .read()
        .then(({ done, value }) => {
          if (done) {
            busboy.end();
            return;
          }
          if (value) busboy.write(Buffer.from(value));
          read();
        })
        .catch(reject);
    }

    read();
  });
}

// Parse attachments from fields (support all types) and merge with uploaded files
async function parseAttachments(
  fields: Record<string, any>,
  files: { buffer: Buffer; filename: string; mimeType: string; url?: string }[]
) {
  const seen = new Set<string>();

  const extraAttachments: { type: string; url: string; name?: string }[] = [];

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
            ["link", "form", "image", "pdf"].includes(att.type) &&
            !seen.has(att.url)
          ) {
            seen.add(att.url);
            extraAttachments.push({
              type: att.type,
              url: att.url,
              name: att.name || undefined,
            });
          }
        }
      }
    } catch (e) {
      console.warn("Could not parse attachments JSON:", e);
    }
  }

  const fileAttachments = [];

  for (const file of files) {
    if (!file.url) {
      const uploadResult = await uploadToCloudinary(file.buffer, file.filename, "articles");
      file.url = uploadResult.url;
    }
    if (seen.has(file.url)) continue;
    seen.add(file.url);
    fileAttachments.push({
      type: getAttachmentType(file.mimeType),
      url: file.url,
      name: file.filename,
    });
  }

  return [...extraAttachments, ...fileAttachments];
}

// POST: Create new article
export async function POST(req: Request) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  await connectMongoDB();

  try {
    const { fields, files } = await parseFormData(req);
    
    console.log("=== DEBUG: CREATE ARTICLE ===");
    console.log("Received fields:", Object.keys(fields));
    console.log("Received files:", files.length);
    console.log("Raw attachments field:", fields.attachments);

    const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
    const content = Array.isArray(fields.content) ? fields.content[0] : fields.content;
    const subject = Array.isArray(fields.subject) ? fields.subject[0] : fields.subject || "";

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    // Normalize tags to string[]
    type TagLike = string | { value?: string };

    const tagsField = fields.tags || [];
    let tags: string[] = [];

    if (typeof tagsField === "string") {
      try {
        const parsed = JSON.parse(tagsField);
        if (Array.isArray(parsed)) {
          tags = parsed
            .map((t) => {
              if (typeof t === "string") return t;
              if (
                t &&
                typeof t === "object" &&
                "value" in t &&
                typeof t.value === "string"
              )
                return t.value;
              return "";
            })
            .filter(Boolean);
        } else if (typeof parsed === "string") {
          tags = [parsed];
        } else {
          tags = [];
        }
      } catch {
        tags = [tagsField];
      }
    } else if (Array.isArray(tagsField)) {
      tags = tagsField
        .map((t: TagLike) => {
          if (typeof t === "string") return t;
          if (
            t &&
            typeof t === "object" &&
            "value" in t &&
            typeof t.value === "string"
          )
            return t.value;
          return "";
        })
        .filter(Boolean);
    } else {
      tags = [];
    }

    const attachments = await parseAttachments(fields, files);
    
    console.log("Parsed attachments:", attachments);

    // Generate slug from title
    const generateSlug = (str: string) =>
      str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const slug = generateSlug(title);

    // Check slug uniqueness
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
    
    console.log("Article created successfully. Attachments in DB:", newArticle.attachments);
    console.log("=== END DEBUG ===");

    return NextResponse.json(newArticle, { status: 201 });
  } catch (err) {
    console.error("Create article error:", err);
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}

// GET: Fetch all articles
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
