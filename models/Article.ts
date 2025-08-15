import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAttachment {
  type: "pdf" | "image" | "form" | "docx" | "ppt" | "pptx" | "xlsx" | "video";
  url: string;
  name?: string;
  public_id?: string;
}

export interface IArticleData {
  title: string;
  title_ar?: string; // Arabic title
  content: string;
  content_ar?: string; // Arabic content
  slug: string;
  subject?: string;
  subject_ar?: string; // Arabic subject
  attachments?: IAttachment[];
  upvotes?: string[];
  downvotes?: string[];
  tags?: string[];
}

// Specify _id type explicitly here as Types.ObjectId
export interface IArticleDocument
  extends IArticleData,
    Document<Types.ObjectId> {
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
        message: (props: { value: string }) =>
          `${props.value} is not a valid URL!`,
      },
    },
    name: { type: String },
    public_id: { type: String },
  },
  { _id: false }
);

const ArticleSchema = new Schema<IArticleDocument>(
  {
    title: { type: String, required: true },
    title_ar: { type: String }, // optional
    content: { type: String, required: true },
    content_ar: { type: String }, // optional
    slug: { type: String, required: true, unique: true },
    subject: { type: String },
    subject_ar: { type: String }, // optional
    attachments: { type: [AttachmentSchema], default: [] },
    upvotes: [{ type: String }],
    downvotes: [{ type: String }],
    tags: [{ type: String }],
  },
  { timestamps: true }
);

// Delete the existing model to ensure schema updates are applied
if (mongoose.models.Article) {
  delete mongoose.models.Article;
}

const ArticleModel = mongoose.model<IArticleDocument>("Article", ArticleSchema);

export default ArticleModel;

export interface ArticleSerialized {
  _id: string;
  title: string;
  title_ar?: string;
  content: string;
  content_ar?: string;
  slug: string;
  subject?: string;
  subject_ar?: string;
  attachments?: IAttachment[];
  upvotes?: string[];
  downvotes?: string[];
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  createdAtFormatted?: string;
  upvotesCount: number;
  downvotesCount: number;
}

export function serializeArticle(article: IArticleDocument): ArticleSerialized {
  return {
    _id: article._id.toString(),
    title: article.title,
    title_ar: article.title_ar,
    content: article.content,
    content_ar: article.content_ar,
    slug: article.slug,
    subject: article.subject,
    subject_ar: article.subject_ar,
    attachments: article.attachments,
    upvotes: article.upvotes,
    downvotes: article.downvotes,
    tags: article.tags,
    createdAt: article.createdAt?.toISOString(),
    updatedAt: article.updatedAt?.toISOString(),
    upvotesCount: article.upvotes?.length || 0,
    downvotesCount: article.downvotes?.length || 0,
  };
}
