import mongoose, { Schema, Types, HydratedDocument, Model } from "mongoose";
import slugify from "slugify";

export interface IArticle {
  _id: Types.ObjectId;
  slug: string;
  title: string;
  subject: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
}

export type ArticleDoc = HydratedDocument<IArticle>;

const ArticleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    tags: { type: [String], default: [] },
    slug: { type: String, required: true, unique: true },
    upvotes: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    downvotes: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
  },
  {
    timestamps: true,
  }
);

ArticleSchema.pre<ArticleDoc>("save", function (next) {
  if (this.isModified("title")) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

const Article: Model<IArticle> =
  mongoose.models.Article || mongoose.model<IArticle>("Article", ArticleSchema);

export default Article;
