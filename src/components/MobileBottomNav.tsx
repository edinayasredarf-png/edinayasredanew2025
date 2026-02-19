"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";

const NAV_ITEMS = [
  {
    key: "home",
    label: "Главная",
    href: "/",
    icon: "/icons/navbar/home.svg",
    iconActive: "/icons/navbar/home_active.svg",
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
        <div className="pointer-events-auto w-full rounded-[28px] border border-white/60 bg-white/80 shadow-[0_10px_40px_rgba(0,0,0,0.12)] backdrop-blur-[30px]">
          <div className="relative flex items-stretch gap-0.5 overflow-hidden rounded-[28px] px-2 py-2">
            {/* Фон */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-white/50 to-white/30" />
              <div className="absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.8),transparent_70%)]" />
            </div>

            {/* Плавно перемещающийся активный фон */}
            {NAV_ITEMS.map((item, index) => {
              const active = isActive(pathname, item.href);
              if (!active) return null;

              return (
                <motion.div
                  key="active-pill"
                  layoutId="mobile-nav-pill"
                  className="absolute inset-y-1 rounded-[24px] bg-gradient-to-b from-white to-gray-50 shadow-[0_2px_8px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.04)]"
                  style={{
                    left: `calc(${(index / NAV_ITEMS.length) * 100}% + 0.125rem)`,
                    right: `calc(${((NAV_ITEMS.length - index - 1) / NAV_ITEMS.length) * 100}% + 0.125rem)`,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              );
            })}

            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <div
                  key={item.key}
                  className="relative flex-1 min-w-[60px] flex items-stretch justify-center"
                >
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
        </div>
      </div>
    </div>
  );
};

const NavIcon: React.FC<{
  icon: string;
  iconActive: string;
  active: boolean;
  label: string;
}> = ({ icon, iconActive, active, label }) => {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="absolute inset-0"
    >
      <Image
        src={active ? iconActive : icon}
        alt={label}
        fill
        className="object-contain"
        style={
          active
            ? undefined
            : { filter: "brightness(0) saturate(100%) opacity(0.5)" }
        }
      />
    </motion.div>
  );
};

export default MobileBottomNav;