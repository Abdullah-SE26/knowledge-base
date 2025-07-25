"use client";

import { useState } from "react";
import { Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";

interface ArticleActionsClientProps {
  articleId: string;
  initialUpvotes: number;
  initialDownvotes: number;
  title?: string;
}

const ArticleActionsClient: React.FC<ArticleActionsClientProps> = ({
  articleId,
  initialUpvotes,
  initialDownvotes,
  title,
}) => {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userVote, setUserVote] = useState<"upvote" | "downvote" | null>(null); // track user's vote

  const handleVote = async (type: "upvote" | "downvote") => {
    if (loading || userVote === type) return; // prevent re-voting the same type
    setLoading(true);

    // Optimistic update
    if (type === "upvote") {
      setUpvotes(prev => prev + 1);
      if (userVote === "downvote") setDownvotes(prev => prev - 1);
    } else {
      setDownvotes(prev => prev + 1);
      if (userVote === "upvote") setUpvotes(prev => prev - 1);
    }

    setUserVote(type);

    try {
      const res = await fetch("/api/articleVotes/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, type }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Vote request failed");

      const data = await res.json();
      setUpvotes(data.upvotes);
      setDownvotes(data.downvotes);
    } catch (err) {
      console.error("Vote failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/articles/${articleId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 5000);
  };

  return (
    <div className="flex items-center gap-4 mt-6 flex-wrap">
      <button
        onClick={() => handleVote("upvote")}
        disabled={loading}
        aria-label={title ? `Upvote article titled ${title}` : "Upvote article"}
        className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition disabled:opacity-50 ${
          userVote === "upvote"
            ? "bg-green-500 text-white"
            : "bg-green-100 text-green-700 hover:bg-green-200"
        }`}
      >
        <ThumbsUp className="w-4 h-4" />
        {upvotes}
      </button>

      <button
        onClick={() => handleVote("downvote")}
        disabled={loading}
        aria-label={title ? `Downvote article titled ${title}` : "Downvote article"}
        className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition disabled:opacity-50 ${
          userVote === "downvote"
            ? "bg-red-500 text-white"
            : "bg-red-100 text-red-700 hover:bg-red-200"
        }`}
      >
        <ThumbsDown className="w-4 h-4" />
        {downvotes}
      </button>

      <button
        onClick={handleCopy}
        aria-label={title ? `Copy link to article titled ${title}` : "Copy link to article"}
        className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium transition cursor-pointer dark:text-black"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-green-600" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copy Link
          </>
        )}
      </button>
    </div>
  );
};

export default ArticleActionsClient;
