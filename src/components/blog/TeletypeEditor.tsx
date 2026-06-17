'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import CharacterCount from '@tiptap/extension-character-count';
import Youtube from '@tiptap/extension-youtube';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight, common } from 'lowlight';
import DOMPurify from 'dompurify';
import { fileToDataURL } from '@/lib/blogStore';

type Props = {
  initialHtml?: string;
  onChange?: (html: string) => void;
  className?: string;
};

const lowlight = createLowlight(common);

// Слэш-команды в стиле Teletype
const SLASH_COMMANDS = [
  {
    label: 'Заголовок 2',
    icon: 'H2',
    action: (e: any) => e.chain().focus().toggleHeading({ level: 2 }).run()
  },
  {
    label: 'Заголовок 3',
    icon: 'H3',
    action: (e: any) => e.chain().focus().toggleHeading({ level: 3 }).run()
  },
  {
    label: 'Список',
    icon: '•',
    action: (e: any) => e.chain().focus().toggleBulletList().run()
  },
  {
    label: 'Нумерованный список',
    icon: '1.',
    action: (e: any) => e.chain().focus().toggleOrderedList().run()
  },
  {
    label: 'Цитата',
    icon: '"',
    action: (e: any) => e.chain().focus().toggleBlockquote().run()
  },
  {
    label: 'Выноска',
    icon: '📌',
    action: (e: any) => e.chain().focus().toggleBlockquote().run()
  },
  {
    label: 'Код',
    icon: '</>',
    action: (e: any) => e.chain().focus().toggleCodeBlock().run()
  },
  {
    label: 'Список задач',
    icon: '☑',
    action: (e: any) => e.chain().focus().toggleTaskList().run()
  },
  {
    label: 'Разделитель',
    icon: '—',
    action: (e: any) => e.chain().focus().setHorizontalRule().run()
  },
  {
    label: 'Таблица',
    icon: '▦',
    action: (e: any) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  },
  {
    label: 'YouTube',
    icon: '▶',
    action: (e: any) => insertYouTubePrompt(e)
  },
];

function insertYouTubePrompt(editor: any) {
  const prev = editor?.getAttributes('youtube')?.src as string | undefined;
  const url = window.prompt('Вставьте ссылку на YouTube', prev || 'https://www.youtube.com/watch?v=') || '';
  if (!url) return;
  editor.chain().focus().setYoutubeVideo({ src: url, width: 640, height: 360, controls: true }).run();
}

