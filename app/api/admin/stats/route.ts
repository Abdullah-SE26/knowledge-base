import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import Article from "@/models/Article";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: Request) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  await connectMongoDB();

  // Total articles
  const totalArticles = await Article.countDocuments();

  // Total likes and dislikes (sum length of upvotes and downvotes arrays)
  const aggLikesDislikes = await Article.aggregate([
    {
      $group: {
        _id: null,
        totalUpvotes: { $sum: { $size: { $ifNull: ["$upvotes", []] } } },
        totalDownvotes: { $sum: { $size: { $ifNull: ["$downvotes", []] } } },
      },
    },
  ]);

  const totalUpvotes =
    aggLikesDislikes[0]?.totalUpvotes !== undefined
      ? aggLikesDislikes[0].totalUpvotes
      : 0;
  const totalDownvotes =
    aggLikesDislikes[0]?.totalDownvotes !== undefined
      ? aggLikesDislikes[0].totalDownvotes
      : 0;

  // Daily article creations (last 30 days)
  const today = new Date();
  const past30Days = new Date(today);
  past30Days.setDate(today.getDate() - 29);

  const dailyCreations = await Article.aggregate([
    {
      $match: {
        createdAt: { $gte: past30Days },
      },
    },
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
    {
      $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
    },
  ]);

  // Format daily creations as [{ date: 'YYYY-MM-DD', count }]
  const formattedDailyCreations = dailyCreations.map((item) => {
    const { year, month, day } = item._id;
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    return { date: dateStr, count: item.count };
  });

  // TODO: Upvotes trends - similar aggregation (can be extended)

  return NextResponse.json({
    totalArticles,
    totalUpvotes,
    totalDownvotes,
    dailyCreations: formattedDailyCreations,
  });
}
