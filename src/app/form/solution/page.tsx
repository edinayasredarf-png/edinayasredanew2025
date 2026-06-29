import type { Metadata } from 'next';
import FormPageShell from '@/components/forms/FormPageShell';

export const metadata: Metadata = {
  title: 'Запросить похожее решение — Единая среда',
  description: 'Оставьте заявку — мы подберём подходящее решение на платформе «Единая среда» под ваши задачи.',
  alternates: { canonical: '/form/solution' },
  robots: { index: false },
};

export default function SolutionFormPage() {
  return (
    <FormPageShell
      title="Запросить похожее решение"
      description="Расскажите о вашей задаче — мы подберём подходящее решение и свяжемся с вами для обсуждения деталей."
      b24Form="inline/95/lw93ha"
      b24Loader={95}
      containerId="b24-solution-page-form"
    />
  );
}
