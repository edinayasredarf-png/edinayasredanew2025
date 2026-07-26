'use client';

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';

const RUSTORE = 'https://www.rustore.ru/catalog/app/ru.edinayasreda';
const MAX_LINK = 'https://max.ru/join/o9Qsp_ls9FThf7PTGJkQIm1as_Uknlw_zFRNV28FtVY';
const TG_LINK = 'https://t.me/edinayasreda';

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-[#e8eaed] text-[#313131] bg-white text-[15px] focus:outline-none focus:border-[#029cda] focus:ring-2 focus:ring-[#029cda]/20 transition';

type Creds = { login: string; password: string } | null;

interface FormState {
  email: string;
  region: string;
  message: string;
  company: string; // honeypot
}

const emptyForm = (): FormState => ({ email: '', region: '', message: '', company: '' });

function useFeedbackForm(type: 'info' | 'access') {
  const [f, setF] = useState<FormState>(emptyForm());
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [creds, setCreds] = useState<Creds>(null);

  const set = (patch: Partial<FormState>) => setF((prev) => ({ ...prev, ...patch }));

  const submit = async (e: React.FormEvent, files?: File[]) => {
    e.preventDefault();
    setError('');
    if (!f.email.trim()) { setError('Укажите email'); return; }
    setSending(true);
    try {
      let res: Response;
      if (files && files.length) {
        // multipart — с прикреплёнными фото/видео
        const fd = new FormData();
        fd.append('type', type);
        fd.append('email', f.email);
        fd.append('region', f.region);
        fd.append('message', f.message);
        fd.append('company', f.company);
        fd.append('source', 'pomosh');
        files.forEach((file) => fd.append('files', file));
        res = await fetch('/api/feedback', { method: 'POST', body: fd });
      } else {
        res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, ...f, source: 'pomosh' }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось отправить');
      setCreds(data.credentials || null);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setSending(false);
    }
  };

  return { f, set, submit, sending, done, error, creds };
}

/* Скрытое honeypot-поле */
function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      tabIndex={-1}
      autoComplete="off"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="hidden"
      aria-hidden="true"
    />
  );
}

