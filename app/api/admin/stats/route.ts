import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import Article from "@/models/Article";
import clientPromise from "@/lib/clientPromise";
import { startOfDay, subDays, format } from "date-fns";

export async function GET() {
  try {
    await requireAdmin();
    
    const client = await clientPromise;
    const db = client.db();
    
    // Get articles collection
    const articles = await Article.find({}).lean();
    const usersCollection = db.collection("users");
    const users = await usersCollection.find({}).toArray();
    
    // Basic counts
    const totalArticles = articles.length;
    const totalUsers = users.length;
    const totalUpvotes = articles.reduce((sum, article) => sum + (article.upvotes?.length || 0), 0);
    const totalDownvotes = articles.reduce((sum, article) => sum + (article.downvotes?.length || 0), 0);
    
    // Articles created over time (last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const articlesOverTime = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const count = articles.filter(article => {
        const createdAt = new Date(article.createdAt);
        return createdAt >= dayStart && createdAt < dayEnd;
      }).length;
      
      articlesOverTime.push({
        date: format(date, 'MMM dd'),
        articles: count
      });
    }
    
    // Most liked articles
    const mostLikedArticles = articles
      .map(article => ({
        title: article.title,
        slug: article.slug,
        upvotes: article.upvotes?.length || 0,
        downvotes: article.downvotes?.length || 0,
        ratio: (article.upvotes?.length || 0) / Math.max((article.upvotes?.length || 0) + (article.downvotes?.length || 0), 1)
      }))
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, 5);
    
    // Articles by subject
    const subjectCounts = articles.reduce((acc, article) => {
      const subject = article.subject || 'Uncategorized';
      acc[subject] = (acc[subject] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const articlesBySubject = Object.entries(subjectCounts).map(([subject, count]) => ({
      subject,
      count
    }));
    
    // Popular tags
    const tagCounts = articles.reduce((acc, article) => {
      article.tags?.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
    
    const popularTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Engagement trends (last 7 days)
    const engagementTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      // This is simplified - in a real app you'd track vote timestamps
      const dayArticles = articles.filter(article => {
        const createdAt = new Date(article.createdAt);
        return createdAt >= dayStart && createdAt < dayEnd;
      });
      
      const dayUpvotes = dayArticles.reduce((sum, article) => sum + (article.upvotes?.length || 0), 0);
      const dayDownvotes = dayArticles.reduce((sum, article) => sum + (article.downvotes?.length || 0), 0);
      
      engagementTrends.push({
        date: format(date, 'MMM dd'),
        upvotes: dayUpvotes,
        downvotes: dayDownvotes
      });
    }
    
    // Recent activity (last 10 articles)
    const recentArticles = articles
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(article => ({
        title: article.title,
        slug: article.slug,
        createdAt: article.createdAt,
        upvotes: article.upvotes?.length || 0,
        downvotes: article.downvotes?.length || 0
      }));
    
    return NextResponse.json({
      overview: {
        totalArticles,
        totalUsers,
        totalUpvotes,
        totalDownvotes
      },
      articlesOverTime,
      mostLikedArticles,
      articlesBySubject,
      popularTags,
      engagementTrends,
      recentArticles
    });
    
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Unauthorized or server error" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}