"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import Stories from "react-insta-stories";
import {
  type Story,
  type StorySlide,
  votePoll,
  getPollVote,
  clearPollVote,
} from "@/lib/storiesStore";

/** Демо: массив слайдов { url, header?, duration? } */
type LegacyStoryItem = {
  url: string;
  header?: { heading: string; subheading?: string; profileImage?: string };
  duration?: number;
};

type StoriesModalProps = {
  allStories?: Story[];
  startIndex?: number;
  story?: Story;
  stories?: LegacyStoryItem[];
  isOpen: boolean;
  onClose: () => void;
};

const TEXT_PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="700"><rect fill="%231a1a2e" width="400" height="700"/></svg>'
  );

/** Формат react-insta-stories */
type InstaStoryItem = {
  url?: string;
  type?: "video" | "image";
  duration?: number;
  muted?: boolean;
  preloadResource?: boolean;
  header?: { heading: string; subheading: string; profileImage: string };
  content?: (props: { action: (a: string) => void; isPaused: boolean }) => React.ReactNode;
  _slide?: StorySlide;
  _storyId?: string;
};

const VIDEO_FAIL_FALLBACK = (
  <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#1a1a2e] p-6 text-center">
    <span className="text-4xl">🎬</span>
    <p className="text-white">Видео не загрузилось</p>
    <p className="text-sm text-white/60">Проверьте ссылку или загрузите файл заново</p>
  </div>
);

/** Позиция текста → flex justify */
function textPositionClass(pos?: "top" | "center" | "bottom"): string {
  if (pos === "top") return "justify-start";
  if (pos === "center") return "justify-center";
  return "justify-end";
}

