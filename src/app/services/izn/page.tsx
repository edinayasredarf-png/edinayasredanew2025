"use client";
import ServiceHero from '@/components/services/ServiceHero';
import React from 'react';
import Layout from '../../../components/Layout';
import DemoIframeSection from "../../../components/DemoIframeSection";
import TwoColumnTextSection from '../../../components/services/izn/TwoColumnTextSection';
import GreenDataSection from '../../../components/services/izn/GreenDataSection';
import TasksSection from '../../../components/services/izn/TasksSection';
import TargetAudienceSection from '../../../components/services/izn/TargetAudienceSection';
import ServiceCardsSection from '../../../components/services/izn/ServiceCardsSection';
import DigitalSystemSection from '../../../components/services/izn/DigitalSystemSection';
import AdvantagesGridSection from '../../../components/services/izn/AdvantagesGridSection';
import WorkflowStepsSection from '../../../components/services/izn/WorkflowStepsSection';
import CTASection from '../../../components/services/izn/CTASection';
import FAQSection from '../../../components/services/izn/FAQSection';
import ServiceLeadDefinition from '../../../components/services/ServiceLeadDefinition';

export default function GreenInventoryPage() {
  const handleKP = () => {
    window.dispatchEvent(new CustomEvent('openKPModal'));
  };

  const handleConsult = () => {
    window.dispatchEvent(new CustomEvent('openConsultModal'));
  };

  return (
    <Layout hideBreadcrumbs>
      <div className="min-h-screen bg-white font-raleway font-medium lining-nums">
  {/* Hero Section */}
	<ServiceHero
          service="izn"
          title={<>Инвентаризация<br />зеленых насаждений</>}
          description={<>Выполняем инвентаризацию зеленых насаждений с созданием цифрового реестра территории. Проводим профессиональную инвентаризацию деревьев и кустарников с геопривязкой, фотофиксацией и подготовкой всей необходимой документации.</>}
          onRequest={handleKP}
          onConsult={handleConsult}
        />


        <ServiceLeadDefinition
          heading="Что такое инвентаризация зелёных насаждений"
          answer="Инвентаризация зелёных насаждений — это учёт всех деревьев, кустарников и газонов на территории с определением их вида, состояния и точных координат. Каждому объекту присваивается цифровой паспорт с фотофиксацией и геопривязкой, а данные сводятся в электронный реестр и карту насаждений. Это основа для планирования ухода, сноса, компенсационных посадок и контроля состояния зелёного фонда города."
          provider="«Единая среда» проводит полевую инвентаризацию и ведёт реестр в модуле ИЗН — в базе платформы уже более 100 млн деревьев. АИС «Единая среда» включена в реестр отечественного ПО Минцифры. Модуль ИЗН работает и отдельно, и в связке с учётом благоустройства, мест захоронений и лесоустройства — в едином реестре города."
          facts={["100 млн+ деревьев в базе", "Цифровой паспорт объекта", "ГИС-карта", "В реестре ПО Минцифры"]}
        />

        <TwoColumnTextSection />

        <GreenDataSection />

        <TasksSection onButtonClick={handleKP} />

        <TargetAudienceSection onButtonClick={handleKP} />

        <ServiceCardsSection />

        <DigitalSystemSection />

        <DemoIframeSection />

        <AdvantagesGridSection />

        <WorkflowStepsSection />

        <CTASection onButtonClick={handleKP} />

        <FAQSection />

      </div>
    </Layout>
  );
}