"use client";
import React, { useEffect, useRef } from "react";
import Image from "next/image";
import MessengerRequestLinks from "./MessengerRequestLinks";

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
      <div className={` relative flex flex-col ${className}`}>
        {children}
      </div>
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
  title = "Оставьте заявку",
  description = "Заполните форму и менеджер свяжется с вами в ближайшее время для предоставления доступа к системе и уточнения деталей по услугам! ",
  bonusIcon = "/icons/bonus.svg",
  leftBgColor = "bg-[#029cda]",
  leftTextColor = "text-white",
  children,
}) => {
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
    <ModalBase open={open} onClose={onClose} ariaLabel={title}>
      <div className="w-full max-w-[420px] mx-auto m-2 bg-[#EEEEF8] rounded-[28px] p-6 flex flex-col font-[Raleway] animate-fade-in relative" onClick={e => e.stopPropagation()}>

        {/* Header с логотипом и крестиком */}
        <div className="flex items-center gap-3 mb-6 pr-10">
          <Image
            src="/icons/logo_modal.svg"
            alt="Логотип"
            width={52}
            height={52}
            className="w-13 h-13 flex-shrink-0"
          />
          <h2 className="text-2xl font-medium text-[#313131] flex-1">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Закрыть модальное окно"
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#313131" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {description && (
          <p className="text-[15px] text-[#7C8A9A] mb-5 leading-relaxed">{description}</p>
        )}

        {/* Форма */}
        <div className="flex flex-col gap-4">
          {children}
          <div id="b24-register-form" />
          <MessengerRequestLinks />
        </div>

        <div className="mt-6 text-center text-sm text-gray-400">
          Есть аккаунт?{' '}
          <a href="https://edinayasreda.ru/" className="text-[#029cda] font-medium hover:underline" target="_blank" rel="noopener noreferrer">
            Войти
          </a>
        </div>
      </div>
    </ModalBase>
  );
};

export { ModalBase };
export default Modal;
