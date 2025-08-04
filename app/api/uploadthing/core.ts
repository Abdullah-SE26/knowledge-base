// app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/server";

const f = createUploadthing();

export const ourFileRouter = {
  anyFileUploader: f({ blob: { maxFileSize: "16MB", maxFileCount: 5 } })
    .onUploadComplete(async ({ file }) => {
      return {
        url: file.ufsUrl,
        name: file.name,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
