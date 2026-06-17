'use client';
import React from 'react';
import Image from 'next/image';
import { uploadEditorImage } from '@/lib/imageUpload';

export default function CoverPicker({ value, onChange }: { value?: string; onChange: (v?: string)=>void; }) {
  const pick = async () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async () => {
      const f = input.files?.[0]; if (!f) return;
      const url = await uploadEditorImage(f);
      onChange(url);
    };
    input.click();
  };
  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#F6F7F9] border flex items-center justify-center">
      {value ? <Image src={value} alt="cover" fill className="object-contain" sizes="100vw"/> : (
        <div className="text-center px-6">
          <div className="text-[#111] font-medium">Обложка</div>
          <div className="text-sm text-[#52555a] mt-1">PNG/JPG/WebP</div>
        </div>
      )}
      <div className="absolute bottom-3 right-3 flex gap-2 font-raleway">
        <button onClick={pick} className="px-4 py-2 rounded-xl bg-[#313131] text-white font-medium  hover:bg-[#313131]/90">Выбрать</button>
        <button
          onClick={() => {
            const url = prompt('Вставьте ссылку на изображение (например https://media.единаясреда.рф/media/blog/cover.jpg)');
            if (!url) return;
            onChange(url);
          }}
          className="px-4 py-2 rounded-xl bg-[#313131] text-white font-medium  hover:bg-[#313131]/90"
        >Вставить ссылку</button>
        {value && <button onClick={()=>onChange(undefined)} className="px-4 py-2 rounded-xl bg-[#F11212] text-white font-medium  hover:bg-[#F11212]/90">Удалить</button>}
      </div>
    </div>
  );
}
