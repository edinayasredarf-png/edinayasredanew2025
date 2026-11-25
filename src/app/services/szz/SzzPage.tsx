'use client';
import Image from 'next/image';
import Layout from '@/components/Layout';
import FAQ from '@/components/FAQ';
import ServiceHero from '@/components/services/ServiceHero';
import ServiceContentSection from '@/components/services/ServiceContentSection';
import LesCTASection from '@/components/services/les/LesCTASection';
import DeliverablesSection from '@/components/services/szz/DeliverablesSection';
import { audience, tasks, scope, steps, advantages, faq } from '@/components/services/szz/content';

export default function SzzPage() {
  const request = () => window.dispatchEvent(new CustomEvent('openKPModal'));
  const consult = () => window.dispatchEvent(new CustomEvent('openConsultModal'));
  return <Layout hideBreadcrumbs><div className="min-h-screen bg-white font-raleway font-medium lining-nums">
    <ServiceHero service="szz" title="Разработка и установление санитарно-защитных зон" description="От обследования объекта и проекта СЗЗ до сопровождения экспертизы и установления границ. Организуем необходимые исследования, подготовим координатное описание и перенесём результат в цифровой реестр «Единая среда»." onRequest={request} onConsult={consult} />
    <section className="max-w-[820px] mx-auto px-4 py-12 md:py-20 text-[#313131]">
      <h2 className="text-3xl md:text-4xl leading-tight mb-6">Что такое санитарно-защитная зона</h2>
      <div className="text-lg leading-relaxed space-y-6"><p>Санитарно-защитная зона — территория с особым режимом использования вокруг объекта, который влияет на среду обитания и здоровье человека. Её границы обосновывают по характеристикам источников воздействия, расчётам и необходимым исследованиям.</p><p>Разработка проекта — часть полного цикла. Мы связываем исходные данные, лабораторные работы, описание границ и сопровождение рассмотрения в один процесс. Работаем с кладбищами, муниципальными и производственными объектами; состав работ определяем после диагностики.</p></div>
    </section>
    <ServiceContentSection title="Кому необходима разработка СЗЗ" cards={audience} columns={2} onRequest={request} />
    <ServiceContentSection title="Какие задачи решает установление СЗЗ" cards={tasks} outlined />
    <ServiceContentSection title="Что входит в услугу" subtitle="Состав проекта, расчётов и исследований определяем по особенностям объекта и согласовываем до начала работ." cards={scope} />
    <section className="max-w-[1200px] mx-auto px-4 py-12 md:py-20">
      <div className="grid lg:grid-cols-2 gap-3 bg-[#F6F7F9] rounded-3xl p-2">
        <div className="bg-white rounded-2xl min-h-[260px] flex items-center justify-center p-8"><Image src="/img/services/izn/3.png" alt="Учёт территории и окружающих объектов" width={240} height={240} /></div>
        <div className="p-6 md:p-9 text-[#313131]"><h2 className="text-3xl md:text-4xl leading-tight">Отдельное внимание — СЗЗ кладбищ</h2><p className="text-lg text-[#7c8a9a] leading-relaxed mt-6">Учитываем статус кладбища, фактические границы, окружающую застройку и чувствительные территории. Проверяем ранее подготовленные материалы и определяем необходимые исследования, в том числе почв и подземных вод — по условиям объекта.</p><p className="text-lg text-[#7c8a9a] leading-relaxed mt-4">Если инвентаризация уже выполнена в «Единой среде», используем связанные данные об объекте и дополняем их границами СЗЗ и документами.</p><button type="button" onClick={consult} className="mt-6 text-[#029cda] text-lg underline underline-offset-4">Обсудить объект</button></div>
      </div>
    </section>
    <ServiceContentSection title="Как проходит работа" subtitle="Понятный маршрут от исходных данных до передачи результатов. Этапы могут частично выполняться параллельно." cards={steps} />
    <DeliverablesSection />
    <section className="max-w-[1200px] mx-auto px-4 py-12 md:py-20">
      <h2 className="text-center text-[#313131] text-3xl md:text-[48px] leading-tight">СЗЗ в цифровой системе управления территорией</h2>
      <div className="grid md:grid-cols-3 gap-3 mt-12">
        <div className="bg-[#F6F7F9] rounded-3xl p-7"><h3 className="text-2xl text-[#313131]">Границы на карте</h3><p className="text-lg text-[#7c8a9a] leading-relaxed mt-4">Контур объекта и санитарно-защитной зоны рядом с данными инвентаризации, участками и другими слоями территории.</p></div>
        <div className="border-[6px] border-[#F6F7F9] rounded-3xl flex justify-center items-center p-7"><Image src="/img/services/izn/7.png" alt="Цифровая карта и реестр документов" width={260} height={220} /></div>
        <div className="bg-[#F6F7F9] rounded-3xl p-7"><h3 className="text-2xl text-[#313131]">Документы у объекта</h3><p className="text-lg text-[#7c8a9a] leading-relaxed mt-4">Проект, протоколы и полученные заключения связаны с карточкой объекта. Состав цифрового реестра согласовываем с заказчиком.</p></div>
      </div>
    </section>
    <ServiceContentSection title="Почему выбирают «Единую среду»" cards={advantages} columns={4} />
    <LesCTASection onButtonClick={request} title="Рассчитаем стоимость разработки СЗЗ для вашего объекта" description="Стоимость зависит от типа и статуса объекта, источников воздействия, готовности исходных данных, программы исследований и объёма сопровождения. Оставьте заявку — уточним задачу и подготовим состав работ, график и индивидуальный расчёт." imageAlt="Индивидуальный расчёт стоимости проекта СЗЗ" />
    <FAQ items={faq} title="Часто задаваемые вопросы" showContactCard onContactClick={consult} />
  </div></Layout>;
}
