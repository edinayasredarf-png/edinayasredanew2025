'use client';
import React from 'react';
import { fileToDataURL } from '@/lib/blogStore';

export default function CoverPicker({ value, onChange }: { value?: string; onChange: (v?: string)=>void; }) {
  const pick = async () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async () => {
      const f = input.files?.[0]; if (!f) return;
      const data = await fileToDataURL(f);
      onChange(data);
    };
    input.click();
  };
  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#F6F7F9] border flex items-center justify-center">
      {value ? <img src={value} alt="cover" className="w-full h-full object-contain"/> : (
        <div className="text-center px-6">
          <div className="text-[#111] font-medium">Обложка</div>
          <div className="text-sm text-[#52555a] mt-1">PNG/JPG/WebP</div>
        </div>
      )}
      <div className="absolute bottom-3 right-3 flex gap-2">
        <button onClick={pick} className="px-4 py-2 rounded-xl bg-white border hover:bg-gray-50">Выбрать</button>
        {value && <button onClick={()=>onChange(undefined)} className="px-4 py-2 rounded-xl bg-white border hover:bg-gray-50">Удалить</button>}
      </div>
    </div>
  );
}
