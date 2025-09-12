"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface ModalBaseProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

const ModalBase: React.FC<ModalBaseProps> = ({ open, onClose, children, className = '', ariaLabel }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open && ref.current) {
      ref.current.focus();
    }
  }, [open]);

  if (!open) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={handleOverlayClick}
      tabIndex={-1}
      ref={ref}
      aria-modal="true"
      role="dialog"
      aria-label={ariaLabel}
    >
      <div className={`bg-white rounded-2xl shadow-lg relative flex flex-col ${className}`}>{children}</div>
    </div>
  );
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  bonusIcon?: string;
  leftBgColor?: string;
  leftTextColor?: string;
  children?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title = "Регистрация",
  description = "Укажите адрес электронной почты и пароль для доступа к платформе. Подтвердите ваш аккаунт и получите бонусы для старта!",
  bonusIcon = "/icons/bonus.svg",
  leftBgColor = "bg-[#0077FF]",
  leftTextColor = "text-white",
  children,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Очищаем контейнер перед вставкой
    const formContainer = document.getElementById("b24-register-form");
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={handleOverlayClick}>
      {/* Основная модалка */}
      <div className="w-full md:w-1/2 mx-auto m-2 flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-lg animate-fade-in relative">
        {/* Левая часть: фирменный блок (только на md+) */}
        <div className={`hidden md:flex md:w-1/2 ${leftBgColor} ${leftTextColor} flex-col justify-between p-4 md:p-6`}>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
            <p className="text-base md:text-lg mb-8">{description}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 flex flex-col items-start mt-auto">
            <div className="flex items-center gap-3 mb-2">
              <img src="/img/box.png" alt="Бонус" width={40} height={40} className="w-full h-full" />
            </div>
          </div>
        </div>
        {/* Правая часть: форма (на мобильных — вся модалка) */}
        <div className="w-full md:w-1/2 bg-white p-4 md:p-6 flex flex-col justify-center relative">
          <div className="flex items-center justify-between mb-6">
            {/* Заголовок только на мобильных, на десктопе скрыт */}
            <h2 className="text-2xl font-bold text-black md:hidden">{title}</h2>
            <button
              onClick={handleCloseClick}
              className="absolute top-4 right-4 text-gray-600 hover:text-[#0077FF] text-2xl md:text-3xl"
              aria-label="Закрыть модальное окно"
            >
              &times;
            </button>
          </div>
          {/* Заголовок и подзаголовок для мобильной версии (убираем дублирование) */}
          {/* <div className="block md:hidden mb-6">
            <h2 className="text-2xl font-bold mb-2 text-black">{title}</h2>
            <p className="text-base text-gray-600">{description}</p>
          </div> */}
          <div className="flex flex-col gap-4">
            {children}
          </div>
          {/* Bitrix24 форма */}
          <div className="mt-4">
            <div id="b24-register-form" />
          </div>
          <div className="mt-6 text-center text-sm text-gray-400">
            Есть аккаунт?{' '}
            <a
              href="https://edinayasreda.ru/"
              className="text-[#0077FF] font-medium hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Войти
            </a>
          </div>
        </div>
        {/* Подтверждающее окно */}
        {showConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
            <div className="bg-white rounded-2xl p-4 max-w-xs w-full shadow-xl flex flex-col items-center">
              <div className="text-lg font-medium mb-4 text-black text-center">
                Вы точно хотите закрыть окно?
              </div>
              <div className="flex gap-4 mt-2">
                <button onClick={handleConfirmClose} className="px-6 py-2 rounded-xl bg-[#0077FF] text-white font-medium hover:bg-[#005fcc]">
                  Да, закрыть
                </button>
                <button onClick={handleCancelClose} className="px-6 py-2 rounded-xl bg-gray-200 text-black font-medium hover:bg-gray-300">
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { ModalBase };
export default Modal;