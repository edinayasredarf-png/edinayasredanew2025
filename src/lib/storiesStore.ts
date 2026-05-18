'use client';

import { dataFetch } from './dataApi';

/** Позиция текста поверх слайда */
export type StoryTextPosition = 'top' | 'center' | 'bottom';

/** Кнопка в слайде */
export type StorySlideButton = {
  label: string;
  url: string;
};

/** Опрос в слайде */
export type StorySlidePoll = {
  question: string;
  options: string[];
  /** Количество голосов за каждый вариант (индекс = индекс options) */
  results?: number[];
};

/** Вложение (файл) в слайде */
export type StoryAttachment = {
  name: string;
  url: string;
};

/** Один слайд сториса */
export type StorySlide = {
  id: string;
  type: 'image' | 'video' | 'text';
  /** URL картинки/видео или пусто для text */
  url?: string;
  /** Текст поверх слайда или содержимое текстового слайда */
  text?: string;
  /** Позиция текста: top | center | bottom */
  textPosition?: StoryTextPosition;
  /** Кнопка (CTA) */
  button?: StorySlideButton;
  /** Опрос */
  poll?: StorySlidePoll;
  /** Прикреплённые файлы */
  attachments?: StoryAttachment[];
  /** Длительность показа в мс */
  duration?: number;
};

/** Сторис целиком */
export type Story = {
  id: string;
  /** Заголовок в квадрате в ленте */
  title: string;
  /** Превью для квадрата (URL картинки) */
  thumbnail: string;
  slides: StorySlide[];
  createdAt: number;
  updatedAt: number;
  /** Количество открытий (просмотров) */
  viewCount: number;
};

const K_STORIES = 'BLOG_STORIES_V1';

// -------- LocalStorage fallback (когда Supabase не настроен) --------
function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

// -------- Supabase row mapping --------
function mapRow(row: Record<string, unknown>): Story {
  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    thumbnail: String(row.thumbnail ?? ''),
    slides: Array.isArray(row.slides) ? (row.slides as StorySlide[]) : [],
    createdAt: Number(row.created_at ?? 0),
    updatedAt: Number(row.updated_at ?? 0),
    viewCount: Number(row.view_count ?? 0),
  };
}

function toPayload(s: Story): Record<string, unknown> {
  return {
    id: s.id,
    title: s.title,
    thumbnail: s.thumbnail,
    slides: s.slides,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
    view_count: s.viewCount,
  };
}

// -------- Async API (Supabase + localStorage fallback) --------

export async function loadStories(): Promise<Story[]> {
  try {
    const rows = (await dataFetch('/stories')) as Record<string, unknown>[];
    return (rows || []).map(mapRow);
  } catch (e) {
    console.warn('load stories API failed, using local fallback:', e);
    return readLocal<Story[]>(K_STORIES, []);
  }
}

export async function listStories(): Promise<Story[]> {
  const list = await loadStories();
  return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getStoryById(id: string): Promise<Story | undefined> {
  try {
    const row = (await dataFetch('/stories?id=' + encodeURIComponent(id))) as Record<string, unknown> | null;
    if (row) return mapRow(row);
  } catch (e) {
    console.warn('get story API failed, using local fallback:', e);
  }
  const list = readLocal<Story[]>(K_STORIES, []);
  return list.find((s) => s.id === id);
}

export async function upsertStory(s: Story): Promise<void> {
  const now = Date.now();
  const toSave: Story = {
    ...s,
    updatedAt: now,
    createdAt: s.createdAt || now,
    viewCount: s.viewCount ?? 0,
  };

  try {
    const existing = await getStoryById(s.id);
    if (existing) {
      toSave.createdAt = existing.createdAt;
      toSave.viewCount = existing.viewCount;
    }
    await dataFetch('/stories', {
      method: 'POST',
      body: JSON.stringify(toPayload(toSave)),
    });
    return;
  } catch (e) {
    console.warn('upsert story API failed, using local fallback:', e);
  }

  const list = readLocal<Story[]>(K_STORIES, []);
  const idx = list.findIndex((x) => x.id === s.id);
  if (idx >= 0) {
    toSave.createdAt = list[idx].createdAt;
    toSave.viewCount = list[idx].viewCount;
    list[idx] = toSave;
  } else {
    list.unshift(toSave);
  }
  writeLocal(K_STORIES, list);
}

export async function deleteStory(id: string): Promise<void> {
  try {
    await dataFetch('/stories?id=' + encodeURIComponent(id), { method: 'DELETE' });
    return;
  } catch (e) {
    console.warn('delete story API failed, using local fallback:', e);
  }
  const list = readLocal<Story[]>(K_STORIES, []).filter((s) => s.id !== id);
  writeLocal(K_STORIES, list);
}

/** Увеличить счётчик просмотров при открытии сториса */
export async function incStoryViews(id: string): Promise<void> {
  try {
    await dataFetch('/story-views', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
    return;
  } catch (e) {
    console.warn('inc story views API failed, using local fallback:', e);
  }
  const list = readLocal<Story[]>(K_STORIES, []);
  const idx = list.findIndex((s) => s.id === id);
  if (idx >= 0) {
    list[idx].viewCount = (list[idx].viewCount || 0) + 1;
    writeLocal(K_STORIES, list);
  }
}

export function genSlideId() {
  return crypto.randomUUID();
}

const K_POLL_VOTED = 'STORY_POLL_VOTED_V1';

/** Проголосовать в опросе: storyId, slideId, optionIndex. prevOptionIndex — для переголосования. */
export async function votePoll(
  storyId: string,
  slideId: string,
  optionIndex: number,
  prevOptionIndex?: number
): Promise<void> {
  const story = await getStoryById(storyId);
  if (!story) return;
  const slideIdx = story.slides.findIndex((s) => s.id === slideId);
  if (slideIdx < 0 || !story.slides[slideIdx].poll) return;
  const poll = story.slides[slideIdx].poll!;
  if (optionIndex < 0 || optionIndex >= (poll.options?.length ?? 0)) return;

  const results = [...(poll.results ?? poll.options.map(() => 0))];
  if (typeof prevOptionIndex === 'number' && prevOptionIndex >= 0 && prevOptionIndex < results.length) {
    results[prevOptionIndex] = Math.max(0, (results[prevOptionIndex] ?? 0) - 1);
  }
  results[optionIndex] = (results[optionIndex] ?? 0) + 1;
  const newSlides = [...story.slides];
  newSlides[slideIdx] = {
    ...newSlides[slideIdx],
    poll: { ...poll, results },
  };
  await upsertStory({ ...story, slides: newSlides });

  const voted = readLocal<Record<string, number>>(K_POLL_VOTED, {});
  voted[`${storyId}_${slideId}`] = optionIndex;
  writeLocal(K_POLL_VOTED, voted);
}

/** Получить выбранный вариант для опроса (или null) */
export function getPollVote(storyId: string, slideId: string): number | null {
  const voted = readLocal<Record<string, number>>(K_POLL_VOTED, {});
  const v = voted[`${storyId}_${slideId}`];
  return typeof v === 'number' ? v : null;
}

/** Сбросить голос (переголосовать) */
export function clearPollVote(storyId: string, slideId: string): void {
  const voted = readLocal<Record<string, number>>(K_POLL_VOTED, {});
  delete voted[`${storyId}_${slideId}`];
  writeLocal(K_POLL_VOTED, voted);
}
