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
import {
  Info,
  Plus,
  Link as LinkIcon,
  X,
  FileText,
  Image,
  FilePlus,
} from "lucide-react";
import Tags from "@yaireo/tagify/dist/react.tagify";
import "@yaireo/tagify/dist/tagify.css";
import CustomEditor from "./CustomEditor";
import { v4 as uuidv4 } from "uuid";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

function Tooltip({ children, tip }: { children: React.ReactNode; tip: string }) {
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
  type: "pdf" | "image" | "link" | "form" | "docx";
  url: string;
  name?: string;
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
  attachment?: FileList;
}

const attachmentTypes = [
  { value: "link", label: "Link", icon: <LinkIcon size={16} /> },
  { value: "pdf", label: "PDF", icon: <FileText size={16} /> },
  { value: "image", label: "Image", icon: <Image size={16} /> },
  { value: "form", label: "Form", icon: <FilePlus size={16} /> },
  { value: "docx", label: "Word Document", icon: <FileText size={16} /> },
];

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
  const [removedAttachments, setRemovedAttachments] = useState<Attachment[]>([]);

  const [newAttachmentURL, setNewAttachmentURL] = useState("");
  const [newAttachmentName, setNewAttachmentName] = useState("");
  const [newAttachmentType, setNewAttachmentType] =
    useState<Attachment["type"]>("link");

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
    setAttachments(initialData?.attachments || []);
    setRemovedAttachments([]);
    setNewAttachmentURL("");
    setNewAttachmentName("");
    setNewAttachmentType("link");
  }, [initialData, reset]);

  function addAttachment() {
    const trimmedUrl = newAttachmentURL.trim();
    const trimmedName = newAttachmentName.trim();

    if (!trimmedUrl) return;

    const exists = attachments.some(
      (att) =>
        att.type === newAttachmentType &&
        att.url === trimmedUrl &&
        (att.name || "") === (trimmedName || "")
    );

    if (exists) return;

    setAttachments((prev) => [
      ...prev,
      {
        customId: uuidv4(),
        type: newAttachmentType,
        url: trimmedUrl,
        name: trimmedName || undefined,
      },
    ]);

    setNewAttachmentURL("");
    setNewAttachmentName("");
  }

  function removeAttachment(index: number) {
    const attToRemove = attachments[index];
    if (
      initialData?.attachments?.some(
        (att) =>
          att.type === attToRemove.type &&
          att.url === attToRemove.url &&
          (att.name || "") === (attToRemove.name || "")
      )
    ) {
      setRemovedAttachments((prev) => [...prev, attToRemove]);
    }
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  const onFormSubmit = (data: FormValues) => {
    const formData = new FormData();

    formData.append("title", data.title);
    formData.append("subject", data.subject);
    formData.append("content", data.content);
    formData.append(
      "tags",
      JSON.stringify(data.tags.map((tag) => tag.value))
    );

    const files = data.attachment ? Array.from(data.attachment) : [];
    files.forEach((file) => {
      formData.append("attachment", file);
    });

    const currentAttachments = attachments.filter(
      (att) =>
        !removedAttachments.some(
          (rem) =>
            rem.type === att.type &&
            rem.url === att.url &&
            (rem.name || "") === (att.name || "")
        )
    );
    
    console.log("=== DEBUG: ARTICLE MODAL SUBMIT ===");
    console.log("All attachments:", attachments);
    console.log("Removed attachments:", removedAttachments);
    console.log("Current attachments (after filtering):", currentAttachments);
    console.log("Files being uploaded:", files.length);
    console.log("=== END MODAL DEBUG ===");

    formData.append("attachments", JSON.stringify(currentAttachments));

    onSubmit(formData);
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
              <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
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
              <p className="text-sm text-red-600 mt-1">{errors.subject.message}</p>
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
              <p className="text-sm text-red-600 mt-1">{errors.content.message}</p>
            )}
          </div>

          {/* File Upload */}
          <div>
            <Label htmlFor="attachment">Attachments (Upload files)</Label>
            <Input id="attachment" type="file" multiple {...register("attachment")} />
          </div>

          {/* Attachment UI */}
          <div>
            <Label>Attachments (Add links or files)</Label>
            <div className="flex gap-2 items-center mb-3">
              <select
                className="border rounded px-2 py-1 text-sm cursor-pointer"
                value={newAttachmentType}
                onChange={(e) =>
                  setNewAttachmentType(e.target.value as Attachment["type"])
                }
                aria-label="Select attachment type"
              >
                {attachmentTypes.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <Input
                placeholder="URL or file path"
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
                onClick={addAttachment}
                disabled={!newAttachmentURL.trim()}
                title="Add attachment"
              >
                <Plus size={16} />
              </Button>
            </div>

            {attachments.length > 0 && (
              <ul className="max-h-40 overflow-auto divide-y rounded border border-gray-200 dark:border-gray-700">
                {attachments.map((att, idx) => {
                  const typeInfo = attachmentTypes.find((t) => t.value === att.type);
                  return (
                    <li
                      key={att.customId || idx}
                      className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        {typeInfo?.icon}
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-blue-600 truncate max-w-xs"
                          title={att.name || att.url}
                        >
                          {att.name || att.url}
                        </a>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(idx)}
                        title="Remove attachment"
                        aria-label="Remove attachment"
                      >
                        <X size={16} />
                      </Button>
                    </li>
                  );
                })}
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
