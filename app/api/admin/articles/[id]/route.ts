import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import Article from "@/models/Article";
import { requireAdmin } from "@/lib/adminAuth";
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

    busboy.on("field", (fieldname, val) => {
        console.log(`[busboy] field: ${fieldname} =`, val);
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
      const filepath = path.join(uploadDir, `${Date.now()}-${filename}`);

      const writeStream = fs.createWriteStream(filepath);
      file.pipe(writeStream);

      writeStream.on("finish", () => {
        files.push({ filepath, filename, mimeType });
      });

      writeStream.on("error", (err) => reject(err));
    });

    busboy.on("error", (err) => reject(err));

    busboy.on("finish", () => resolve({ fields, files }));

    if (!req.body) return reject(new Error("Request body is empty"));

    const reader = req.body.getReader();

    function read() {
      reader.read().then(({ done, value }) => {
        if (done) {
          busboy.end();
          return;
        }
        if (value) busboy.write(Buffer.from(value));
        read();
      }).catch(reject);
    }

    read();
  });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  await connectMongoDB();

  try {
    const { fields, files } = await parseFormData(req);

    const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
    const subject = Array.isArray(fields.subject) ? fields.subject[0] : fields.subject || "";
    const content = Array.isArray(fields.content) ? fields.content[0] : fields.content;
    let tags = fields.tags || [];
    if (typeof tags === "string") tags = [tags];

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const generateSlug = (str: string) =>
      str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const slug = generateSlug(title);

    const existing = await Article.findOne({ slug, _id: { $ne: params.id } });
    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }

    const article = await Article.findById(params.id);
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const newAttachments = files.map((file) => ({
      type: file.mimeType || "unknown",
      url: `/uploads/${path.basename(file.filepath)}`,
      name: file.filename,
    }));

    article.title = title;
    article.slug = slug;
    article.subject = subject;
    article.content = content;
    article.tags = tags;
    article.attachments = [...(article.attachments || []), ...newAttachments];
    article.updatedAt = new Date();

    await article.save();
    console.log("Saved article content:", article.content);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  await connectMongoDB();

  try {
    const deleted = await Article.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}

