"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info, Plus, Link as LinkIcon, X } from "lucide-react";
import Tags from "@yaireo/tagify/dist/react.tagify";
import "@yaireo/tagify/dist/tagify.css";
import CustomEditor from "./CustomEditor";

// For tooltip (simple implementation)
function Tooltip({ children, tip }: { children: React.ReactNode; tip: string }) {
  return (
    <span className="relative group inline-flex items-center cursor-help">
      {children}
      <span className="absolute bottom-full mb-1 w-max max-w-xs rounded bg-gray-700 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 z-50">
        {tip}
      </span>
    </span>
  );
}

interface Tag {
  value: string;
}

interface LinkOrFormAttachment {
  type: "link" | "form";
  url: string;
  name?: string;
}

interface ArticleModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void> | void;
  initialData?: {
    title?: string;
    subject?: string;
    content?: string;
    tags?: Tag[];
    attachments?: LinkOrFormAttachment[];
  };
}

interface FormValues {
  title: string;
  subject: string;
  tags: Tag[];
  content: string;
  attachment?: FileList;
}

export default function ArticleModal({
  open,
  onClose,
  onSubmit,
  initialData,
}: ArticleModalProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: initialData?.title || "",
      subject: initialData?.subject || "",
      tags: initialData?.tags || [],
      content: initialData?.content || "",
    },
  });

  // State for link/form attachments user can add manually
  const [linkAttachments, setLinkAttachments] = useState<LinkOrFormAttachment[]>(
    []
  );

  // Inputs for new link/form attachment
  const [newAttachmentType, setNewAttachmentType] = useState<"link" | "form">(
    "link"
  );
  const [newAttachmentURL, setNewAttachmentURL] = useState("");
  const [newAttachmentName, setNewAttachmentName] = useState("");

  const [tagSuggestions] = useState<string[]>([
    "news",
    "tech",
    "webdev",
    "tutorial",
    "design",
  ]);

  useEffect(() => {
    reset({
      title: initialData?.title || "",
      subject: initialData?.subject || "",
      tags: initialData?.tags || [],
      content: initialData?.content || "",
    });

    setLinkAttachments(initialData?.attachments || []);
  }, [initialData, reset]);

  function addLinkAttachment() {
    if (!newAttachmentURL.trim()) return;
    setLinkAttachments((prev) => [
      ...prev,
      {
        type: newAttachmentType,
        url: newAttachmentURL.trim(),
        name: newAttachmentName.trim() || undefined,
      },
    ]);
    setNewAttachmentURL("");
    setNewAttachmentName("");
  }

  function removeLinkAttachment(index: number) {
    setLinkAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  const onFormSubmit = (data: FormValues) => {
    const formData = new FormData();

    formData.append("title", data.title);
    formData.append("subject", data.subject);
    formData.append("content", data.content);

    // Tags as JSON string
    formData.append("tags", JSON.stringify(data.tags.map((tag) => tag.value)));

    // Append files from file input
    const files = data.attachment ? Array.from(data.attachment) : [];
    files.forEach((file) => {
      formData.append("attachment", file);
    });

    // Append link/form attachments as JSON string under "attachments"
    if (linkAttachments.length > 0) {
      formData.append("attachments", JSON.stringify(linkAttachments));
    }

    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        aria-describedby="article-dialog-desc"
        className="max-w-3xl max-h-[90vh] overflow-auto"
      >
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Article" : "Create New Article"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register("title", { required: "Title is required" })}
              autoFocus
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              {...register("subject", { required: "Subject is required" })}
            />
            {errors.subject && (
              <p className="text-sm text-red-600 mt-1">{errors.subject.message}</p>
            )}
          </div>

          <div>
            <Label className="flex items-center gap-2" htmlFor="tags">
              <span>Tags</span>
              <Tooltip tip="Press Enter to create a tag">
                <Info size={16} className="text-gray-500 hover:text-gray-700" />
              </Tooltip>
            </Label>
            <Controller
              name="tags"
              control={control}
              render={({ field: { onChange, value } }) => (
                <Tags
                  settings={{
                    whitelist: tagSuggestions,
                    dropdown: { enabled: 0 },
                    // Keep tags visually distinct (optional)
                    // editTags: false,
                  }}
                  value={value}
                  onChange={(e) => {
                    try {
                      const tags = JSON.parse(e.detail.value);
                      onChange(tags);
                    } catch (err) {
                      console.error("Invalid tag JSON:", err);
                    }
                  }}
                />
              )}
            />
          </div>

          <div>
            <Label htmlFor="content">Content *</Label>
            <Controller
              name="content"
              control={control}
              rules={{ required: "Content is required" }}
              render={({ field }) => (
                <CustomEditor
                  value={field.value}
                  onChange={field.onChange}
                  onSave={() => handleSubmit(onFormSubmit)()} // Manual Save
                />
              )}
            />
            {errors.content && (
              <p className="text-sm text-red-600 mt-1">{errors.content.message}</p>
            )}
          </div>

          {/* File Attachments */}
          <div>
            <Label htmlFor="attachment">Attachments (Upload files)</Label>
            <Input id="attachment" type="file" multiple {...register("attachment")} />
          </div>

          {/* Link/Form Attachments */}
          <div>
            <Label>Attachments (Add links or forms)</Label>
            <div className="flex gap-2 items-center mb-2">
              <select
                className="border rounded p-1"
                value={newAttachmentType}
                onChange={(e) =>
                  setNewAttachmentType(e.target.value as "link" | "form")
                }
              >
                <option value="link">Link</option>
                <option value="form">Form</option>
              </select>
              <Input
                placeholder="URL"
                className="flex-grow"
                value={newAttachmentURL}
                onChange={(e) => setNewAttachmentURL(e.target.value)}
              />
              <Input
                placeholder="Optional name"
                className="flex-grow"
                value={newAttachmentName}
                onChange={(e) => setNewAttachmentName(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLinkAttachment}
                disabled={!newAttachmentURL.trim()}
                title="Add attachment"
              >
                <Plus size={16} />
              </Button>
            </div>

            {/* Show existing link/form attachments */}
            {linkAttachments.length > 0 && (
              <ul className="list-disc ml-5 space-y-1 max-h-32 overflow-auto">
                {linkAttachments.map((att, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <LinkIcon size={16} />
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-600"
                      >
                        {att.name || att.url}
                      </a>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLinkAttachment(idx)}
                      title="Remove attachment"
                    >
                      <X size={16} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
