// models/Article.ts

import mongoose, { Schema, Document } from "mongoose";

export interface IAttachment {
  type: "pdf" | "image" | "link" | "form";
  url: string;
  name?: string; // optional display name
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

const AttachmentSchema = new Schema<IAttachment>(
  {
    type: { type: String, enum: ["pdf", "image", "link", "form"], required: true },
    url: { type: String, required: true },
    name: { type: String }, // optional
  },
  { _id: false }
);

const ArticleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    subject: { type: String },
    attachments: [AttachmentSchema],
    upvotes: [String],
    downvotes: [String],
  },
  { timestamps: true }
);

export default mongoose.models.Article ||
  mongoose.model<IArticle>("Article", ArticleSchema);
