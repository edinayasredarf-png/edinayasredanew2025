'use client';
import Image from 'next/image';

const cards = [
  {
    title: "Опыт и компетенции",
    list: [
      "Более 15 лет работы в отрасли",
      "Совокупный опыт команды более 100 лет",
      "Выполнено более 100 муниципальных и государственных контрактов",
      "Лидеры команды участвуют в разработке отраслевых нормативно-правовых актов",
      "фотофиксация",
      "Опыт работы в группах и комиссиях государственных и муниципальных органах"
    ],
    image: "/img/services/izn/4.png"
  },
  {
    title: "Технологии",
    list: [
      "Современное и высококачественное оборудование",
      "Собственный отдел программистов",
      "Собственный сервис «Единая среда» для  эффективного учёта, управления и мониторинга территорий и объектов в организациях любого типа и масштаба",
      "Соответствие отечественным и международным требованиям"
    ],
    image: "/img/services/izn/5.png"
  },
  {
    title: "Уверенность в результате",
    list: [
      "Точное понимание целей и задач заказчиков",
      "Продуктовая линейка для органов местного самоуправления",
      "Закрытие большей части вопросов управления городской средой",
      "Учет всех деталей, даже не учтенных в ТЗ",
      "Важность как условий контракта, так и конечного результата"
    ],
    image: "/img/services/izn/6.png"
  }
];

export default function LesAdvantagesSection() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 py-24">
      <h2 className="text-center text-[#313131] text-4xl md:text-[52px] leading-tight">
        Наши преимущества
      </h2>
      <p className="text-center text-[#7c8a9a] text-xl mt-6 mb-16 max-w-3xl mx-auto">
        Мы выполняем полный цикл работ — от полевого обследования до передачи готовой цифровой базы.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
        {cards.map((card, i) => (
          <div key={i} className="bg-white rounded-3xl flex flex-col overflow-hidden">
            <div className="p-2">
              <div className="bg-[#f6f7f9] rounded-2xl flex items-center justify-center h-[260px]">
                <Image src={card.image} alt={card.title} width={160} height={160} className="object-contain" />
              </div>
            </div>
            <div className="p-6 space-y-4">
              <h3 className="text-[#313131] text-2xl leading-snug">{card.title}</h3>
              <ul className="space-y-3 text-[#7c8a9a] text-lg leading-relaxed pl-0">
                {card.list.map((item, idx) => (
                  <li
                    key={idx}
                    className="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-2 before:h-2 before:bg-no-repeat before:bg-contain before:bg-center before:bg-[url('/icons/check_blue.svg')]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
