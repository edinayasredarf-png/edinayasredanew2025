"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { useModal } from "./ModalProvider";

const NAV_ITEMS_DEFAULT = [
  {
    key: "services",
    label: "Услуги",
    href: "/services",
    icon: "/icons/navbar/services.svg",
    iconActive: "/icons/navbar/services_active.svg",
  },
  {
    key: "cases",
    label: "Кейсы",
    href: "/cases",
    icon: "/icons/navbar/cases.svg",
    iconActive: "/icons/navbar/cases_active.svg",
  },
  {
    key: "company",
    label: "Компания",
    href: "/about",
    icon: "/icons/navbar/home.svg",
    iconActive: "/icons/navbar/home_active.svg",
  },
  {
    key: "blog",
    label: "Блог",
    href: "/blog",
    icon: "/icons/navbar/blog.svg",
    iconActive: "/icons/navbar/blog_active.svg",
  },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { openRegister } = useModal();
  const navItems = NAV_ITEMS_DEFAULT;
  const activeIndex = navItems.findIndex((item) => isActive(pathname, item.href));

  return (
    <>
      {/* MOBILE: возвращено как было */}
      <div className="fixed inset-x-0 bottom-0 z-[120] md:hidden pointer-events-none pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto w-full max-w-[480px] px-3 pb-3">
          <div className="pointer-events-auto w-full rounded-[28px] border border-white/60 bg-[#F6F7F9]/80 shadow-[0_10px_40px_rgba(0,0,0,0.12)] backdrop-blur-[30px]">
            <div className="relative flex items-stretch rounded-[28px] px-2 py-2">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-white/50 to-white/30" />
                <div className="absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.8),transparent_70%)]" />
              </div>

              {activeIndex !== -1 && (
                <motion.div
                  layoutId="mobile-nav-pill"
                  className="absolute top-2 bottom-2 rounded-[18px] bg-gradient-to-b from-white to-gray-50 shadow-[0_2px_8px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.04)]"
                  style={{
                    width: `calc((100% - 1rem) / ${navItems.length})`,
                    left: `calc(0.5rem + ((100% - 1rem) / ${navItems.length}) * ${activeIndex})`,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {navItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <div key={item.key} className="relative flex-1 min-w-0 flex items-stretch justify-center">
                    <Link href={item.href} className="relative z-10 flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 w-full">
                      <motion.div
                        animate={{ scale: active ? 1.1 : 1, y: active ? -1 : 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="relative w-6 h-6"
                      >
                        <NavIcon
                          icon={item.icon}
                          iconActive={item.iconActive}
                          active={active}
                          label={item.label}
                        />
                      </motion.div>
                      <motion.span
                        animate={{ scale: active ? 1 : 0.95, opacity: active ? 1 : 0.7 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={`text-[10px] leading-[12px] whitespace-nowrap ${active ? "text-[#007AFF] font-semibold" : "text-[#8E8E93] font-medium"}`}
                      >
                        {item.label}
                      </motion.span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP: в том же стиле с плавным тоглом */}
      <div className="hidden fixed inset-x-0 bottom-0 z-[110] pointer-events-none pb-4">
        <div className="mx-auto max-w-[620px] px-4">
          <div className="pointer-events-auto inline-flex w-full items-center gap-2">
            <div className="relative h-[64px] flex-1 rounded-2xl bg-[#F6F7F9]/20 border border-white/50 shadow-[0px_20px_30px_0px_rgba(0,0,0,0.08),0px_8px_12px_0px_rgba(0,0,0,0.05)] backdrop-blur-[20px] overflow-hidden">
              {activeIndex !== -1 && (
                <motion.div
                  layoutId="desktop-nav-pill"
                  className="absolute top-[6px] bottom-[6px] rounded-xl bg-[#F6F7F9]"
                  style={{
                    width: `calc((100% - 0.75rem) / ${navItems.length})`,
                    left: `calc(0.375rem + ((100% - 0.75rem) / ${navItems.length}) * ${activeIndex})`,
                  }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <div
                className="relative z-10 grid h-full gap-2 p-2"
                style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
              >
                {navItems.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className="h-full rounded-xl flex flex-col items-center justify-center gap-0.5"
                    >
                      <motion.div
                        animate={{ scale: active ? 1.06 : 1, y: active ? -1 : 0 }}
                        transition={{ type: "spring", stiffness: 380, damping: 28 }}
                        className="relative w-5 h-5"
                      >
                        <NavIcon
                          icon={item.icon}
                          iconActive={item.iconActive}
                          active={active}
                          label={item.label}
                        />
                      </motion.div>
                      <span className={`text-[12px] leading-4 font-medium font-[Raleway] ${active ? "text-[#313131]" : "text-[#313131]/60"}`}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={openRegister}
              className="w-[130px] h-[64px] rounded-2xl bg-[#029cda] text-white shadow-[0px_20px_30px_0px_rgba(0,0,0,0.08),0px_8px_12px_0px_rgba(0,0,0,0.05)] backdrop-blur-[20px] flex items-center justify-center"
            >
              <div className="w-[118px] h-[52px] rounded-xl bg-[#029cda] flex flex-col items-center justify-center gap-0.5">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                  <path d="M12 3a1 1 0 0 1 1 1v7h7a1 1 0 1 1 0 2h-7v7a1 1 0 1 1-2 0v-7H4a1 1 0 1 1 0-2h7V4a1 1 0 0 1 1-1Z" />
                </svg>
                <span className="text-[12px] leading-4 font-medium font-[Raleway]">
                  Оставить заявку
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const NavIcon: React.FC<{
  icon: string;
  iconActive: string;
  active: boolean;
  label: string;
}> = ({ icon, iconActive, active, label }) => {
  return (
    <motion.div animate={{ opacity: 1 }} className="absolute inset-0">
      <Image
        src={active ? iconActive : icon}
        alt={label}
        fill
        className="object-contain"
        style={active ? undefined : { filter: "brightness(0) saturate(100%) opacity(0.5)" }}
      />
    </motion.div>
  );
};

export default MobileBottomNav;