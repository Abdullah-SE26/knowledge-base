"use client";

import React, { useEffect, useState, useCallback } from "react";
import ArticleModal from "./ArticleModal";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import {
  Edit2,
  Trash2,
  PlusCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

interface Article {
  _id: string;
  title: string;
  slug: string;
  subject?: string;
  content: string;
  createdAt: string;
  upvotes: string[];
  downvotes: string[];
  tags?: string[];
  attachments?: { name: string; url: string }[];
}

export default function AdminArticlesManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/articles");
      if (!res.ok) throw new Error("Failed to fetch articles");
      const data = await res.json();
      setArticles(data.articles);
    } catch {
      toast.error("Failed to fetch articles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleEdit = useCallback(
    (id: string) => {
      const article = articles.find((a) => a._id === id);
      if (article) {
        setEditingArticle(article);
        setModalOpen(true);
      }
    },
    [articles]
  );

  const handleCreate = useCallback(() => {
    setEditingArticle(null);
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(
    async (data: {
      title: string;
      subject: string;
      content: string;
      tags: string[];
      attachments: File[];
    }) => {
      if (saving) return;
      setSaving(true);
      const isEdit = !!editingArticle;
      const url = isEdit
        ? `/api/admin/articles/${editingArticle!._id}`
        : "/api/admin/articles";
      const method = isEdit ? "PUT" : "POST";

      // Use FormData for file uploads
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("subject", data.subject);
      formData.append("content", data.content);
      data.tags.forEach((tag) => formData.append("tags[]", tag));
      data.attachments.forEach((file) => formData.append("attachments", file));

      try {
        const res = await fetch(url, {
          method,
          body: formData,
        });

        if (!res.ok) {
          let errorMsg = "Failed to save";
          try {
            const errorData = await res.json();
            errorMsg = errorData.error || errorMsg;
          } catch {}
          throw new Error(errorMsg);
        }

        setModalOpen(false);
        setEditingArticle(null);
        await fetchArticles();
        toast.success(`Article ${isEdit ? "updated" : "created"} successfully!`);
      } catch (err: unknown) {
        if (err instanceof Error) {
          toast.error(`Error saving article: ${err.message}`);
        } else {
          toast.error("Unknown error saving article");
        }
      } finally {
        setSaving(false);
      }
    },
    [saving, editingArticle, fetchArticles]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setConfirmDeleteId(null);
      try {
        const res = await fetch(`/api/admin/articles/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete");
        await res.json();
        await fetchArticles();
        toast.success("Article deleted.");
      } catch {
        toast.error("Failed to delete article.");
      }
    },
    [fetchArticles]
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Toaster />

      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Articles</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded flex items-center gap-2"
        >
          <PlusCircle size={18} />
          Create New
        </button>
      </header>

      {loading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <div className="overflow-auto shadow border rounded-lg">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm">
              <tr>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Subject</th>
                <th className="px-4 py-2">Votes</th>
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y dark:divide-gray-700">
              {articles.map((a) => (
                <tr
                  key={a._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-4 py-2 max-w-xs break-words">
                    <Link
                      href={`/articles/${a.slug}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {a.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{a.subject || "-"}</td>
                  <td className="px-4 py-2 text-center flex justify-center gap-3">
                    <span className="flex items-center gap-1 text-green-600">
                      <ThumbsUp size={16} />
                      {a.upvotes.length}
                    </span>
                    <span className="flex items-center gap-1 text-red-500">
                      <ThumbsDown size={16} />
                      {a.downvotes.length}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {new Date(a.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-center space-x-2">
                    <button
                      onClick={() => handleEdit(a._id)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(a._id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      


      <ArticleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        initialData={
          editingArticle
            ? {
                title: editingArticle.title,
                subject: editingArticle.subject,
                content: editingArticle.content,
                tags: editingArticle.tags
                  ? editingArticle.tags.map((tag) => ({ value: tag }))
                  : [],
              }
            : undefined
        }
      />

      <ConfirmationModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        title="Confirm Delete"
        description="Are you sure you want to delete this article?"
        confirmText="Delete"
      />
    </div>
  );
}
