import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
  secure: true,
});

if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  throw new Error("Missing Cloudinary environment variables.");
}

export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  folder: string
): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename.replace(/\.[^/.]+$/, ""),
        resource_type: "auto", // ✅ This is critical for non-images
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url) return reject(new Error("Upload failed"));
        resolve({ url: result.secure_url });
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}
