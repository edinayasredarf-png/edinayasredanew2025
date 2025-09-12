"use client";
import React, { useState } from 'react';
import Link from 'next/link';

interface BurgerMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: (section: string) => void;
}

export default function BurgerMenu({ isOpen, onToggle, onNavigate }: BurgerMenuProps) {
  const menuItems = [
    { id: 'hero', label: 'Главная', icon: '🏠' },
    { id: 'mission', label: 'Миссия', icon: '🎯' },
    { id: 'stats', label: 'Статистика', icon: '📊' },
    { id: 'products', label: 'Продукты', icon: '🚀' },
    { id: 'technology', label: 'Технологии', icon: '⚡' },
    { id: 'team', label: 'Команда', icon: '👥' },
    { id: 'cta', label: 'Контакты', icon: '📞' },
  ];

  return (
    <>
      {/* Burger Button */}
      <button
        onClick={onToggle}
        className="fixed top-6 right-6 z-50 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <div className="relative w-6 h-6">
          <span className={`absolute top-0 left-0 w-6 h-0.5 bg-white transform transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`absolute top-2 left-0 w-6 h-0.5 bg-white transform transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></span>
          <span className={`absolute top-4 left-0 w-6 h-0.5 bg-white transform transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </div>
      </button>

      {/* Menu Overlay */}
      <div className={`fixed inset-0 z-40 transition-all duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
        <div className="relative h-full flex items-center justify-center">
          <nav className="text-center">
            <ul className="space-y-8">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onNavigate(item.id);
                      onToggle();
                    }}
                    className="text-3xl md:text-4xl font-light text-white hover:text-blue-300 transition-all duration-300 flex items-center justify-center gap-4 group"
                  >
                    <span className="text-2xl md:text-3xl group-hover:scale-110 transition-transform duration-300">
                      {item.icon}
                    </span>
                    <span className="group-hover:translate-x-2 transition-transform duration-300">
                      {item.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
} 