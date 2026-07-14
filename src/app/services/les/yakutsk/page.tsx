"use client";
import React from 'react';
import Image from "next/image";
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
    <Layout>
      <div className="min-h-screen bg-white font-raleway font-medium lining-nums">
        <section className="page-hero rounded-b-[20px] relative overflow-hidden min-h-[400px]">
          <div className="rd-content-column py-10 md:py-20 relative z-10">
            <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-16">
              <div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20">
                <h1 className="text-[clamp(2rem,5.5vw,3.4rem)] leading-[1.14] tracking-[0.6px] font-involve font-medium">
                  Лесоустройство<br /><span className="text-[#029cda]">в Якутске</span>
                </h1>
                <p className="mt-8 text-lg md:text-[22.7px] leading-[1.37] text-gray-300 max-w-2xl font-raleway">
                  Комплекс работ по организации лесного фонда, описанию, учету и изучению лесов, разработке проектов ведения лесного хозяйства на перспективный период
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <button onClick={handleKP} className="inline-flex items-center justify-center bg-[#029cda] text-white font-medium px-6 py-4 md:px-8 md:py-5 text-lg md:text-2xl rounded-xl hover:bg-[#029cda]/90 transition-colors duration-200 focus:outline-none">Получить расчет</button>
                  <button onClick={handleConsult} className="inline-block text-white border border-white font-medium px-6 py-4 md:px-8 md:py-5 text-lg md:text-2xl rounded-xl hover:bg-[#F6F7F9]/10 transition-colors">Бесплатная консультация</button>
                </div>
              </div>
              <div className="flex-1 w-full h-full relative flex justify-center items-end lg:hidden z-10">
                <Image src="/img/les.png" alt="Лесоустройство" width={500} height={400} className="w-full max-w-[400px] object-contain" style={{ height: 'auto' }} />
              </div>
            </div>
            <div className="hidden lg:block absolute right-0 bottom-0 z-10 w-[40%] max-w-[400px] h-auto pointer-events-none">
              <Image src="/img/les.png" alt="Лесоустройство" width={500} height={400} className="w-full object-contain" style={{ height: 'auto' }} />
            </div>
          </div>
        </section>
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
