import type { Metadata } from 'next';
export const metadata: Metadata = { title: { absolute: 'Документы — Единая среда' }, description: 'Реквизиты, сведения о регистрации ПО, лицензия, пользовательские инструкции и политики обработки данных.', alternates: { canonical: '/documents' } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
