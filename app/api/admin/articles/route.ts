import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import connectMongoDB from "@/lib/mongodb";
import Article from "@/models/Article";
import Busboy from "busboy";
import path from "path";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

interface ParsedFile {
  filepath: string;
  filename: string;
  mimeType: string;
}

// Helper to determine attachment type from mimeType
function getAttachmentType(mimeType: string): "pdf" | "image" | "link" | "form" {
  if (!mimeType) return "pdf";
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  return "pdf"; // fallback
}

// Parses attachments field from form data (for links/forms) + files
async function parseAttachments(
  fields: Record<string, any>,
  files: ParsedFile[]
) {
  let extraAttachments: { type: "link" | "form"; url: string; name?: string }[] = [];

  if (fields.attachments) {
    try {
      const parsed =
        typeof fields.attachments === "string"
          ? JSON.parse(fields.attachments)
          : fields.attachments;

      if (Array.isArray(parsed)) {
        extraAttachments = parsed
          .filter(
            (att) =>
              att.url &&
              (att.type === "link" || att.type === "form") &&
              typeof att.url === "string"
          )
          .map((att) => ({
            type: att.type,
            url: att.url,
            name: att.name || undefined,
          }));
      }
    } catch (e) {
      console.warn("Could not parse attachments field as JSON:", e);
    }
  }

  const fileAttachments = files.map((file) => ({
    type: getAttachmentType(file.mimeType),
    url: `/uploads/${path.basename(file.filepath)}`,
    name: file.filename,
  }));

  return [...extraAttachments, ...fileAttachments];
}

// Fixed parseFormData that waits for all files to finish writing
async function parseFormData(req: Request): Promise<{
  fields: Record<string, string | string[]>;
  files: ParsedFile[];
}> {
  return new Promise((resolve, reject) => {
    const headers = Object.fromEntries(req.headers.entries()) as Record<string, string>;
    const busboy = Busboy({ headers });

    const fields: Record<string, string | string[]> = {};
    const files: ParsedFile[] = [];

    const uploadDir = path.join(process.cwd(), "/public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileWritePromises: Promise<void>[] = [];

    busboy.on("field", (fieldname: string, val: string) => {
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

    busboy.on(
      "file",
      (
        fieldname: string,
        file: NodeJS.ReadableStream,
        info: { filename: string; mimeType: string }
      ) => {
        const { filename, mimeType } = info;
        const filepath = path.join(uploadDir, `${Date.now()}-${filename}`);

        const writeStream = fs.createWriteStream(filepath);
        file.pipe(writeStream);

        const promise = new Promise<void>((res, rej) => {
          writeStream.on("finish", () => {
            files.push({ filepath, filename, mimeType });
            res();
          });
          writeStream.on("error", (err) => rej(err));
        });

        fileWritePromises.push(promise);
      }
    );

    busboy.on("error", (err: Error) => reject(err));

    busboy.on("finish", () => {
      // Wait for all file writes to complete before resolving
      Promise.all(fileWritePromises)
        .then(() => resolve({ fields, files }))
        .catch(reject);
    });

    if (!req.body) {
      return reject(new Error("Request body is empty or not readable"));
    }

    const reader = req.body.getReader();

    if (!reader) {
      return reject(new Error("Request body reader is not available"));
    }

    function read() {
      reader
        .read()
        .then(({ done, value }) => {
          if (done) {
            busboy.end();
            return;
          }
          if (value) {
            busboy.write(Buffer.from(value));
          }
          read();
        })
        .catch(reject);
    }

    read();
  });
}

// POST: Create new article
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

    return NextResponse.json(newArticle, { status: 201 });
  } catch (err) {
    console.error("Create article error:", err);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
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
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
