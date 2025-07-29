import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import Article from "@/models/Article";
import slugify from "slugify";
import mongoose from "mongoose";

// GET single article
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid article ID" },
        { status: 400 }
      );
    }
    
    const article = await Article.findById(params.id).lean();
    
    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      ...article,
      _id: article._id.toString(),
      upvotesCount: article.upvotes?.length || 0,
      downvotesCount: article.downvotes?.length || 0,
    });
    
  } catch (error) {
    console.error("Admin article GET error:", error);
    return NextResponse.json(
      { error: "Unauthorized or server error" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

// UPDATE article
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid article ID" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { title, content, subject, tags, attachments } = body;
    
    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }
    
    const existingArticle = await Article.findById(params.id);
    if (!existingArticle) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }
    
    // Generate new slug if title changed
    let slug = existingArticle.slug;
    if (title !== existingArticle.title) {
      slug = slugify(title, { lower: true, strict: true });
      
      // Ensure slug is unique (excluding current article)
      let counter = 1;
      let uniqueSlug = slug;
      while (await Article.findOne({ slug: uniqueSlug, _id: { $ne: params.id } })) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }
      slug = uniqueSlug;
    }
    
    const updatedArticle = await Article.findByIdAndUpdate(
      params.id,
      {
        title,
        content,
        slug,
        subject: subject || '',
        tags: tags || [],
        attachments: attachments || [],
      },
      { new: true, runValidators: true }
    ).lean();
    
    return NextResponse.json({
      message: "Article updated successfully",
      article: {
        ...updatedArticle,
        _id: updatedArticle!._id.toString(),
        upvotesCount: updatedArticle!.upvotes?.length || 0,
        downvotesCount: updatedArticle!.downvotes?.length || 0,
      }
    });
    
  } catch (error) {
    console.error("Admin article PUT error:", error);
    return NextResponse.json(
      { error: "Unauthorized or server error" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

// DELETE article
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid article ID" },
        { status: 400 }
      );
    }
    
    const article = await Article.findById(params.id);
    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }
    
    await Article.findByIdAndDelete(params.id);
    
    return NextResponse.json({
      message: "Article deleted successfully"
    });
    
  } catch (error) {
    console.error("Admin article DELETE error:", error);
    return NextResponse.json(
      { error: "Unauthorized or server error" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}