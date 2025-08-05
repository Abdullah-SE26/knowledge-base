// models/Article.ts

import mongoose, { Schema, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IAttachment {
  // customId is usually frontend-only, omit from backend unless you want to store it
  type: "pdf" | "image" | "form" | "docx" | "ppt" | "pptx" | "xlsx" | "video";
  url: string;
  name?: string;
  public_id?: string;
}

export interface IArticle extends Document {
  title: string;
  content: string;
  slug: string;
  subject?: string;
  attachments?: IAttachment[];
  upvotes?: string[];
  downvotes?: string[];
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    type: {
      type: String,
      enum: ["pdf", "image", "form", "docx", "ppt", "pptx", "xlsx", "video"],
      required: true,
    },
    url: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          try {
            new URL(v);
            return true;
          } catch {
            return false;
          }
        },
        message: (props: { value: string }) => `${props.value} is not a valid URL!`,
      },
    },
    name: { type: String },
    public_id: { type: String }, // optional Cloudinary or other public id
  },
  { _id: false }
);

const ArticleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    subject: { type: String },
    attachments: { type: [AttachmentSchema], default: [] },
    upvotes: [{ type: String }],
    downvotes: [{ type: String }],
    tags: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.models.Article ||
  mongoose.model<IArticle>("Article", ArticleSchema);
