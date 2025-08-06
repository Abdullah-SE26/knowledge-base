"use client";

import React, { useEffect, useState } from "react";
import { FileText, ThumbsUp, ThumbsDown } from "lucide-react";

interface Stats {
  totalArticles: number;
  totalUpvotes: number;
  totalDownvotes: number;
}

export default function StatsSection() {
  const [stats, setStats] = useState<Stats>({
    totalArticles: 0,
    totalUpvotes: 0,
    totalDownvotes: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats({
          totalArticles: data.totalArticles,
          totalUpvotes: data.totalUpvotes,
          totalDownvotes: data.totalDownvotes,
        });
      })
      .catch((err) => {
        console.error("Failed to fetch stats", err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-semibold mb-6">📊 Summary Stats</h2>

      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-300">Loading stats...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center p-4 rounded-lg bg-gray-100 dark:bg-gray-900 shadow-sm">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
            <p className="text-3xl font-bold">{stats.totalArticles}</p>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Articles</p>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg bg-gray-100 dark:bg-gray-900 shadow-sm">
            <ThumbsUp className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
            <p className="text-3xl font-bold">{stats.totalUpvotes}</p>
            <p className="text-green-700 dark:text-green-300 mt-1">Likes</p>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg bg-gray-100 dark:bg-gray-900 shadow-sm">
            <ThumbsDown className="w-8 h-8 text-red-600 dark:text-red-400 mb-2" />
            <p className="text-3xl font-bold">{stats.totalDownvotes}</p>
            <p className="text-red-700 dark:text-red-300 mt-1">Dislikes</p>
          </div>
        </div>
      )}
    </section>
  );
}
