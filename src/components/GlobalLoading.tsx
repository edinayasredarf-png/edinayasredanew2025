'use client';
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type Ctx = {
  busy: boolean;
  show: () => void;
  hide: () => void;
  within: <T>(p: Promise<T>) => Promise<T>;
};

const LoadingCtx = createContext<Ctx | null>(null);

export function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
  const [busy, setBusy] = useState(false);
  const pending = useRef(0);

  const show = useCallback(() => {
    pending.current += 1;
    setBusy(true);
  }, []);

  const hide = useCallback(() => {
    pending.current = Math.max(0, pending.current - 1);
    if (pending.current === 0) setBusy(false);
  }, []);

  const within = useCallback(async <T,>(p: Promise<T>) => {
    show();
    try { return await p; }
    finally { hide(); }
  }, [show, hide]);

  const value = useMemo(() => ({ busy, show, hide, within }), [busy, show, hide, within]);

  return (
    <LoadingCtx.Provider value={value}>
      {children}
      <FullscreenLoader visible={busy} />
    </LoadingCtx.Provider>
  );
}

export function useGlobalLoading() {
  const ctx = useContext(LoadingCtx);
  if (!ctx) throw new Error('useGlobalLoading must be used within <GlobalLoadingProvider>');
  return ctx;
}

function FullscreenLoader({ visible }: { visible: boolean }) {
  return (
    <div
      aria-live="polite"
      aria-busy={visible}
      className={`fixed inset-0 z-[1000] grid place-items-center bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="relative h-14 w-14" role="status" aria-label="Загрузка">
        <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
        <div className="absolute inset-0 rounded-full border-4 border-white border-t-transparent motion-safe:animate-spin" />
      </div>
    </div>
  );
}
