"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { StoriesModal } from "@/components/StoriesModal";
import { listStories, incStoryViews, type Story } from "@/lib/storiesStore";

const STORAGE_KEY = "viewed_stories_v1";

let _storiesCache: Story[] | null = null;

const StoriesStrip: React.FC = () => {
  const [stories, setStories] = useState<Story[]>(_storiesCache || []);
  const [viewedIds, setViewedIds] = useState<string[]>([]);
  const [activeStory, setActiveStory] = useState<Story | null>(null);

  // Загружаем список просмотренных сторис из localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setViewedIds(JSON.parse(raw));
    } catch {
      // игнорируем ошибки localStorage
    }
  }, []);

  // Загружаем сторисы из Supabase (storiesStore)
  useEffect(() => {
    let cancelled = false;
    listStories().then((data) => {
      if (!cancelled) {
        _storiesCache = data;
        setStories(data);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const markViewed = (id: string) => {
    setViewedIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // игнорируем
      }
      return next;
    });
  };

  const [startIndex, setStartIndex] = useState(0);

  const handleOpenStory = (story: Story) => {
    void incStoryViews(story.id);
    const idx = stories.findIndex((s) => s.id === story.id);
    setStartIndex(idx >= 0 ? idx : 0);
    setActiveStory(story);
  };

  const handleCloseModal = () => {
    if (activeStory) {
      markViewed(activeStory.id);
    }
    setActiveStory(null);
  };

  if (!stories.length) return null;

  return (
    <>
      {/* Бегущая строка сторис */}
      <div className="font-[Raleway] font-medium bg-black w-full">
        <div className="w-full max-w-[1480px] mx-auto px-2 mb-3">
          <div className="flex gap-3 overflow-x-auto py-2 no-scrollbar">
          {stories.map((story) => {
            const isViewed = viewedIds.includes(story.id);
            return (
              <button
                key={story.id}
                type="button"
                onClick={() => handleOpenStory(story)}
                className="flex-shrink-0 focus:outline-none"
              >
                <div
                  className={[
                    "relative w-20 h-20 bg-black rounded-full overflow-hidden p-1.5",
                    "border-2",
                    isViewed ? "border-gray-400" : "border-[#0077FF]",
                  ].join(" ")}
                >
                  <div className="relative w-full h-full rounded-full overflow-hidden">
                    <Image
                      src={story.thumbnail}
                      alt={story.title}
                      width={64}
                      height={64}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {/* Градиент и описание внутри квадрата */}
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                    <span className="text-[10px] text-white font-medium px-1.5 pb-1.5 text-center line-clamp-2 leading-tight">
                      {story.title}
                    </span>
                  </div>
                  {/* Точка «новый» в углу */}
                  {!isViewed && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#0077FF] ring-2 ring-black" />
                  )}
                </div>
              </button>
            );
          })}
          </div>
        </div>
      </div>

      {/* Полноэкранные сторисы в модалке */}
      {activeStory != null && (
        <StoriesModal
          allStories={stories}
          startIndex={startIndex}
          isOpen
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default StoriesStrip;