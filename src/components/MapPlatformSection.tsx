import Image from "next/image";

type Feature = {
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    title: "Разные картографические подложки",
    description:
      "Спутник, схема, гибрид — переключайтесь в один клик под любую задачу.",
  },
  {
    title: "Сотни типов объектов",
    description:
      "Точки, линии, полигоны — отображайте инфраструктуру именно так, как она есть.",
  },
  {
    title: "Собственные справочники",
    description:
      "Паспорта объектов, характеристики, статусы — любые атрибуты под каждый тип. Всё структурировано и доступно сразу.",
  },
  {
    title: "Публичная версия",
    description:
      "Встройте интерактивную карту на свой портал. Посетители видят нужные объекты без регистрации.",
  },
];

export default function MapPlatformSection() {
  return (
    <section className="bg-white w-full py-16 md:py-24" aria-label="Мощная картографическая платформа">
      <div className="rd-content-column">
        {/* Заголовок + подзаголовок */}
        <div className="flex flex-col items-center text-center">
          <h2 className="max-w-[1120px] font-involve text-[#050c26] text-[32px] md:text-[40px] font-medium leading-[1.15] md:leading-[44px] tracking-wide">
            Мощная картографическая платформа
          </h2>
          <p className="mt-4 max-w-[680px] font-[Raleway] text-base leading-6 tracking-tight text-[#646b85]">
            Всё необходимое для работы с геоданными — в одной системе
          </p>
        </div>

        {/* Контент: слева фичи, справа картинка */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,454px)_minmax(0,684px)] gap-8 lg:gap-10 items-center">
          {/* ФИЧИ */}
          <div className="flex flex-col gap-8 lg:pl-10">
            {features.map((f) => (
              <div key={f.title}>
                <h3 className="font-involve text-[#050c26] text-xl font-medium leading-7 tracking-wide">
                  {f.title}
                </h3>
                <p className="mt-2 max-w-[400px] font-[Raleway] text-base leading-6 tracking-tight text-[#646b85]">
                  {f.description}
                </p>
              </div>
            ))}
          </div>

          {/* КАРТИНКА */}
          <div className="bg-[#F6F7F9] rounded-[32px] flex items-center justify-center p-8 md:p-12 lg:p-[64px] min-h-[320px] md:min-h-[420px] lg:h-[548px]">
            <div className="relative w-full max-w-[600px] aspect-[16/10] md:translate-x-6 lg:translate-x-10">
              <Image
                src="/img/platform.webp"
                alt="Картографическая платформа Единая среда"
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 90vw, 600px"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
