"use client";
import ServiceHero from '@/components/services/ServiceHero';
import Layout from '../../../components/Layout';
import React from 'react';
import LesInfoSection from '../../../components/services/les/LesInfoSection';
import LesAudienceSection from '../../../components/services/les/LesAudienceSection';
import LesTasksSection from '../../../components/services/les/LesTasksSection';
import LesWorkflowSection from '../../../components/services/les/LesWorkflowSection';
import LesAdvantagesSection from '../../../components/services/les/LesAdvantagesSection';
import LesCTASection from '../../../components/services/les/LesCTASection';
import LesFAQSection from '../../../components/services/les/LesFAQSection';
import ServiceLeadDefinition from '../../../components/services/ServiceLeadDefinition';

export default function ForestManagementPage() {
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
          service="les"
          title={<>Лесоустройство</>}
          description={<>Комплекс работ по организации лесного фонда, описанию, учету и изучению лесов, разработке проектов ведения лесного хозяйства на перспективный период</>}
          onRequest={handleKP}
          onConsult={handleConsult}
        />

        <ServiceLeadDefinition
          heading="Что такое лесоустройство"
          answer="Лесоустройство — это комплекс работ по обследованию, учёту и проектированию использования лесов: таксация насаждений с определением их состава, возраста и запаса древесины, картографирование участков и подготовка лесоустроительной документации. Результат — актуальные материалы лесоустройства и цифровые лесные карты, на основе которых планируют рубки, охрану, защиту и воспроизводство леса на ближайшие 10 лет."
          provider="«Единая среда» выполняет полевые обследования, таксацию и оцифровку материалов лесоустройства и передаёт готовые цифровые карты и документацию. Работы ведутся по требованиям лесоустроительной инструкции. Лесные данные можно вести отдельно или вместе с другими городскими объектами в единой системе."
          facts={["Таксация и дешифрирование", "Цифровые лесные карты", "Проект на 10 лет", "40+ регионов"]}
        />

        <LesInfoSection />
        <LesAudienceSection onButtonClick={handleKP} />
        <LesTasksSection onButtonClick={handleKP} />
        <LesWorkflowSection onButtonClick={handleConsult} />
        <LesAdvantagesSection />
        <LesCTASection onButtonClick={handleKP} />
        <LesFAQSection />
      </div>
    </Layout>
  );
}
