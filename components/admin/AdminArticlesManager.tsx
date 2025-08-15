"use client";

import React, { useEffect, useState, useCallback, useMemo, JSX } from "react";
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
  FilePlus,
  FilePieChart,
  FileSpreadsheet,
  FileVideo,
  Search,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import debounce from "lodash.debounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatISO } from "date-fns";
import { PaginationWrapper } from "../ui/PaginationWrapper";

type AttachmentType =
  | "pdf"
  | "image"
  | "form"
  | "docx"
  | "ppt"
  | "pptx"
  | "xlsx"
  | "video";

interface Attachment {
  type: AttachmentType;
  url: string;
  name?: string;
  public_id?: string;
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

interface ApiResponse {
  articles: Article[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminArticlesManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  const [page, setPage] = useState(1);
  const limit = 10;

  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<"createdAt" | "-createdAt" | "title" | "-title">("-createdAt");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  useEffect(() => {
    setPage(1);
  }, [searchTerm, sort, dateFrom, dateTo]);

  const totalPages = Math.ceil(totalItems / limit);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort,
      });

      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      if (dateFrom) params.append("dateFrom", formatISO(dateFrom));
      if (dateTo) params.append("dateTo", formatISO(dateTo));

      const res = await fetch(`/api/admin/articles?${params.toString()}`);
      if (!res.ok) throw new Error("Fetch failed");

      const data: ApiResponse = await res.json();
      setArticles(data.articles);
      setTotalItems(data.total);
    } catch {
      toast.error("Failed to fetch articles");
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, searchTerm, dateFrom, dateTo]);

  const debouncedFetch = useMemo(() => debounce(fetchArticles, 400), [fetchArticles]);

  useEffect(() => {
    fetchArticles();
  }, [page, sort, dateFrom, dateTo, fetchArticles]);

  useEffect(() => {
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [searchTerm, debouncedFetch]);

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

  const validAttachmentTypes = new Set([
    "pdf",
    "image",
    "form",
    "docx",
    "ppt",
    "pptx",
    "xlsx",
    "video",
  ]);

  const handleSave = useCallback(
    async (data: FormData) => {
      if (saving) return;
      setSaving(true);
      const isEdit = !!editingArticle;
      const url = isEdit
        ? `/api/admin/articles/${editingArticle._id}`
        : "/api/admin/articles";
      const method = isEdit ? "PUT" : "POST";

      try {
        const title = data.get("title") as string;
        const slug = data.get("slug") as string;
        const subject = (data.get("subject") as string) || "";
        const content = data.get("content") as string;
        const tags = data.getAll("tags") as string[];
        const attachmentsJson = data.get("attachments") as string;

        let attachments: Attachment[] = [];
        try {
          const parsed = JSON.parse(attachmentsJson);
          attachments = Array.isArray(parsed)
            ? parsed.map((att: Attachment) => ({
                ...att,
                type: validAttachmentTypes.has(att.type) ? att.type : "form",
              }))
            : [];
        } catch {}

        const sendData = new FormData();
        sendData.append("title", title);
        sendData.append("slug", slug);
        sendData.append("subject", subject);
        sendData.append("content", content);
        tags.forEach((tag) => sendData.append("tags", tag));
        if (attachments.length > 0) {
          sendData.append("attachments", JSON.stringify(attachments));
        }

        const res = await fetch(url, { method, body: sendData });
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          throw new Error(json?.error || res.statusText);
        }

        toast.success(`Article ${isEdit ? "updated" : "created"} successfully`);
        setModalOpen(false);
        setEditingArticle(null);
        await fetchArticles();
      } catch (err: any) {
        toast.error(`Error saving article: ${err.message}`);
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
        const res = await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed");
        toast.success("Deleted");
        fetchArticles();
      } catch {
        toast.error("Delete failed");
      }
    },
    [fetchArticles]
  );

  const attachmentIconMap: Record<AttachmentType, JSX.Element> = {
    pdf: <FileText size={16} />,
    image: <Image size={16} />,
    form: <FilePlus size={16} />,
    docx: <FileText size={16} />,
    ppt: <FilePieChart size={16} />,
    pptx: <FilePieChart size={16} />,
    xlsx: <FileSpreadsheet size={16} />,
    video: <FileVideo size={16} />,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Toaster />
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Articles</h1>
        <Button className="flex items-center gap-2" onClick={handleCreate}>
          <PlusCircle size={18} />
          Create New
        </Button>
      </header>

      {/* Filters */}
      <div className="grid md:grid-cols-4 sm:grid-cols-2 gap-4 mb-6 items-end">
        {/* Search with nicer focus */}
        <div className="relative">
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 rounded"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        </div>

        {/* Sort */}
        <Select value={sort} onValueChange={(value) => setSort(value as any)}>
          <SelectTrigger className="focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 rounded">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="-createdAt">Newest</SelectItem>
              <SelectItem value="createdAt">Oldest</SelectItem>
              <SelectItem value="title">Title (A-Z)</SelectItem>
              <SelectItem value="-title">Title (Z-A)</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Date From */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 rounded"
            >
              {dateFrom ? dateFrom.toDateString() : "From"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
          </PopoverContent>
        </Popover>

        {/* Date To */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 rounded"
            >
              {dateTo ? dateTo.toDateString() : "To"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={setDateTo}
              hidden={{ before: dateFrom ?? undefined, after: new Date() }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
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
                <tr key={a._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-2 max-w-xs break-words">
                    <Link
                      href={`/articles/${a.slug}`}
                      className="text-blue-600 hover:underline font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                      title={a.title}
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
                        {(Object.keys(attachmentIconMap) as AttachmentType[]).map(
                          (type) => {
                            const count = a.attachments?.filter(
                              (att) => att.type === type
                            ).length;
                            if (!count) return null;
                            return (
                              <TooltipPrimitive.Provider key={type}>
                                <TooltipPrimitive.Root>
                                  <TooltipPrimitive.Trigger asChild>
                                    <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 text-sm text-gray-700 rounded">
                                      {attachmentIconMap[type]}
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
                          }
                        )}
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
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(a._id)}
                        className="text-red-600 hover:text-red-800"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <PaginationWrapper
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
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
                    type: att.type ?? "form",
                    url: att.url,
                    name: att.name,
                    public_id: att.public_id,
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
