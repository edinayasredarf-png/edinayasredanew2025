"use client";
import ServiceHero from '@/components/services/ServiceHero';

import Layout from "../../../../components/Layout";
import DemoIframeSection from "../../../../components/DemoIframeSection";

// Секции
import AudienceSection from "../../../../components/services/imz/AudienceSection";
import TasksSection from "../../../../components/services/imz/TasksSection";
import AdvantagesSection from "../../../../components/services/imz/AdvantagesSection";
import ProcessSection from "../../../../components/services/imz/ProcessSection";
import ComplianceSection from "../../../../components/services/imz/ComplianceSection";
import ResultsSection from "../../../../components/services/imz/ResultsSection";
import ConsultationCTA from "../../../../components/services/imz/ConsultationCTA";
import FAQSection from "../../../../components/services/imz/FAQSection";

export default function InventoryBurialsPage() {
  const handleKP = () =>
    window.dispatchEvent(new CustomEvent("openKPModal"));

  const handleConsult = () =>
    window.dispatchEvent(new CustomEvent("openConsultModal"));

  return (
    <Layout hideBreadcrumbs>
      <div className="font-raleway font-medium lining-nums">

        {/* HERO */}
        <ServiceHero
          service="imz"
          title={<>Инвентаризация<br /> мест захоронений<br />  <span className="text-[#029cda]">в Туле</span></>}
          description={<>Выполняем инвентаризацию кладбищ и инвентаризацию мест
                  захоронений в Туле с созданием электронной карты, реестра захоронений и удобного
                  поиска для муниципалитетов, операторов кладбищ и граждан.</>}
          onRequest={handleKP}
          onConsult={handleConsult}
        />

        {/* Остальные секции */}
        <AudienceSection />
        <TasksSection />
        <AdvantagesSection onKP={handleKP} />
        <ProcessSection onConsult={handleConsult} />
        <ComplianceSection />
        <ResultsSection onConsult={handleConsult} />
        <DemoIframeSection />
        <ConsultationCTA onKP={handleKP} />
        <FAQSection />
      </div>
    </Layout>
  );
}