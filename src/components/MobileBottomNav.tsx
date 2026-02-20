"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { key: "home", label: "Главная", href: "/" },
  { key: "services", label: "Услуги", href: "/services" },
  { key: "cases", label: "Кейсы", href: "/cases" },
  { key: "blog", label: "Блог", href: "/blog" },
  { key: "profile", label: "Профиль", href: "/profile" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-0 z-[120] md:hidden pointer-events-none pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto w-full max-w-[480px] px-3 pb-3">
        <div className="pointer-events-auto w-full rounded-[296px] border border-white/55 bg-[#f7f7f7]/75 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-[20px]">
          <div className="relative flex items-stretch gap-1 overflow-hidden rounded-[296px] px-2 py-2">
            {/* Фон «жидкое стекло» (как в референсе) */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -inset-8 opacity-70">
                <div className="absolute -inset-10 bg-white" />
                <div className="absolute inset-6 rounded-full bg-black/5 blur-[10px] backdrop-blur-[20px]" />
              </div>
              <div className="absolute inset-0 rounded-[296px] bg-[#f7f7f7]" />
              <div className="absolute inset-0 rounded-[296px] bg-black/0" />
            </div>

            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <div
                  key={item.key}
                  className="relative flex-1 min-w-[60px] flex items-stretch justify-center"
                >
                  {active && (
                    <motion.div
                      layoutId="mobile-nav-pill"
                      className="absolute inset-y-[4px] left-[2px] right-[2px] rounded-[100px] bg-[#E9EAEC]/90 shadow-[0_6px_20px_rgba(0,0,0,0.12)]"
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 32,
                      }}
                    />
                  )}

                  <Link
                    href={item.href}
                    className={`relative z-10 flex flex-col items-center justify-center gap-px px-2 ${
                      active ? "pt-1.5 pb-[7px]" : "pt-[9px] pb-[7px]"
                    }`}
                  >
                    <NavIcon name={item.key} active={active} />
                    <span
                      className={`text-[10px] leading-3 font-['Raleway'] ${
                        active
                          ? "text-[#008bff] font-bold"
                          : "text-[#313131] font-medium"
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const NavIcon: React.FC<{ name: string; active: boolean }> = ({
  name,
  active,
}) => {
  const stroke = active ? "#0077FF" : "#313131";

  switch (name) {
    case "home":
      return (
        <div className="w-6 h-6 relative">
          <div
            className="absolute left-[5px] top-[5px] w-3.5 h-[16px] rounded-[2px]"
            style={{ outline: `2px solid ${stroke}`, outlineOffset: -1 }}
          />
          <div
            className="absolute left-[9.5px] top-[15px] w-[5px] h-1.5 rounded-[2px]"
            style={{ border: `2px solid ${stroke}` }}
          />
        </div>
      );
    case "services":
      return (
        <div className="w-6 h-6 relative">
          <div
            className="absolute left-[8px] top-[8px] w-[5px] h-2 origin-top-left -rotate-90 rounded-full"
            style={{ outline: `2px solid ${stroke}`, outlineOffset: -1 }}
          />
        </div>
      );
    case "cases":
      return (
        <div className="w-6 h-6 relative">
          <div
            className="absolute left-[3px] top-[3px] w-[18px] h-[18px] rounded-[3px]"
            style={{ outline: `2px solid ${stroke}`, outlineOffset: -1 }}
          />
          <div
            className="absolute left-[3px] top-[7px] w-[18px] h-1 rounded-[2px]"
            style={{ outline: `2px solid ${stroke}`, outlineOffset: -1 }}
          />
          <div
            className="absolute left-[7px] top-[16px] w-2 h-[2px] rounded-[2px]"
            style={{ border: `2px solid ${stroke}` }}
          />
        </div>
      );
    case "blog":
      return (
        <div className="w-6 h-6 relative">
          <div
            className="absolute left-[5px] top-[5px] w-[13px] h-4 rounded-[2px]"
            style={{ outline: `2px solid ${stroke}`, outlineOffset: -1 }}
          />
        </div>
      );
    case "profile":
      return (
        <div className="w-6 h-6 relative">
          <div
            className="absolute left-[9px] top-[7px] w-1.5 h-1.5 rounded-full"
            style={{ outline: `2px solid ${stroke}`, outlineOffset: -1 }}
          />
          <div
            className="absolute left-[3px] top-[3px] w-[18px] h-[18px] rounded-full"
            style={{ outline: `2px solid ${stroke}`, outlineOffset: -1 }}
          />
          <div
            className="absolute left-[6px] top-[15px] w-3 h-[7px] rounded-[2px]"
            style={{ backgroundColor: stroke }}
          />
        </div>
      );
    default:
      return null;
  }
};

export default MobileBottomNav;

