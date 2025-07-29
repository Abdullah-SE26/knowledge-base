import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import Article from "@/models/Article";
import slugify from "slugify";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const subject = searchParams.get('subject') || '';
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    if (subject) {
      query.subject = subject;
    }
    
    const articles = await Article.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Article.countDocuments(query);
    
    const articlesWithStats = articles.map(article => ({
      ...article,
      _id: article._id.toString(),
      upvotesCount: article.upvotes?.length || 0,
      downvotesCount: article.downvotes?.length || 0,
    }));
    
    return NextResponse.json({
      articles: articlesWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Admin articles GET error:", error);
    return NextResponse.json(
      { error: "Unauthorized or server error" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    
    const body = await request.json();
    const { title, content, subject, tags, attachments } = body;
    
    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }
    
    // Generate slug
    let slug = slugify(title, { lower: true, strict: true });
    
    // Ensure slug is unique
    let counter = 1;
    let uniqueSlug = slug;
    while (await Article.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }
    
    const article = new Article({
      title,
      content,
      slug: uniqueSlug,
      subject: subject || '',
      tags: tags || [],
      attachments: attachments || [],
      upvotes: [],
      downvotes: []
    });
    
    await article.save();
    
    return NextResponse.json({
      message: "Article created successfully",
      article: {
        ...article.toObject(),
        _id: article._id.toString(),
        upvotesCount: 0,
        downvotesCount: 0
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error("Admin articles POST error:", error);
    return NextResponse.json(
      { error: "Unauthorized or server error" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}