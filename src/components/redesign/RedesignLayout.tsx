'use client';

/**
 * @deprecated Используйте `@/components/Layout` — header/footer подключены глобально.
 */
import Layout from '@/components/Layout';
import type { ReactNode } from 'react';

export function RedesignLayout({ children }: { children: ReactNode }) {
  return <Layout>{children}</Layout>;
}