export default function TeletypeEditor({ initialHtml = '', onChange, className = '' }: Props) {
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const slashRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    autofocus: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
      }),
      Typography,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        protocols: ['http', 'https', 'mailto', 'tel'],
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          style: 'max-width:100%;height:auto;border-radius:12px;margin:16px 0;'
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder: 'Наберите / для быстрой вставки...'
      }),
      Youtube.configure({
        HTMLAttributes: {
          class: 'rounded-xl overflow-hidden my-4'
        }
      }),
      Table.configure({ resizable: true, lastColumnResizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'plaintext'
      }),
      CharacterCount.configure(),
    ],
    editorProps: {
      attributes: {
        class: 'teletype-editor-content',
        dir: 'ltr',
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of items) {
          if (item.type.indexOf('image') === 0) {
            const file = item.getAsFile();
            if (!file) continue;
            fileToDataURL(file).then((src) => {
              (view as any).editor.chain().focus().setImage({ src }).run();
            });
            return true;
          }
        }
        return false;
      },
      handleDrop(view, event, _slice, moved) {
        if (moved) return false;
        const dt = (event as DragEvent).dataTransfer;
        if (!dt?.files?.length) return false;
        const file = dt.files[0];
        if (!file || !file.type.startsWith('image/')) return false;
        event.preventDefault();
        fileToDataURL(file).then((src) => {
          (view as any).editor.chain().focus().setImage({ src }).run();
        });
        return true;
      },
    },
    content: initialHtml || '<p></p>',
    onCreate: ({ editor }) => {
      const clean = sanitizeHtml(editor.getHTML());
      if (clean !== editor.getHTML()) editor.commands.setContent(clean, { emitUpdate: false });
    },
    onUpdate: ({ editor }) => {
      const raw = editor.getHTML();
      const clean = sanitizeHtml(raw);
      onChange?.(clean);

      // Обработка слэш-команд
      const { from } = editor.state.selection;
      const text = editor.state.doc.textBetween(Math.max(0, from - 50), from, '\n', '\n');
      const slashMatch = /(?:^|\s)\/([a-zA-Zа-яА-Я0-9-_ ]*)$/.exec(text);

      if (slashMatch) {
        setSlashOpen(true);
        setSlashQuery(slashMatch[1]?.trim() ?? '');
        setSelectedIndex(0);
      } else {
        setSlashOpen(false);
        setSlashQuery('');
      }
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(initialHtml || '<p></p>', { emitUpdate: false });
  }, [initialHtml, editor]);

  // Обработка клавиатуры для слэш-меню
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!slashOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, slashFiltered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (slashFiltered[selectedIndex]) {
          slashFiltered[selectedIndex].action(editor);
          setSlashOpen(false);
          setSlashQuery('');
        }
      } else if (e.key === 'Escape') {
        setSlashOpen(false);
        setSlashQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [slashOpen, selectedIndex, editor]);

  const insertImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      const data = await fileToDataURL(f);
      editor?.chain().focus().setImage({ src: data }).run();
    };
    input.click();
  };

  const toggleLink = () => {
    const prev = editor?.getAttributes('link').href as string | undefined;
    const url = window.prompt('Введите ссылку', prev || 'https://');
    if (url === null) return;
    if (!url) {
      editor?.chain().focus().unsetLink().run();
      return;
    }
    editor
      ?.chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url, target: '_blank', rel: 'noopener noreferrer nofollow' })
      .run();
  };

  const slashFiltered = useMemo(() => {
    const q = slashQuery.toLowerCase();
    return SLASH_COMMANDS.filter((c) =>
      c.label.toLowerCase().includes(q) ||
      c.icon.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [slashQuery]);

  if (!editor) {
    return (
      <div className="teletype-loading">
        Загрузка редактора…
      </div>
    );
  }

  return (
    <div className={`teletype-editor ${className}`}>
      {/* Минималистичная панель инструментов */}
      <div className="teletype-toolba font-[Raleway]">
        <div className="teletype-toolbar-left">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`teletype-btn ${editor.isActive('bold') ? 'active' : ''}`}
            title="Жирный"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`teletype-btn ${editor.isActive('italic') ? 'active' : ''}`}
            title="Курсив"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`teletype-btn ${editor.isActive('strike') ? 'active' : ''}`}
            title="Зачёркнутый"
          >
            <s>S</s>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`teletype-btn ${editor.isActive('highlight') ? 'active' : ''}`}
            title="Выделение"
          >
            🖍
          </button>
        </div>

        <div className="teletype-toolbar-center">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`teletype-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
            title="Заголовок 2"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`teletype-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
            title="Заголовок 3"
          >
            H3
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`teletype-btn ${editor.isActive('blockquote') ? 'active' : ''}`}
            title="Цитата"
          >
            "
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`teletype-btn ${editor.isActive('codeBlock') ? 'active' : ''}`}
            title="Код"
          >
            {'</>'}
          </button>
        </div>

        <div className="teletype-toolbar-right">
          <button
            onClick={toggleLink}
            className={`teletype-btn ${editor.isActive('link') ? 'active' : ''}`}
            title="Ссылка"
          >
            🔗
          </button>
          <button
            onClick={insertImage}
            className="teletype-btn"
            title="Изображение"
          >
            🖼
          </button>
          <button
            onClick={() => insertYouTubePrompt(editor)}
            className="teletype-btn"
            title="YouTube"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Область редактора */}
      <div className="teletype-content" ref={editorRef}>
        <EditorContent editor={editor} />
      </div>

      {/* Слэш-меню */}
      {slashOpen && (
        <div
          ref={slashRef}
          className="teletype-slash-menu"
          style={{
            position: 'absolute',
            top: editorRef.current?.getBoundingClientRect().top || 0,
            left: 0,
            zIndex: 1000,
          }}
        >
          {slashFiltered.map((cmd, i) => (
            <button
              key={i}
              className={`teletype-slash-item ${i === selectedIndex ? 'selected' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                cmd.action(editor);
                setSlashOpen(false);
                setSlashQuery('');
              }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className="teletype-slash-icon">{cmd.icon}</span>
              <span className="teletype-slash-label">{cmd.label}</span>
            </button>
          ))}
          {!slashFiltered.length && (
            <div className="teletype-slash-empty">
              Ничего не найдено…
            </div>
          )}
        </div>
      )}

      {/* Стили */}
      <style jsx>{`
        .teletype-editor {
          position: relative;
          background: #1a1a1a;
          border-radius: 12px;
          overflow: hidden;
          min-height: 400px;
        }

        .teletype-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          background: #1a1a1a;
          color: #888;
          border-radius: 12px;
        }

        .teletype-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #2a2a2a;
          border-bottom: 1px solid #333;
        }

        .teletype-toolbar-left,
        .teletype-toolbar-center,
        .teletype-toolbar-right {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .teletype-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: #ccc;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
        }

        .teletype-btn:hover {
          background: #3a3a3a;
          color: #fff;
        }

        .teletype-btn.active {
          background: #4a4a4a;
          color: #fff;
        }

        .teletype-content {
          background: #1a1a1a;
          min-height: 300px;
          padding: 24px;
        }

        .teletype-editor-content {
          outline: none;
          color: #fff;
          font-size: 16px;
          line-height: 1.6;
        }

        .teletype-editor-content p {
          margin: 0 0 16px 0;
        }

        .teletype-editor-content h2 {
          font-size: 24px;
          font-weight: 700;
          margin: 24px 0 16px 0;
          color: #fff;
        }

        .teletype-editor-content h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 20px 0 12px 0;
          color: #fff;
        }

        .teletype-editor-content blockquote {
          border-left: 4px solid #4a4a4a;
          padding: 12px 16px;
          margin: 16px 0;
          background: #2a2a2a;
          border-radius: 0 8px 8px 0;
          color: #ccc;
        }

        .teletype-editor-content code {
          background: #2a2a2a;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 14px;
          color: #ff6b6b;
        }

        .teletype-editor-content pre {
          background: #0a0a0a;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 16px 0;
          border: 1px solid #333;
        }

        .teletype-editor-content pre code {
          background: none;
          padding: 0;
          color: #e0e0e0;
        }

        .teletype-editor-content ul,
        .teletype-editor-content ol {
          padding-left: 24px;
          margin: 16px 0;
        }

        .teletype-editor-content li {
          margin: 4px 0;
        }

        .teletype-editor-content a {
          color: #4a9eff;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .teletype-editor-content a:hover {
          color: #6bb6ff;
        }

        .teletype-editor-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 16px 0;
        }

        .teletype-editor-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          background: #2a2a2a;
          border-radius: 8px;
          overflow: hidden;
        }

        .teletype-editor-content th,
        .teletype-editor-content td {
          padding: 12px;
          border: 1px solid #3a3a3a;
          text-align: left;
        }

        .teletype-editor-content th {
          background: #3a3a3a;
          font-weight: 600;
        }

        .teletype-slash-menu {
          background: #2a2a2a;
          border: 1px solid #3a3a3a;
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          min-width: 280px;
        }

        .teletype-slash-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          background: transparent;
          border: none;
          color: #ccc;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .teletype-slash-item:hover,
        .teletype-slash-item.selected {
          background: #3a3a3a;
          color: #fff;
        }

        .teletype-slash-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: #4a4a4a;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .teletype-slash-label {
          font-size: 14px;
          font-weight: 500;
        }

        .teletype-slash-empty {
          padding: 12px 16px;
          color: #666;
          font-size: 14px;
          text-align: center;
        }

        /* Стили для задач */
        .teletype-editor-content ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }

        .teletype-editor-content li[data-type="taskItem"] {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin: 8px 0;
        }

        .teletype-editor-content li[data-type="taskItem"] > label {
          margin-top: 2px;
        }

        /* Стили для YouTube */
        .teletype-editor-content iframe {
          border-radius: 8px;
          margin: 16px 0;
        }
      `}</style>
    </div>
  );
}

function sanitizeHtml(html: string) {
  return DOMPurify.sanitize(html, {
    ADD_ATTR: [
      'target', 'rel', 'style', 'controls', 'frameborder',
      'allow', 'allowfullscreen', 'autoplay', 'playsinline', 'muted',
      'width', 'height', 'data-language', 'colspan', 'rowspan'
    ],
    ADD_URI_SAFE_ATTR: ['src', 'href'],
    ADD_TAGS: ['iframe', 'video', 'source', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'colgroup', 'col'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|data|blob):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
    FORBID_TAGS: ['script'],
  });
}
