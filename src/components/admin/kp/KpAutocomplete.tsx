'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Item {
  title: string;
  position?: string;
}

/**
 * Поле ввода с автоподстановкой из Bitrix24 (компании/контакты). Работает как
 * обычный input: если Bitrix недоступен — просто нет подсказок.
 */
export default function KpAutocomplete({
  value, onChange, type, onPick, placeholder, className,
}: {
  value: string;
  onChange: (v: string) => void;
  type: 'company' | 'contact';
  onPick: (item: Item) => void;
  placeholder?: string;
  className?: string;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [justPicked, setJustPicked] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (justPicked) { setJustPicked(false); return; }
    const q = value.trim();
    if (q.length < 2) { setItems([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const res = await fetch(`/api/kp/bitrix/search?type=${type}&q=${encodeURIComponent(q)}`, {
          credentials: 'include', signal: ctrl.signal,
        });
        const d = await res.json();
        setItems(d.items || []);
        setOpen((d.items || []).length > 0);
      } catch {
        /* отменили или ошибка — тихо */
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, type]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (it: Item) => {
    setJustPicked(true);
    onPick(it);
    setOpen(false);
    setItems([]);
  };

  return (
    <div ref={boxRef} className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => items.length && setOpen(true)}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
      />
      {loading && <div className="absolute right-3 top-2.5 text-xs text-gray-400">…</div>}
      {open && items.length > 0 && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              onClick={() => pick(it)}
              className="w-full text-left px-3 py-2 hover:bg-[#EAF6FC] text-sm border-b border-gray-50 last:border-0"
            >
              <div className="text-[#313131]">{it.title}</div>
              {it.position && <div className="text-xs text-gray-400">{it.position}</div>}
            </button>
          ))}
          <div className="px-3 py-1 text-[10px] text-gray-300">из Bitrix24</div>
        </div>
      )}
    </div>
  );
}
