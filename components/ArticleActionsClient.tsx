"use client";

import { useState, useRef } from "react";
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
  const [userVote, setUserVote] = useState<"upvote" | "downvote" | null>(null);

  const prevUpvotes = useRef(upvotes);
  const prevDownvotes = useRef(downvotes);
  const prevUserVote = useRef(userVote);

  const handleVote = async (type: "upvote" | "downvote") => {
    if (loading || userVote === type) return;
    setLoading(true);

    prevUpvotes.current = upvotes;
    prevDownvotes.current = downvotes;
    prevUserVote.current = userVote;

    // Optimistic update
    if (type === "upvote") {
      setUpvotes((prev) => prev + 1);
      if (userVote === "downvote") setDownvotes((prev) => prev - 1);
    } else {
      setDownvotes((prev) => prev + 1);
      if (userVote === "upvote") setUpvotes((prev) => prev - 1);
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

      const data: { upvotes: number; downvotes: number } = await res.json();
      setUpvotes(data.upvotes);
      setDownvotes(data.downvotes);
    } catch (err) {
      console.error("Vote failed", err);
      setUpvotes(prevUpvotes.current);
      setDownvotes(prevDownvotes.current);
      setUserVote(prevUserVote.current);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/articles/${articleId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 5000);
    } else {
      alert("Clipboard not supported");
    }
  };

  return (
    <div
      className="flex items-center gap-3 flex-wrap"
      aria-live="polite"
      aria-atomic="true"
    >
      <button
        onClick={() => handleVote("upvote")}
        disabled={loading}
        aria-label={title ? `Upvote article titled ${title}` : "Upvote article"}
        aria-pressed={userVote === "upvote"}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:opacity-50 ${
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
        aria-pressed={userVote === "downvote"}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-50 ${
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
        className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md text-sm font-medium transition cursor-pointer dark:text-black focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
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
