"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

interface EditorClientProps {
  content?: string;
  onUpdate?: (content: string) => void;
}

export default function EditorClient({ content = "", onUpdate }: EditorClientProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onUpdate) onUpdate(html);
    },
  });

  // Optional: sync content if prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="border rounded p-2 min-h-[200px]">
      <EditorContent editor={editor} />
    </div>
  );
}
