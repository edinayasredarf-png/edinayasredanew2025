"use client";
import ServiceHero from '@/components/services/ServiceHero';
import React from 'react';
import Layout from '../../../../components/Layout';
import DemoIframeSection from "../../../../components/DemoIframeSection";
import TwoColumnTextSection from '../../../../components/services/izn/TwoColumnTextSection';
import GreenDataSection from '../../../../components/services/izn/GreenDataSection';
import TasksSection from '../../../../components/services/izn/TasksSection';
import TargetAudienceSection from '../../../../components/services/izn/TargetAudienceSection';
import ServiceCardsSection from '../../../../components/services/izn/ServiceCardsSection';
import DigitalSystemSection from '../../../../components/services/izn/DigitalSystemSection';
import AdvantagesGridSection from '../../../../components/services/izn/AdvantagesGridSection';
import WorkflowStepsSection from '../../../../components/services/izn/WorkflowStepsSection';
import CTASection from '../../../../components/services/izn/CTASection';
import FAQSection from '../../../../components/services/izn/FAQSection';

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
          title={<>Инвентаризация<br />зеленых насаждений <br /> <span className="text-[#029cda]">в Оренбурге</span></>}
          description={<>Выполняем инвентаризацию зеленых насаждений с созданием цифрового реестра территории. Проводим профессиональную инвентаризацию деревьев и кустарников с геопривязкой, фотофиксацией и подготовкой всей необходимой документации.</>}
          onRequest={handleKP}
          onConsult={handleConsult}
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