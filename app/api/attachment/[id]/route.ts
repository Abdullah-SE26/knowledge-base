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
  // Check user session and auth
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const publicId = params.id;
  if (!publicId) {
    return NextResponse.json({ error: "Missing attachment id" }, { status: 400 });
  }

  try {
    // Get resource info from Cloudinary
    const resource = await cloudinary.v2.api.resource(publicId);

    // Fetch the file from Cloudinary
    const fileUrl = resource.secure_url;
    const response = await fetch(fileUrl);

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch file from Cloudinary" }, { status: 500 });
    }

    const buffer = await response.arrayBuffer();

    // Return the file as response with appropriate headers
    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": resource.format.startsWith("image") ? `image/${resource.format}` : "application/octet-stream",
        "Content-Disposition": `inline; filename="${resource.public_id}.${resource.format}"`,
      },
    });
  } catch (error) {
    console.error("Attachment fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch attachment" }, { status: 500 });
  }
}
