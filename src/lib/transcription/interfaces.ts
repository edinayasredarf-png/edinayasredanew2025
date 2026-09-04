import "server-only";

/**
 * Абстракция транскрипции (§42-43 ТЗ). Бизнес-логика НЕ связана с конкретным
 * провайдером. Диаризация: провайдер отдаёт speaker-метки (speaker_0/1),
 * маппинг в MANAGER/CLIENT делаем отдельно.
 */

export interface TranscriptWord {
  text: string;
  startMs: number | null;
  endMs: number | null;
}

export interface TranscriptSegment {
  idx: number;
  speakerLabel: string | null; // speaker_0 / speaker_1
  startMs: number | null;
  endMs: number | null;
  text: string;
  /** Пословные таймкоды (Yandex v3) — нужны для пословного выравнивания со спикерами. */
  words?: TranscriptWord[];
}

export interface TranscriptionResult {
  provider: string;
  language: string | null;
  fullText: string;
  durationSec: number | null;
  segments: TranscriptSegment[];
}

export interface TranscribeInput {
  /** URL записи (из телефонии Bitrix) ИЛИ буфер аудио. */
  audioUrl?: string;
  audioBuffer?: Buffer;
  mimeType?: string;
  languageHint?: string; // "ru"
}

export interface AsyncStartResult {
  operationId: string;
}

export interface AsyncPollResult {
  done: boolean;
  result?: TranscriptionResult;
}

/**
 * Провайдер транскрипции. Два режима:
 *  - "sync": короткий вызов transcribe() (Whisper-совместимый);
 *  - "async": longRunning (Yandex SpeechKit) — startAsync() отдаёт operationId,
 *    pollAsync() опрашивает готовность. Асинхронность драйвит очередь (не блокируем
 *    serverless-функцию на всю длительность распознавания).
 */
export interface TranscriptionProvider {
  readonly name: string;
  readonly mode: "sync" | "async";
  /**
   * Нужен ли Object Storage для audioUri (Yandex — да). Self-hosted сервис умеет
   * скачивать запись сам по URL, поэтому false — обходимся без хранилища.
   */
  readonly needsObjectStorage?: boolean;
  /** sync-режим: получить результат сразу. */
  transcribe?(input: TranscribeInput): Promise<TranscriptionResult>;
  /** async-режим: запустить распознавание аудио, уже загруженного в Object Storage. */
  startAsync?(audioUri: string, languageHint?: string): Promise<AsyncStartResult>;
  /** async-режим: опросить операцию. */
  pollAsync?(operationId: string): Promise<AsyncPollResult>;
}

export class TranscriptionNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranscriptionNotConfiguredError";
  }
}
