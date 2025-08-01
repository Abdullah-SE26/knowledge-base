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
  FileText,
  Image,
  Link as LinkIcon,
  FilePlus,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";

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
        
        console.log("=== DEBUG: FRONTEND SENDING ===");
        console.log("Method:", method);
        console.log("URL:", url);
        console.log("Title:", title);
        console.log("Files:", files.length);
        console.log("Attachments JSON:", attachmentsJson);
        console.log("Parsed attachments:", attachments);

        const sendData = new FormData();
        if (title) sendData.append("title", title);
        sendData.append("subject", subject);
        if (content) sendData.append("content", content);
        sendData.append("tags", JSON.stringify(tags));
        files.forEach((file) => sendData.append("attachment", file));
        sendData.append("attachments", JSON.stringify(attachments));
        
        console.log("FormData contents:");
        for (const [key, value] of sendData.entries()) {
          if (value instanceof File) {
            console.log(`${key}:`, `File(${value.name})`);
          } else {
            console.log(`${key}:`, value);
          }
        }
        console.log("=== END FRONTEND DEBUG ===");

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
        toast.success(
          `Article ${isEdit ? "updated" : "created"} successfully!`
        );
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

  // Icon map for attachments
  const attachmentIconMap = {
    pdf: <FileText size={16} />,
    image: <Image size={16} />,
    link: <LinkIcon size={16} />,
    form: <FilePlus size={16} />,
    docx: <FileText size={16} />,
  };

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
                <th className="px-4 py-2 text-left">Attachments</th>
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {articles.map((a) => (
                <tr
                  key={a._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-4 py-2 max-w-xs break-words">
                    <Link
                      href={`/articles/${a.slug}`}
                      className="text-blue-600 hover:underline font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
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
                  <td className="px-4 py-2">
                    {a.attachments && a.attachments.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {(
                          [
                            "image",
                            "pdf",
                            "link",
                            "form",
                            "docx",
                          ] as Attachment["type"][]
                        ).map((type) => {
                          const count =
                            a.attachments?.filter((att) => att.type === type)
                              .length || 0;
                          if (count === 0) return null;
                          return (
                            <TooltipPrimitive.Provider key={type}>
                              <TooltipPrimitive.Root>
                                <TooltipPrimitive.Trigger asChild>
                                  <div
                                    className="flex items-center gap-1 cursor-default select-none rounded bg-gray-100 px-2 py-1 text-sm text-gray-700 hover:bg-gray-200"
                                    aria-label={`${count} ${type}${
                                      count > 1 ? "s" : ""
                                    }`}
                                  >
                                    {attachmentIconMap[type] || (
                                      <LinkIcon size={16} />
                                    )}
                                    <span>{count}</span>
                                  </div>
                                </TooltipPrimitive.Trigger>
                                <TooltipPrimitive.Portal>
                                  <TooltipPrimitive.Content
                                    side="top"
                                    align="center"
                                    sideOffset={5}
                                    className="rounded bg-gray-800 px-2 py-1 text-xs text-white shadow-lg z-50"
                                  >
                                    {`${count} ${type}${count > 1 ? "s" : ""}`}
                                    <TooltipPrimitive.Arrow className="fill-gray-800" />
                                  </TooltipPrimitive.Content>
                                </TooltipPrimitive.Portal>
                              </TooltipPrimitive.Root>
                            </TooltipPrimitive.Provider>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
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
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        initialData={
          editingArticle
            ? {
                title: editingArticle.title,
                subject: editingArticle.subject,
                content: editingArticle.content,
                tags: editingArticle.tags?.map((tag) => ({ value: tag })) || [],
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
