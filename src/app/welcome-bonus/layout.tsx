import type { Metadata } from 'next';
export const metadata: Metadata = { title: { absolute: 'Приветственный бонус — Единая среда' }, description: 'Стартовый бонус для новых клиентов «Единой среды»: условия запуска, обучения и подключения платформы.', alternates: { canonical: '/welcome-bonus' } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
