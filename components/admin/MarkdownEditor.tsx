"use client";
import "@toast-ui/editor/dist/toastui-editor.css";
import React, { useRef, useEffect } from "react";
import { Editor } from "@toast-ui/react-editor";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const editorRef = useRef<Editor>(null);

  // Sync the editor content if `value` prop changes externally
  useEffect(() => {
    if (!editorRef.current) return;
    const editorInstance = editorRef.current.getInstance();
    if (value !== editorInstance.getMarkdown()) {
      editorInstance.setMarkdown(value);
    }
  }, [value]);

  // Handler to update parent on content change
  const handleChange = () => {
    if (!editorRef.current) return;
    const editorInstance = editorRef.current.getInstance();
    const markdown = editorInstance.getMarkdown();
    onChange(markdown);
  };

  return (
    <Editor
      initialValue={value}
      previewStyle="vertical"       // you can also use "tab" for tabs
      height="400px"
      initialEditType="markdown"
      useCommandShortcut={true}
      ref={editorRef}
      onChange={handleChange}
      language="en"
    />
  );
}
