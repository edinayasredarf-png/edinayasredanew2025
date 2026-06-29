import type { Metadata } from 'next';
import FormPageShell from '@/components/forms/FormPageShell';

export const metadata: Metadata = {
  title: 'Получить консультацию — Единая среда',
  description: 'Оставьте заявку на консультацию по платформе «Единая среда». Наши специалисты свяжутся с вами в ближайшее время.',
  alternates: { canonical: '/form/consult' },
  robots: { index: false },
};

export default function ConsultFormPage() {
  return (
    <FormPageShell
      title="Получить консультацию"
      description="Оставьте ваши контактные данные — наш специалист свяжется с вами и ответит на все вопросы."
      b24Form="inline/95/lw93ha"
      b24Loader={95}
      containerId="b24-consult-page-form"
      showMessengers
    />
  );
}
