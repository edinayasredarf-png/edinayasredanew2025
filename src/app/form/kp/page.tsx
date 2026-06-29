import type { Metadata } from 'next';
import FormPageShell from '@/components/forms/FormPageShell';

export const metadata: Metadata = {
  title: 'Запросить КП — Единая среда',
  description: 'Оставьте контактные данные — мы подготовим индивидуальное коммерческое предложение по платформе «Единая среда».',
  alternates: { canonical: '/form/kp' },
  robots: { index: false },
};

export default function KpFormPage() {
  return (
    <FormPageShell
      title="Запросить КП"
      description="Оставьте ваши контактные данные — мы подготовим индивидуальное коммерческое предложение и свяжемся с вами для уточнения деталей."
      b24Form="inline/101/5ywm2s"
      b24Loader={101}
      containerId="b24-kp-page-form"
    />
  );
}
