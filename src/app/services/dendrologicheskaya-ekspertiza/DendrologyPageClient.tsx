"use client";

import Image from 'next/image';
import Link from 'next/link';
import Layout from '@/components/Layout';
import FAQ from '@/components/FAQ';
import ServiceHero from '@/components/services/ServiceHero';
import ServiceLeadDefinition from '@/components/services/ServiceLeadDefinition';
import { useModal } from '@/components/ModalProvider';

const audiences = [
  ['Застройщики и проектировщики', 'Чтобы определить, какие деревья сохранить, пересадить или снести с компенсационным озеленением, и подготовить основания для проекта и согласований.'],
  ['Собственники участков и домов', 'Для обследования аварийного дерева, обоснования его сноса, оспаривания отказа администрации или оценки безопасности насаждений.'],
  ['Управляющие компании и ТСЖ', 'Для обоснования обрезки, сноса или сохранения насаждений на придомовой территории и разрешения споров с жильцами.'],
  ['Администрации и учреждения', 'Для оценки зелёного фонда, обоснования разрешений на снос и расчёта компенсационной стоимости.'],
  ['Страховые компании', 'Для установления причин повреждения или гибели насаждений и оценки ущерба.'],
  ['Частные лица, юристы и адвокаты', 'Для подготовки доказательной базы в спорах о незаконной рубке, повреждении имущества, взыскании ущерба и решениях органов власти.'],
];

const tasks = [
  ['Оценить состояние насаждений', 'Определяем состояние дерева или кустарника: здоровое, ослабленное, аварийное или погибшее. Выявляем признаки болезней, гниения, поражения вредителями и механические повреждения.'],
  ['Установить причину повреждения или гибели', 'Исследуем последствия болезней, неправильной обрезки, химического воздействия, строительных работ, непогоды или действий третьих лиц. Фиксируем выводы в заключении.'],
  ['Оценить возможность пересадки', 'Если дерево попадает в зону строительства, оцениваем возможность его сохранения, перспективы пересадки и необходимые условия.'],
  ['Рассчитать компенсационную стоимость', 'При необходимости готовим обоснованный расчёт компенсационного озеленения или денежной компенсации при сносе насаждений.'],
  ['Подготовить заключение для спора или согласования', 'Оформляем результаты исследования для досудебной претензии, взаимодействия с администрацией или представления в судебном процессе.'],
];

const included = [
  'Выезд эксперта на участок, территорию или место происшествия.',
  'Визуальное и инструментальное обследование деревьев и кустарников.',
  'Фотофиксация состояния, повреждений и признаков аварийности.',
  'Анализ документов и фотоматериалов, в том числе если объект уже изменён.',
  'Определение причины повреждения или гибели насаждений.',
  'Оценка возможности пересадки и условий сохранения.',
  'Расчёт компенсационной стоимости — при необходимости.',
  'Заключение с описанием исследования, выводами и фотоприложением.',
  'Консультация по дальнейшим действиям: согласование, претензия, иск или обращение в администрацию.',
];

const preparation = [
  ['Адрес и задача', 'Укажите адрес объекта и цель обращения: оценка состояния, причина гибели, пересадка, снос или судебный / досудебный спор.'],
  ['Фотографии', 'Пришлите общий вид дерева или территории и крупные планы проблемных зон.'],
  ['Документы, если есть', 'Подойдут выписка из ЕГРН, разрешение, проект, акт осмотра, переписка с администрацией или управляющей компанией.'],
  ['Ответственный за территорию', 'Сообщите, кто отвечает за объект: собственник, управляющая компания или администрация, если это известно.'],
];

const steps = [
  ['Обращение и анализ задачи', 'Уточняем адрес, цель экспертизы, изучаем фотографии и имеющиеся документы. Согласуем объём, стоимость и сроки.'],
  ['Выезд и обследование', 'Эксперт осматривает насаждения, выполняет необходимые исследования и фиксирует состояние объекта.'],
  ['Исследование и выводы', 'Анализируем материалы, определяем причины повреждений, условия сохранения или пересадки. При необходимости рассчитываем компенсационную стоимость.'],
  ['Передача заключения', 'Передаём заключение с выводами и фотоприложением, консультируем по дальнейшим действиям.'],
];

