import { Metadata } from 'next';
import RequisitesPageClient from './RequisitesPageClient';

export const metadata: Metadata = {
  title: 'Реквизиты компании — Единая среда',
  description: 'Реквизиты ООО «Сфера»: ИНН 6150100608, КПП 615001001, ОГРН 1206100037670, юридический адрес, банковские реквизиты и контакты для документооборота.',
  alternates: { canonical: '/requisites' },
  openGraph: {
    title: 'Реквизиты компании — Единая среда',
    description: 'ООО «Сфера»: ИНН 6150100608, ОГРН 1206100037670. Юридический адрес, банковские реквизиты, контакты директора.',
    url: 'https://xn--80aakbcct4b2aj7m.xn--p1ai/requisites',
  },
};

export default function RequisitesPage() {
  return <RequisitesPageClient />;
}
