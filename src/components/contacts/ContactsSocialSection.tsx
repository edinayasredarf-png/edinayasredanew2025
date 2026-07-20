"use client";

import Image from "next/image";

const socials = [
  { name: "Max", href: "https://max.ru/id6150100608_biz", icon: "/icons/max.svg" },
  { name: "Telegram", href: "https://t.me/edinayasredarf", icon: "/icons/tg.svg" },
  { name: "ВКонтакте", href: "https://vk.com/edinayasredarf", icon: "/icons/vk.svg" },
  { name: "VK Видео", href: "https://vkvideo.ru/@edinayasreda", icon: "/icons/vkvideo.svg" },
  { name: "YouTube", href: "https://youtube.com/@edinayasreda", icon: "/icons/youtube.svg" },
  { name: "Dzen", href: "https://dzen.ru/edinayasreda", icon: "/icons/dzen.svg" },
];

export default function ContactsSocialSection() {
  return (
    <section className="bg-white w-full py-12 md:py-16" aria-label="Мы в социальных сетях">
      <div className="rd-content-column">
        <h2 className="text-center font-involve text-[#050c26] text-[28px] md:text-[36px] font-medium leading-[1.2] tracking-wide">
          Мы в социальных сетях
        </h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
          {socials.map((s) => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.name}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F6F7F9] transition-colors hover:bg-[#E9EBEF]"
            >
              <Image src={s.icon} alt="" width={38} height={38} className="h-[38px] w-[38px] object-contain" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
