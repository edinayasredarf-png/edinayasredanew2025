'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { RichTextProvider } from 'reactjs-tiptap-editor';
import { Document } from '@tiptap/extension-document';
import { HardBreak } from '@tiptap/extension-hard-break';
import { ListItem } from '@tiptap/extension-list';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { TextStyle } from '@tiptap/extension-text-style';
import { Dropcursor, Gapcursor, Placeholder, TrailingNode, CharacterCount } from '@tiptap/extensions';

import { Attachment, RichTextAttachment } from 'reactjs-tiptap-editor/attachment';
import { Blockquote, RichTextBlockquote } from 'reactjs-tiptap-editor/blockquote';
import { Bold, RichTextBold } from 'reactjs-tiptap-editor/bold';
import { BulletList, RichTextBulletList } from 'reactjs-tiptap-editor/bulletlist';
import { Clear, RichTextClear } from 'reactjs-tiptap-editor/clear';
import { Code, RichTextCode } from 'reactjs-tiptap-editor/code';
import { CodeBlock, RichTextCodeBlock } from 'reactjs-tiptap-editor/codeblock';
import { CodeView, RichTextCodeView } from 'reactjs-tiptap-editor/codeview';
import { Color, RichTextColor } from 'reactjs-tiptap-editor/color';
import { Column, ColumnNode, MultipleColumnNode, RichTextColumn } from 'reactjs-tiptap-editor/column';
import { Emoji, RichTextEmoji } from 'reactjs-tiptap-editor/emoji';
import { ExportPdf, RichTextExportPdf } from 'reactjs-tiptap-editor/exportpdf';
import { ExportWord, RichTextExportWord } from 'reactjs-tiptap-editor/exportword';
import { FontFamily, RichTextFontFamily } from 'reactjs-tiptap-editor/fontfamily';
import { FontSize, RichTextFontSize } from 'reactjs-tiptap-editor/fontsize';
import { Heading, RichTextHeading } from 'reactjs-tiptap-editor/heading';
import { Highlight, RichTextHighlight } from 'reactjs-tiptap-editor/highlight';
import { History, RichTextRedo, RichTextUndo } from 'reactjs-tiptap-editor/history';
import { HorizontalRule, RichTextHorizontalRule } from 'reactjs-tiptap-editor/horizontalrule';
import { Iframe, RichTextIframe } from 'reactjs-tiptap-editor/iframe';
import { Image, RichTextImage } from 'reactjs-tiptap-editor/image';
import { ImportWord, RichTextImportWord } from 'reactjs-tiptap-editor/importword';
import { Indent, RichTextIndent } from 'reactjs-tiptap-editor/indent';
import { Italic, RichTextItalic } from 'reactjs-tiptap-editor/italic';
import { LineHeight, RichTextLineHeight } from 'reactjs-tiptap-editor/lineheight';
import { Link, RichTextLink } from 'reactjs-tiptap-editor/link';
import { Mermaid, RichTextMermaid } from 'reactjs-tiptap-editor/mermaid';
import { MoreMark, RichTextMoreMark } from 'reactjs-tiptap-editor/moremark';
import { OrderedList, RichTextOrderedList } from 'reactjs-tiptap-editor/orderedlist';
import { RichTextSearchAndReplace, SearchAndReplace } from 'reactjs-tiptap-editor/searchandreplace';
import { RichTextStrike, Strike } from 'reactjs-tiptap-editor/strike';
import { RichTextTable, Table } from 'reactjs-tiptap-editor/table';
import { RichTextTaskList, TaskList } from 'reactjs-tiptap-editor/tasklist';
import { RichTextAlign, TextAlign } from 'reactjs-tiptap-editor/textalign';
import { RichTextTextDirection, TextDirection } from 'reactjs-tiptap-editor/textdirection';
import { RichTextUnderline, TextUnderline } from 'reactjs-tiptap-editor/textunderline';
import { RichTextVideo, Video } from 'reactjs-tiptap-editor/video';
import { RichTextCallout, Callout } from 'reactjs-tiptap-editor/callout';
import { SlashCommand, SlashCommandList } from 'reactjs-tiptap-editor/slashcommand';
import {
  RichTextBubbleColumns,
  RichTextBubbleIframe,
  RichTextBubbleImage,
  RichTextBubbleLink,
  RichTextBubbleMermaid,
  RichTextBubbleTable,
  RichTextBubbleText,
  RichTextBubbleVideo,
  RichTextBubbleMenuDragHandle,
  RichTextBubbleCallout,
} from 'reactjs-tiptap-editor/bubble';

