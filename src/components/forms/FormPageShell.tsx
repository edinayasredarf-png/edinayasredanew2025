'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { RedesignHeader } from '@/components/redesign/RedesignHeader';
import { RedesignFooter } from '@/components/redesign/RedesignFooter';

interface FormPageShellProps {
  title: string;
  description?: string;
  /** Bitrix24 form id, e.g. "inline/95/lw93ha" */
  b24Form: string;
  /** Bitrix24 loader number, e.g. 95 */
  b24Loader: number;
  /** unique DOM container id */
  containerId: string;
}

export default function FormPageShell({
  title,
  description,
  b24Form,
  b24Loader,
  containerId
}: FormPageShellProps) {
  const injected = useRef(false);

  useEffect(() => {
    if (injected.current) return;
    injected.current = true;

    const container = document.getElementById(containerId);
    if (!container) return;

    const script = document.createElement('script');
    script.setAttribute('data-b24-form', b24Form);
    script.setAttribute('data-skip-moving', 'true');
    script.innerHTML = `
      (function(w,d,u){
        var s=d.createElement('script');
        s.async=true;
        s.src=u+'?'+((Date.now()/180000)|0);
        var h=d.getElementsByTagName('script')[0];
        h.parentNode.insertBefore(s,h);
      })(window,document,'https://cdn-ru.bitrix24.ru/b32921504/crm/form/loader_${b24Loader}.js');
    `;
    container.appendChild(script);
  }, [b24Form, b24Loader, containerId]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F9] font-[Raleway]">
      <RedesignHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-[460px]">
          {/* Card */}
          <div className="bg-white rounded-[28px] p-8">
            {/* Logo + title */}
            <div className="flex items-center gap-3 mb-6">
              <Image
                src="/icons/logo_modal.svg"
                alt="Единая среда"
                width={52}
                height={52}
                className="w-13 h-13 flex-shrink-0"
              />
              <h1 className="text-[22px] font-semibold text-[#313131] leading-tight">
                {title}
              </h1>
            </div>

            {description && (
              <p className="text-[15px] text-[#7C8A9A] mb-5 leading-relaxed">
                {description}
              </p>
            )}

            {/* Bitrix24 form */}
            <div id={containerId} />

          </div>

          {/* Back link */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-[#7C8A9A] hover:text-[#029cda] transition-colors"
            >
              ← Вернуться на главную
            </Link>
          </div>
        </div>
      </main>

      <RedesignFooter />
    </div>
  );
}
