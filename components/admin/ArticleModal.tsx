"use client";

import React, { useEffect, useState, useRef } from "react";
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
import { Info, X, FileText } from "lucide-react";
import Tags from "@yaireo/tagify/dist/react.tagify";
import "@yaireo/tagify/dist/tagify.css";
import CustomEditor from "./CustomEditor";
import { v4 as uuidv4 } from "uuid";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import toast from "react-hot-toast";

function Tooltip({
  children,
  tip,
}: {
  children: React.ReactNode;
  tip: string;
}) {
  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="top"
            align="center"
            sideOffset={5}
            className="rounded bg-gray-800 px-2 py-1 text-xs text-white shadow-lg z-50"
          >
            {tip}
            <TooltipPrimitive.Arrow className="fill-gray-800" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

interface Tag {
  value: string;
}

interface Attachment {
  customId?: string;
  type: "pdf" | "image" | "form" | "docx";
  url: string;
  name?: string;
  file?: File;
}

interface ArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void> | void;
  initialData?: {
    title?: string;
    subject?: string;
    content?: string;
    tags?: Tag[];
    attachments?: Attachment[];
  };
}

interface FormValues {
  title: string;
  subject: string;
  tags: Tag[];
  content: string;
}

export default function ArticleModal({
  isOpen,
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

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [tagSuggestions] = useState<string[]>([
    "news",
    "tech",
    "webdev",
    "tutorial",
    "design",
  ]);
  const [isSaving, setIsSaving] = useState(false);

  // ref for file input to reset it
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    reset({
      title: initialData?.title || "",
      subject: initialData?.subject || "",
      tags: initialData?.tags || [],
      content: initialData?.content || "",
    });

    const initialAttachments =
      initialData?.attachments?.map((att) => ({
        ...att,
        customId: uuidv4(),
      })) || [];

    setAttachments(initialAttachments);
  }, [initialData, reset]);

  function getAttachmentType(file: File): Attachment["type"] {
    if (file.type.includes("image")) return "image";
    if (file.type.includes("pdf")) return "pdf";
    if (file.name.endsWith(".docx")) return "docx";
    return "form";
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles = files.map((file) => ({
      customId: uuidv4(),
      type: getAttachmentType(file),
      url: URL.createObjectURL(file),
      name: file.name,
      file,
    }));

    setAttachments((prev) => [...prev, ...newFiles]);

    // Clear file input so user can re-upload same files if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Show toast
    toast.success("Attachment added");
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const onFormSubmit = async (data: FormValues) => {
  setIsSaving(true);
  try {
    const formData = new FormData();

    formData.append("title", data.title);
    formData.append("subject", data.subject);
    formData.append("content", data.content);

    // ✅ Instead of JSON.stringify, use multiple entries
    data.tags.forEach((tag) => formData.append("tags", tag.value));

    // Append new uploaded files (blobs)
    attachments.forEach((att) => {
      if (att.file) {
        formData.append("attachment", att.file);
      }
    });

    // Add existing (non-new) attachments in JSON
    const existing = attachments.filter((att) => !att.file);
    if (existing.length > 0) {
      formData.append(
        "attachments",
        JSON.stringify(existing.map(({ type, url, name }) => ({ type, url, name })))
      );
    }

    await onSubmit(formData);
  } finally {
    setIsSaving(false);
  }
};


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register("title", { required: "Title is required" })}
              autoFocus
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Subject */}
          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              {...register("subject", { required: "Subject is required" })}
            />
            {errors.subject && (
              <p className="text-sm text-red-600 mt-1">
                {errors.subject.message}
              </p>
            )}
          </div>

          {/* Tags */}
          <div>
            <Label className="flex items-center gap-2" htmlFor="tags">
              <span>Tags</span>
              <Tooltip tip="Press Enter to create a tag">
                <Info
                  size={16}
                  className="text-gray-500 hover:text-gray-700 cursor-help"
                />
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
                  }}
                  value={value}
                  onChange={(e) => {
                    const raw = e.detail.value;
                    if (!raw?.trim()) {
                      onChange([]); // or `onChange([{ value: "" }])` if needed
                      return;
                    }

                    try {
                      const tags = JSON.parse(raw);
                      onChange(tags);
                    } catch (err) {
                      console.error("Invalid tag JSON:", err);
                      onChange([]); // fallback
                    }
                  }}
                />
              )}
            />
          </div>

          {/* Content */}
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
                  onSave={() => handleSubmit(onFormSubmit)()}
                />
              )}
            />
            {errors.content && (
              <p className="text-sm text-red-600 mt-1">
                {errors.content.message}
              </p>
            )}
          </div>

          {/* File Upload */}
          <div>
            <Label htmlFor="attachment">Attachments (Upload files)</Label>
            <Input
              id="attachment"
              type="file"
              multiple
              onChange={handleFileUpload}
              ref={fileInputRef}
              disabled={isSaving}
            />
          </div>

          {/* Uploaded Attachments */}
          {attachments.length > 0 && (
            <div>
              <Label>Uploaded Attachments</Label>
              <ul className="max-h-40 overflow-auto divide-y rounded border border-gray-200 dark:border-gray-700">
                {attachments.map((att, idx) => (
                  <li
                    key={att.customId || idx}
                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <FileText size={16} />
                      <span className="truncate max-w-xs">{att.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(idx)}
                      title="Remove attachment"
                      aria-label="Remove attachment"
                      disabled={isSaving}
                    >
                      <X size={16} />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
