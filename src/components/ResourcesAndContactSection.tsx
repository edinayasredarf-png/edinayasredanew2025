"use client";

import Image from "next/image";

const resources = [
  {
    title: "С чего начать оцифровку своей территории",
    href: "/files/checklist-digital.pdf",
  },
  {
    title: "Какие требования сейчас к инвентаризации",
    href: "/files/checklist-inventory.pdf",
  },
];

export default function ResourcesAndContactSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="rd-content-column">
        {/* TOP CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {resources.map((item, index) => (
            <article
              key={index}
              className="
                bg-[#F6F7F9]
                rounded-[32px]
                p-8 md:p-10
                min-h-[258px]
                flex
                flex-col
                justify-between
              "
            >
              <h3
                className="
                  font-involve
                  text-[#222222]
                  text-[28px]
                  md:text-[32px]
                  font-medium
                  leading-[1.25]
                  max-w-[500px]
                "
              >
                {item.title}
              </h3>

              <a
                href={item.href}
                download
                className="
                  inline-flex
                  items-center
                  gap-3
                  text-[#029CDA]
                  font-involve
                  font-bold
                  text-lg
                  md:text-xl
                  hover:opacity-80
                  transition-opacity
                  w-fit
                "
              >
                Скачать чек-лист

                <span
                  className="
                    w-6
                    h-6
                    rounded-full
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                >
                  <Image
                    src="/icons/arrow-up-right.svg"
                    alt=""
                    width={12}
                    height={12}
                    className="object-contain"
                  />
                </span>
              </a>
            </article>
          ))}
        </div>

        {/* CTA BLOCK */}
        <div
          className="
            relative
            mt-4
            overflow-hidden
            rounded-[32px]
            bg-[#029CDA]
            min-h-[200px]
          "
        >
          {/* Background Pattern */}
          <div
            className="
              absolute
              right-0
              top-0
              h-full
              w-[220px]
              hidden
              md:block
              pointer-events-none
            "
          >
            <Image
              src="/img/contact-pattern.svg"
              alt=""
              fill
              className="object-contain object-right"
            />
          </div>

          <div
            className="
              relative
              z-10
              flex
              flex-col
              justify-between
              h-full
              p-8
              md:px-10
              md:py-10
            "
          >
            <h3
              className="
                font-involve
                text-white
                text-[24px]
                md:text-[32px]
                font-medium
                leading-[1.3]
                max-w-[700px]
              "
            >
              Напишите нам — проконсультируем
              <br className="hidden md:block" />
              и поможем подобрать тариф под ваши задачи
            </h3>

            <div className="flex items-center gap-4 mt-8">
              <a
                href="https://t.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  w-10
                  h-10
                  bg-white
                  rounded-full
                  flex
                  items-center
                  justify-center
                  hover:scale-105
                  transition-transform
                "
              >
                <Image
                  src="/icons/telegram.svg"
                  alt="Telegram"
                  width={22}
                  height={22}
                />
              </a>

              <a
                href="#"
                className="
                  w-10
                  h-10
                  bg-white
                  rounded-full
                  flex
                  items-center
                  justify-center
                  hover:scale-105
                  transition-transform
                "
              >
                <Image
                  src="/icons/max.svg"
                  alt="MAX"
                  width={22}
                  height={22}
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}