'use client';

import * as React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Toolbar from './Toolbar';
import { fileToDataURL } from '@/lib/blogStore';

// (опционально) если добавите санитайз:
let sanitize = (html: string) => html;
try {
  // динамический импорт, чтобы не ломать SSR
  // @ts-ignore
  const DOMPurify = typeof window !== 'undefined' ? require('dompurify') : null;
  if (DOMPurify?.sanitize) sanitize = DOMPurify.sanitize;
} catch {}

type Props = {
  initialHtml?: string;
  onChange: (html: string) => void;
};

export default function PostEditor({ initialHtml = '', onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({ openOnClick: false }),
      Image,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: sanitize(initialHtml),
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          // базовая «проse»-типографика + скругления
          'prose prose-neutral max-w-none focus:outline-none',
      },
    },
  });

  if (!editor) return null;

  // === МАППИНГ ВАШЕГО ТУЛБАРА → TipTap ===
  const run = (cmd: string, val?: string) => {
    const c = editor.chain().focus();
    switch (cmd) {
      case 'bold': return c.toggleBold().run();
      case 'italic': return c.toggleItalic().run();
      case 'underline': return c.toggleUnderline().run();
      case 'strikeThrough': return c.toggleStrike().run();

      case 'formatBlock': {
        // val: '<p>' | '<h1>' | '<h2>' | '<h3>'
        if (val === '<h1>') return c.toggleHeading({ level: 1 }).run();
        if (val === '<h2>') return c.toggleHeading({ level: 2 }).run();
        if (val === '<h3>') return c.toggleHeading({ level: 3 }).run();
        return c.setParagraph().run();
      }

      case 'insertUnorderedList': return c.toggleBulletList().run();
      case 'insertOrderedList':  return c.toggleOrderedList().run();

      case 'justifyLeft':   editor.commands.setTextAlign('left');  return;
      case 'justifyCenter': editor.commands.setTextAlign('center'); return;
      case 'justifyRight':  editor.commands.setTextAlign('right');  return;

      case 'undo': return editor.commands.undo();
      case 'redo': return editor.commands.redo();

      case 'removeFormat':
        editor.commands.unsetAllMarks();
        editor.commands.clearNodes();
        return;
    }
  };

  const insertHtml = (html: string) => editor.commands.insertContent(html);

  const pickImage = async () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async () => {
      const f = input.files?.[0]; if (!f) return;
      const src = await fileToDataURL(f);
      editor.chain().focus().setImage({ src, alt: '' }).run();
    };
    input.click();
  };

  const pickVideo = async () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'video/*';
    input.onchange = () => {
      const f = input.files?.[0]; if (!f) return;
      const url = URL.createObjectURL(f);
      insertHtml(
        `<video controls style="max-width:100%;border-radius:12px"><source src="${url}"/></video>`
      );
    };
    input.click();
  };

  return (
    <div className="space-y-3">
      <Toolbar
        onCmd={run}
        onInsertHtml={insertHtml}
        onPickImage={pickImage}
        onPickVideo={pickVideo}
        onEmbed={() => {
          const html = prompt('Вставьте iframe/embed HTML');
          if (!html) return;
          insertHtml(html); // при желании пропустите через sanitize
        }}
      />
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
