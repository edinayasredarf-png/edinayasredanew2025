import type { Metadata } from 'next';
import FormPageShell from '@/components/forms/FormPageShell';

export const metadata: Metadata = {
  title: 'Демо-доступ — Единая среда',
  description: 'Получите бесплатный демо-доступ к платформе «Единая среда», чтобы ознакомиться с её возможностями и интерфейсом.',
  alternates: { canonical: '/form/demo' },
  robots: { index: false },
};

export default function DemoFormPage() {
  return (
    <FormPageShell
      title="Демо-доступ"
      description="Получите бесплатный демо-доступ к платформе, чтобы ознакомиться с её возможностями и интерфейсом."
      b24Form="inline/99/q3wj75"
      b24Loader={99}
      containerId="b24-demo-page-form"
    />
  );
}
