'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface MobileSearchProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export default function MobileSearch({ isOpen, onClose, initialQuery = '' }: MobileSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [contentType, setContentType] = useState<'all' | 'post' | 'news' | 'lesson' | 'case'>('all');
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
    }
  }, [isOpen, initialQuery]);

  const handleSearch = () => {
    if (!query.trim()) return;
    
    const params = new URLSearchParams();
    params.set('q', query.trim());
    if (contentType !== 'all') {
      params.set('type', contentType);
    }
    
    router.push(`/blog?${params.toString()}`);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-16">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#111]">Поиск</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Что ищем?</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Введите запрос..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2777ff] focus:border-transparent"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Тип контента</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'all', label: 'Все' },
                { value: 'post', label: 'Статьи' },
                { value: 'news', label: 'Новости' },
                { value: 'lesson', label: 'Уроки' },
                { value: 'case', label: 'Кейсы' }
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setContentType(type.value as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    contentType === type.value
                      ? 'bg-[#2777ff] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSearch}
            className="w-full bg-[#2777ff] text-white py-3 rounded-lg font-medium hover:bg-[#1e5bb8] transition"
          >
            Найти
          </button>
        </div>
      </div>
    </div>
  );
}