import 'reactjs-tiptap-editor/style.css';
import 'prism-code-editor-lightweight/layout.css';
import 'prism-code-editor-lightweight/themes/github-dark.css';

import { EditorContent, useEditor } from '@tiptap/react';
import nextDynamic from 'next/dynamic';
import { uploadEditorImage } from '@/lib/imageUpload';

// Редактор изображений (тяжёлый, только браузер) — динамический импорт.
const ImageEditorModal = nextDynamic(() => import('./ImageEditorModal'), {
  ssr: false,
});

// Мост между module-level upload-хуком Tiptap и состоянием компонента:
// компонент выставляет обработчик на маунте, хук картинок его вызывает.
let imageEditBeforeUpload: ((file: File) => Promise<string>) | null = null;

const DocumentColumn = Document.extend({
  content: '(block|columns)+',
});

const BaseKit = [
  DocumentColumn,
  Text,
  Dropcursor.configure({
    color: 'hsl(var(--primary))',
    width: 2,
  }),
  Gapcursor,
  HardBreak,
  Paragraph,
  TrailingNode,
  ListItem,
  TextStyle,
  Placeholder.configure({
    placeholder: "Нажмите '/' для команд",
  }),
];

const extensions = [
  ...BaseKit,
  CharacterCount,
  History,
  SearchAndReplace,
  Clear,
  FontFamily,
  Heading,
  FontSize,
  Bold,
  Italic,
  TextUnderline,
  Strike,
  MoreMark,
  Emoji,
  Color,
  Highlight,
  BulletList,
  OrderedList,
  TextAlign,
  Indent,
  LineHeight,
  TaskList,
  Link,
  Image.configure({
    // Перед загрузкой картинки открываем редактор (обрезка/текст/фильтры).
    // Обработчик выставляет компонент RichEditor на маунте; без него —
    // прямая загрузка (напр. если редактор ещё не готов).
    upload: (file: File) =>
      imageEditBeforeUpload ? imageEditBeforeUpload(file) : uploadEditorImage(file),
  }),
  Video.configure({
    upload: (file: File) =>
      new Promise((resolve) => {
        setTimeout(() => resolve(URL.createObjectURL(file)), 300);
      }),
  }),
  Blockquote,
  HorizontalRule,
  Code,
  CodeBlock,
  Column,
  ColumnNode,
  MultipleColumnNode,
  Table,
  Iframe,
  ExportPdf,
  ImportWord,
  ExportWord,
  TextDirection,
  Attachment.configure({
    upload: (file: File) =>
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      }),
  }),
  Mermaid.configure({
    upload: (file: File) =>
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      }),
  }),
  SlashCommand,
  CodeView,
  Callout,
];

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

