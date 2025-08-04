import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
  title: "KB-Admin",
  description: "Manage resources",
};

import StatsSection from "@/components/admin/StatsSection";
import connectMongoDB from "@/lib/mongodb";
import Article from "@/models/Article";
import GraphClientWrapper from "@/components/admin/GraphClientWrapper";

export default async function AdminDashboardPage() {
  await connectMongoDB();

  const totalArticles = await Article.countDocuments();

  // For simplicity, fetch a page of articles here (could be client-side later)
  const articles = await Article.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select("title slug subject createdAt upvotes downvotes")
    .lean();

  // For stats like totalUpvotes/Downvotes and daily creations, fetch via API client side or add here if you want server side

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-12">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats */}
      <StatsSection/>

      {/* Graphs */}
      <GraphClientWrapper />

    </div>
  );
}
