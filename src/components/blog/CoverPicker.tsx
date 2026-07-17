'use client';
import React, { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import nextDynamic from 'next/dynamic';
import { uploadEditorImage } from '@/lib/imageUpload';

// Редактор грузим динамически — тяжёлый и только для браузера.
const ImageEditorModal = nextDynamic(() => import('./ImageEditorModal'), {
  ssr: false,
});

export default function CoverPicker({ value, onChange }: { value?: string; onChange: (v?: string)=>void; }) {
  // Источник для редактора: blob-URL свежего файла или URL текущей обложки.
  const [editorSrc, setEditorSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  // blob-URL надо освободить после закрытия редактора
  const objectUrlRef = useRef<string | null>(null);

  const revokeObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  // Выбор файла → сразу открываем редактор (не загружаем оригинал впустую).
  const pick = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = () => {
      const f = input.files?.[0]; if (!f) return;
      revokeObjectUrl();
      const url = URL.createObjectURL(f);
      objectUrlRef.current = url;
      setError('');
      setEditorSrc(url);
    };
    input.click();
  };

  // Редактировать уже выбранную обложку.
  const editCurrent = () => {
    if (!value) return;
    setError('');
    setEditorSrc(value);
  };

  const closeEditor = useCallback(() => {
    setEditorSrc(null);
    revokeObjectUrl();
  }, []);

  // Из редактора пришёл отредактированный файл → загружаем и ставим обложкой.
  const handleEdited = useCallback(async (file: File) => {
    closeEditor();
    setUploading(true);
    setError('');
    try {
      const url = await uploadEditorImage(file);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить обложку');
    } finally {
      setUploading(false);
    }
  }, [closeEditor, onChange]);

  const btn = 'px-4 py-2 rounded-xl text-white font-medium';

  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-white border border-[#e8eaed] flex items-center justify-center">
      {value ? <Image src={value} alt="cover" fill className="object-contain" sizes="100vw"/> : (
        <div className="text-center px-6">
          <div className="text-[#111] font-medium">Обложка</div>
          <div className="text-sm text-[#52555a] mt-1">PNG/JPG/WebP · можно обрезать и добавить текст</div>
        </div>
      )}

      {uploading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#029cda]" />
        </div>
      )}

      {error && (
        <div className="absolute top-3 left-3 right-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-3 py-1.5 z-10">
          {error}
        </div>
      )}

      <div className="absolute bottom-3 right-3 flex flex-wrap gap-2 font-[Raleway]">
        <button onClick={pick} className={`${btn} bg-[#313131] hover:bg-[#313131]/90`}>Выбрать</button>
        {value && (
          <button onClick={editCurrent} className={`${btn} bg-[#029cda] hover:bg-[#0280b5]`}>Редактировать</button>
        )}
        <button
          onClick={() => {
            const url = prompt('Вставьте ссылку на изображение (например https://media.единаясреда.рф/media/blog/cover.jpg)');
            if (!url) return;
            onChange(url);
          }}
          className={`${btn} bg-[#313131] hover:bg-[#313131]/90`}
        >Вставить ссылку</button>
        {value && <button onClick={()=>onChange(undefined)} className={`${btn} bg-[#F11212] hover:bg-[#F11212]/90`}>Удалить</button>}
      </div>

      {editorSrc && (
        <ImageEditorModal
          source={editorSrc}
          saveName="cover"
          onSave={handleEdited}
          onClose={closeEditor}
        />
      )}
    </div>
  );
}