const faq = [
  { question: 'Можно ли обследовать одно дерево?', answer: 'Да. Работаем с объектами разного масштаба: от одного дерева на частном участке до территории застройки или городского парка.' },
  { question: 'Можно ли использовать заключение в суде?', answer: 'Заключение можно представить при досудебном урегулировании и в судебном процессе. До начала работы уточняем вопросы исследования и требования к документу. Оценку представленных доказательств осуществляет суд.' },
  { question: 'Что делать, если дерево уже срублено или территория изменена?', answer: 'Передайте сохранившиеся фотографии, акты осмотра, проекты и другие документы. Эксперт оценит, достаточно ли материалов для исследования и на какие вопросы можно ответить.' },
  { question: 'Сколько стоит дендрологическая экспертиза?', answer: 'Стоимость рассчитывается индивидуально: она зависит от количества насаждений, сложности обследования, вопросов эксперту и необходимых расчётов. Оставьте заявку — уточним детали и подготовим предложение.' },
  { question: 'В какие сроки выезжает эксперт и готовится заключение?', answer: 'Выезд по Ростову-на-Дону и Ростовской области — от 1–3 рабочих дней с момента обращения. Подготовка заключения — от 3–10 рабочих дней в зависимости от объёма и сложности. Срочный формат и выезд в другие регионы согласуются отдельно.' },
];

const heading = 'text-[#313131] text-3xl sm:text-4xl lg:text-[52px] font-medium leading-tight';
const text = 'text-[#7c8a9a] text-base sm:text-lg leading-relaxed';
const button = 'inline-flex items-center justify-center bg-[#029cda] hover:bg-[#0280b5] text-white text-lg font-medium px-7 py-4 rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#029cda]';

