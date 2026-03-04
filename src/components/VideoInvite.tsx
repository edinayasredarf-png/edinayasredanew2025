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
    <section className={`w-full flex justify-center items-center py-10 md:py-14 font-[Raleway] ${className}`}>
      <div className="w-full max-w-[1160px] px-2 mx-auto">
        <div className="w-full px-6 md:px-9 pt-[35px] pb-9 bg-white rounded-[20px] flex flex-col md:flex-row justify-between items-center gap-8 md:gap-10">
          {/* Текст */}
          <div className="flex-1 flex flex-col items-start text-center md:text-left gap-4">
            <h2 className="text-[#313131] text-[24px] md:text-[26.8px] font-medium leading-9">
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
              className="w-full md:w-[228px] h-[60px] px-2 py-2 bg-[#0077ff] hover:bg-[#0a6ae0] text-white rounded-xl font-medium leading-[44px] text-[16px] md:text-[19.38px]  "
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
