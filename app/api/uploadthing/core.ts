// app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/server";

const f = createUploadthing();

export const ourFileRouter = {
  anyFileUploader: f({
    blob: {
      maxFileSize: "1GB",       // ✅ allows large files (e.g., video)
      maxFileCount: 5,          // ✅ up to 5 files per upload
    },
  }).onUploadComplete(async ({ file }) => {
    return {
      url: file.ufsUrl,         // ✅ you'll use this on frontend
      name: file.name,          // ✅ original file name
    };
  }),
};

export type OurFileRouter = typeof ourFileRouter;
