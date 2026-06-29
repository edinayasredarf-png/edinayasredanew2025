import type { Metadata } from 'next';
import FormPageShell from '@/components/forms/FormPageShell';

export const metadata: Metadata = {
  title: 'Заявка на сотрудничество — Единая среда',
  description: 'Оставьте заявку на партнёрство с компанией «Единая среда». Развивайте бизнес вместе с нами.',
  alternates: { canonical: '/form/partnership' },
  robots: { index: false },
};

export default function PartnershipFormPage() {
  return (
    <FormPageShell
      title="Заявка на сотрудничество"
      description="Оставьте ваши контактные данные — мы расскажем об условиях партнёрства и ответим на все вопросы."
      b24Form="inline/95/lw93ha"
      b24Loader={95}
      containerId="b24-partnership-page-form"
    />
  );
}
