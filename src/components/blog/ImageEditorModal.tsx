'use client';

import React, { useCallback } from 'react';
import nextDynamic from 'next/dynamic';

// Собранные файлы Filerobot ссылаются на глобальный `React` без import.
// Под автоматическим JSX-рантаймом Next такого глобала нет, и редактор падает
// с "React is not defined". Выставляем React в window до загрузки редактора —
// работает независимо от сборщика (webpack/turbopack).
if (typeof window !== 'undefined') {
  (window as unknown as { React?: typeof React }).React = React;
}

// Filerobot тяжёлый и работает только в браузере — грузим динамически,
// поэтому он не попадает в общий бандл и не ломает SSR.
const FilerobotImageEditor = nextDynamic(
  () => import('react-filerobot-image-editor'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full text-white/80 text-sm font-[Raleway]">
        Загрузка редактора…
      </div>
    ),
  }
);

// Идентификаторы вкладок/инструментов Filerobot — строковые константы,
// чтобы не тянуть модуль на этапе SSR ради двух enum'ов.
const TAB = {
  ADJUST: 'Adjust',
  FINETUNE: 'Finetune',
  FILTERS: 'Filters',
  ANNOTATE: 'Annotate',
  WATERMARK: 'Watermark',
  RESIZE: 'Resize',
} as const;

/** Русские подписи. Неизвестные ключи Filerobot тихо откатывает к английскому. */
const RU = {
  name: 'Название',
  save: 'Сохранить',
  saveAs: 'Сохранить как',
  back: 'Назад',
  loading: 'Загрузка…',
  resetOperations: 'Сбросить всё',
  changesLoseWarningHint:
    'Если нажать «Сбросить», изменения будут потеряны. Продолжить?',
  discardChanges: 'Отменить изменения',
  cancel: 'Отмена',
  apply: 'Применить',
  warning: 'Внимание',
  confirm: 'Подтвердить',
  download: 'Скачать',
  width: 'Ширина',
  height: 'Высота',
  toggleRatioLock: 'Зафиксировать пропорции',
  reset: 'Сброс',
  // вкладки
  adjustTab: 'Кадрирование',
  finetuneTab: 'Коррекция',
  filtersTab: 'Фильтры',
  watermarkTab: 'Водяной знак',
  annotateTab: 'Разметка',
  resizeTab: 'Размер',
  // инструменты
  crop: 'Обрезка',
  rotate: 'Поворот',
  flipX: 'Отразить по горизонтали',
  flipY: 'Отразить по вертикали',
  brightness: 'Яркость',
  contrast: 'Контраст',
  hue: 'Оттенок',
  saturation: 'Насыщенность',
  value: 'Яркость (V)',
  warmth: 'Тёплость',
  blur: 'Размытие',
  text: 'Текст',
  textTool: 'Текст',
  rectangle: 'Прямоугольник',
  ellipse: 'Овал',
  polygon: 'Многоугольник',
  pen: 'Кисть',
  line: 'Линия',
  arrow: 'Стрелка',
  image: 'Картинка',
  watermark: 'Водяной знак',
  addWatermark: 'Добавить водяной знак',
  addWatermarkTitle: 'Выберите тип водяного знака',
  uploadWatermark: 'Загрузить изображение',
  addWatermarkAsText: 'Добавить текст',
  fontFamily: 'Шрифт',
  size: 'Размер',
  fillColor: 'Цвет заливки',
  strokeColor: 'Цвет обводки',
  strokeWidth: 'Толщина обводки',
  original: 'Оригинал',
  custom: 'Свободно',
  square: 'Квадрат',
  cropItemNoEffect: 'Без ограничения пропорций',
} as const;

export interface ImageEditorModalProps {
  /** URL или data:URL исходного изображения */
  source: string;
  onSave: (file: File) => void;
  onClose: () => void;
  /** Имя сохраняемого файла без расширения */
  saveName?: string;
  /** Стартовая вкладка: 'Adjust' (кадрирование) по умолчанию */
  defaultTab?: (typeof TAB)[keyof typeof TAB];
}

/** Полноэкранный модальный редактор изображения на базе Filerobot. */
export default function ImageEditorModal({
  source,
  onSave,
  onClose,
  saveName = 'image',
  defaultTab = TAB.ADJUST,
}: ImageEditorModalProps) {
  const handleSave = useCallback(
    (edited: {
      imageCanvas?: HTMLCanvasElement;
      imageBase64?: string;
      mimeType?: string;
      name?: string;
    }) => {
      const mime = edited.mimeType || 'image/png';
      const ext = mime.split('/')[1] || 'png';
      const fileName = `${edited.name || saveName}.${ext}`;

      const finish = (blob: Blob | null) => {
        if (!blob) return;
        onSave(new File([blob], fileName, { type: blob.type || mime }));
        onClose();
      };

      // Canvas даёт лучшее качество и корректный размер; fallback — base64.
      if (edited.imageCanvas?.toBlob) {
        edited.imageCanvas.toBlob(finish, mime, 0.92);
        return;
      }
      if (edited.imageBase64) {
        try {
          const [, b64] = edited.imageBase64.split(',');
          const bin = atob(b64);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          finish(new Blob([bytes], { type: mime }));
        } catch {
          /* ничего не отдаём — пусть пользователь попробует снова */
        }
      }
    },
    [onSave, onClose, saveName]
  );

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/70"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-2 sm:inset-4 md:inset-8 rounded-xl overflow-hidden bg-[#1e1e1e] shadow-2xl">
        <FilerobotImageEditor
          source={source}
          onSave={handleSave}
          onClose={onClose}
          language="en"
          translations={RU}
          // Словарь передаём напрямую — не тянем переводы с внешнего бэкенда
          // (иначе Filerobot спамит в консоль "Error while loading translations").
          useBackendTranslations={false}
          defaultSavedImageName={saveName}
          defaultSavedImageType="webp"
          // порядок вкладок: кадрирование, коррекция, фильтры, разметка, знак, размер
          tabsIds={[
            TAB.ADJUST,
            TAB.FINETUNE,
            TAB.FILTERS,
            TAB.ANNOTATE,
            TAB.WATERMARK,
            TAB.RESIZE,
          ]}
          defaultTabId={defaultTab}
          savingPixelRatio={2}
          previewPixelRatio={window.devicePixelRatio || 1}
        />
      </div>
    </div>
  );
}
