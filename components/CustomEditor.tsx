'use client';

import React from 'react';

import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { CKEditor } from '@ckeditor/ckeditor5-react'; // ✅ use normal import


type CustomEditorProps = {
  value: string;
  onChange: (data: string) => void;
};

const CustomEditor: React.FC<CustomEditorProps> = ({ value, onChange }) => {
  return (
    <div>
      <CKEditor
        editor={ClassicEditor}
        data={value}
        onChange={(_, editor) => {
          const data = editor.getData();
          onChange(data);
        }}
        config={{
          toolbar: [
            'heading',
            '|',
            'bold',
            'italic',
            'link',
            'bulletedList',
            'numberedList',
            'blockQuote',
            '|',
            'undo',
            'redo',
          ],
        }}
      />
    </div>
  );
};

export default CustomEditor;
