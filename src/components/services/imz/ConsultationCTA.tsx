"use client";
import Image from "next/image";

export default function ConsultationCTA({ onKP }: any) {
  return (
    <section className="max-w-[980px] mx-auto px-4 py-24">
      <div className="bg-white rounded-3xl p-2 flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div className="lg:w-1/2 flex flex-col justify-center p-6">
          <h2 className="text-[#313131] text-3xl md:text-[28px] font-medium leading-snug mb-6">
            Оставьте запрос на <br /> консультацию с индивидуальным расчетом
          </h2>
          <p className="text-[#7c8a9a] text-lg leading-relaxed mb-8">
            Стоимость зависит от площади кладбищ, состояния архивов и необходимого объема работ.
          </p>
          <button onClick={onKP} className="bg-[#029cda] hover:bg-[#0066db] text-white text-lg font-medium px-8 py-4 rounded-xl transition">
            Оставить заявку
          </button>
        </div>

        <div className="lg:w-1/2 bg-[#f6f7f9] rounded-2xl flex items-center justify-center p-6">
          <Image src="/img/imz_cta.png" alt="" width={320} height={320} />
        </div>
      </div>
    </section>
  );
}