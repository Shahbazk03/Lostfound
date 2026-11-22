"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Strikethrough, List, ListOrdered, Link2, Image as ImageIcon, Heading2, Quote, Undo, Redo } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

function ToolbarButton({ onClick, isActive, disabled, label, children }: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={isActive === undefined ? undefined : isActive}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white ${isActive ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-emerald-400 dark:ring-slate-700' : ''}`}
    >
      {children}
    </button>
  );
}

export function TiptapEditor({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: 'Start writing...' }),
    ],
    content: value,
    // Rendered only in the browser; avoids a hydration mismatch warning.
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none dark:prose-invert focus:outline-none min-h-[160px] px-4 py-3 bg-white dark:bg-slate-900 border border-t-0 border-slate-200 dark:border-slate-700 rounded-b-xl focus-visible:ring-4 focus-visible:ring-emerald-500/10',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="w-full">
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 rounded-t-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-950">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} label="Bold" isActive={editor.isActive('bold')}><Bold className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} label="Italic" isActive={editor.isActive('italic')}><Italic className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} label="Strikethrough" isActive={editor.isActive('strike')}><Strikethrough className="w-4 h-4" /></ToolbarButton>
        <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} label="Heading" isActive={editor.isActive('heading', { level: 2 })}><Heading2 className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} label="Bulleted list" isActive={editor.isActive('bulletList')}><List className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} label="Numbered list" isActive={editor.isActive('orderedList')}><ListOrdered className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} label="Quote" isActive={editor.isActive('blockquote')}><Quote className="w-4 h-4" /></ToolbarButton>
        <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
        <ToolbarButton onClick={() => {
          const url = window.prompt('URL');
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }} label="Link" isActive={editor.isActive('link')}><Link2 className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => {
          const url = window.prompt('Image URL');
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }} label="Image"><ImageIcon className="w-4 h-4" /></ToolbarButton>
        <div className="flex-1" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} label="Undo" disabled={!editor.can().undo()}><Undo className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} label="Redo" disabled={!editor.can().redo()}><Redo className="w-4 h-4" /></ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
