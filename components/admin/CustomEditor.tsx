'use client';

import React, { useEffect, useState } from 'react';
import { EditorContent, useEditor, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import ListItem from '@tiptap/extension-list-item';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List as ListIcon,
  Quote,
  Link as LinkIcon,
  Undo,
  Redo,
  Save,
  Paintbrush,
  Palette,
} from 'lucide-react';

import toast from 'react-hot-toast';

interface CustomEditorProps {
  value: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  className?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  icon: React.ReactNode;
  title: string;
  disabled?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  active = false,
  icon,
  title,
  disabled = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-md border text-sm flex items-center justify-center gap-1 transition ${
      active
        ? 'bg-blue-600 text-white'
        : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
    } disabled:opacity-50`}
  >
    {icon}
  </button>
);

const CustomEditor: React.FC<CustomEditorProps> = ({
  value,
  onChange,
  onSave,
  className = '',
}) => {
  const [color, setColor] = useState('#000000');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ underline: false }), // StarterKit includes Heading, Paragraph, etc.
      Underline,
      Link.configure({ openOnClick: false }),
      TextStyle,
      Color,
      Highlight,
      ListItem,
      BulletList,
      OrderedList,
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        className:
          'prose dark:prose-invert min-h-[200px] max-h-[500px] overflow-y-auto outline-none bg-white dark:bg-gray-900 p-4 rounded ' +
          className,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  const handleSave = () => {
    if (onSave) {
      onSave();
      toast.success('Changes saved');
    }
  };

  const applyColor = () => {
    editor?.chain().focus().setColor(color).run();
  };

  const toggleHighlight = () => {
    editor?.chain().focus().toggleHighlight().run();
  };

  return (
    <div className="relative border rounded-md shadow-sm">
      {/* Fixed Toolbar */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 border-b rounded-t">
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBold().run()}
          icon={<Bold size={16} />}
          title="Bold"
          active={editor?.isActive('bold')}
        />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          icon={<Italic size={16} />}
          title="Italic"
          active={editor?.isActive('italic')}
        />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          icon={<UnderlineIcon size={16} />}
          title="Underline"
          active={editor?.isActive('underline')}
        />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          icon={<Strikethrough size={16} />}
          title="Strikethrough"
          active={editor?.isActive('strike')}
        />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          icon={<span className="font-bold">H1</span>}
          title="Heading 1"
          active={editor?.isActive('heading', { level: 1 })}
        />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          icon={<span className="font-bold">H2</span>}
          title="Heading 2"
          active={editor?.isActive('heading', { level: 2 })}
        />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          icon={<ListIcon size={16} />}
          title="Bullet List"
          active={editor?.isActive('bulletList')}
        />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          icon={<span>1.</span>}
          title="Ordered List"
          active={editor?.isActive('orderedList')}
        />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          icon={<Quote size={16} />}
          title="Blockquote"
          active={editor?.isActive('blockquote')}
        />
        <ToolbarButton
          onClick={() => {
            const previousUrl = editor?.getAttributes('link').href;
            const url = window.prompt('Enter URL', previousUrl || '');
            if (url === null) return;
            if (url.trim() === '') {
              editor?.chain().focus().unsetLink().run();
              return;
            }
            editor?.chain().focus().setLink({ href: url }).run();
          }}
          icon={<LinkIcon size={16} />}
          title="Insert Link"
          active={editor?.isActive('link')}
        />
        <ToolbarButton
          onClick={() => editor?.chain().focus().undo().run()}
          icon={<Undo size={16} />}
          title="Undo"
        />
        <ToolbarButton
          onClick={() => editor?.chain().focus().redo().run()}
          icon={<Redo size={16} />}
          title="Redo"
        />

        {/* Text Color */}
        <div className="flex items-center gap-1 ml-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-6 h-6 cursor-pointer border rounded"
            title="Text Color"
          />
          <button type="button" onClick={applyColor} title="Apply Text Color">
            <Palette size={16} />
          </button>
        </div>

        {/* Highlight toggle (no color picker) */}
        <ToolbarButton
          onClick={toggleHighlight}
          icon={<Paintbrush size={16} />}
          title="Toggle Highlight"
          active={editor?.isActive('highlight')}
        />

        {/* Save button */}
        {onSave && (
          <ToolbarButton
            onClick={handleSave}
            icon={<Save size={16} />}
            title="Save"
          />
        )}
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default CustomEditor;