export default function DendrologyPageClient() {
  const { openKP, openConsult } = useModal();

  return (
    <Layout hideBreadcrumbs>
      <div className="min-h-screen bg-white font-raleway font-medium lining-nums">
        <ServiceHero
          service="dendrology"
          title={<>Дендрологическая<br />экспертиза</>}
          description="Официальное заключение о состоянии деревьев и кустарников — для суда, застройки, страховой компании и администрации."
          onRequest={openKP}
          onConsult={openConsult}
        />

        <ServiceLeadDefinition
          heading="Что такое дендрологическая экспертиза"
          answer="Дендрологическая экспертиза — это исследование состояния зелёных насаждений, их ценности, причин повреждения или гибели, а также последствий хозяйственной деятельности для деревьев и кустарников. Заключение эксперта помогает обосновать решение, когда от состояния дерева зависят строительство, расходы или ответственность."
          provider="«Единая среда» проводит экспертизы для собственников, застройщиков, управляющих компаний, администраций, страховых компаний, частных лиц и их представителей."
          facts={['Выезд от 1–3 рабочих дней', 'Заключение от 3–10 рабочих дней', 'Ростов-на-Дону и область']}
        />

        <section className="py-14 md:py-24 bg-[#f5f7fa]">
          <div className="rd-content-column">
            <h2 className={`${heading} text-center mb-10 md:mb-14`}>Кому нужна экспертиза</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {audiences.map(([title, description]) => (
                <div key={title} className="bg-white rounded-3xl p-6 md:p-8">
                  <h3 className="text-[#313131] text-2xl font-medium mb-4">{title}</h3>
                  <p className={text}>{description}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-10"><button type="button" onClick={openConsult} className={button}>Обсудить задачу</button></div>
          </div>
        </section>

        <section className="py-14 md:py-24">
          <div className="rd-content-column">
            <h2 className={`${heading} mb-10 md:mb-14 max-w-3xl`}>Какие задачи решает дендрологическая экспертиза</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {tasks.map(([title, description], i) => (
                <div key={title} className={`bg-[#F6F7F9] rounded-3xl p-6 md:p-8 ${i === tasks.length - 1 ? 'md:col-span-2' : ''}`}>
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#029cda] text-white text-xl mb-6">{i + 1}</span>
                  <h3 className="text-[#313131] text-2xl font-medium mb-4">{title}</h3>
                  <p className={text}>{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 md:py-24 bg-[#f5f7fa]">
          <div className="rd-content-column grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
            <div>
              <h2 className={`${heading} mb-6`}>Что входит в услугу</h2>
              <p className={`${text} mb-8`}>От выезда на объект до заключения с обоснованными выводами. Состав исследований согласуем под вашу задачу.</p>
              <Image src="/img/услуга_изн.png" alt="Исследование состояния зелёных насаждений" width={360} height={360} className="w-full max-w-[360px] h-auto mx-auto" />
            </div>
            <ul className="space-y-3">
              {included.map(item => (
                <li key={item} className="flex gap-4 bg-white rounded-2xl p-5">
                  <span aria-hidden="true" className="text-[#029cda] shrink-0 text-xl">✓</span>
                  <span className={text}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-14 md:py-24">
          <div className="rd-content-column grid lg:grid-cols-2 gap-8 lg:gap-16">
            <div>
              <h2 className={`${heading} mb-6`}>Заключение, на которое можно опереться</h2>
              <p className={text}>Результат работы — документ с описанием исследований, фотоматериалами и обоснованными выводами для принятия решения, согласований или разрешения спора.</p>
            </div>
            <div className="space-y-5">
              {[
                ['Обоснованные выводы', 'Исследуем состояние насаждений на основе методик дендрологических исследований с учётом задачи экспертизы.'],
                ['Документальная фиксация', 'Включаем описание обследования, выявленные повреждения и фотоприложение.'],
                ['Учёт требований', 'Учитываем требования к содержанию зелёных насаждений и порядку их обследования. Требования к заключению уточняем до начала работ.'],
                ['Любой масштаб объекта', 'Обследуем отдельные деревья, частные участки, территории застройки и городские парки.'],
              ].map(([title, description]) => (
                <div key={title} className="bg-[#F6F7F9] rounded-3xl p-6">
                  <h3 className="text-[#313131] text-xl font-medium mb-3">{title}</h3>
                  <p className={text}>{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 md:py-24 bg-[#f5f7fa]">
          <div className="rd-content-column">
            <h2 className={`${heading} text-center mb-10 md:mb-16`}>Сроки и формат работы</h2>
            <div className="grid md:grid-cols-3 gap-3">
              {[
                { value: 'от 1–3 рабочих дней', title: 'Выезд эксперта', description: 'С момента обращения по Ростову-на-Дону и Ростовской области.' },
                { value: 'от 3–10 рабочих дней', title: 'Готовое заключение', description: 'В зависимости от сложности и объёма объекта. Срочный формат — по согласованию.' },
                { value: 'Ростов-на-Дону и область', title: 'География работы', description: <><strong className="font-bold text-[#313131]">Возможен выезд в другие регионы.</strong> Сроки и условия согласуем отдельно.</> },
              ].map(({ value, title, description }) => (
                <div key={title} className="bg-white rounded-3xl p-6 md:p-8 md:min-h-[288px]">
                  <p className="text-[#029cda] text-2xl xl:text-[28px] 2xl:text-[30px] leading-[1.2] font-involve font-medium mb-7">{value}</p>
                  <h3 className="text-[#313131] text-xl font-medium mb-4">{title}</h3>
                  <p className={text}>{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 md:py-24">
          <div className="rd-content-column">
            <h2 className={`${heading} text-center mb-10 md:mb-14`}>Как проходит работа</h2>
            <ol className="grid md:grid-cols-2 gap-3">
              {steps.map(([title, description], i) => (
                <li key={title} className="bg-[#F6F7F9] rounded-3xl p-6 md:p-8">
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#029cda] text-white text-xl mb-6">{i + 1}</span>
                  <h3 className="text-[#313131] text-2xl font-medium mb-4">{title}</h3>
                  <p className={text}>{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-14 md:py-24 bg-[#f5f7fa]">
          <div className="rd-content-column grid lg:grid-cols-2 gap-8 lg:gap-16">
            <h2 className={heading}>Что подготовить для начала</h2>
            <ol className="space-y-6">
              {preparation.map(([title, description], i) => (
                <li key={title} className="flex gap-4">
                  <span className="shrink-0 flex items-center justify-center w-10 h-10 bg-white rounded-xl text-[#029cda] text-xl">{i + 1}</span>
                  <div><h3 className="text-[#313131] text-xl font-medium mb-2">{title}</h3><p className={text}>{description}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="max-w-[1200px] mx-auto px-4 py-14 md:py-24">
          <div className="bg-[#F6F7F9] rounded-3xl p-2 flex flex-col lg:flex-row gap-8 lg:gap-12 lg:min-h-[440px]">
            <div className="lg:w-1/2 flex flex-col justify-center items-start p-6">
              <h2 className="text-[#313131] text-3xl md:text-[28px] font-medium leading-snug mb-6">Получите заключение по вашей задаче</h2>
              <p className={`${text} mb-8`}>Если от состояния дерева зависят деньги, сроки или ответственность, начните с консультации. Оставьте заявку — свяжемся, уточним детали и предложим подходящий формат экспертизы.</p>
              <button type="button" onClick={openKP} className={button}>Оставить заявку</button>
            </div>
            <div className="lg:w-1/2 bg-white rounded-2xl p-6 flex items-center justify-center">
              <Image src="/img/imz_cta.png" alt="Консультация по дендрологической экспертизе" width={320} height={320} className="w-full max-w-[320px] h-auto" />
            </div>
          </div>
          <p className="mt-6 text-center text-[#7c8a9a]">Нужен полный учёт территории? <Link href="/services/izn" className="text-[#029cda] underline underline-offset-4">Инвентаризация зелёных насаждений</Link></p>
        </section>

        <FAQ items={faq} title="Часто задаваемые вопросы" showContactCard contactCardTitle="Остались вопросы?" contactCardText="Расскажите о вашем объекте — поможем определить формат работы." contactButtonText="Задать вопрос" onContactClick={openConsult} />
      </div>
    </Layout>
  );
}
