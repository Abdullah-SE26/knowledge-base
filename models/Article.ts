// models/Article.ts

import mongoose, { Schema, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IAttachment {
  customId?: string;
  type: "pdf" | "image" | "form" | "docx" | "ppt";
  url: string;
  name?: string;
}

export interface ArticleSerialized {
  _id: string;
  slug: string;
  title: string;
  subject: string;
  content: string;
  tags: string[];
  attachments: IAttachment[];
  createdAt: string;
  createdAtFormatted: string;
  updatedAt: string;
  updatedAtFormatted: string;
  upvotesCount: number;
  downvotesCount: number;
}

export interface IArticle extends Document {
  title: string;
  content: string;
  slug: string;
  subject: string;
  attachments?: IAttachment[];
  upvotes?: string[];
  downvotes?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  tags?: string[];
}

const AttachmentSchema = new Schema<IAttachment & { customId: string }>(
  {
    customId: {
      type: String,
      default: uuidv4,
    },
    type: {
      type: String,
      enum: ["pdf", "image", "form", "docx", "ppt", "pptx", "jpg", "png"],
      required: true,
    },
    url: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string): boolean {
          try {
            // Accept any well-formed URL (Cloudinary etc.)
            new URL(v);
            return true;
          } catch {
            return false;
          }
        },
        message: (props: { value: string }) => `${props.value} is not a valid URL!`,
      },
    },
    name: { type: String }, // Optional
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
    upvotes: [String],
    downvotes: [String],
    tags: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.models.Article ||
  mongoose.model<IArticle>("Article", ArticleSchema);
