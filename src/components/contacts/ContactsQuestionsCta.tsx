"use client";

import { useModal } from "@/components/ModalProvider";

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export default function ContactsQuestionsCta() {
  const modal = useModal() as { openConsult?: () => void };
  const consult = () => modal?.openConsult?.();

  return (
    <section className="bg-white w-full pb-16 md:pb-24" aria-label="Остались вопросы">
      <div className="rd-content-column">
        <div className="rounded-[32px] bg-[#F6F7F9] px-8 py-12 md:px-14 md:py-16">
          <h2 className="font-involve text-[#050c26] text-[28px] md:text-[36px] font-medium leading-[1.2] tracking-wide">
            Остались вопросы?
          </h2>
          <p className="mt-4 max-w-[560px] font-[Raleway] text-base md:text-lg leading-6 text-[#646b85]">
            Поговорите с нашим экспертом. Оставьте заявку в форме ниже, и мы перезвоним в удобное для вас время.
          </p>
          <button
            type="button"
            onClick={consult}
            className="mt-8 inline-flex items-center gap-3 h-[52px] px-8 rounded-xl bg-[#029cda] text-white text-base font-medium font-involve hover:bg-[#0288bd] transition-colors"
          >
            <PhoneIcon />
            Оставить заявку
          </button>
        </div>
      </div>
    </section>
  );
}
