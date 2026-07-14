import Link from "next/link";

type Item = {
  title: string;
  description: string;
  icon: string;
  href: string;
  external?: boolean;
};

const items: Item[] = [
  {
    title: "Документация",
    description:
      "Подробные руководства по работе с системой: от первого входа до настройки сложных слоёв и справочников.",
    icon: "/img/block/1.svg",
    href: "/documents",
  },
  {
    title: "Блог",
    description: "Рассказываем про облачные технологии и обновления сервисов.",
    icon: "/img/block/2.svg",
    href: "/blog",
  },
  {
    title: "Новости",
    description:
      "Следите за обновлениями платформы, событиями компании и важными изменениями в отрасли.",
    icon: "/img/block/3.svg",
    href: "/news",
  },
  {
    title: "Комьюнити-чат",
    description:
      "Личный менеджер и чат с командой. Отвечаем быстро и помогаем решить любой вопрос по системе.",
    icon: "/img/block/4.svg",
    href: "https://max.ru/join/o9Qsp_ls9FThf7PTGJkQIm1as_Uknlw_zFRNV28FtVY",
    external: true,
  },
];

function Card({ item }: { item: Item }) {
  const className =
    "group bg-[#F6F7F9] rounded-[32px] p-8 lg:p-10 flex flex-col min-h-[260px] lg:h-[289px] transition-colors hover:bg-[#eef0f3]";
  const inner = (
    <>
      <div className="w-12 h-12 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.icon} alt="" className="w-12 h-12 object-contain" />
      </div>
      <h3 className="mt-6 font-involve text-[#050c26] text-2xl font-medium leading-7 tracking-wide">
        {item.title}
      </h3>
      <p className="mt-3 font-[Raleway] text-base leading-6 tracking-tight text-[#646b85]">
        {item.description}
      </p>
    </>
  );

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={item.href} className={className}>
      {inner}
    </Link>
  );
}

export default function ResourcesLinksSection() {
  return (
    <section className="bg-white w-full py-16 md:py-24" aria-label="Полезные разделы">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <Card key={item.title} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
