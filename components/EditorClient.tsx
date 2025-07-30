"use client";

import React, { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface Props {
  content: string;
  onEditorReady?: (editor: any) => void;
}

export default function TiptapEditor({ content, onEditorReady }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: "", // initially empty
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert min-h-[200px] outline-none bg-white dark:bg-gray-800 p-2 rounded",
      },
    },
  });

  // Set content when editor is ready
  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  // Notify parent with editor instance
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  if (!editor) return <p>Loading editor...</p>;

  return <EditorContent editor={editor} />;
}
