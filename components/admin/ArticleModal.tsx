"use client";

import React, { useState, useEffect } from "react";
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
import { Info } from "lucide-react";
import Tags from "@yaireo/tagify/dist/react.tagify";
import "@yaireo/tagify/dist/tagify.css";
import CustomEditor from "./CustomEditor";

interface Tag {
  value: string;
}

interface ArticleModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    subject: string;
    content: string;
    tags: string[];
    attachments: File[];
  }) => Promise<void> | void;
  initialData?: {
    title?: string;
    subject?: string;
    content?: string;
    tags?: Tag[];
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
  }, [initialData, reset]);

  const onFormSubmit = (data: FormValues) => {
    console.log("tags:", data.tags)
    onSubmit({
      title: data.title,
      subject: data.subject,
      content: data.content,
      tags: data.tags.map((tag) => tag.value),
      attachments: data.attachment ? Array.from(data.attachment) : [],
    });
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
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input {...register("title", { required: "Title is required" })} />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label>Subject *</Label>
            <Input
              {...register("subject", { required: "Subject is required" })}
            />
            {errors.subject && (
              <p className="text-sm text-red-600">{errors.subject.message}</p>
            )}
          </div>

          <div>
            <Label className="flex items-center gap-1">
              <span title="Press Enter to create a tag">
                Tags <Info size={14} />
              </span>
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
                  value={value} // Pass the array directly, not JSON string
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
            <Label>Content *</Label>
            <Controller
              name="content"
              control={control}
              rules={{ required: "Content is required" }}
              render={({ field }) => (
                <CustomEditor
                  value={field.value}
                  onChange={field.onChange}
                  onSave={() => handleSubmit(onFormSubmit)()} // ✅ Manual Save
                />
              )}
            />

            {errors.content && (
              <p className="text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          <div>
            <Label>Attachments</Label>
            <Input type="file" multiple {...register("attachment")} />
          </div>

          <div className="flex justify-end space-x-2">
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
