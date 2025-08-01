"use client";

import React, { useEffect, useState, useCallback } from "react";
import ArticleModal from "./ArticleModal";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import { Edit2, Trash2, PlusCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

interface Attachment {
  type: "pdf" | "image" | "link" | "form" | "docx";
  url: string;
  name?: string;
}

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
  attachments?: Attachment[];
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

  const handleEdit = (id: string) => {
    const article = articles.find((a) => a._id === id);
    if (article) {
      setEditingArticle(article);
      setModalOpen(true);
    }
  };

  const handleCreate = () => {
    setEditingArticle(null);
    setModalOpen(true);
  };

  const handleSave = useCallback(
    async (data: FormData) => {
      if (saving) return;
      setSaving(true);

      const isEdit = !!editingArticle;
      const url = isEdit
        ? `/api/admin/articles/${editingArticle!._id}`
        : "/api/admin/articles";
      const method = isEdit ? "PUT" : "POST";

      try {
        const title = data.get("title") as string | null;
        const subject = (data.get("subject") as string | null) || "";
        const content = data.get("content") as string | null;

        const tagsJson = data.get("tags") as string | null;
        let tags: string[] = [];
        if (tagsJson) {
          try {
            tags = JSON.parse(tagsJson);
          } catch {
            console.warn("Failed to parse tags JSON");
          }
        }

        const files = data.getAll("attachment") as File[];
        const attachmentsJson = data.get("attachments") as string | null;
        let attachments: { type: string; url: string; name?: string }[] = [];
        if (attachmentsJson) {
          try {
            attachments = JSON.parse(attachmentsJson);
          } catch {
            console.warn("Failed to parse attachments JSON");
          }
        }

        const sendData = new FormData();
        if (title) sendData.append("title", title);
        sendData.append("subject", subject);
        if (content) sendData.append("content", content);
        sendData.append("tags", JSON.stringify(tags));
        files.forEach((file) => sendData.append("attachment", file));
        if (attachments.length > 0) {
          sendData.append("attachments", JSON.stringify(attachments));
        }

        const res = await fetch(url, {
          method,
          body: sendData,
        });

        if (!res.ok) {
          const json = await res.json().catch(() => null);
          throw new Error(json?.error || res.statusText);
        }

        setModalOpen(false);
        setEditingArticle(null);
        await fetchArticles();
        toast.success(`Article ${isEdit ? "updated" : "created"} successfully!`);
      } catch (err: any) {
        console.error("Save failed:", err);
        toast.error(`Error saving article: ${err.message || err}`);
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
        if (!res.ok) throw new Error("Failed to delete article");
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
        <div className="overflow-x-auto shadow border rounded-lg">
          <table className="min-w-full text-sm table-auto">
            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
              <tr>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Subject</th>
                <th className="px-4 py-2 text-center">Votes</th>
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {articles.map((a) => (
                <tr key={a._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-2 max-w-xs break-words">
                    <Link
                      href={`/articles/${a.slug}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {a.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{a.subject || "-"}</td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex justify-center gap-3">
                      <span className="flex items-center gap-1 text-green-600">
                        <ThumbsUp size={16} />
                        {a.upvotes.length}
                      </span>
                      <span className="flex items-center gap-1 text-red-500">
                        <ThumbsDown size={16} />
                        {a.downvotes.length}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {new Date(a.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex justify-center gap-2">
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
                    </div>
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
                tags:
                  editingArticle.tags?.map((tag) => ({ value: tag })) || [],
                attachments:
                  editingArticle.attachments?.map((att) => ({
                    type: att.type || "link",
                    url: att.url,
                    name: att.name,
                  })) || [],
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
