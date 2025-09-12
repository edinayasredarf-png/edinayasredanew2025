"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ModalBase } from './Modal';

interface KPModalProps {
  open: boolean;
  onClose: () => void;
}

const KPModal: React.FC<KPModalProps> = ({ open, onClose }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!open) return;
    const formContainer = document.getElementById("b24-kp-form");
    if (formContainer) formContainer.innerHTML = "";
    const script = document.createElement("script");
    script.setAttribute("data-b24-form", "inline/101/5ywm2s");
    script.setAttribute("data-skip-moving", "true");
    script.innerHTML = `
      (function (w, d, u) {
        var s = d.createElement(\"script\");
        s.async = true;
        s.src = u + \"?\" + ((Date.now() / 180000) | 0);
        var h = d.getElementsByTagName(\"script\")[0];
        h.parentNode.insertBefore(s, h);
      })(window, document, \"https://cdn-ru.bitrix24.ru/b32921504/crm/form/loader_101.js\");
    `;
    formContainer?.appendChild(script);
  }, [open]);

  if (!open) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setShowConfirm(true);
    }
  };

  const handleCloseClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmClose = () => {
    setShowConfirm(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowConfirm(false);
  };

  return (
    <>
      <ModalBase open={open} onClose={onClose} ariaLabel="Запросить КП">
        <div className="w-full md:w-[400px] p-4 flex flex-col justify-center relative">
          <div className="flex items-center gap-3 mb-6" style={{paddingTop: '1rem', paddingLeft: '1rem', paddingRight: '1rem'}}>
            <img src="/icons/logo-mobile-black.svg" alt="Логотип" width={40} height={40} className="w-10 h-10" onError={e => e.currentTarget.style.display='none'} />
            <h2 className="text-2xl md:text-2xl font-medium text-gray-800 flex-1">Запросить КП</h2>
            <button
              onClick={handleCloseClick}
              className="text-gray-600 hover:text-[#0077FF] text-2xl md:text-3xl"
              aria-label="Закрыть модальное окно"
            >
              &times;
            </button>
          </div>
          <div className="flex flex-col gap-4">
            <p className="text-gray-600 text-center px-4">
              Оставьте ваши контактные данные — мы подготовим индивидуальное коммерческое предложение и свяжемся с вами для уточнения деталей.
            </p>
            <div id="b24-kp-form" />
          </div>
        </div>
      </ModalBase>
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
    </>
  );
};

export default KPModal; 