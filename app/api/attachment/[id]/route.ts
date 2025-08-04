import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const publicId = params.id;
  if (!publicId) {
    return NextResponse.json({ error: "Missing attachment id" }, { status: 400 });
  }

  try {
    const resource = await cloudinary.v2.api.resource(publicId);
    const fileUrl = resource.secure_url;

    const response = await fetch(fileUrl);
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch file from Cloudinary" }, { status: 500 });
    }

    const buffer = await response.arrayBuffer();

    // Get the file format and MIME type
    const format = resource.format.toLowerCase();
    const filename = resource.public_id.split("/").pop(); // safe filename fallback

    let contentType = "application/octet-stream";

    if (format === "pdf") {
      contentType = "application/pdf";
    } else if (resource.resource_type === "image") {
      contentType = `image/${format}`;
    } else if (format === "docx") {
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else if (format === "doc") {
      contentType = "application/msword";
    } else if (format === "pptx") {
      contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    } else if (format === "xlsx") {
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    }

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}.${format}"`,
      },
    });
  } catch (error) {
    console.error("Attachment fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch attachment" }, { status: 500 });
  }
}
