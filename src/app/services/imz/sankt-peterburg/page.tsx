"use client";

import Layout from "../../../../components/Layout";
import Image from "next/image";
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
    <Layout>
      <div className="font-raleway font-medium lining-nums">

        {/* HERO */}
        <section className="page-hero rounded-b-[20px] relative overflow-hidden min-h-[400px]">
          <div className="rd-content-column py-10 md:py-20 relative z-10">
            <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-16">

              {/* Текст */}
              <div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20">
                <h1 className="text-4xl sm:text-5xl md:text-[68px] font-medium leading-tight">
                  Инвентаризация<br /> мест захоронений<br />  <span className="text-[#029cda]">в Санкт-Петербурге</span>
                </h1>

                <p className="mt-8 text-xl sm:text-[22px] text-gray-300 max-w-2xl">
                  Выполняем инвентаризацию кладбищ и инвентаризацию мест
                  захоронений в Санкт-Петербурге с созданием электронной карты, реестра захоронений и удобного
                  поиска для муниципалитетов, операторов кладбищ и граждан.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleKP}
                    className="inline-flex items-center justify-center bg-[#029cda] text-white font-medium text-xl px-16 py-5 rounded-2xl hover:bg-[#029cda]/90 transition"
                  >
                    Получить КП
                  </button>

                  <button
                    onClick={handleConsult}
                    className="inline-flex items-center justify-center border border-white text-white font-medium text-xl px-16 py-5 rounded-2xl hover:bg-white/10 transition"
                  >
                    Получить консультацию
                  </button>
                </div>
              </div>

              {/* Изображение */}
              <div className="hidden lg:block absolute right-0 bottom-0 w-[40%] max-w-[500px]">
                <Image
                  src="/img/cemetery1.png"
                  alt="Инвентаризация и оцифровка кладбищ"
                  width={500}
                  height={400}
                  className="w-full object-contain"
                />
              </div>

            </div>
          </div>
        </section>

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