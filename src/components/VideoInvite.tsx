'use client';

import React from 'react';
import Button from './Button';
import { useModal } from './ModalProvider';

interface VideoInviteProps {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  className?: string;
}

const VideoInvite: React.FC<VideoInviteProps> = ({
  title = 'Узнайте о всех преимуществах системы на видеовстрече',
  subtitle = 'Расскажем про систему, как может помочь в работе на примере вашей территории, покажем как «Единая Среда» ускоряет инвентаризацию, контроль и отчётность.',
  ctaLabel = 'Записаться',
  className = '',
}) => {
  const { openDemo } = useModal();

  return (
    <section className={`bg-white w-full py-10 md:py-14 lg:py-16 font-[Raleway] ${className}`}>
      <div className="rd-content-column">
        <div className="w-full px-6 md:px-9 pt-8 md:pt-9 pb-8 md:pb-9 rd-block rounded-2xl flex flex-col md:flex-row justify-between items-center gap-8 md:gap-10">
          {/* Текст */}
          <div className="flex-1 flex flex-col items-start text-center md:text-left gap-4">
            <h2 className="font-involve text-[#313131] text-[clamp(1.25rem,3vw,1.7rem)] leading-[1.3]">
              {title}
            </h2>
            <p className="text-[#7c8a9a] text-[16.5px] md:text-[18.91px] font-medium leading-7">
              {subtitle}
            </p>
          </div>

          <div className="w-full md:w-auto">
            <Button
              onClick={openDemo}
              variant="primary"
              size="large"
              className="w-full md:w-[228px] h-[60px] px-2 py-2 bg-[#029cda] hover:bg-[#029cda]/90 text-white rounded-xl font-medium leading-[44px] text-[16px] md:text-[19.38px]  "
            >
              {ctaLabel}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoInvite;
