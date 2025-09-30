'use client';

import React, { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import DOMPurify from 'dompurify';
import { fileToDataURL } from '@/lib/blogStore';

type Props = {
  initialHtml?: string;
  onChange?: (html: string) => void;
};

export default function TipTapEditor({ initialHtml = '', onChange }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        protocols: ['http', 'https', 'mailto'],
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: { style: 'max-width:100%;height:auto;border-radius:16px' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Начните писать…' }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none article-content',
        dir: 'ltr',
      },
    },
    content: initialHtml || '<p></p>',
    onCreate: ({ editor }) => {
      const clean = DOMPurify.sanitize(editor.getHTML(), {
        ADD_ATTR: ['target', 'rel', 'style'],
        ADD_URI_SAFE_ATTR: ['src'],
        ADD_TAGS: ['iframe'],
      });
      if (clean !== editor.getHTML()) editor.commands.setContent(clean, { emitUpdate: false });
    },
    onUpdate: ({ editor }) => {
      const raw = editor.getHTML();
      const clean = DOMPurify.sanitize(raw, {
        ADD_ATTR: ['target', 'rel', 'style'],
        ADD_URI_SAFE_ATTR: ['src'],
        ADD_TAGS: ['iframe'],
      });
      onChange?.(clean);
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(initialHtml || '<p></p>', { emitUpdate: false });
  }, [initialHtml, editor]);

  if (!editor) {
    return (
      <div className="bg-white rounded-2xl border p-4 text-[#52555a]">
        Загрузка редактора…
      </div>
    );
  }

  const toggleLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Введите ссылку', prev || 'https://');
    if (url === null) return;
    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url, target: '_blank', rel: 'noopener noreferrer' })
      .run();
  };

  const insertImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      const data = await fileToDataURL(f);
      editor.chain().focus().setImage({ src: data }).run();
    };
    input.click();
  };

  const addHeading = (level: 2 | 3) => {
    editor.chain().focus().toggleHeading({ level }).run();
  };

  return (
    <div className="w-full">
      {/* Панель */}
      <div className="mb-3 w-full bg-white border border-gray-200 rounded-2xl p-1 flex items-center flex-wrap gap-1">
        <div className="flex items-center rounded-xl bg-gray-50 px-1">
          <Btn onClick={() => editor.chain().focus().toggleBold().run()}  active={editor.isActive('bold')}      title="Жирный"><b>B</b></Btn>
          <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}    title="Курсив"><i>I</i></Btn>
          <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Подчёркнутый"><u>U</u></Btn>
          <Btn onClick={() => editor.chain().focus().toggleStrike().run()}  active={editor.isActive('strike')}   title="Зачёркнутый"><s>S</s></Btn>
        </div>

        <div className="flex items-center rounded-xl bg-gray-50 px-1">
          <Btn onClick={() => editor.chain().focus().setParagraph().run()}               active={editor.isActive('paragraph')} title="Абзац">P</Btn>
          <Btn onClick={() => addHeading(2)} active={editor.isActive('heading', { level: 2 })} title="H2">H2</Btn>
          <Btn onClick={() => addHeading(3)} active={editor.isActive('heading', { level: 3 })} title="H3">H3</Btn>
          <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Цитата">❝</Btn>
          <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')}  title="Код">{'</>'}</Btn>
          <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Разделитель">———</Btn>
        </div>

        <div className="flex items-center rounded-xl bg-gray-50 px-1">
          <Btn onClick={() => editor.chain().focus().toggleBulletList().run()}  active={editor.isActive('bulletList')}  title="Список">• List</Btn>
          <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Нумерованный">1. List</Btn>
        </div>

        <div className="flex items-center rounded-xl bg-gray-50 px-1">
          <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()}   active={editor.isActive({ textAlign: 'left' })}   title="Слева">⟸</Btn>
          <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="По центру">⇔</Btn>
          <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()}  active={editor.isActive({ textAlign: 'right' })}  title="Справа">⟹</Btn>
        </div>

        <div className="flex items-center rounded-xl bg-gray-50 px-1">
          <Btn onClick={toggleLink} active={editor.isActive('link')} title="Ссылка">🔗</Btn>
          <Btn onClick={insertImage} title="Изображение">🖼</Btn>
        </div>

        <div className="ml-auto flex items-center rounded-xl bg-gray-50 px-1">
          <Btn onClick={() => editor.chain().focus().undo().run()} title="Отменить">↶</Btn>
          <Btn onClick={() => editor.chain().focus().redo().run()} title="Повторить">↷</Btn>
          <Btn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Очистить форматирование">⌫</Btn>
        </div>
      </div>

      {/* Сам редактор */}
      <div className="bg-white rounded-2xl border p-4">
        <EditorContent editor={editor} className="tiptap text-black" />
      </div>

      <style>{`
        .article-content img, .article-content video, .article-content iframe { max-width: 100%; height: auto; border-radius: 16px; }
        .article-content figure { text-align:center; }
        .article-content figcaption { color:#6b7280; font-size:14px; margin-top:6px; }
        .article-content blockquote { border-left:4px solid #e1e2e5; padding:8px 12px; border-radius:8px; color:#374151; }
        .article-content h2 { font-size: 1.5rem; line-height: 1.3; margin-top: 1.4rem; font-weight: 700; }
        .article-content h3 { font-size: 1.25rem; line-height: 1.35; margin-top: 1.2rem; font-weight: 600; }
      `}</style>
    </div>
  );
}

function Btn({
  title,
  onClick,
  active,
  children,
}: {
  title?: string;
  onClick?: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex items-center justify-center h-10 px-3 rounded-lg text-[#111] hover:bg-gray-100 ${active ? 'bg-gray-200' : ''}`}
    >
      {children}
    </button>
  );
}
