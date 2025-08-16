"use client";

import React, { useEffect, useId, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import MarkdownEditor from "./MarkdownEditor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Tags from "@yaireo/tagify/dist/react.tagify";
import "@yaireo/tagify/dist/tagify.css";
import { v4 as uuidv4 } from "uuid";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import toast from "react-hot-toast";
import { UploadDropzone } from "@/components/admin/FileUploadDropzone";
import {
  Info,
  X,
  FileText,
  FileVideo,
  FilePieChart,
  FileSpreadsheet,
  File,
  FilePlus,
} from "lucide-react";

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
  type: "pdf" | "image" | "form" | "docx" | "ppt" | "pptx" | "xlsx" | "video";
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
  if ([".png", ".jpg", ".jpeg", ".gif"].some((ext) => lower.endsWith(ext)))
    return "image";
  if (lower.endsWith(".pdf")) return "pdf";
  if ([".docx", ".doc"].some((ext) => lower.endsWith(ext))) return "docx";
  if ([".ppt", ".pptx"].some((ext) => lower.endsWith(ext))) return "ppt";
  if (lower.endsWith(".xlsx")) return "xlsx";
  if ([".mp4", ".webm"].some((ext) => lower.endsWith(ext))) return "video";
  return "form";
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

  const removeAttachment = (index: number) =>
    setAttachments((prev) => prev.filter((_, i) => i !== index));

  const onFormSubmit = async (data: FormValues) => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("subject", data.subject);
      formData.append("content", data.content);
      data.tags.forEach((tag) => formData.append("tags", tag.value));

      const validTypes = new Set([
        "pdf",
        "image",
        "form",
        "docx",
        "ppt",
        "pptx",
        "xlsx",
        "video",
      ]);
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
      <DialogContent className="w-full text-black max-w-6xl min-w-[1000px] max-h-[95vh] px-8 py-6 sm:px-10 sm:py-8 bg-white rounded-lg">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Article" : "Create New Article"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="space-y-6 overflow-y-auto max-h-[75vh] pr-2"
        >
          {/* Title */}
          <div className="relative">
            <Label className="mb-2" htmlFor={`${id}-title`}>Title *</Label>
            <div className="rounded-md border border-gray-300 focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-1 focus-within:ring-offset-white transition">
              <Input
                id={`${id}-title`}
                {...register("title", { required: "Title is required" })}
                autoFocus
                className="bg-white text-black w-full rounded-md outline-none border-none"
              />
            </div>
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Subject */}
          <div className="relative">
            <Label className="mb-2" htmlFor={`${id}-subject`}>Subject *</Label>
            <div className="rounded-md border border-gray-300 focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-1 focus-within:ring-offset-white transition">
              <Input
                id={`${id}-subject`}
                {...register("subject", { required: "Subject is required" })}
                className="bg-white text-black w-full rounded-md outline-none border-none "
              />
            </div>
            {errors.subject && (
              <p className="text-sm text-red-600 mt-1">
                {errors.subject.message}
              </p>
            )}
          </div>

          {/* Tags */}
          <div>
            <Label className="flex items-center gap-2 mb-2" htmlFor={`${id}-tags`}>
              <span >Tags</span>
              <Tooltip tip="Press Enter to create a tag">
                <Info size={16} className="text-gray-500 cursor-help" />
              </Tooltip>
            </Label>
            <Controller
              name="tags"
              control={control}
              render={({ field: { onChange, value } }) => (
                <Tags
                  value={value}
                  onChange={(e) => {
                    try {
                      onChange(JSON.parse(e.detail.value));
                    } catch {
                      onChange([]);
                    }
                  }}
                  settings={{ dropdown: { enabled: 0 } }}
                  className="tagify bg-white text-black border  rounded-md focus:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 focus:ring-offset-white"
                />
              )}
            />
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor={`${id}-content`}>Content *</Label>
              <a
                href="/markdown-help"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 underline hover:text-blue-800"
              >
                Markdown Guide
              </a>
            </div>
            <Controller
              name="content"
              control={control}
              rules={{ required: "Content is required" }}
              render={({ field }) => (
                <div className="bg-white text-black rounded-lg shadow-sm p-4 min-h-[300px]">
                  <MarkdownEditor
                    value={field.value}
                    onChange={field.onChange}
                  />
                </div>
              )}
            />
            {errors.content && (
              <p className="text-sm text-red-600 mt-1">
                {errors.content.message}
              </p>
            )}
          </div>

          {/* Upload Dropzone */}
          <div>
            <Label>Attachments (Upload files)</Label>
            <UploadDropzone
              endpoint="anyFileUploader"
              onClientUploadComplete={(files) => {
                const existingUrls = new Set(attachments.map((a) => a.url));
                const newAttachments = files
                  .filter((f) => !existingUrls.has(f.ufsUrl))
                  .map((f) => ({
                    customId: uuidv4(),
                    url: f.ufsUrl,
                    name: f.name,
                    type: getAttachmentTypeFromFilename(f.name),
                  }));
                setAttachments((prev) => [...prev, ...newAttachments]);
                if (newAttachments.length > 0)
                  toast.success("Attachment uploaded");
              }}
              onUploadError={(error) => {
                console.error(error);
                toast.error("Upload failed.");
              }}
              disabled={isSaving}
            />
          </div>

          {/* Attachment List */}
          {attachments.length > 0 && (
            <div>
              <Label>Uploaded Attachments</Label>
              <ul className="max-h-40 overflow-auto divide-y rounded border border-gray-300">
                {attachments.map((att, idx) => (
                  <li
                    key={att.customId || idx}
                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2 text-sm text-black">
                      {att.type === "image" ? (
                        <img
                          src={att.url}
                          alt={att.name}
                          className="w-6 h-6 object-cover rounded"
                        />
                      ) : att.type === "pdf" ? (
                        <FileText className="w-5 h-5 text-red-500" />
                      ) : att.type === "docx" ? (
                        <FileText className="w-5 h-5 text-blue-600" />
                      ) : att.type === "ppt" || att.type === "pptx" ? (
                        <FilePieChart className="w-5 h-5 text-orange-500" />
                      ) : att.type === "xlsx" ? (
                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                      ) : att.type === "form" ? (
                        <FilePlus className="w-5 h-5 text-indigo-500" />
                      ) : att.type === "video" ? (
                        <FileVideo className="w-5 h-5 text-purple-600" />
                      ) : (
                        <File className="w-5 h-5 text-gray-500" />
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

          {/* Buttons */}
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
                  Saving & Translating...
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
