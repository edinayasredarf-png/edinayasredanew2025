import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Button from './Button';
import { useModal } from './ModalProvider';

type SmallCardProps = {
  title: React.ReactNode;
  text: React.ReactNode;
  textColor?: string;
  titleColor?: string;
  className?: string;
};

const SmallCard = ({ title, text, textColor = 'text-gray-500', titleColor = 'text-black', className = '' }: SmallCardProps) => (
  <div className={`outline outline-[6px] outline-white rounded-3xl p-4 text-center flex flex-col justify-center h-auto ${className}`}>
    <h3 className={`text-lg md:text-xl font-medium ${titleColor} leading-snug mb-2`}>
      {title}
    </h3>
    <p className={`${textColor} text-sm md:text-base lg:text-lg leading-snug`}>
      {text}
    </p>
  </div>
);

type StackCardProps = {
  icon: string;
  text: React.ReactNode;
};

const StackCard = ({ icon, text }: StackCardProps) => (
  <div className="outline outline-[6px] outline-white rounded-3xl flex items-center p-4 min-h-[80px]">
    <div className="w-12 h-12 bg-grey-97 rounded-xl flex-shrink-0 flex items-center justify-center mr-4">
      <Image src={icon} alt="" width={48} height={48} className="object-contain aspect-square" />
    </div>
    <div className="text-black text-sm md:text-base lg:text-lg leading-snug">
      {text}
    </div>
  </div>
);

const SectionBestSolution: React.FC = () => {
  const { openDemo } = useModal();
  return (
    <section className="max-w-[1480px] mx-auto px-5 md:px-8 mt-16">
      <h2 className="text-center text-black text-2xl md:text-4xl lg:text-[50px] font-medium leading-[1.1] mb-12">
        Единая Среда лучшее решение
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Блок 1: Большой */}
        <div className="outline outline-[6px] outline-white rounded-3xl flex flex-col md:flex-row items-center p-4 h-full lg:col-span-2 md:col-span-1 group">
          <div className="bg-[#0077FF] flag-animate rounded-xl md:rounded-2xl flex items-center justify-center w-28 h-28 md:w-36 md:h-36 flex-shrink-0 m-2">
            <Image
              src="/icons/logo-small.svg"
              alt="Проверка подрядчиков"
              width={80}
              height={80}
              className="object-contain aspect-square max-w-full max-h-full"
            />
          </div>
          <h3 className="text-lg md:text-xl font-medium text-black text-center md:text-left mt-3 md:mt-0 md:ml-6 leading-snug">
            Полностью отечественный продукт
          </h3>
        </div>

        {/* Блок 2: Большой */}
        <div className="outline outline-[6px] outline-white rounded-3xl flex flex-col md:flex-row items-center gap-6 p-6 h-full lg:col-span-2 md:col-span-1">
          <div className="flex-grow text-center md:text-left">
            <p className="text-black text-sm md:text-lg lg:text-xl leading-snug">
              Находится в реестре российского ПО
            </p>
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mt-3 mx-auto md:mx-0">
              <Link
                href="https://reestr.digital.gov.ru/reestr/685429/?sphrase_id=6357918"
                target="_blank"
                className="inline-flex items-center gap-2 text-black text-sm md:text-lg lg:text-xl font-medium group"
              >
                <svg
                  className="w-5 h-5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
          <Image
            src="/img/sertificats.png"
            alt="Реестр ПО"
            width={160}
            height={160}
            className="w-24 h-24 md:w-36 md:h-36 object-contain aspect-square mx-auto md:mx-0"
          />
        </div>

        {/* Блок 3: Малый */}
        <SmallCard title="Серверы находятся все на территории РФ" text="" />

        {/* Блок 4: Малый */}
        <SmallCard title="Облачное решение" text="Доступ к системе из любой точки" />

        {/* Блок 5 и 6: Стек из двух узких */}
        <div className="lg:col-span-2 md:col-span-2 flex flex-col gap-4">
          <StackCard icon="/icons/icon1.svg" text="Единая отказоустойчивая архитектура с резервированием" />
          <StackCard icon="/icons/icon2.svg" text="Ежедневная работа над появлением новых функций" />
        </div>

        {/* Блок 7: Малый */}
        <SmallCard title="Мультисистема" text="Большой функционал системы" textColor="text-black" />

        {/* Блок 8: Малый */}
        <SmallCard
          title={<span className="font-medium text-black leading-tight text-lg md:text-xl lg:text-2xl">24/7</span>}
          text={<>Ваша «IT-служба<br />одного окна»</>}
        />

        {/* Блок 9: Большой */}
        <div className="outline outline-[6px] outline-white rounded-3xl p-4 text-center flex flex-col justify-center h-full lg:col-span-2 md:col-span-2">
          <h3 className="font-medium text-black leading-snug mb-2 text-lg md:text-xl lg:text-2xl">
            Обучение и поддержка
          </h3>
          <p className="text-gray-500 text-sm md:text-base lg:text-lg leading-snug">
            Обучение вашей команды и экспертная поддержка
          </p>
        </div>
      </div>

      {/* Кнопка */}
      <div className="flex justify-center mt-10">
        <Button onClick={openDemo} variant="primary" size="large" className="w-full md:w-auto">
          Протестировать
        </Button>
      </div>
    </section>
  );
};

export default SectionBestSolution;
