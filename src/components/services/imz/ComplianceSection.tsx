"use client";
import Image from "next/image";

export default function ComplianceSection() {
  return (
    <section className="max-w-[1200px] mx-auto px-4">
      <div className="bg-white rounded-3xl p-2 flex flex-col lg:flex-row gap-6 lg:gap-10">
        <div className="lg:w-1/2 bg-[#f6f7f9] rounded-2xl flex items-center justify-center p-4">
          <Image src="/img/imz9.png" alt="" width={320} height={320} />
        </div>
        <div className="lg:w-1/2 flex flex-col justify-center px-4 py-8">
          <h3 className="text-[#313131] text-2xl font-medium mb-4">
            Соответствие требованиям государства и подготовка к единой базе
          </h3>
          <p className="text-[#7c8a9a] text-lg md:text-xl leading-relaxed">
            Инвентаризация мест захоронений выполняется с учетом действующих требований и будущей интеграции с государственными системами.
          </p>
        </div>
      </div>
    </section>
  );
}