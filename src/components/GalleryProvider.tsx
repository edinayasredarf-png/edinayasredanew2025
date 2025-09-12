'use client';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type GalleryItem = { src: string; alt?: string };

type GalleryCtx = {
  items: GalleryItem[];
  isOpen: boolean;
  index: number;
  open: (idx: number) => void;
  close: () => void;
  next: () => void;
  prev: () => void;
  register: (item: GalleryItem) => number; // возвращает индекс
  unregister: (src: string) => void;
};

const Ctx = createContext<GalleryCtx | null>(null);

export const GalleryProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const register = useCallback((item: GalleryItem) => {
    // если уже есть — вернуть существующий индекс
    const exist = items.findIndex((x) => x.src === item.src);
    if (exist !== -1) return exist;
    setItems((prev) => [...prev, item]);
    return items.length;
  }, [items]);

  const unregister = useCallback((src: string) => {
    setItems((prev) => prev.filter((x) => x.src !== src));
  }, []);

  const open = useCallback((idx: number) => {
    setIndex(idx);
    setIsOpen(true);
    // блокируем прокрутку body
    if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  }, []);

  const next = useCallback(() => {
    setIndex((i) => (items.length ? (i + 1) % items.length : 0));
  }, [items.length]);

  const prev = useCallback(() => {
    setIndex((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
  }, [items.length]);

  const value = useMemo(() => ({ items, isOpen, index, open, close, next, prev, register, unregister }), [
    items, isOpen, index, open, close, next, prev, register, unregister
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useGallery = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGallery must be used within <GalleryProvider>');
  return ctx;
};
