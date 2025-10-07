'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function TopProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const start = () => {
    setVisible(true);
    setProgress(10);
    timer.current = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + Math.random() * 10 : prev));
    }, 200);
  };

  const done = () => {
    if (timer.current) clearInterval(timer.current);
    setProgress(100);
    setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 200);
  };

  useEffect(() => {
    start();
    const id = setTimeout(done, 350);
    return () => clearTimeout(id);
  }, [pathname, search?.toString()]);

  return (
    <div className={`fixed left-0 top-0 z-[1100] h-0.5 w-full ${visible ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
      <div className="h-full bg-black transition-[width] duration-200" style={{ width: `${progress}%` }} />
    </div>
  );
}
