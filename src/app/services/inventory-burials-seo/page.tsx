"use client";

import Layout from "../../../components/Layout";
import InterfaceSlider from "../../../components/InterfaceSlider";

export default function InventoryBurialsSeoPage() {
  const handleKP = () => {
    window.dispatchEvent(new CustomEvent("openKPModal"));
  };

  const handleConsult = () => {
    window.dispatchEvent(new CustomEvent("openConsultModal"));
  };

  return (
    <Layout>
      <div className="font-raleway font-medium lining-nums">
        {/* H1 / Hero */}
        <section className="page-hero rounded-b-[20px] relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
            <div className="max-w-4xl">
              <h1 className="text-[clamp(2rem,5.5vw,3.4rem)] leading-[1.14] tracking-[0.6px] font-involve font-medium">
                Инвентаризация и оцифровка мест захоронений и кладбищ
              </h1>
              <p className="mt-6 text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl">
                АИС «Единая среда» выполняет инвентаризацию кладбищ и{" "}
                <strong>инвентаризацию мест захоронений</strong> с созданием
                электронной карты, реестра захоронений и удобного поиска для
                муниципалитетов, операторов кладбищ и граждан.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleKP}
                  className="inline-flex items-center justify-center bg-[#029cda] text-white text-sm md:text-base lg:text-lg font-medium px-6 py-4 md:px-8 md:py-5 rounded-xl hover:bg-[#029cda]/90 transition-colors duration-200 focus:outline-none"
                >
                  Получить КП на инвентаризацию кладбищ
                </button>
                <button
                  onClick={handleConsult}
                  className="inline-flex items-center justify-center bg-white text-[#029cda] border border-[#029cda] text-sm md:text-base lg:text-lg font-medium px-6 py-4 md:px-8 md:py-5 rounded-xl hover:bg-[#029cda]/10 transition-colors duration-200 focus:outline-none"
                >
                  Бесплатная консультация по учету захоронений
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Для кого система */}
        <section className="py-14 md:py-20">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl text-[#313131] font-medium mb-6">
              Для кого подходит система инвентаризации мест захоронений
            </h2>
            <p className="text-gray-700 text-base md:text-lg mb-8 max-w-3xl">
              Решение предназначено для органов местного самоуправления,
              муниципальных предприятий, операторов кладбищ и специализированных
              организаций, отвечающих за{" "}
              <strong>учет мест захоронения и инвентаризацию кладбищ</strong>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.06)]">
                <h3 className="text-lg md:text-xl font-semibold mb-3 text-[#313131]">
                  Органы местного самоуправления
                </h3>
                <p className="text-gray-600 text-sm md:text-base">
                  Выполнение нормативных требований по ведению{" "}
                  <strong>реестра мест захоронений</strong>, формирование
                  отчетности и планирование развития кладбищ.
                </p>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.06)]">
                <h3 className="text-lg md:text-xl font-semibold mb-3 text-[#313131]">
                  Муниципальные кладбища и МУПы
                </h3>
                <p className="text-gray-600 text-sm md:text-base">
                  Ведение единой базы захоронений и{" "}
                  <strong>учета захоронений на кладбище</strong>, исключение
                  ошибок и потерь записей в бумажных книгах.
                </p>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.06)]">
                <h3 className="text-lg md:text-xl font-semibold mb-3 text-[#313131]">
                  Подрядчики по инвентаризации кладбищ
                </h3>
                <p className="text-gray-600 text-sm md:text-base">
                  Профессиональный инструмент для{" "}
                  <strong>инвентаризации мест погребения</strong> и передачи
                  результатов заказчику в виде удобной электронной системы.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Какие задачи решает инвентаризация */}
        <section className="py-14 md:py-20 bg-[#F5F7FA]">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl text-[#313131] font-medium mb-6">
              Какие задачи решает инвентаризация кладбищ
            </h2>
            <p className="text-gray-700 text-base md:text-lg mb-8 max-w-3xl">
              <strong>Инвентаризация мест захоронений</strong> проводится для
              получения точных данных о заполненности кладбищ, выявления
              бесхозных захоронений и наведения порядка в учете.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6">
                <h3 className="text-lg md:text-xl font-semibold mb-3 text-[#313131]">
                  Полная картина заполненности кладбищ
                </h3>
                <p className="text-gray-600 text-sm md:text-base">
                  Определение фактического количества захоронений, свободных
                  мест, резервов и{" "}
                  <strong>реестра бесхозных захоронений</strong>.
                </p>
              </div>
              <div className="bg-white rounded-3xl p-6">
                <h3 className="text-lg md:text-xl font-semibold mb-3 text-[#313131]">
                  Наведение порядка в книгах захоронений
                </h3>
                <p className="text-gray-600 text-sm md:text-base">
                  Сопоставление архивных записей с фактическими данными,
                  устранение дубликатов и ошибок, создание{" "}
                  <strong>единой базы захоронений</strong>.
                </p>
              </div>
              <div className="bg-white rounded-3xl p-6">
                <h3 className="text-lg md:text-xl font-semibold mb-3 text-[#313131]">
                  Исполнение нормативных требований
                </h3>
                <p className="text-gray-600 text-sm md:text-base">
                  Подготовка к переходу на государственные и региональные
                  системы учета, соблюдение требований к{" "}
                  <strong>инвентаризации муниципальных кладбищ</strong>.
                </p>
              </div>
              <div className="bg-white rounded-3xl p-6">
                <h3 className="text-lg md:text-xl font-semibold mb-3 text-[#313131]">
                  Повышение качества сервисов для граждан
                </h3>
                <p className="text-gray-600 text-sm md:text-base">
                  Возможность <strong>поиска захоронений по фамилии</strong> и
                  оформления обращений онлайн на основе актуальных данных.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Функциональные возможности */}
        <section className="py-14 md:py-20">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl text-[#313131] font-medium mb-6">
              Функциональные возможности АИС «Единая среда»
            </h2>
            <p className="text-gray-700 text-base md:text-lg mb-8 max-w-3xl">
              Платформа объединяет{" "}
              <strong>геоинформационную систему кладбищ</strong>, реестр мест
              захоронений и инструменты аналитики для управления территорией.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.06)]">
                <h3 className="text-lg md:text-xl font-semibold mb-3 text-[#313131]">
                  Электронная карта кладбища
                </h3>
                <p className="text-gray-600 text-sm md:text-base">
                  <strong>Электронная карта кладбищ</strong> с координатами,
                  фотографиями и атрибутами мест захоронений, отображение
                  участков и инфраструктуры.
                </p>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.06)]">
                <h3 className="text-lg md:text-xl font-semibold mb-3 text-[#313131]">
                  Реестр мест захоронений
                </h3>
                <p className="text-gray-600 text-sm md:text-base">
                  Ведение <strong>реестра мест погребения</strong>, ответственных
                  лиц, надмогильных сооружений и участков с историей изменений.
                </p>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.06)]">
                <h3 className="text-lg md:text-xl font-semibold mb-3 text-[#313131]">
                  Поиск захоронений для граждан
                </h3>
                <p className="text-gray-600 text-sm md:text-base">
                  Онлайн‑поиск по фамилии, датам жизни, номеру участка и{" "}
                  <strong>электронной карте кладбища</strong>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Как проводится инвентаризация */}
        <section className="py-14 md:py-20 bg-[#F5F7FA]">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl text-[#313131] font-medium mb-6">
              Как проводится инвентаризация мест захоронений
            </h2>
            <p className="text-gray-700 text-base md:text-lg mb-8 max-w-3xl">
              Работы выполняются по четкой методике: от подготовки архивов до
              полевых работ и загрузки данных в систему.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-6">
                <h3 className="text-lg md:text-xl font-semibold mb-3 text-[#313131]">
                  Подготовка и анализ архивов
                </h3>
                <p className="text-gray-600 text-sm md:text-base">
                  Анализ книг захоронений, схем участков и электронных данных,
                  формирование плана{" "}
                  <strong>инвентаризации кладбищ</strong>.
                </p>
              </div>
              <div className="bg-white rounded-3xl p-6">
                <h3 className="text-lg md:text-xl font-semibold mb-3 text-[#313131]">
                  Полевые работы и съемка
                </h3>
                <p className="text-gray-600 text-sm md:text-base">
                  Обход территорий с использованием{" "}
                  <strong>GPS/ГНСС‑оборудования</strong> и мобильных устройств,
                  фиксация координат, фото и атрибутов мест захоронения.
                </p>
              </div>
              <div className="bg-white rounded-3xl p-6">
                <h3 className="text-lg md:text-xl font-semibold mb-3 text-[#313131]">
                  Камеральная обработка и загрузка в систему
                </h3>
                <p className="text-gray-600 text-sm md:text-base">
                  Проверка данных, привязка к участкам, создание{" "}
                  <strong>электронного плана кладбища</strong> и запуск работы
                  в АИС «Единая среда».
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Соответствие законодательству */}
        <section className="py-14 md:py-20">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl text-[#313131] font-medium mb-6">
              Соответствие требованиям государства и подготовка к единой базе
            </h2>
            <p className="text-gray-700 text-base md:text-lg mb-8 max-w-3xl">
              <strong>Инвентаризация мест захоронений</strong> и ведение
              электронного реестра выполняются с учетом действующих требований и
              будущей интеграции с государственными и региональными системами
              учета.
            </p>
          </div>
        </section>

        {/* Результат и CTA + слайдер интерфейса */}
        <section className="py-14 md:py-20 bg-[#F5F7FA]">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl text-[#313131] font-medium mb-6">
              Результат для муниципалитета и граждан
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="bg-white rounded-3xl p-6">
                <h3 className="text-lg md:text-xl font-semibold mb-3 text-[#313131]">
                  Для администрации и служб
                </h3>
                <p className="text-gray-600 text-sm md:text-base">
                  Актуальная электронная карта кладбищ и{" "}
                  <strong>реестр мест захоронений</strong>, отчетность,
                  планирование развития территорий и сокращение ручного труда.
                </p>
              </div>
              <div className="bg-white rounded-3xl p-6">
                <h3 className="text-lg md:text-xl font-semibold mb-3 text-[#313131]">
                  Для жителей
                </h3>
                <p className="text-gray-600 text-sm md:text-base">
                  Удобный <strong>поиск захоронений по фамилии</strong>,
                  доступ к информации онлайн и возможность заказать услуги по
                  уходу за местом захоронения.
                </p>
              </div>
            </div>

            <div className="mb-10">
              <InterfaceSlider
                title="Интерфейс системы учета кладбищ"
                subtitle="Электронная карта кладбищ, реестр мест захоронений и поиск захоронений в одной системе"
                images={[
                  {
                    src: "/img/es_interface1.webp",
                    alt: "Электронная карта кладбища",
                  },
                  {
                    src: "/img/es_interface2.webp",
                    alt: "Реестр мест захоронений",
                  },
                  {
                    src: "/img/es_interface3.webp",
                    alt: "Аналитика по заполненности кладбищ",
                  },
                  {
                    src: "/img/es_interface4.webp",
                    alt: "Отчеты по захоронениям",
                  },
                ]}
              />
            </div>

            <div className="max-w-3xl mx-auto text-center">
              <h3 className="text-xl md:text-2xl font-semibold mb-4 text-[#313131]">
                Узнайте стоимость инвентаризации кладбищ для вашего муниципалитета
              </h3>
              <p className="text-gray-600 text-sm md:text-base mb-6">
                Стоимость зависит от площади кладбищ, состояния архивов и
                необходимого объема полевых работ. Оставьте заявку, и мы
                подготовим расчет под вашу задачу.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={handleKP}
                  className="inline-flex items-center justify-center bg-[#029cda] text-white px-8 py-4 rounded-xl font-medium hover:bg-[#029cda]/90 transition-colors duration-200 focus:outline-none"
                >
                  Рассчитать стоимость инвентаризации кладбищ
                </button>
                <button
                  onClick={handleConsult}
                  className="inline-flex items-center justify-center bg-white text-[#029cda] border border-[#029cda] px-8 py-4 rounded-xl font-medium hover:bg-[#029cda]/10 transition-colors duration-200 focus:outline-none"
                >
                  Задать вопросы по учету захоронений
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}