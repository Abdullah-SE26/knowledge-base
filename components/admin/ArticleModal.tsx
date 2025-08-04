"use client";

import React, { useEffect, useId, useState } from "react";
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
import { UploadDropzone } from "@/components/admin/FileUploadDropzone";

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
  type: "pdf" | "image" | "form" | "docx" | "ppt";
  url: string;
  name?: string;
  public_id?: string;
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

function getAttachmentTypeFromFilename(filename: string): Attachment["type"] {
  const lower = filename.toLowerCase();
  if (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".gif")
  )
    return "image";
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) return "docx";
  return "form"; // fallback
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
  const id = useId();

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
      data.tags.forEach((tag) => formData.append("tags", tag.value));

      const validTypes = new Set(["pdf", "image", "form", "docx", "ppt"]);
      const serializedAttachments = attachments.map(
        ({ type, url, name, public_id }) => ({
          type: validTypes.has(type) ? type : "form",
          url,
          name,
          public_id,
        })
      );

      formData.append("attachments", JSON.stringify(serializedAttachments));

      await onSubmit(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Article" : "Create New Article"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor={`${id}-title`}>Title *</Label>
            <Input
              id={`${id}-title`}
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
            <Label htmlFor={`${id}-subject`}>Subject *</Label>
            <Input
              id={`${id}-subject`}
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
            <Label className="flex items-center gap-2" htmlFor={`${id}-tags`}>
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
                    try {
                      const tags = JSON.parse(e.detail.value);
                      onChange(tags);
                    } catch {
                      onChange([]);
                    }
                  }}
                />
              )}
            />
          </div>

          {/* Content */}
          <div>
            <Label htmlFor={`${id}-content`}>Content *</Label>
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

          {/* UploadThing Dropzone */}
          <div>
            <Label>Attachments (Upload files)</Label>
            <UploadDropzone
              endpoint="anyFileUploader"
              onClientUploadComplete={(files) => {
                const existingUrls = new Set(attachments.map((a) => a.url));
                const newAttachments = files
                  .filter((file) => !existingUrls.has(file.ufsUrl))
                  .map((file) => ({
                    customId: uuidv4(),
                    url: file.ufsUrl,
                    name: file.name,
                    type: getAttachmentTypeFromFilename(file.name),
                  }));

                setAttachments((prev) => [...prev, ...newAttachments]);

                if (newAttachments.length > 0)
                  toast.success("Attachment uploaded");
              }}
              onUploadError={(error) => {
                console.error("Upload failed:", error);
                toast.error("Upload failed. Please try again.");
              }}
              disabled={isSaving}
            />
          </div>

          {/* Attachment List */}
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
                      {att.type === "image" ? (
                        <img
                          src={att.url}
                          alt={att.name}
                          className="w-6 h-6 object-cover rounded"
                        />
                      ) : att.type === "pdf" ? (
                        <span className="text-red-500">📄</span>
                      ) : att.type === "docx" ? (
                        <span className="text-blue-500">📝</span>
                      ) : (
                        <FileText size={16} />
                      )}
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate max-w-xs text-blue-600 hover:underline"
                      >
                        {att.name}
                      </a>
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
