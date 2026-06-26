"use client";
import React from 'react';
import Layout from '@/components/Layout';

export default function CoursePage() {
  return (
    <Layout>
      {/* Hero Section */}
			<div className='font-[Raleway] font-medium lining-nums'>

      <section className="page-hero rounded-b-[20px] relative overflow-hidden min-h-[400px]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 relative z-10">
          <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-16">
            <div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20">
              <h1 className="font-involve text-[#313131] text-[clamp(2rem,5.5vw,3.4rem)] leading-[1.14] tracking-[0.6px]">
                Обучение работе в системе
              </h1>
                              <p className="mt-6 md:mt-8 text-[#313131]/70 text-lg md:text-[22.7px] leading-[1.37] max-w-[662px] font-[Inter]">
                Изучите все возможности платформы &quot;Единая среда&quot; и научитесь эффективно работать с системой
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1480px] mx-auto px-5 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Video Player */}
            <div className="lg:col-span-2">
              <h2 className="text-3xl md:text-4xl font-bold text-[#313131] mb-8">
                Видео курс по работе в системе
              </h2>

                                                        {/* VK Video Player */}
              <div className="relative w-full aspect-video rounded-3xl overflow-hidden ">
                <iframe
                  src="https://vkvideo.ru/video_ext.php?oid=-213906731&id=456239068&hd=2&autoplay=1"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock;"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                ></iframe>
              </div>

              {/* Course Description */}
              <div className="mt-8" >
                <h3 className="text-2xl font-bold text-[#313131] mb-4">
                  Описание курса
                </h3>
                <p className="text-lg text-[#7C8A9A] leading-relaxed">
                  Наш обучающий курс поможет вам освоить все функции платформы &quot;Единая среда&quot;.
                  Вы научитесь создавать проекты, работать с документами, управлять данными
                  и эффективно использовать все возможности системы для решения ваших задач.
                </p>
              </div>
            </div>

            {/* Course Info */}
            <div className="lg:col-span-1 ">
                              <div className="bg-[#F6F7F9] rounded-3xl p-8 sticky top-8  bg-white">
                <h3 className="text-2xl font-bold text-[#313131] mb-6">
                  Информация о курсе
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-[#313131] mb-2">Длительность</h4>
                    <p className="text-[#7C8A9A]"> 26 минут</p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-[#313131] mb-2">Уровень</h4>
                    <p className="text-[#7C8A9A]">Начальный</p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-[#313131] mb-2">Формат</h4>
                    <p className="text-[#7C8A9A]">Видео лекции</p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-[#313131] mb-2">Язык</h4>
                    <p className="text-[#7C8A9A]">Русский</p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-[#313131] mb-2">Сертификат</h4>
                    <p className="text-[#7C8A9A]">Выдается по завершении</p>
                  </div>
                </div>




              </div>
            </div>
          </div>
        </div>
      </section>
			</div>

    </Layout>
  );
}