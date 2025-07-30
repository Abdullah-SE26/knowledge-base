// components/CustomEditorClientWrapper.tsx
'use client';

import React from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

interface CustomEditorClientWrapperProps {
  value: string;
  onChange: (value: string) => void;
}

const CustomEditorClientWrapper: React.FC<CustomEditorClientWrapperProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="border rounded">
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

export default CustomEditorClientWrapper;
