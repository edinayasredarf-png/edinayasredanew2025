"use client";
import React, { useEffect } from "react";
import Image from "next/image";
import { ModalBase } from './Modal';

interface DemoAccessModalProps {
  open: boolean;
  onClose: () => void;
}

const DemoAccessModal: React.FC<DemoAccessModalProps> = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;

    // Очищаем контейнер перед вставкой
    const formContainer = document.getElementById("b24-demo-form");
    if (formContainer) formContainer.innerHTML = "";

    // Вставляем Bitrix24-форму
    const script = document.createElement("script");
    script.setAttribute("data-b24-form", "inline/99/q3wj75");
    script.setAttribute("data-skip-moving", "true");
    script.innerHTML = `
      (function (w, d, u) {
        var s = d.createElement("script");
        s.async = true;
        s.src = u + "?" + ((Date.now() / 180000) | 0);
        var h = d.getElementsByTagName("script")[0];
        h.parentNode.insertBefore(s, h);
      })(window, document, "https://cdn-ru.bitrix24.ru/b32921504/crm/form/loader_99.js");
    `;
    formContainer?.appendChild(script);
  }, [open]);

  if (!open) return null;

  return (
    <ModalBase open={open} onClose={onClose} ariaLabel="Демо-доступ">
      <div className=" bg-[#EEEEF8] rounded-[28px] relative w-full md:w-[400px] p-6 flex flex-col font-[Raleway]">

        {/* Крестик */}
        <button
          onClick={onClose}
          aria-label="Закрыть модальное окно"
          className="
            absolute top-4 right-4
            w-10 h-10
            flex items-center justify-center
            rounded-full
            hover:bg-gray-100
            transition
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#313131"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header с логотипом */}
        <div className="flex items-center gap-3 mb-6">
          <Image
            src="/icons/logo_modal.svg"
            alt="Логотип"
            width={40}
            height={40}
            className="w-14 h-14"
          />
          <h2 className="text-2xl font-bold text-[#313131]">
            Демо-доступ
          </h2>
        </div>

        {/* Описание */}
        <p className="text-medium text-[#7C8A9A] mb-4">
          Получите бесплатный демо-доступ к платформе, чтобы ознакомиться с её возможностями и интерфейсом.
        </p>

        {/* Bitrix24 форма */}
        <div id="b24-demo-form" />
      </div>
    </ModalBase>
  );
};

export default DemoAccessModal;
