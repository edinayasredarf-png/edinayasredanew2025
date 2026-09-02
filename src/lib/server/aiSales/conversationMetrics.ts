import "server-only";

/**
 * Код-метрики разговора (§21,§45 ТЗ) — считаются математикой, БЕЗ LLM.
 * Работают на моно (по ролям из roleSplit): talk ratio, длина реплик, монолог,
 * а при наличии таймкодов — темп речи и паузы.
 */

export interface ConvSegment {
  role: string | null; // MANAGER | CLIENT | null
  text: string;
  startMs: number | null;
  endMs: number | null;
}

export interface ConversationMetrics {
  // По словам (работает всегда):
  managerWords: number;
  clientWords: number;
  talkRatioManager: number | null; // 0..1 доля слов менеджера
  managerUtterances: number;
  clientUtterances: number;
  avgManagerUtteranceWords: number | null;
  avgClientUtteranceWords: number | null;
  longestMonologueWords: number; // самая длинная реплика (обычно менеджера)
  // По времени (если есть таймкоды):
  durationSec: number | null;
  talkTimeManagerSec: number | null;
  talkTimeClientSec: number | null;
  talkRatioManagerTime: number | null;
  wpmManager: number | null;
  wpmClient: number | null;
  longestPauseSec: number | null;
  pausesOver3s: number | null;
  hasTimestamps: boolean;
}

const wc = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);
const r2 = (n: number) => Math.round(n * 100) / 100;

export function computeConversationMetrics(segments: ConvSegment[]): ConversationMetrics {
  const mgr = segments.filter((s) => s.role === "MANAGER");
  const cli = segments.filter((s) => s.role === "CLIENT");

  const managerWords = mgr.reduce((a, s) => a + wc(s.text), 0);
  const clientWords = cli.reduce((a, s) => a + wc(s.text), 0);
  const totalWords = managerWords + clientWords;

  const longestMonologueWords = segments.reduce((m, s) => Math.max(m, wc(s.text)), 0);

  const hasTs = segments.some((s) => s.startMs != null && s.endMs != null);
  const dur = (s: ConvSegment) =>
    s.startMs != null && s.endMs != null ? Math.max(0, s.endMs - s.startMs) : 0;
  const talkMsMgr = mgr.reduce((a, s) => a + dur(s), 0);
  const talkMsCli = cli.reduce((a, s) => a + dur(s), 0);

  // Общая длительность и паузы — по таймкодам сегментов.
  let durationSec: number | null = null;
  let longestPauseSec: number | null = null;
  let pausesOver3s: number | null = null;
  if (hasTs) {
    const timed = segments
      .filter((s) => s.startMs != null && s.endMs != null)
      .sort((a, b) => (a.startMs as number) - (b.startMs as number));
    const first = timed[0]?.startMs ?? 0;
    const last = timed.reduce((m, s) => Math.max(m, s.endMs as number), 0);
    durationSec = Math.round((last - first) / 1000);
    let longest = 0;
    let cntPause = 0;
    for (let i = 1; i < timed.length; i++) {
      const gap = (timed[i].startMs as number) - (timed[i - 1].endMs as number);
      if (gap > longest) longest = gap;
      if (gap > 3000) cntPause++;
    }
    longestPauseSec = Math.round(longest / 1000);
    pausesOver3s = cntPause;
  }

  const wpm = (words: number, ms: number): number | null =>
    ms > 0 ? Math.round(words / (ms / 60000)) : null;

  return {
    managerWords,
    clientWords,
    talkRatioManager: totalWords ? r2(managerWords / totalWords) : null,
    managerUtterances: mgr.length,
    clientUtterances: cli.length,
    avgManagerUtteranceWords: mgr.length ? Math.round(managerWords / mgr.length) : null,
    avgClientUtteranceWords: cli.length ? Math.round(clientWords / cli.length) : null,
    longestMonologueWords,
    durationSec,
    talkTimeManagerSec: hasTs ? Math.round(talkMsMgr / 1000) : null,
    talkTimeClientSec: hasTs ? Math.round(talkMsCli / 1000) : null,
    talkRatioManagerTime: hasTs && talkMsMgr + talkMsCli > 0 ? r2(talkMsMgr / (talkMsMgr + talkMsCli)) : null,
    wpmManager: hasTs ? wpm(managerWords, talkMsMgr) : null,
    wpmClient: hasTs ? wpm(clientWords, talkMsCli) : null,
    longestPauseSec,
    pausesOver3s,
    hasTimestamps: hasTs,
  };
}
