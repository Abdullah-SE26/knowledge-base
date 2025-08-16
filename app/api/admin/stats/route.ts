import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import Article from "@/models/Article";
import User from "@/models/User";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: Request) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  await connectMongoDB();

  // --- ARTICLE STATS ---

  // Total articles
  const totalArticles = await Article.countDocuments();

  // Total upvotes and downvotes
  const aggLikesDislikes = await Article.aggregate([
    {
      $group: {
        _id: null,
        totalUpvotes: { $sum: { $size: { $ifNull: ["$upvotes", []] } } },
        totalDownvotes: { $sum: { $size: { $ifNull: ["$downvotes", []] } } },
      },
    },
  ]);

  const totalUpvotes = aggLikesDislikes[0]?.totalUpvotes ?? 0;
  const totalDownvotes = aggLikesDislikes[0]?.totalDownvotes ?? 0;

  // Daily article creations (last 30 days)
  const today = new Date();
  const past30Days = new Date(today);
  past30Days.setDate(today.getDate() - 29);

  const dailyCreationsAgg = await Article.aggregate([
    { $match: { createdAt: { $gte: past30Days } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);

  const formattedDailyCreations = dailyCreationsAgg.map((item) => {
    const { year, month, day } = item._id;
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return { date: dateStr, count: item.count };
  });

  // --- USER STATS ---

  const totalUsers = await User.countDocuments();

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthlyActiveUsers = await User.countDocuments({
    lastActive: { $gte: firstDayOfMonth },
  });

  // --- RETURN COMBINED STATS ---

  return NextResponse.json({
    totalArticles,
    totalUpvotes,
    totalDownvotes,
    dailyCreations: formattedDailyCreations,
    totalUsers,
    monthlyActiveUsers,
  });
}