const RichTextToolbar = () => (
  <div className="flex items-center p-1 gap-1 flex-wrap border-b border-border bg-background sticky top-0 z-10">
    <RichTextUndo />
    <RichTextRedo />
    <RichTextSearchAndReplace />
    <RichTextClear />
    <RichTextFontFamily />
    <RichTextHeading />
    <RichTextFontSize />
    <RichTextBold />
    <RichTextItalic />
    <RichTextUnderline />
    <RichTextStrike />
    <RichTextMoreMark />
    <RichTextEmoji />
    <RichTextColor />
    <RichTextHighlight />
    <RichTextBulletList />
    <RichTextOrderedList />
    <RichTextAlign />
    <RichTextIndent />
    <RichTextLineHeight />
    <RichTextTaskList />
    <RichTextLink />
    <RichTextImage />
    <RichTextVideo />
    <RichTextBlockquote />
    <RichTextHorizontalRule />
    <RichTextCode />
    <RichTextCodeBlock />
    <RichTextColumn />
    <RichTextTable />
    <RichTextIframe />
    <RichTextExportPdf />
    <RichTextImportWord />
    <RichTextExportWord />
    <RichTextTextDirection />
    <RichTextAttachment />
    <RichTextMermaid />
    <RichTextCodeView />
    <RichTextCallout />
  </div>
);

type Props = {
  initialHtml?: string;
  onChange?: (html: string) => void;
};

type PendingEdit = {
  src: string;
  file: File;
  resolve: (url: string) => void;
  reject: (err: unknown) => void;
};

export default function RichEditor({ initialHtml = '', onChange }: Props) {
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  // Картинка, ожидающая редактирования перед вставкой в текст.
  const [pendingEdit, setPendingEdit] = useState<PendingEdit | null>(null);

  // Ставим мост для upload-хука картинок: открыть редактор и дождаться результата.
  useEffect(() => {
    imageEditBeforeUpload = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const src = URL.createObjectURL(file);
        setPendingEdit({ src, file, resolve, reject });
      });
    return () => {
      imageEditBeforeUpload = null;
    };
  }, []);

  // Завершение работы с редактором: загрузить файл и вернуть URL в Tiptap.
  const finishPendingEdit = useCallback(
    async (fileToUpload: File) => {
      const p = pendingEdit;
      if (!p) return;
      URL.revokeObjectURL(p.src);
      setPendingEdit(null);
      try {
        p.resolve(await uploadEditorImage(fileToUpload));
      } catch (e) {
        p.reject(e);
      }
    },
    [pendingEdit],
  );

  const onValueChange = useCallback(
    debounce((value: string) => {
      onChangeRef.current?.(value);
    }, 300),
    [],
  );

  const editor = useEditor({
    textDirection: 'auto',
    content: initialHtml,
    extensions,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onValueChange(editor.getHTML());
    },
  });

  // При маунте сразу уведомляем родителя о начальном значении
  useEffect(() => {
    if (initialHtml) {
      onChangeRef.current?.(initialHtml);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Синхронизация если initialHtml изменился снаружи (например при загрузке черновика)
  useEffect(() => {
    if (editor && initialHtml && editor.getHTML() !== initialHtml) {
      editor.commands.setContent(initialHtml, { emitUpdate: false });
      onChangeRef.current?.(initialHtml);
    }
  }, [initialHtml, editor]);

  if (!editor) return null;

  return (
    <RichTextProvider editor={editor}>
      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <div className="flex max-h-full w-full flex-col">
          <RichTextToolbar />
          <EditorContent editor={editor} className="min-h-[400px] p-4" />

          <RichTextBubbleColumns />
          <RichTextBubbleIframe />
          <RichTextBubbleImage />
          <RichTextBubbleLink />
          <RichTextBubbleMermaid />
          <RichTextBubbleTable />
          <RichTextBubbleText />
          <RichTextBubbleVideo />
          <RichTextBubbleCallout />
          <SlashCommandList />
          <RichTextBubbleMenuDragHandle />
        </div>
      </div>

      {pendingEdit && (
        <ImageEditorModal
          source={pendingEdit.src}
          saveName="image"
          onSave={(edited) => finishPendingEdit(edited)}
          // Закрыли без сохранения — вставляем оригинал как есть.
          onClose={() => finishPendingEdit(pendingEdit.file)}
        />
      )}
    </RichTextProvider>
  );
}
