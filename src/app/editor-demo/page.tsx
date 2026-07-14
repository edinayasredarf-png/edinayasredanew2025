'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

const TeletypeEditor = dynamic(() => import('@/components/blog/TeletypeEditor'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">Загрузка редактора...</div>
});

export default function EditorDemo() {
  const [content, setContent] = useState('<p>Добро пожаловать в современный редактор в стиле Teletype!</p><p>Попробуйте набрать <strong>/</strong> для быстрой вставки блоков.</p>');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Современный редактор в стиле Teletype
          </h1>
          <p className="text-gray-600">
            Минималистичный редактор с темной темой, слэш-командами и современным дизайном.
          </p>
        </div>

        <div className="bg-[#F6F7F9] rounded-xl shadow-lg p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Особенности:</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Темная минималистичная тема</li>
              <li>Слэш-команды для быстрой вставки блоков</li>
              <li>Современный UI как в Teletype</li>
              <li>Поддержка изображений, видео, таблиц</li>
              <li>Горячие клавиши и навигация</li>
            </ul>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Попробуйте редактор:</h3>
            <TeletypeEditor
              initialHtml={content}
              onChange={setContent}
              className="min-h-[500px]"
            />
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">HTML результат:</h4>
            <pre className="text-sm text-gray-600 overflow-x-auto">
              {content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
