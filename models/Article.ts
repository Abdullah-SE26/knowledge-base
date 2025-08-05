import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAttachment {
  type: "pdf" | "image" | "form" | "docx" | "ppt" | "pptx" | "xlsx" | "video";
  url: string;
  name?: string;
  public_id?: string;
}

export interface IArticleData {
  title: string;
  content: string;
  slug: string;
  subject?: string;
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

const ArticleModel =
  mongoose.models.Article ||
  mongoose.model<IArticleDocument>("Article", ArticleSchema);

export default ArticleModel;

export interface ArticleSerialized {
  _id: string;
  title: string;
  content: string;
  slug: string;
  subject?: string;
  attachments?: IAttachment[];
  upvotes?: string[];
  downvotes?: string[];
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  upvotesCount: number;    // add this
  downvotesCount: number;  // add this
}

export function serializeArticle(article: IArticleDocument): ArticleSerialized {
  return {
    _id: article._id.toString(), // now TypeScript knows _id is ObjectId
    title: article.title,
    content: article.content,
    slug: article.slug,
    subject: article.subject,
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
