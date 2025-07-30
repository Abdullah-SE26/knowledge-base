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

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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
    // Convert headers to plain object
    const headers = Object.fromEntries(req.headers.entries()) as Record<
      string,
      string
    >;

    // Create Busboy instance
    const busboy = Busboy({ headers });

    const fields: Record<string, string | string[]> = {};
    const files: ParsedFile[] = [];

    const uploadDir = path.join(process.cwd(), "/public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

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

        writeStream.on("finish", () => {
          files.push({ filepath, filename, mimeType });
        });

        writeStream.on("error", (err) => reject(err));
      }
    );

    busboy.on("error", (err: Error) => reject(err));

    busboy.on("finish", () => {
      resolve({ fields, files });
    });

    // Read and feed request body chunks to busboy
    if (!req.body) return reject(new Error("Request body is empty"));

    const reader = req.body.getReader();

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

export async function POST(req: Request) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  await connectMongoDB();

  try {
    const { fields, files } = await parseFormData(req);

    const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
    const content = Array.isArray(fields.content)
      ? fields.content[0]
      : fields.content;
    const subject = Array.isArray(fields.subject)
      ? fields.subject[0]
      : fields.subject || "";
    let tags = fields.tags || [];
    if (typeof tags === "string") tags = [tags];

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    let slug = generateSlug(title);
    let exists = await Article.findOne({ slug });
    let count = 1;
    while (exists) {
      slug = `${generateSlug(title)}-${count++}`;
      exists = await Article.findOne({ slug });
    }

    const attachments = files.map((file) => ({
      type: "pdf", // adjust or detect based on mimeType if needed
      url: `/uploads/${path.basename(file.filepath)}`,
      name: file.filename,
    }));

    const newArticle = new Article({
      title,
      slug,
      subject,
      content,
      tags,
      attachments,
      upvotes: [],
      downvotes: [],
    });

    await newArticle.save();

    return NextResponse.json(newArticle, { status: 201 });
  } catch (error) {
    console.error("Failed to create article:", error);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  await connectMongoDB();

  try {
    const articles = await Article.find({})
      .select("title slug subject createdAt upvotes downvotes tags")
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
