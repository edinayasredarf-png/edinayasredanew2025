"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const NAV_ITEMS = [
  {
    key: "home",
    label: "Главная",
    href: "/",
    icon: "/icons/navbar/home.svg",
    iconActive: "/icons/navbar/home_active.svg", // если есть отдельная активная версия
  },
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
    key: "blog",
    label: "Блог",
    href: "/blog",
    icon: "/icons/navbar/blog.svg",
    iconActive: "/icons/navbar/blog_active.svg",
  },
  {
    key: "profile",
    label: "Профиль",
    href: "/profile",
    icon: "/icons/navbar/profile.svg",
    iconActive: "/icons/navbar/profile_active.svg",
  },
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
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="pointer-events-auto w-full rounded-[28px] border border-white/60 bg-white/80 shadow-[0_10px_40px_rgba(0,0,0,0.12)] backdrop-blur-[30px]"
        >
          <div className="relative flex items-stretch gap-0.5 overflow-hidden rounded-[28px] px-2 py-2">
            {/* Фон */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-white/50 to-white/30" />
              <div className="absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.8),transparent_70%)]" />
            </div>

            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <div
                  key={item.key}
                  className="relative flex-1 min-w-[60px] flex items-stretch justify-center"
                >
                  <AnimatePresence mode="wait">
                    {active && (
                      <motion.div
                        layoutId="mobile-nav-pill"
                        className="absolute inset-y-1 left-0.5 right-0.5 rounded-[18px] bg-gradient-to-b from-white to-gray-50 shadow-[0_2px_8px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.04)]"
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 35,
                        }}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                      />
                    )}
                  </AnimatePresence>

                  <Link
                    href={item.href}
                    className="relative z-10 flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 w-full"
                  >
                    <motion.div
                      animate={{
                        scale: active ? 1.1 : 1,
                        y: active ? -1 : 0,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                      }}
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
                      animate={{
                        scale: active ? 1 : 0.95,
                        opacity: active ? 1 : 0.7,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                      }}
                      className={`text-[10px] leading-[12px] whitespace-nowrap ${
                        active
                          ? "text-[#007AFF] font-semibold"
                          : "text-[#8E8E93] font-medium"
                      }`}
                    >
                      {item.label}
                    </motion.span>
                  </Link>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ─── Вариант 1: если есть два файла (обычный + активный) ──────────────────────
const NavIcon: React.FC<{
  icon: string;
  iconActive: string;
  active: boolean;
  label: string;
}> = ({ icon, iconActive, active, label }) => {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={active ? "active" : "default"}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.7 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <Image
          src={active ? iconActive : icon}
          alt={label}
          fill
          className="object-contain"
          // Если иконки одноцветные SVG — можно добавить CSS-фильтр
          style={
            active
              ? undefined
              : { filter: "brightness(0) saturate(100%) opacity(0.5)" }
          }
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default MobileBottomNav;