"use client";

import React from 'react';
import Image from 'next/image';

interface CardProps {
  size?: 'big' | 'small';
  imageSrc?: string;
  imageAlt?: string;
  title: string;
  description: string;
  textColor?: string;
  descColor?: string;
}

const Card: React.FC<CardProps> = ({ size = 'small', imageSrc, imageAlt, title, description, textColor = 'text-black-solid', descColor = 'text-grey-600' }) => {
  return (
    <div
      className={`bg-white rounded-4xl p-3 md:p-4 h-auto flex ${size === 'big' ? 'flex-col md:flex-row md:col-span-2 lg:col-span-2 gap-2' : 'flex-col gap-2'} transition-all duration-300 hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-grey-97`}
    >
      {imageSrc && (
        <div className="bg-[#F6F7F9] rounded-xl md:rounded-2xl flex items-center justify-center w-full h-28 md:w-32 md:h-32 flex-shrink-0 mx-[1px] md:mx-0 mt-0 mb-0">
          <Image src={imageSrc} alt={imageAlt || ''} width={96} height={96} className="object-contain max-w-[90%] max-h-[90%]" onError={e => e.currentTarget.style.display='none'} />
        </div>
      )}
      <div className={`flex flex-col justify-center h-full pl-2 md:pl-4 ${size === 'big' ? 'md:pl-0 flex-1' : ''}`}>
        <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
          <h3 className={`text-xl font-medium ${textColor} text-center md:text-left`}>{title}</h3>
        </div>
        <p className={`text-base ${descColor} text-center md:text-left mx-auto md:mx-0`}>{description}</p>
      </div>
    </div>
  );
};

export default Card; 