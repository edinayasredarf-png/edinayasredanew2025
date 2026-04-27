"use client";

import Image from "next/image";
import React from "react";

const MAX_URL = "https://max.ru/u/f9LHodD0cOK1BljWQVdQUmREhda821o6xBdsfe8i81sZg62tI3MEXi2sUPw";
const TELEGRAM_URL = "https://t.me/edinayasreda";
const VK_URL = "https://vk.com/im/convo/-213906731?entrypoint=community_page&tab=all";

type Props = {
  className?: string;
  title?: string;
};

export default function MessengerRequestLinks({
  className = "",
  title = "Написать нам в мессенджерах",
}: Props) {
  return (
    <div className={className}>
      <div className="mt-4 rounded-xl border border-dashed border-[#0077FF] bg-[#F6F7F9] px-4 py-3">
        <div className="text-center text-sm font-medium text-[#313131]">{title}</div>
        <div className="mt-2 flex items-center justify-center gap-4">
          <a href={MAX_URL} title="Max" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
            <Image src="/icons/max-blue.svg" alt="Max" width={32} height={32} />
          </a>
					<a
            href={TELEGRAM_URL}
            title="Telegram"
            aria-label="Написать в Telegram"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <Image src="/icons/tg-blue.svg" alt="Telegram" width={32} height={32} />
          </a>

          <a
            href={VK_URL}
            title="Вконтакте"
            aria-label="Написать в Вконтакте"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <Image src="/icons/vk-blue.svg" alt="Вконтакте" width={32} height={32} />
          </a>

        </div>
      </div>
    </div>
  );
}