/** Один кастомный слайд: текст по позиции + кнопка; для видео — кнопка звука */
function SlideContent({
  slide,
  action,
  isPaused,
  variant,
  mediaUrl,
}: {
  slide: StorySlide;
  action: (a: string) => void;
  isPaused: boolean;
  variant: "text" | "image" | "video";
  mediaUrl?: string;
}) {
  const pos = textPositionClass(slide.textPosition);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (variant !== "video" || !v) return;
    if (isPaused) v.pause();
    else v.play().catch(() => {});
  }, [isPaused, variant]);

  return (
    <div className="relative flex h-full w-full flex-col bg-black">
      {/* Фон: картинка / видео / цвет */}
      {variant === "text" && (
        <div className="absolute inset-0 bg-[#1a1a2e]" />
      )}
      {variant === "image" && mediaUrl && (
        <img
          src={mediaUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {variant === "video" && mediaUrl && (
        <video
          ref={videoRef}
          src={mediaUrl}
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          muted={false}
          loop={false}
          onEnded={() => action("play")}
          onPlay={() => action("play")}
          onPause={() => action("pause")}
        />
      )}

      {/* Текст поверх с учётом позиции (опрос рендерится снаружи Stories) */}
      {slide.text?.trim() && (
        <div
          className={`absolute inset-0 z-[100] flex flex-col ${pos} bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 pointer-events-none`}
        >
          <p className="max-w-full whitespace-pre-wrap text-lg text-white drop-shadow-md pointer-events-none">
            {slide.text}
          </p>
        </div>
      )}
    </div>
  );
}

/** Конвертация Story[] в плоский массив для react-insta-stories */
function toInstaStories(stories: Story[], _startIndex: number): InstaStoryItem[] {
  const flat: InstaStoryItem[] = [];
  stories.forEach((s) => {
    s.slides.forEach((slide: StorySlide) => {
      const baseItem = { _slide: slide, _storyId: s.id };
      const duration = slide.duration ?? 5000;
      if (slide.type === "text" && !slide.url) {
        flat.push({
          ...baseItem,
          content: ({ action, isPaused }) => (
            <SlideContent slide={slide} action={action} isPaused={isPaused} variant="text" />
          ),
          duration,
        } as InstaStoryItem);
        return;
      }
      if (slide.type === "video") {
        const url = slide.url?.trim();
        if (!url) {
        flat.push({
          ...baseItem,
          content: () => VIDEO_FAIL_FALLBACK,
          duration,
        } as InstaStoryItem);
        return;
      }
      flat.push({
        ...baseItem,
        content: ({ action, isPaused }) => (
          <SlideContent
            slide={slide}
            action={action}
            isPaused={isPaused}
            variant="video"
            mediaUrl={url}
          />
        ),
        duration,
      } as InstaStoryItem);
        return;
      }
      // image
      const mediaUrl = slide.url || TEXT_PLACEHOLDER;
      flat.push({
        ...baseItem,
        content: ({ action, isPaused }) => (
          <SlideContent
            slide={slide}
            action={action}
            isPaused={isPaused}
            variant="image"
            mediaUrl={mediaUrl}
          />
        ),
        duration,
      } as InstaStoryItem);
    });
  });
  return flat;
}

/** Legacy (демо) → InstaStories */
function legacyToInstaStories(items: LegacyStoryItem[]): InstaStoryItem[] {
  return items.map((s) => {
    const isVideo = !!s.url?.match(/\.(mp4|webm|mov)(\?|$)/i);
    return {
      url: s.url,
      type: (isVideo ? "video" : "image") as "video" | "image",
      duration: s.duration ?? 5000,
      muted: isVideo,
      header: s.header
      ? {
          heading: s.header.heading,
          subheading: s.header.subheading ?? "",
          profileImage: s.header.profileImage ?? "",
        }
      : undefined,
    };
  }) as InstaStoryItem[];
}

export const StoriesModal: React.FC<StoriesModalProps> = ({
  allStories: allStoriesProp,
  startIndex = 0,
  story: singleStoryProp,
  stories: legacyStories,
  isOpen,
  onClose,
}) => {
  const [mounted, setMounted] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const storiesContainerRef = useRef<HTMLDivElement>(null);

  const legacyAsStory: Story | null =
    legacyStories?.length
      ? {
          id: "legacy",
          title: "Инструкция",
          thumbnail: legacyStories[0]?.url ?? "",
          slides: legacyStories.map((s, i) => ({
            id: `legacy-${i}`,
            type: "image" as const,
            url: s.url,
            text: s.header?.heading,
            textPosition: "bottom" as const,
            duration: s.duration ?? 5000,
          })),
          createdAt: 0,
          updatedAt: 0,
          viewCount: 0,
        }
      : null;

  const allStories: Story[] =
    allStoriesProp ??
    (singleStoryProp ? [singleStoryProp] : null) ??
    (legacyAsStory ? [legacyAsStory] : []);

  const instaStories = useMemo(() => {
    if (legacyStories?.length) return legacyToInstaStories(legacyStories);
    return toInstaStories(allStories, startIndex);
  }, [allStories, startIndex, legacyStories]);

  const startFlatIndex = useMemo(() => {
    if (instaStories.length === 0) return 0;
    let count = 0;
    for (let i = 0; i < allStories.length; i++) {
      if (i === startIndex) return count;
      count += allStories[i].slides.length;
    }
    return 0;
  }, [allStories, startIndex]);

  const currentButton = useMemo(() => {
    const item = instaStories[currentSlideIndex] as InstaStoryItem & { _slide?: StorySlide };
    const btn = item?._slide?.button;
    if (!btn?.url) return null;
    // Нормализуем URL: если не начинается с http:// или https://, добавляем https://
    const url = btn.url.trim();
    const normalizedUrl = url.startsWith('http://') || url.startsWith('https://')
      ? url
      : `https://${url}`;
    return { ...btn, url: normalizedUrl };
  }, [instaStories, currentSlideIndex]);

  const currentPollData = useMemo(() => {
    const item = instaStories[currentSlideIndex] as InstaStoryItem & { _slide?: StorySlide; _storyId?: string };
    const slide = item?._slide;
    const poll = slide?.poll;
    const storyId = item?._storyId;
    const slideId = slide?.id;
    return poll?.question && poll?.options?.length ? { poll, storyId: storyId ?? '', slideId: slideId ?? '' } : null;
  }, [instaStories, currentSlideIndex]);

  const [pollRefresh, setPollRefresh] = useState(0);
  const [prevVotedForRevote, setPrevVotedForRevote] = useState<number | null>(null);
  const votedOption = useMemo(() => {
    if (!currentPollData) return null;
    const v = getPollVote(currentPollData.storyId, currentPollData.slideId);
    return v;
  }, [currentPollData, pollRefresh]);
  const showPollOptions = votedOption === null;

  useEffect(() => {
    setPrevVotedForRevote(null);
  }, [currentSlideIndex]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) setCurrentSlideIndex(startFlatIndex);
  }, [isOpen, startFlatIndex]);

  // «Будильник»: фокус + клик при открытии, чтобы таймер/видео стартовали без доп. нажатия
  useEffect(() => {
    if (!isOpen || !storiesContainerRef.current) return;
    const el = storiesContainerRef.current;
    const t = setTimeout(() => {
      el.focus();
      el.click();
    }, 100);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen || instaStories.length === 0) return null;

  const modal = (
    <>
      {/* Затемнение — клик закрывает */}
      <div
        className="fixed inset-0 z-[1000] bg-black/90 md:flex md:items-center md:justify-center"
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        aria-label="Закрыть"
      />
      {/* Шортс: десктоп — центр, мобильный — весь экран */}
      <div
        ref={storiesContainerRef}
        tabIndex={0}
        className="fixed inset-0 z-[1001] flex flex-col bg-black outline-none md:inset-auto md:left-1/2 md:top-1/2 md:h-[85vh] md:max-h-[760px] md:w-full md:max-w-[430px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:overflow-hidden md:shadow-2xl"
      >
        <Stories
          stories={instaStories as React.ComponentProps<typeof Stories>["stories"]}
          defaultInterval={5000}
          width="100%"
          height="100%"
          onAllStoriesEnd={onClose}
          onStoryStart={(idx: number) => setCurrentSlideIndex(idx)}
          loop={false}
          currentIndex={startFlatIndex}
          keyboardNavigation
          isPaused={false}
          preloadCount={2}
        />
        {/* Крестик поверх */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-[9999] flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-xl font-bold text-white hover:bg-black/70"
          aria-label="Закрыть"
        >
          ✕
        </button>
        {/* Опрос поверх — вне Stories */}
        {currentPollData && (
          <div
            className={`absolute left-4 right-4 z-[10000] pointer-events-auto ${currentButton?.label ? 'bottom-24' : 'bottom-4'}`}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-4 space-y-2">
              <p className="text-white text-lg font-medium mb-3">{currentPollData.poll.question}</p>
              {!showPollOptions ? (
                <>
                  <p className="text-white text-center py-2">Спасибо за ваш выбор!</p>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPrevVotedForRevote(votedOption);
                      clearPollVote(currentPollData.storyId, currentPollData.slideId);
                      setPollRefresh((k) => k + 1);
                    }}
                    className="block w-full text-center rounded-xl bg-[#029cda] text-white px-5 py-3 text-base font-medium hover:bg-[#029cda]/90 transition-colors"
                  >
                    Переголосовать
                  </a>
                </>
              ) : (
                currentPollData.poll.options!.map((opt, idx) => (
                  <a
                    key={idx}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void votePoll(
                        currentPollData.storyId,
                        currentPollData.slideId,
                        idx,
                        prevVotedForRevote ?? undefined
                      );
                      setPrevVotedForRevote(null);
                      setPollRefresh((k) => k + 1);
                    }}
                    className="block w-full text-center rounded-xl bg-[#029cda] text-white px-5 py-3.5 text-base font-medium hover:bg-[#029cda]/90 active:bg-[#0066DD] transition-colors"
                  >
                    {opt}
                  </a>
                ))
              )}
            </div>
          </div>
        )}
        {/* Кнопка CTA поверх — вне Stories, чтобы не перехватывалась overlay */}
        {currentButton?.label && currentButton?.url && (
          <div className={`absolute left-4 right-4 z-[10000] ${currentPollData ? 'bottom-4' : 'bottom-20'}`}>
            <a
              href={currentButton.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                window.open(currentButton.url, '_blank', 'noopener,noreferrer');
              }}
              className="block w-full inline-flex items-center justify-center rounded-xl bg-[#029cda] text-white px-5 py-3.5 text-base font-medium hover:bg-[#029cda]/90 active:bg-[#0066DD] transition-colors"
            >
              {currentButton.label}
            </a>
          </div>
        )}
      </div>
    </>
  );

  return createPortal(modal, document.body);
};
