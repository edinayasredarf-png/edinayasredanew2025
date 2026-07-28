function ArrowUpRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

type Method = {
  title: string;
  subtitle: string;
  icon: string;
  actionLabel: string;
  href: string;
  external?: boolean;
};

const methods: Method[] = [
  {
    title: "8 800 550 56 12",
    subtitle: "Бесплатный многоканальный телефон по всей России",
    icon: "/img/chanel/4.svg",
    actionLabel: "Позвонить",
    href: "tel:88005505612",
  },
  {
    title: "8 928 102 07 72",
    subtitle: "Прямой мобильный номер",
    icon: "/img/chanel/4.svg",
    actionLabel: "Позвонить",
    href: "tel:89281020772",
  },
  {
    title: "Max",
    subtitle: "Чат отдела продаж в Max",
    icon: "/img/chanel/1.svg",
    actionLabel: "Оставить заявку",
    href: "https://max.ru/join/o9Qsp_ls9FThf7PTGJkQIm1as_Uknlw_zFRNV28FtVY",
    external: true,
  },
  {
    title: "Онлайн-чат",
    subtitle: "Задайте нам вопрос в чате — ответим в течение нескольких минут",
    icon: "/img/chanel/2.svg",
    actionLabel: "Открыть чат",
    href: "/online-chat",
  },
];

export default function ContactsMethodsSection() {
  return (
    <section className="bg-white w-full pt-4 pb-12 md:pt-6 md:pb-16" aria-label="Способы связи">
      <div className="rd-content-column">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {methods.map((m) => (
            <div
              key={m.title}
              className="bg-[#F6F7F9] rounded-[32px] p-8 lg:p-10 flex items-start justify-between gap-6 min-h-[190px]"
            >
              <div className="flex flex-col h-full">
                <h3 className="font-involve text-[#050c26] text-2xl font-medium leading-7 tracking-wide">
                  {m.title}
                </h3>
                <p className="mt-3 flex-1 font-[Raleway] text-base leading-6 tracking-tight text-[#646b85]">
                  {m.subtitle}
                </p>
                <a
                  href={m.href}
                  {...(m.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="mt-5 inline-flex items-center gap-2 text-[#029cda] text-base font-medium font-involve hover:opacity-80 transition-opacity"
                >
                  {m.actionLabel} <ArrowUpRight />
                </a>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.icon} alt="" className="shrink-0 w-[68px] h-[68px] object-contain" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
