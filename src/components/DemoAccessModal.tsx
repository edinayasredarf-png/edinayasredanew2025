"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ModalBase } from './Modal';

interface DemoAccessModalProps {
  open: boolean;
  onClose: () => void;
}

const DemoAccessModal: React.FC<DemoAccessModalProps> = ({ open, onClose }) => {
  const [showConfirm, setShowConfirm] = useState(false);

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
        var s = d.createElement(\"script\");
        s.async = true;
        s.src = u + \"?\" + ((Date.now() / 180000) | 0);
        var h = d.getElementsByTagName(\"script\")[0];
        h.parentNode.insertBefore(s, h);
      })(window, document, \"https://cdn-ru.bitrix24.ru/b32921504/crm/form/loader_99.js\");
    `;
    formContainer?.appendChild(script);
  }, [open]);

  if (!open) return null;

  // Обработка клика по оверлею
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setShowConfirm(true);
    }
  };

  // Обработка крестика
  const handleCloseClick = () => {
    setShowConfirm(true);
  };

  // Подтверждение закрытия
  const handleConfirmClose = () => {
    setShowConfirm(false);
    onClose();
  };

  // Отмена закрытия
  const handleCancelClose = () => {
    setShowConfirm(false);
  };

  return (
    <ModalBase open={open} onClose={onClose} ariaLabel="Демо-доступ">
      {/* Уникальный контент демо-модалки */}
      <div className="w-full md:w-[400px] p-4 md:p-6 flex flex-col justify-center relative">
        <button
          onClick={handleCloseClick}
          className="absolute top-6 right-6 md:top-8 md:right-8 text-gray-600 hover:text-[#0077FF] text-2xl md:text-3xl"
          aria-label="Закрыть модальное окно"
        >
          &times;
        </button>
        <div className="block mb-6">
          <h2 className="text-2xl font-bold mb-2 text-black">Демо-доступ</h2>
          <p className="text-base text-gray-600">Получите бесплатный демо-доступ к платформе, чтобы ознакомиться с её возможностями и интерфейсом.</p>
        </div>
        {/* Bitrix24 форма и остальной контент остаются */}
        <div className="mt-4">
          <div id="b24-demo-form" />
        </div>
      </div>
      {showConfirm && (
        <ModalBase open={showConfirm} onClose={handleCancelClose} ariaLabel="Подтверждение закрытия">
          <div className="p-4 max-w-xs w-full flex flex-col items-center">
            <div className="text-lg font-medium mb-4 text-black text-center">Вы точно хотите закрыть окно?</div>
            <div className="flex gap-4 mt-2">
              <button onClick={handleConfirmClose} className="px-6 py-2 rounded-xl bg-[#0077FF] text-white font-medium hover:bg-[#005fcc]">Да, закрыть</button>
              <button onClick={handleCancelClose} className="px-6 py-2 rounded-xl bg-gray-200 text-black font-medium hover:bg-gray-300">Отмена</button>
            </div>
          </div>
        </ModalBase>
      )}
    </ModalBase>
  );
};

export default DemoAccessModal; 