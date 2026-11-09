"use client";
import ServiceHero from '@/components/services/ServiceHero';

import Layout from "../../../components/Layout";
import DemoIframeSection from "../../../components/DemoIframeSection";

// Секции
import AudienceSection from "../../../components/services/imz/AudienceSection";
import TasksSection from "../../../components/services/imz/TasksSection";
import AdvantagesSection from "../../../components/services/imz/AdvantagesSection";
import ProcessSection from "../../../components/services/imz/ProcessSection";
import ComplianceSection from "../../../components/services/imz/ComplianceSection";
import ResultsSection from "../../../components/services/imz/ResultsSection";
import ConsultationCTA from "../../../components/services/imz/ConsultationCTA";
import FAQSection from "../../../components/services/imz/FAQSection";
import ServiceLeadDefinition from "../../../components/services/ServiceLeadDefinition";

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
          title={<>Инвентаризация<br /> мест захоронений</>}
          description={<>Выполняем инвентаризацию кладбищ и инвентаризацию мест
                  захоронений с созданием электронной карты, реестра захоронений и удобного
                  поиска для муниципалитетов, операторов кладбищ и граждан.</>}
          onRequest={handleKP}
          onConsult={handleConsult}
        />

        <ServiceLeadDefinition
          heading="Что такое инвентаризация мест захоронений"
          answer="Инвентаризация мест захоронений — это сплошной учёт и оцифровка всех захоронений и участков на кладбище: полевое обследование с геопривязкой каждой могилы, фотофиксация, сверка с архивными книгами и сведение данных в единый электронный реестр и карту кладбища с поиском по фамилии. По итогам муниципалитет получает актуальную картину занятых и свободных участков, данные об ответственных лицах и состоянии территории."
          provider="«Единая среда» выполняет полный цикл — от полевых работ и оцифровки архивов до передачи готового реестра и ГИС-карты. Модуль ИМЗ входит в АИС «Единая среда»: платформа включена в реестр отечественного ПО Минцифры, по ней реализовано более 500 проектов в 40+ регионах России с 2011 года. Начать можно только с кладбищ и позже добавить другие типы городских объектов в единый реестр — вплоть до цифрового двойника города."
          facts={["В реестре ПО Минцифры", "500+ проектов", "40+ регионов", "Поиск по фамилии"]}
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