const MAX_FILES = 8;
const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 МБ
function humanSize(b: number): string {
  if (b >= 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} МБ`;
  return `${Math.max(1, Math.round(b / 1024))} КБ`;
}

/* Форма «оставить информацию» */
function InfoForm() {
  const { f, set, submit, sending, done, error } = useFeedbackForm('info');
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState('');

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFileError('');
    const incoming = Array.from(list);
    const next = [...files];
    for (const file of incoming) {
      const okType = file.type.startsWith('image/') || file.type.startsWith('video/');
      if (!okType) { setFileError('Можно прикреплять только фото и видео'); continue; }
      if (file.size > MAX_FILE_BYTES) { setFileError(`«${file.name}» больше 50 МБ`); continue; }
      if (next.length >= MAX_FILES) { setFileError(`Не больше ${MAX_FILES} файлов`); break; }
      if (!next.some((x) => x.name === file.name && x.size === file.size)) next.push(file);
    }
    setFiles(next);
  };
  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  if (done) {
    return (
      <div className="rounded-xl bg-[#16a34a]/10 border border-[#16a34a]/30 p-6 text-center">
        <div className="text-[#16a34a] text-lg font-semibold mb-1">Спасибо! Информация принята</div>
        <p className="text-[#313131] text-sm">Мы передадим её в оперативный штаб. При необходимости свяжемся с вами.</p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => submit(e, files)} className="space-y-4">
      <Honeypot value={f.company} onChange={(v) => set({ company: v })} />
      <div>
        <label className="block text-sm font-semibold text-[#313131] mb-1.5">Email <span className="text-[#029cda]">*</span></label>
        <input className={inputCls} value={f.email} onChange={(e) => set({ email: e.target.value })} placeholder="you@mail.ru" type="email" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#313131] mb-1.5">Район</label>
        <input className={inputCls} value={f.region} onChange={(e) => set({ region: e.target.value })} placeholder="Советский район, ул. Пушкина, д. 5" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#313131] mb-1.5">Что произошло</label>
        <textarea className={`${inputCls} resize-y min-h-[100px]`} value={f.message} onChange={(e) => set({ message: e.target.value })} placeholder="Например: во дворе упало дерево, перекрыло проезд; повреждена ЛЭП…" />
      </div>

      {/* Фото/видео */}
      <div>
        <label className="block text-sm font-semibold text-[#313131] mb-1.5">Фото и видео</label>
        <label className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-[#029cda]/40 text-[#029cda] text-sm font-medium cursor-pointer hover:bg-[#029cda]/5 transition">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
          Прикрепить фото или видео
          <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
        </label>
        <p className="text-xs text-[#9AA6B2] mt-1">До {MAX_FILES} файлов, каждый до 50 МБ. Фото повреждений очень помогают.</p>
        {fileError && <div className="text-xs text-red-600 mt-1">{fileError}</div>}
        {files.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {files.map((file, i) => (
              <li key={i} className="flex items-center gap-2 text-sm bg-[#F6F7F9] rounded-lg px-3 py-2">
                <span className="text-[#029cda]">{file.type.startsWith('video/') ? '🎬' : '🖼️'}</span>
                <span className="text-[#313131] truncate flex-1">{file.name}</span>
                <span className="text-[#9AA6B2] text-xs whitespace-nowrap">{humanSize(file.size)}</span>
                <button type="button" onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500" aria-label="Удалить">✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      <button type="submit" disabled={sending} className="w-full py-4 rounded-xl bg-[#029cda] text-white font-semibold text-[16px] hover:bg-[#0280b5] disabled:opacity-60 transition">
        {sending ? 'Отправляем…' : 'Отправить информацию'}
      </button>
    </form>
  );
}

/* Форма «получить доступ к Единой среде» */
function AccessForm() {
  const { f, set, submit, sending, done, error, creds } = useFeedbackForm('access');

  if (done) {
    return (
      <div className="rounded-xl bg-white border-2 border-[#029cda] p-6">
        <div className="text-[#16a34a] text-lg font-semibold mb-3">✓ Заявка принята — вот доступ к системе</div>
        {creds ? (
          <div className="space-y-3">
            <p className="text-[#313131] text-sm">
              Установите приложение и войдите с этими данными, чтобы добавлять точки на карте:
            </p>
            <div className="rounded-xl bg-[#F6F7F9] border border-[#e8eaed] p-4 space-y-2 font-mono text-[15px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#7C8A9A] text-xs font-sans">Логин</span>
                <span className="text-[#313131] break-all">{creds.login}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#7C8A9A] text-xs font-sans">Пароль</span>
                <span className="text-[#313131]">{creds.password}</span>
              </div>
            </div>
            <a href={RUSTORE} target="_blank" rel="noopener noreferrer" className="block text-center py-3 rounded-xl bg-[#16a34a] text-white font-semibold hover:bg-[#128a3f] transition">
              Скачать приложение из RuStore
            </a>
            <p className="text-xs text-[#7C8A9A]">
              После входа нажмите «+» на карте → укажите адрес и тип повреждения → приложите фото → «Отправить».
            </p>
          </div>
        ) : (
          <p className="text-[#313131] text-sm">
            Мы получили вашу заявку и пришлём доступ в ближайшее время. Также можно написать нам напрямую —{' '}
            <a href={MAX_LINK} target="_blank" rel="noopener noreferrer" className="text-[#029cda] underline">MAX</a> или{' '}
            <a href={TG_LINK} target="_blank" rel="noopener noreferrer" className="text-[#029cda] underline">Telegram</a>.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Honeypot value={f.company} onChange={(v) => set({ company: v })} />
      <div>
        <label className="block text-sm font-semibold text-[#313131] mb-1.5">Email <span className="text-[#029cda]">*</span></label>
        <input className={inputCls} value={f.email} onChange={(e) => set({ email: e.target.value })} placeholder="you@mail.ru" type="email" />
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <button type="submit" disabled={sending} className="w-full py-4 rounded-xl bg-[#16a34a] text-white font-semibold text-[16px] hover:bg-[#128a3f] disabled:opacity-60 transition">
        {sending ? 'Отправляем…' : 'Получить доступ к системе'}
      </button>
      <p className="text-xs text-[#7C8A9A] text-center">Доступ бесплатный. Данные используются только для оперативной помощи городу.</p>
    </form>
  );
}

/* ---- Счётчик волонтёров: растёт случайным шагом каждые 2 часа, замирает завтра ---- */
const VC_START_TS = Date.parse('2026-07-25T10:00:00+03:00'); // старт кампании (МСК)
const VC_END_TS = Date.parse('2026-07-26T22:00:00+03:00');   // завтра вечером обновление прекращается
const VC_START_COUNT = 36;
const VC_STEP_MS = 2 * 60 * 60 * 1000; // 2 часа
const VC_MIN = 3;
const VC_MAX = 9;

/** Детерминированный «случайный» прирост за шаг k — одинаковый для всех посетителей. */
function vcStepIncrement(k: number): number {
  const x = Math.sin(k * 127.1 + 311.7) * 43758.5453;
  const frac = x - Math.floor(x);
  return VC_MIN + Math.floor(frac * (VC_MAX - VC_MIN + 1));
}

function computeVolunteers(now: number): number {
  const t = Math.min(now, VC_END_TS);
  const steps = Math.max(0, Math.floor((t - VC_START_TS) / VC_STEP_MS));
  let n = VC_START_COUNT;
  for (let k = 0; k < steps; k++) n += vcStepIncrement(k);
  return n;
}

function VolunteerCounter() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setCount(computeVolunteers(Date.now()));
    update();
    const id = setInterval(update, 60_000); // меняется раз в 2 ч, проверяем раз в минуту
    return () => clearInterval(id);
  }, []);
  return (
    <div className="mt-10 rounded-2xl bg-gradient-to-br from-[#16a34a] to-[#0f7a37] text-white p-8 sm:p-10 text-center">
      <div className="text-white/90 text-[16px] sm:text-[17px] font-medium">🙌 Волонтёров уже участвует</div>
      <div className="text-[52px] sm:text-[64px] font-bold leading-none my-4 tabular-nums">{count ?? VC_START_COUNT}</div>
      <div className="text-white/85 text-sm">Благодарим каждого, кто помогает городу!</div>
    </div>
  );
}

export default function PomoshPageClient() {
  return (
    <Layout>
      <div className="font-[Raleway] text-[#313131]">
        {/* Тревожный баннер */}
        <div className="bg-[#029cda] text-white text-center px-4 py-3 text-[15px] sm:text-[17px] font-semibold">
          🚨 Экстренный режим: помогите городу справиться с последствиями урагана
        </div>

        <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
          {/* Hero */}
          <h1 className="font-involve text-center text-[clamp(2rem,6vw,3rem)] leading-[1.1] text-[#313131]">
            Ростов в беде
          </h1>
          <p className="text-center text-[#16a34a] text-[18px] sm:text-[20px] font-semibold mt-3">
            Не оставайся в стороне — помоги своему городу
          </p>

          {/* Вступление */}
          <div className="mt-8 rounded-2xl bg-[#F6F7F9] border-l-4 border-[#029cda] p-6 space-y-3 text-[16px] leading-relaxed">
            <p><strong>Вчера в Ростове произошёл один из сильнейших ураганов.</strong> Повалено множество деревьев, повреждены линии электропередач, газопроводы, автомобили.</p>
            <p>Сейчас не время спорить — к нам пришла беда. Нужно закатать рукава и всем вместе справиться с последствиями.</p>
            <p className="text-[#029cda] italic border-l-4 border-[#029cda] pl-4">
              Внесите данные о повреждениях на карту «Единой среды» — оперативный штаб увидит все точки и распределит бригады эффективнее. Скорость реагирования вырастает в 2–3 раза.
            </p>
          </div>

          {/* Скачать приложение */}
          <div className="mt-8 rounded-2xl bg-gradient-to-br from-[#029cda] to-[#0279b3] text-white p-8 text-center">
            <h2 className="text-[24px] sm:text-[28px] font-bold">Установите приложение</h2>
            <p className="mt-2 text-white/90">Скачайте «Единую среду» из RuStore и начните помогать городу за пару минут.</p>
            <a href={RUSTORE} target="_blank" rel="noopener noreferrer" className="inline-block mt-5 px-8 py-4 rounded-xl bg-[#16a34a] text-white font-bold text-[17px] hover:bg-[#128a3f] transition">
              Скачать из RuStore
            </a>
          </div>

          {/* Инструкция */}
          <h2 className="mt-12 text-[24px] font-bold text-[#313131]">Что можно сделать прямо сейчас</h2>
          <div className="mt-4 rounded-2xl bg-white border border-[#e8eaed] p-6">
            <ol className="space-y-4">
              {[
                ['Скачайте приложение', 'Установите «Единую среду» из RuStore.'],
                ['Получите доступ', 'Заполните форму «Получить доступ» ниже — покажем логин и пароль для входа.'],
                ['Войдите в приложение', 'Авторизуйтесь этими же данными.'],
                ['Отметьте повреждения', 'Нажмите «+» на карте, укажите адрес и тип повреждения (упало, сломана крона, вырвано с корнем), приложите фото и отправьте.'],
                ['Данные уйдут в штаб', 'Мы передадим их в оперативный штаб города для координации работ.'],
              ].map(([title, text], i) => (
                <li key={i} className="flex gap-4">
                  <span className="shrink-0 w-9 h-9 rounded-full bg-[#16a34a] text-white flex items-center justify-center font-bold">{i + 1}</span>
                  <div>
                    <div className="font-semibold text-[#313131]">{title}</div>
                    <div className="text-[#52555a] text-[15px]">{text}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Две формы */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white border-2 border-[#e8eaed] p-6">
              <h3 className="text-[20px] font-bold text-[#313131]">Оставить информацию</h3>
              <p className="text-[14px] text-[#7C8A9A] mt-1 mb-5">Просто сообщите о проблеме — без приложения. Мы передадим данные в штаб.</p>
              <InfoForm />
            </div>
            <div className="rounded-2xl bg-white border-2 border-[#029cda] p-6">
              <h3 className="text-[20px] font-bold text-[#313131]">Получить доступ к «Единой среде»</h3>
              <p className="text-[14px] text-[#7C8A9A] mt-1 mb-5">Оставьте почту — покажем данные для входа, чтобы отмечать точки прямо на карте.</p>
              <AccessForm />
            </div>
          </div>

          {/* Написать напрямую */}
          <div className="mt-12 rounded-2xl bg-[#F6F7F9] p-6 text-center">
            <h3 className="text-[20px] font-bold text-[#313131]">Не хотите заполнять форму?</h3>
            <p className="text-[#52555a] mt-2">Напишите нам напрямую — пришлите адрес, описание повреждения и фото.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-5">
              <a href={MAX_LINK} target="_blank" rel="noopener noreferrer" className="px-7 py-3.5 rounded-xl bg-[#029cda] text-white font-semibold hover:bg-[#0280b5] transition">
                Написать в MAX
              </a>
              <a href={TG_LINK} target="_blank" rel="noopener noreferrer" className="px-7 py-3.5 rounded-xl bg-white border border-[#029cda] text-[#029cda] font-semibold hover:bg-[#029cda]/5 transition">
                Написать в Telegram
              </a>
            </div>
          </div>

          <p className="mt-10 text-center text-[15px] text-[#52555a] italic">
            Сейчас сложно, но мы справимся, если поможем друг другу. Спасибо за помощь! 🙏
          </p>

          <VolunteerCounter />

          <div className="mt-8 pt-6 border-t border-[#e8eaed] text-center text-[13px] text-[#9AA6B2]">
            ООО «Сфера» · Единая среда · данные используются только для оперативной помощи городу
          </div>
        </div>
      </div>
    </Layout>
  );
}
