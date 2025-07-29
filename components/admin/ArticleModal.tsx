"use client";

import React, { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface ArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; subject: string; content: string }) => Promise<void>;
  initialData?: {
    title: string;
    subject: string;
    content: string;
  };
}

export default function ArticleModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: ArticleModalProps) {
 const editor = useEditor({
  extensions: [StarterKit],
  content: initialData?.content || "",
  immediatelyRender: false,
});;

  const [title, setTitle] = useState(initialData?.title || "");
  const [subject, setSubject] = useState(initialData?.subject || "");
  const [saving, setSaving] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setSubject("");
      editor?.commands.setContent("");
    }
  }, [isOpen, editor]);

  // Update editor and inputs when initialData changes (edit mode)
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setSubject(initialData.subject);
      editor?.commands.setContent(initialData.content);
    }
  }, [initialData, editor]);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!editor) return;

    setSaving(true);
    const content = editor.getHTML();

    if (!content || content === "<p></p>") {
      alert("Content cannot be empty");
      setSaving(false);
      return;
    }

    try {
      await onSave({ title, subject, content });
      onClose();
    } catch (error) {
      alert("Failed to save article");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg w-full max-w-3xl max-h-[90vh] overflow-auto"
      >
        <h2 className="text-2xl mb-4">
          {initialData ? "Edit Article" : "Create New Article"}
        </h2>

        <label className="block mb-2 font-semibold" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full mb-4 px-3 py-2 border rounded dark:bg-gray-800 dark:text-white"
        />

        <label className="block mb-2 font-semibold" htmlFor="subject">
          Subject
        </label>
        <input
          id="subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded dark:bg-gray-800 dark:text-white"
        />

        <label className="block mb-2 font-semibold">Content</label>
        <div className="border rounded mb-4 p-2 bg-white dark:bg-gray-800">
          <EditorContent editor={editor} />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded border"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
