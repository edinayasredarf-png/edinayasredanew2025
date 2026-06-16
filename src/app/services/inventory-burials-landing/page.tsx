"use client";

import Layout from "../../../components/Layout";
import InterfaceSlider from "../../../components/InterfaceSlider";

export default function InventoryBurialsLandingPage() {
  const handleKP = () => {
    window.dispatchEvent(new CustomEvent("openKPModal"));
  };

  const handleConsult = () => {
    window.dispatchEvent(new CustomEvent("openConsultModal"));
  };

  return (
    <Layout>
      <div className="font-raleway font-medium lining-nums">
        {/* Hero c правой колонкой преимуществ */}
        <section className="page-hero rounded-b-[20px]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-10 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-medium leading-tight">
                Инвентаризация кладбищ и мест захоронений «под ключ»
              </h1>
              <p className="mt-5 text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl">
                Цифровая инвентаризация кладбищ,{" "}
                <strong>оцифровка мест захоронений</strong> и создание
                геоинформационной карты с поиском захоронений по фамилии на базе
                АИС «Единая среда».
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleKP}
                  className="inline-flex items-center justify-center bg-[#029cda] text-white text-sm md:text-base lg:text-lg font-medium px-6 py-4 md:px-8 md:py-5 rounded-xl hover:bg-[#029cda]/90 transition-colors duration-200 focus:outline-none"
                >
                  Получить КП на инвентаризацию
                </button>
                <button
                  onClick={handleConsult}
                  className="inline-flex items-center justify-center bg-white text-[#029cda] border border-[#029cda] text-sm md:text-base lg:text-lg font-medium px-6 py-4 md:px-8 md:py-5 rounded-xl hover:bg-[#029cda]/10 transition-colors duration-200 focus:outline-none"
                >
                  Обсудить проект инвентаризации
                </button>
              </div>
              <p className="mt-4 text-xs sm:text-sm text-gray-400 max-w-xl">
                Подходит для органов местного самоуправления, муниципальных
                предприятий, операторов кладбищ и подрядчиков по{" "}
                <strong>инвентаризации мест захоронений</strong>.
              </p>
            </div>
            <div className="bg-white/5 rounded-3xl p-6 md:p-8 space-y-5">
              <h2 className="text-lg md:text-xl font-semibold text-white">
                Почему выбирают нашу систему инвентаризации кладбищ
              </h2>
              <ul className="space-y-4 text-sm md:text-base text-gray-100">
                <li>
                  • Отечественная{" "}
                  <strong>геоинформационная система кладбищ</strong> с
                  электронной картой и реестром мест захоронений.
                </li>
                <li>
                  • Полный цикл работ:{" "}
                  <strong>инвентаризация мест погребения</strong>, оцифровка
                  архивов и внедрение системы.
                </li>
                <li>
                  • Подготовка к интеграции с государственной и региональными
                  платформами учета захоронений.
                </li>
                <li>
                  • Возможность <strong>поиска захоронений по фамилии</strong> и
                  публикации электронной карты кладбищ для граждан.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Линейка этапов (timeline) */}
        <section className="py-14 md:py-20 bg-[#F5F7FA]">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl text-[#313131] font-medium mb-4">
              Этапы инвентаризации кладбищ
            </h2>
            <p className="text-gray-700 text-base md:text-lg mb-10 max-w-3xl">
              Проект по <strong>инвентаризации мест захоронений</strong>{" "}
              реализуется по понятной схеме — от анализа архивов до запуска
              электронной карты и реестра.
            </p>
            <div className="space-y-8 relative">
              <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200 hidden md:block" />
              {[
                {
                  step: "01",
                  title: "Подготовка и анализ архивов",
                  text: "Сбор книг захоронений, схем, Excel‑файлов и других источников. Формирование технического задания и плана инвентаризации кладбищ.",
                },
                {
                  step: "02",
                  title: "Полевые работы на кладбищах",
                  text: "Обход территорий с использованием GPS/ГНСС‑оборудования и мобильных устройств. Фиксация координат, фото и атрибутов мест погребения.",
                },
                {
                  step: "03",
                  title: "Камеральная обработка и оцифровка",
                  text: "Сопоставление полевых данных с архивами, устранение несоответствий, формирование единого реестра мест захоронений.",
                },
                {
                  step: "04",
                  title: "Запуск АИС и обучение",
                  text: "Загрузка данных в АИС «Единая среда», настройка ролей, обучение сотрудников и сопровождение первых месяцев эксплуатации.",
                },
              ].map((item, index) => (
                <div
                  key={item.step}
                  className="relative md:pl-16 bg-white md:bg-transparent rounded-3xl md:rounded-none"
                >
                  <div className="flex items-start gap-4 md:gap-6 bg-white rounded-3xl p-5 md:p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.04)]">
                    <div className="flex flex-col items-center md:items-start">
                      <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-[#029cda] text-white flex items-center justify-center text-xs md:text-base font-semibold">
                        {item.step}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold mb-1 text-[#313131]">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 text-sm md:text-base">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Блок про систему (2 колонки + слайдер) */}
        <section className="py-14 md:py-20">
          <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl text-[#313131] font-medium mb-4">
                Геоинформационная система для учета мест захоронений
              </h2>
              <p className="text-gray-700 text-base md:text-lg mb-6">
                АИС «Единая среда» — это{" "}
                <strong>цифровая платформа управления кладбищами</strong>, которая
                объединяет электронную карту, реестр мест захоронений и сервисы
                для граждан.
              </p>
              <ul className="space-y-3 text-sm md:text-base text-gray-700">
                <li>
                  • <strong>Электронный план кладбища</strong> с отображением
                  участков, кварталов и конкретных мест захоронений.
                </li>
                <li>
                  • <strong>Реестр мест захоронений</strong>, ответственных лиц,
                  надмогильных сооружений и статусов захоронений.
                </li>
                <li>
                  • <strong>Интерактивная карта захоронений</strong> для поиска
                  по фамилии и параметрам.
                </li>
                <li>
                  • Экспорт и интеграции с государственными и региональными
                  системами учета кладбищ.
                </li>
              </ul>
            </div>
            <div>
              <InterfaceSlider
                title="Интерфейс системы инвентаризации кладбищ"
                subtitle="Электронная карта, реестры и аналитика по захоронениям в одной системе"
                images={[
                  {
                    src: "/img/es_interface1.webp",
                    alt: "Карта кладбищ и мест захоронений",
                  },
                  {
                    src: "/img/es_interface2.webp",
                    alt: "Реестр мест захоронений",
                  },
                  {
                    src: "/img/es_interface3.webp",
                    alt: "Аналитика по кладбищам",
                  },
                  {
                    src: "/img/es_interface4.webp",
                    alt: "Отчеты по захоронениям",
                  },
                ]}
              />
            </div>
          </div>
        </section>

        {/* Блок «Вопрос–ответ» (FAQ) */}
        <section className="py-14 md:py-20 bg-[#F5F7FA]">
          <div className="max-w-[900px] mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl text-[#313131] font-medium mb-6 text-center">
              Частые вопросы об инвентаризации мест захоронений
            </h2>
            <div className="space-y-4">
              <details className="group bg-white rounded-3xl p-5 md:p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.04)]">
                <summary className="flex items-center justify-between cursor-pointer text-sm md:text-base font-semibold text-black">
                  Как проводится инвентаризация кладбищ и сколько это стоит?
                  <span className="ml-3 text-xl text-gray-400 group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <div className="mt-3 text-gray-600 text-sm md:text-base">
                  Инвентаризация включает анализ архивов, полевые работы, камеральную
                  обработку и загрузку данных в систему. Стоимость зависит от площади
                  кладбищ, состояния архивов и требований к точности, поэтому
                  рассчитывается индивидуально.
                </div>
              </details>
              <details className="group bg-white rounded-3xl p-5 md:p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.04)]">
                <summary className="flex items-center justify-between cursor-pointer text-sm md:text-base font-semibold text-black">
                  Какие данные собираются при инвентаризации мест захоронений?
                  <span className="ml-3 text-xl text-gray-400 group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <div className="mt-3 text-gray-600 text-sm md:text-base">
                  ФИО, даты жизни, тип и состояние надмогильного сооружения, фото,
                  координаты, номера участков и кварталов, сведения об ответственном
                  лице и статусе захоронения.
                </div>
              </details>
              <details className="group bg-white rounded-3xl p-5 md:p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.04)]">
                <summary className="flex items-center justify-between cursor-pointer text-sm md:text-base font-semibold text-black">
                  Можно ли публиковать электронную карту кладбищ для граждан?
                  <span className="ml-3 text-xl text-gray-400 group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <div className="mt-3 text-gray-600 text-sm md:text-base">
                  Да, система поддерживает защищенную публикацию{" "}
                  <strong>карты захоронений онлайн</strong> с поиском по фамилии
                  и фильтрами. Доступ можно настроить по ролям и уровням
                  открытости данных.
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* Финальный CTA */}
        <section className="py-14 md:py-20">
          <div className="max-w-[900px] mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl text-[#313131] font-medium mb-4">
              Запланируйте проект инвентаризации кладбищ
            </h2>
            <p className="text-gray-700 text-sm md:text-base mb-6">
              Расскажите о ваших кладбищах, объеме работ и сроках — мы предложим
              оптимальный формат <strong>инвентаризации мест захоронений</strong>{" "}
              и оцифровки для вашего муниципалитета.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={handleKP}
                className="inline-flex items-center justify-center bg-[#029cda] text-white px-8 py-4 rounded-xl font-medium hover:bg-[#029cda]/90 transition-colors duration-200 focus:outline-none"
              >
                Получить коммерческое предложение
              </button>
              <button
                onClick={handleConsult}
                className="inline-flex items-center justify-center bg-white text-[#029cda] border border-[#029cda] px-8 py-4 rounded-xl font-medium hover:bg-[#029cda]/10 transition-colors duration-200 focus:outline-none"
              >
                Задать вопросы по проекту
              </button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}


