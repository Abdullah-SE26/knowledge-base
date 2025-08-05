"use client";

import { generateUploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

export default function UploadSection() {
  return (
    <div className="p-4 border rounded-xl bg-white shadow-md max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-4">Upload Files</h2>
      <UploadDropzone
        endpoint="anyFileUploader"
        onClientUploadComplete={(res) => {
          console.log("✅ Upload complete:", res);
          alert("Upload successful!");
        }}
        onUploadError={(error) => {
          console.error("❌ Upload failed:", error);
          alert("Upload failed. Please try again.");
        }}
        appearance={{
          label: "Drop your file here or click to browse",
          allowedContent: "PDFs, Docs, PPTs, Images (PNG, JPG), xlsx, mp4, webm",
          button: {
            backgroundColor: "#4f46e5",
            color: "white",
            padding: "10px 16px",
            borderRadius: "8px",
          },
          container: "border border-dashed border-gray-300 p-6 rounded-lg",
        }}
      />
    </div>
  );
}
