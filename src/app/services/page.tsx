import { Metadata } from 'next';
import ServicesPageClient from './ServicesPageClient';

export const metadata: Metadata = {
  title: 'Услуги — инвентаризация и управление территориями',
  description: 'Профессиональная инвентаризация зелёных насаждений, мест захоронений и лесоустройство. Цифровые реестры, ГИС-карты, контроль подрядчиков. Работаем в 40+ регионах России.',
  alternates: { canonical: '/services' },
  openGraph: {
    title: 'Услуги — инвентаризация и управление территориями | Единая среда',
    description: 'Профессиональная инвентаризация зелёных насаждений, мест захоронений и лесоустройство для муниципалитетов.',
    url: 'https://единаясреда.рф/services',
  },
};

export default function ServicesPage() {
  return <ServicesPageClient />;
}
