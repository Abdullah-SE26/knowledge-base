'use client';

import React, { useEffect, useRef } from "react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKEditor } from "@ckeditor/ckeditor5-react";

type CustomEditorProps = {
  value: string;
  onChange: (data: string) => void;
};

const CustomEditor: React.FC<CustomEditorProps> = ({ value, onChange }) => {
  const editorRef = useRef<any>(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    console.log("[CustomEditor] value prop changed:", value);
    if (editorRef.current?.editor) {
      const editorData = editorRef.current.editor.getData();
      if (value !== editorData && !isUpdatingRef.current) {
        isUpdatingRef.current = true;
        editorRef.current.editor.setData(value);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }
  }, [value]);

  return (
    <div className="border rounded-md p-4 min-h-[250px] bg-white">
      <CKEditor
        editor={ClassicEditor}
        data={value}
        onReady={(editor) => {
          editorRef.current = { editor };
          console.log("[CustomEditor] CKEditor ready, initial data:", value);
        }}
        onChange={(_, editor) => {
          if (!isUpdatingRef.current) {
            const data = editor.getData();
            console.log("[CustomEditor] onChange data:", data);
            onChange(data);
          }
        }}
        config={{
          toolbar: [
            "heading",
            "|",
            "bold",
            "italic",
            "link",
            "bulletedList",
            "numberedList",
            "blockQuote",
            "|",
            "undo",
            "redo",
          ],
        }}
      />
    </div>
  );
};

export default CustomEditor;
