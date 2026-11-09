"use client";
import ServiceHero from '@/components/services/ServiceHero';
import React from 'react';
import Layout from '../../../../components/Layout';
import LesInfoSection from '../../../../components/services/les/LesInfoSection';
import LesAudienceSection from '../../../../components/services/les/LesAudienceSection';
import LesTasksSection from '../../../../components/services/les/LesTasksSection';
import LesWorkflowSection from '../../../../components/services/les/LesWorkflowSection';
import LesAdvantagesSection from '../../../../components/services/les/LesAdvantagesSection';
import LesCTASection from '../../../../components/services/les/LesCTASection';
import LesFAQSection from '../../../../components/services/les/LesFAQSection';

export default function ForestManagementCityPage() {
  const handleKP = () => { window.dispatchEvent(new CustomEvent('openKPModal')); };
  const handleConsult = () => { window.dispatchEvent(new CustomEvent('openConsultModal')); };

  return (
    <Layout hideBreadcrumbs>
      <div className="min-h-screen bg-white font-raleway font-medium lining-nums">
        <ServiceHero
          service="les"
          title={<>Лесоустройство<br /><span className="text-[#029cda]">в Новороссийске</span></>}
          description={<>Комплекс работ по организации лесного фонда, описанию, учету и изучению лесов, разработке проектов ведения лесного хозяйства на перспективный период</>}
          onRequest={handleKP}
          onConsult={handleConsult}
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
