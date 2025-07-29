"use client";

import React, { useEffect, useState } from "react";
import ArticleModal from "./ArticleModal";

interface Article {
  _id: string;
  title: string;
  slug: string;
  subject?: string;
  content: string; // added here
  createdAt: string;
  upvotes: string[]; // or number if you want counts
  downvotes: string[];
}

export default function AdminArticlesManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch articles from API
  async function fetchArticles() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/articles");
      if (!res.ok) throw new Error("Failed to fetch articles");
      const data = await res.json();
      setArticles(data.articles);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchArticles();
  }, []);

  function handleEdit(id: string) {
    const article = articles.find((a) => a._id === id);
    if (article) {
      setEditingArticle(article);
      setModalOpen(true);
    }
  }

  function handleCreate() {
    setEditingArticle(null);
    setModalOpen(true);
  }

  async function handleSave(data: { title: string; subject: string; content: string }) {
    const isEdit = !!editingArticle;
    const url = isEdit ? `/api/admin/articles/${editingArticle!._id}` : "/api/admin/articles";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save");
      }

      setModalOpen(false);
      setEditingArticle(null);
      await fetchArticles();
    } catch (err: any) {
      alert(`Error saving article: ${err.message || err}`);
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Admin Articles Manager</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create New Article
        </button>
      </div>

      {loading && <p>Loading articles...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-3 py-2 text-left">Title</th>
            <th className="border border-gray-300 px-3 py-2 text-left">Subject</th>
            <th className="border border-gray-300 px-3 py-2 text-left">Created At</th>
            <th className="border border-gray-300 px-3 py-2 text-left">Upvotes</th>
            <th className="border border-gray-300 px-3 py-2 text-left">Downvotes</th>
            <th className="border border-gray-300 px-3 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => (
            <tr key={article._id} className="hover:bg-gray-50 cursor-pointer">
              <td className="border border-gray-300 px-3 py-2">{article.title}</td>
              <td className="border border-gray-300 px-3 py-2">{article.subject}</td>
              <td className="border border-gray-300 px-3 py-2">
                {new Date(article.createdAt).toLocaleDateString()}
              </td>
              <td className="border border-gray-300 px-3 py-2">{article.upvotes.length}</td>
              <td className="border border-gray-300 px-3 py-2">{article.downvotes.length}</td>
              <td className="border border-gray-300 px-3 py-2 space-x-2">
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => handleEdit(article._id)}
                >
                  Edit
                </button>
                {/* You can add Delete button here if you want */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ArticleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={
          editingArticle
            ? {
                title: editingArticle.title,
                subject: editingArticle.subject || "",
                content: editingArticle.content,
              }
            : undefined
        }
      />
    </div>
  );
}
