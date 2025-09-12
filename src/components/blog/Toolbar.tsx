'use client';
import * as React from 'react';

type ToolbarProps = {
  onCmd?: (cmd: string, value?: string) => void;
  onInsertHtml?: (html: string) => void;
  onPickImage?: () => void;
  onPickVideo?: () => void;
  onEmbed?: () => void;
};

function Btn({ title, onClick, children }: any) {
  return (
    <button type="button" title={title} onClick={onClick}
      className="inline-flex items-center justify-center h-10 px-3 rounded-lg text-[#111] hover:bg-gray-100">
      {children}
    </button>
  );
}

export default function Toolbar({ onCmd, onInsertHtml, onPickImage, onPickVideo, onEmbed }: ToolbarProps) {
  const run = (cmd: string, value?: string) => () => onCmd?.(cmd, value);

  const block = (tag: 'p'|'h1'|'h2'|'h3') => () => {
    // formatBlock требует значение в виде '<h1>'
    const map = { p:'<p>', h1:'<h1>', h2:'<h2>', h3:'<h3>' } as const;
    onCmd?.('formatBlock', map[tag]);
  };

  const addQuote = () => onInsertHtml?.(
    '<blockquote style="border-left:4px solid #e5e7eb;padding:8px 12px;color:#374151;margin:12px 0;border-radius:8px">Цитата</blockquote>'
  );
  const addCode  = () => onInsertHtml?.(
    '<pre style="background:#0b1020;color:#f8fafc;padding:12px 14px;border-radius:12px;overflow:auto"><code>// код</code></pre>'
  );

  const addCaptionedImage = () => {
    const caption = prompt('Подпись к изображению (необязательно)') || '';
    // делегируем выбор файла во внешний хендлер
    onPickImage?.();
    // подпись добавим отдельной кнопкой, но удобнее сразу иметь шаблон:
    if (caption) {
      onInsertHtml?.(`<div style="text-align:center;color:#6b7280;font-size:14px;margin-top:6px">${caption}</div>`);
    }
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-1 flex items-center flex-wrap gap-1">
      <div className="flex items-center rounded-xl bg-gray-50 px-1">
        <Btn title="Жирный" onClick={run('bold')}><b>B</b></Btn>
        <Btn title="Курсив" onClick={run('italic')}><i>I</i></Btn>
        <Btn title="Подчеркнутый" onClick={run('underline')}><u>U</u></Btn>
        <Btn title="Зачеркнутый" onClick={run('strikeThrough')}><s>S</s></Btn>
      </div>

      <div className="flex items-center rounded-xl bg-gray-50 px-1">
        <Btn title="Абзац" onClick={block('p')}>P</Btn>
        <Btn title="H1" onClick={block('h1')}>H1</Btn>
        <Btn title="H2" onClick={block('h2')}>H2</Btn>
        <Btn title="H3" onClick={block('h3')}>H3</Btn>
        <Btn title="Цитата" onClick={addQuote}>❝</Btn>
        <Btn title="Код" onClick={addCode}>{'</>'}</Btn>
      </div>

      <div className="flex items-center rounded-xl bg-gray-50 px-1">
        <Btn title="Список" onClick={run('insertUnorderedList')}>• List</Btn>
        <Btn title="Нумерованный" onClick={run('insertOrderedList')}>1. List</Btn>
      </div>

      <div className="flex items-center rounded-xl bg-gray-50 px-1">
        <Btn title="Выровнять слева" onClick={run('justifyLeft')}>⟸</Btn>
        <Btn title="По центру" onClick={run('justifyCenter')}>⇔</Btn>
        <Btn title="Выровнять справа" onClick={run('justifyRight')}>⟹</Btn>
      </div>

      <div className="flex items-center rounded-xl bg-gray-50 px-1">
        <Btn title="Ссылка" onClick={()=>{
          const url = prompt('Вставьте ссылку (https://...)'); if(!url) return;
          onCmd?.('createLink', url);
          onInsertHtml?.(`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
        }}>🔗</Btn>
        <Btn title="Изображение + подпись" onClick={addCaptionedImage}>🖼️+</Btn>
        <Btn title="Видео (файл)" onClick={onPickVideo}>🎬</Btn>
        <Btn title="Вставить embed" onClick={onEmbed}>⤴︎</Btn>
      </div>

      <div className="ml-auto flex items-center rounded-xl bg-gray-50 px-1">
        <Btn title="Отменить" onClick={run('undo')}>↶</Btn>
        <Btn title="Повторить" onClick={run('redo')}>↷</Btn>
        <Btn title="Очистить форматирование" onClick={run('removeFormat')}>⌫</Btn>
      </div>
    </div>
  );
}
