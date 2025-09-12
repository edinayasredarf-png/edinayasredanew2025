import React from 'react';
import Image from 'next/image';
import Button from './Button';
import { useModal } from './ModalProvider';

interface HeroSectionProps {
  onTestClick?: () => void;
}

const HeroSection: React.FC = () => {
  const { openDemo } = useModal();
  return (
    <section className="bg-black text-white rounded-b-[20px] relative overflow-hidden min-h-[400px]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 relative z-10">
        <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-16">
          {/* Левая часть: текст (шире) */}
          <div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20">
            <h1 className="text-4xl sm:text-5xl md:text-[78px] font-medium leading-tight">
              Цифровое управление<br />территориями
            </h1>
            <p className="mt-8 text-xl sm:text-[27px] text-grey-92 max-w-2xl">
              Платформа для эффективного учёта, управления и мониторинга территорий и объектов в организациях любого типа и масштаба
            </p>
            <div className="mt-10">
              <Button onClick={openDemo} variant="primary" size="large" className="w-full md:w-auto">
                Протестировать
              </Button>
            </div>
          </div>
          {/* Правая часть: изображение (только для мобильных, на десктопе абсолютное) */}
          <div className="flex-1 w-full h-full relative flex justify-center items-end lg:hidden z-10">
            <Image
              src="/img/heroes.png"
              alt="Абстрактная иллюстрация цифрового управления"
              width={700}
              height={500}
              className="w-full max-w-[500px] object-contain"
              priority
              style={{ height: 'auto' }}
            />
          </div>
        </div>
        {/* Абсолютное изображение для десктопа — внутри контейнера */}
        <div className="hidden lg:block absolute right-0 bottom-0 z-10 w-[40%] max-w-[600px] h-auto pointer-events-none">
          <Image
            src="/img/heroes.png"
            alt="Абстрактная иллюстрация цифрового управления"
            width={700}
            height={500}
            className="w-full object-contain"
            priority
            style={{ height: 'auto' }}
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;