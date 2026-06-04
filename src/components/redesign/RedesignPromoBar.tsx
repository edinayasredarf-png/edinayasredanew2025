'use client';

import Link from 'next/link';

export function RedesignPromoBar() {
  return (
    <div className="w-full bg-[#029cda] text-white h-11 flex items-center justify-center px-4 relative z-[60]">
      <Link
        href="/welcome-bonus"
        className="inline-flex items-center gap-2 text-sm md:text-base font-medium font-[Inter] hover:opacity-90 transition-opacity text-center"
      >
        <span>Ещё не используете Единую среду? Вам скидка тут</span>
        <svg className="w-2 h-2 shrink-0 opacity-90" viewBox="0 0 8 14" fill="none" aria-hidden>
          <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </div>
  );
}
