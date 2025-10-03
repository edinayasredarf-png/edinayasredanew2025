'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
// ВАЖНО: именованный экспорт в твоей сборке
import { TextStyle } from '@tiptap/extension-text-style';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
// ВАЖНО: именованный экспорт в твоей сборке
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
};

const lowlight = createLowlight(common);

// «/»-команды
const SLASH_COMMANDS = [
  { label: 'Абзац', action: (e: any) => e.chain().focus().setParagraph().run() },
  { label: 'H2', action: (e: any) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: 'H3', action: (e: any) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { label: 'Список', action: (e: any) => e.chain().focus().toggleBulletList().run() },
  { label: 'Нумерованный', action: (e: any) => e.chain().focus().toggleOrderedList().run() },
  { label: 'Список задач', action: (e: any) => e.chain().focus().toggleTaskList().run() },
  { label: 'Цитата', action: (e: any) => e.chain().focus().toggleBlockquote().run() },
  { label: 'Код', action: (e: any) => e.chain().focus().toggleCodeBlock().run() },
  { label: 'Разделитель', action: (e: any) => e.chain().focus().setHorizontalRule().run() },
  { label: 'Таблица 3×3', action: (e: any) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { label: 'YouTube', action: (e: any) => insertYouTubePrompt(e) },
];

function insertYouTubePrompt(editor: any) {
  const prev = editor?.getAttributes('youtube')?.src as string | undefined;
  const url = window.prompt('Вставьте ссылку на YouTube', prev || 'https://www.youtube.com/watch?v=') || '';
  if (!url) return;
  editor.chain().focus().setYoutubeVideo({ src: url, width: 640, height: 360, controls: true }).run();
}

export default function TipTapEditor({ initialHtml = '', onChange }: Props) {
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const slashRef = useRef<HTMLDivElement | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    autofocus: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false, // заменяем на CodeBlockLowlight
      }),
      Typography,
      TextStyle, // именованный импорт
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
        HTMLAttributes: { style: 'max-width:100%;height:auto;border-radius:16px' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Нажмите “/” для команд. Начните писать…' }),
      Youtube.configure({ HTMLAttributes: { class: 'rounded-xl overflow-hidden' } }),
      Table.configure({ resizable: true, lastColumnResizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: 'plaintext' }),
      CharacterCount.configure(),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none article-content',
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

      // ловец «/»-команд
      const { from } = editor.state.selection;
      const text = editor.state.doc.textBetween(Math.max(0, from - 50), from, '\n', '\n');
      const slashMatch = /(?:^|\s)\/([a-zA-Zа-яА-Я0-9-_ ]*)$/.exec(text);
      setSlashOpen(Boolean(slashMatch));
      setSlashQuery(slashMatch?.[1]?.trim() ?? '');
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(initialHtml || '<p></p>', { emitUpdate: false });
  }, [initialHtml, editor]);

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

  const insertTable = () =>
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();

  const setCodeLanguage = () => {
    const lang =
      window.prompt(
        'Язык кода (javascript, typescript, json, css, html, python, …)',
        'javascript',
      ) || 'plaintext';
    editor?.chain().focus().updateAttributes('codeBlock', { language: lang }).run();
  };

  const slashFiltered = useMemo(() => {
    const q = slashQuery.toLowerCase();
    return SLASH_COMMANDS.filter((c) => c.label.toLowerCase().includes(q)).slice(0, 8);
  }, [slashQuery]);

  if (!editor) {
    return (
      <div className="bg-white rounded-2xl border p-4 text-[#52555a]">
        Загрузка редактора…
      </div>
    );
  }

  return (
    <div className="w-full relative">
      {/* Панель инструментов */}
      <div className="mb-3 w-full bg-white border border-gray-200 rounded-2xl p-1 flex items-center flex-wrap gap-1">
        <Group>
          <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Жирный"><b>B</b></Btn>
          <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Курсив"><i>I</i></Btn>
          <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Подчёркнутый"><u>U</u></Btn>
          <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Зачёркнутый"><s>S</s></Btn>
          <Btn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Выделение">🖍</Btn>
          <label className="inline-flex items-center h-10 px-2 rounded-lg hover:bg-gray-100 cursor-pointer">
            <span className="mr-2 text-sm text-[#111]">Цвет</span>
            <input
              type="color"
              className="w-8 h-8 p-0 border-0 bg-transparent cursor-pointer"
              onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
            />
          </label>
          <Btn onClick={() => editor.chain().focus().unsetColor().run()} title="Сброс цвета">⨯</Btn>
        </Group>

        <Group>
          <Btn onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')} title="Абзац">P</Btn>
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="H2">H2</Btn>
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="H3">H3</Btn>
          <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Цитата">❝</Btn>
          <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Код">{'</>'}</Btn>
          <Btn onClick={setCodeLanguage} title="Язык кода">🌐</Btn>
          <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Разделитель">— — —</Btn>
        </Group>

        <Group>
          <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Список">• List</Btn>
          <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Нумерованный">1. List</Btn>
          <Btn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Задачи">☑</Btn>
        </Group>

        <Group>
          <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Слева">⟸</Btn>
          <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="По центру">⇔</Btn>
          <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Справа">⟹</Btn>
          <Btn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="По ширине">≋</Btn>
        </Group>

        <Group>
          <Btn onClick={toggleLink} active={editor.isActive('link')} title="Ссылка">🔗</Btn>
          <Btn onClick={insertImage} title="Изображение">🖼</Btn>
          <Btn onClick={() => insertYouTubePrompt(editor)} title="YouTube">▶️</Btn>
        </Group>

        <Group>
          <Btn onClick={insertTable} title="Таблица">▦</Btn>
          <Btn onClick={() => editor.chain().focus().addRowAfter().run()} title="Строка +">＋R</Btn>
          <Btn onClick={() => editor.chain().focus().addColumnAfter().run()} title="Колонка +">＋C</Btn>
          <Btn onClick={() => editor.chain().focus().deleteRow().run()} title="Строка −">−R</Btn>
          <Btn onClick={() => editor.chain().focus().deleteColumn().run()} title="Колонка −">−C</Btn>
          <Btn onClick={() => editor.chain().focus().toggleHeaderRow().run()} title="Заголовок">TH</Btn>
        </Group>

        <div className="ml-auto flex items-center rounded-xl bg-gray-50 px-1">
          <Btn onClick={() => editor.chain().focus().undo().run()} title="Отменить">↶</Btn>
          <Btn onClick={() => editor.chain().focus().redo().run()} title="Повторить">↷</Btn>
          <Btn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Очистить">⌫</Btn>
        </div>
      </div>

      {/* Сам редактор */}
      <div className="bg-white rounded-2xl border p-0 overflow-hidden">
        <EditorContent editor={editor} className="tiptap text-black px-4 py-4" />
        <div className="flex items-center justify-between px-4 py-2 border-t text-sm text-gray-500">
          <span>Символов: {editor.storage.characterCount.characters()}</span>
          <span>Слов: {editor.storage.characterCount.words()}</span>
        </div>
      </div>

      {/* «/»-палитра */}
      {slashOpen && (
        <div ref={slashRef} className="absolute z-10 mt-1 w-[320px] bg-white border rounded-xl shadow-lg p-1">
          {slashFiltered.map((cmd, i) => (
            <button
              key={i}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-sm"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { cmd.action(editor); setSlashOpen(false); setSlashQuery(''); }}
            >
              {cmd.label}
            </button>
          ))}
          {!slashFiltered.length && <div className="px-3 py-2 text-gray-400 text-sm">Ничего не найдено…</div>}
        </div>
      )}

      <style>{`
        .article-content img, .article-content video, .article-content iframe { max-width: 100%; height: auto; border-radius: 16px; }
        .article-content figure { text-align:center; }
        .article-content figcaption { color:#6b7280; font-size:14px; margin-top:6px; }
        .article-content blockquote { border-left:4px solid #e1e2e5; padding:8px 12px; border-radius:8px; color:#374151; background:#fafafa; }
        .article-content h2 { font-size: 1.5rem; line-height: 1.3; margin-top: 1.4rem; font-weight: 700; }
        .article-content h3 { font-size: 1.25rem; line-height: 1.35; margin-top: 1.2rem; font-weight: 600; }

        /* таблицы */
        .tiptap table { width: 100%; border-collapse: separate; border-spacing: 0; overflow: hidden; border-radius: 12px; }
        .tiptap table td, .tiptap table th { border: 1px solid #e5e7eb; padding: 10px; vertical-align: top; }
        .tiptap table th { background: #fafafa; font-weight: 600; text-align: left; }
        .tiptap .selectedCell:after { content: ""; position: absolute; inset: 0; background: rgba(0,123,255,.06); pointer-events: none; }

        /* задачи */
        .tiptap ul[data-type="taskList"] { list-style: none; padding: 0; }
        .tiptap li[data-type="taskItem"] { display: flex; align-items: flex-start; gap: .5rem; }
        .tiptap li[data-type="taskItem"] > label { margin-top: .15rem; }

        /* код-блоки */
        .tiptap pre { background: #0b1020; color: #e5e7eb; border-radius: 12px; padding: 14px 16px; overflow-x: auto; }
        .tiptap pre code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }

        /* ссылки */
        .tiptap a { color: #0ea5e9; text-underline-offset: 2px; }

        /* группы */
        .toolbar-group { display: inline-flex; align-items: center; border-radius: 12px; background: #f9fafb; padding: 2px; }
      `}</style>
    </div>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="toolbar-group">{children}</div>;
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
      onMouseDown={(e) => { e.preventDefault(); }}
      onClick={onClick}
      className={`inline-flex items-center justify-center h-10 px-3 rounded-lg text-[#111] hover:bg-gray-100 ${active ? 'bg-gray-200' : ''}`}
    >
      {children}
    </button>
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
