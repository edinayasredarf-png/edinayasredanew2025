'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import KpSettings from './KpSettings';

/* ─────────────── Типы (зеркало серверных) ─────────────── */
import type { Organization, Tier, Executor, TemplateMeta, HistoryRow, CalcRow, PriceMode } from './types';

/* ─────────────── Утилиты расчёта (клиентские, для превью) ─────────────── */
function toNum(v: string | number): number {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  const n = parseFloat(String(v).replace(/\s+/g, '').replace(',', '.'));
  return isFinite(n) ? n : 0;
}
function rowHa(r: CalcRow): number {
  return toNum(r.areaSqm) / 10000;
}
function fmtMoney(n: number): string {
  const [i, d = '00'] = (Math.round(n * 100) / 100).toFixed(2).split('.');
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + '.' + d;
}

/* ─────────────── Компонент ─────────────── */
const emptyRow = (): CalcRow => ({ name: '', cadastral: '', areaSqm: '' });

export default function KpGenerator() {
  const [tab, setTab] = useState<'create' | 'templates' | 'settings' | 'history'>('create');

  // Справочники
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  // Форма
  const [serviceType, setServiceType] = useState('ИМЗ');
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [mode, setMode] = useState<PriceMode>('direct');
  const [incService, setIncService] = useState(true);
  const [incAis, setIncAis] = useState(false);
  const [incRenewal, setIncRenewal] = useState(false);

  const [clientOrgFull, setClientOrgFull] = useState('');
  const [clientOrgShort, setClientOrgShort] = useState('');
  const [clientFio, setClientFio] = useState('');
  const [salutation, setSalutation] = useState('');

  const [kpDate, setKpDate] = useState('');
  const [kpNumber, setKpNumber] = useState('');
  const [requestNumber, setRequestNumber] = useState('');
  const [requestDate, setRequestDate] = useState('');
  const [validityPeriod, setValidityPeriod] = useState('30 дней');
  const [executorId, setExecutorId] = useState<number | ''>('');

  const [rows, setRows] = useState<CalcRow[]>([emptyRow()]);
  const [pasteText, setPasteText] = useState('');

  const [aisLicenses, setAisLicenses] = useState('1');
  const [aisPrice, setAisPrice] = useState('');
  const [renewalYears, setRenewalYears] = useState('1');
  const [renewalPrice, setRenewalPrice] = useState('');

  const [busy, setBusy] = useState(false);

  const loadMeta = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/kp/meta', { credentials: 'include' });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const d = await res.json();
      setOrgs(d.organizations || []);
      setTiers(d.tiers || []);
      setExecutors(d.executors || []);
      setTemplates(d.templates || []);
      setServiceTypes(d.serviceTypes || []);
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const tierFor = useCallback(
    (orgKey: string): Tier | undefined =>
      tiers.find((t) => t.orgKey === orgKey && t.serviceType === serviceType),
    [tiers, serviceType]
  );

  const toggleOrg = (key: string) =>
    setSelectedOrgs((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  // Живой расчёт итога по каждой выбранной организации (матрица «3 КП»).
  const perOrgTotals = useMemo(() => {
    const validRows = rows.filter((r) => toNum(r.areaSqm) > 0);
    return selectedOrgs.map((key) => {
      const org = orgs.find((o) => o.key === key);
      const tier = tierFor(key);
      const perHa = mode === 'tender' ? tier?.pricePerHaTender ?? 0 : tier?.pricePerHaDirect ?? 0;
      const min = tier?.minHectares ?? 1;
      const serviceTotal = incService
        ? validRows.reduce((s, r) => s + Math.max(rowHa(r), min) * perHa, 0)
        : 0;
      const ais = incAis ? toNum(aisLicenses) * toNum(aisPrice || tier?.aisPrice || 0) : 0;
      const renewal = incRenewal
        ? toNum(renewalYears) * toNum(renewalPrice || tier?.renewalPerYear || 0)
        : 0;
      const hasTemplate = templates.some(
        (t) => t.serviceType === serviceType && (t.orgKey === key || t.orgKey === null)
      );
      return {
        key,
        name: org?.shortName || key,
        serviceTotal,
        ais,
        renewal,
        grand: serviceTotal + ais + renewal,
        hasTemplate,
      };
    });
  }, [selectedOrgs, orgs, tierFor, mode, incService, incAis, incRenewal, aisLicenses, aisPrice, renewalYears, renewalPrice, rows, templates, serviceType]);

  const importPaste = () => {
    // Вставка из Excel: строки «Наименование<TAB>Кадастр<TAB>Площадь» (или площадь одна).
    const lines = pasteText.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsed: CalcRow[] = lines.map((l) => {
      const parts = l.split(/\t|;/).map((p) => p.trim());
      if (parts.length >= 3) return { name: parts[0], cadastral: parts[1], areaSqm: parts[2] };
      if (parts.length === 2) return { name: parts[0], cadastral: '', areaSqm: parts[1] };
      return { name: '', cadastral: '', areaSqm: parts[0] };
    });
    if (parsed.length) {
      setRows((rs) => [...rs.filter((r) => r.name || r.cadastral || r.areaSqm), ...parsed]);
      setPasteText('');
    }
  };

  const buildPayload = (format: 'docx' | 'pdf' | 'both') => ({
    format,
    form: {
      serviceType,
      mode,
      includes: { service: incService, ais: incAis, renewal: incRenewal },
      client: {
        orgFull: clientOrgFull,
        orgShort: clientOrgShort,
        fioFull: clientFio,
        salutation: salutation || undefined,
        requestNumber: requestNumber || undefined,
        requestDate: requestDate || undefined,
      },
      kp: { date: kpDate || undefined, number: kpNumber || undefined, validityPeriod },
      rows: rows
        .filter((r) => r.name || r.cadastral || toNum(r.areaSqm) > 0)
        .map((r) => ({ name: r.name, cadastral: r.cadastral, areaSqm: toNum(r.areaSqm) })),
      ais: incAis ? { licenses: toNum(aisLicenses), pricePerLicense: toNum(aisPrice) } : undefined,
      renewal: incRenewal
        ? { years: toNum(renewalYears), pricePerYear: toNum(renewalPrice) }
        : undefined,
    },
    orgKeys: selectedOrgs,
    executorId: executorId || undefined,
  });

  const validate = (): string | null => {
    if (selectedOrgs.length === 0) return 'Выберите хотя бы одну организацию';
    if (!clientOrgFull.trim()) return 'Укажите наименование организации клиента';
    if (!clientFio.trim()) return 'Укажите ФИО клиента';
    const missing = perOrgTotals.filter((t) => !t.hasTemplate).map((t) => t.name);
    if (missing.length)
      return `Нет шаблона (${serviceType}) для: ${missing.join(', ')}. Загрузите во вкладке «Шаблоны».`;
    return null;
  };

  const generate = async (format: 'docx' | 'pdf' | 'both' = 'docx') => {
    const err = validate();
    if (err) {
      setStatus(err);
      return;
    }
    setBusy(true);
    setStatus(format === 'docx' ? 'Генерация…' : 'Генерация (LibreOffice → PDF может занять время)…');
    try {
      const res = await fetch('/api/kp/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(format)),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Ошибка генерации');
      }
      const blob = await res.blob();
      const cdHeader = res.headers.get('Content-Disposition') || '';
      const m = cdHeader.match(/filename\*=UTF-8''([^;]+)/);
      const filename = m ? decodeURIComponent(m[1]) : 'КП.docx';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setStatus(`Готово: ${selectedOrgs.length} КП`);
      if (tab === 'create') void 0;
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  /* ─────────────── Рендер ─────────────── */
  if (loading) {
    return <div className="p-8 text-sm text-gray-500">Загрузка генератора КП…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#313131]">Генератор коммерческих предложений</h2>
          <p className="text-sm text-gray-500">
            Одна форма → несколько организаций сразу. Формулы из Excel «Расчёт по документам».
          </p>
        </div>
        <div className="flex gap-1 bg-[#F6F7F9] rounded-xl p-1">
          {(['create', 'templates', 'settings', 'history'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                tab === t ? 'bg-white shadow-sm text-[#313131] font-medium' : 'text-gray-500'
              }`}
            >
              {t === 'create' ? '📝 Создать КП' : t === 'templates' ? '📁 Шаблоны' : t === 'settings' ? '⚙️ Настройки' : '🗄 История'}
            </button>
          ))}
        </div>
      </div>

      {status && (
        <div className="text-sm px-4 py-2 rounded-lg bg-[#EAF6FC] text-[#0b5c7d] border border-[#cbe8f5]">
          {status}
        </div>
      )}

      {tab === 'create' && (
        <CreateTab
          {...{
            orgs, serviceTypes, serviceType, setServiceType,
            selectedOrgs, toggleOrg, tierFor, mode, setMode,
            incService, setIncService, incAis, setIncAis, incRenewal, setIncRenewal,
            clientOrgFull, setClientOrgFull, clientOrgShort, setClientOrgShort,
            clientFio, setClientFio, salutation, setSalutation,
            kpDate, setKpDate, kpNumber, setKpNumber, requestNumber, setRequestNumber,
            requestDate, setRequestDate, validityPeriod, setValidityPeriod,
            executors, executorId, setExecutorId,
            rows, setRows, pasteText, setPasteText, importPaste,
            aisLicenses, setAisLicenses, aisPrice, setAisPrice,
            renewalYears, setRenewalYears, renewalPrice, setRenewalPrice,
            perOrgTotals, generate, busy,
          }}
        />
      )}

      {tab === 'templates' && (
        <TemplatesTab
          orgs={orgs}
          serviceTypes={serviceTypes}
          templates={templates}
          onChanged={loadMeta}
          setStatus={setStatus}
        />
      )}

      {tab === 'settings' && (
        <KpSettings
          orgs={orgs}
          tiers={tiers}
          executors={executors}
          serviceTypes={serviceTypes}
          onChanged={loadMeta}
          setStatus={setStatus}
        />
      )}

      {tab === 'history' && <HistoryTab setStatus={setStatus} />}
    </div>
  );
}

/* ═══════════════ Вкладка «Создать КП» ═══════════════ */
type CreateProps = Record<string, unknown>;
function CreateTab(p: CreateProps) {
  const {
    orgs, serviceTypes, serviceType, setServiceType,
    selectedOrgs, toggleOrg, tierFor, mode, setMode,
    incService, setIncService, incAis, setIncAis, incRenewal, setIncRenewal,
    clientOrgFull, setClientOrgFull, clientOrgShort, setClientOrgShort,
    clientFio, setClientFio, salutation, setSalutation,
    kpDate, setKpDate, kpNumber, setKpNumber, requestNumber, setRequestNumber,
    requestDate, setRequestDate, validityPeriod, setValidityPeriod,
    executors, executorId, setExecutorId,
    rows, setRows, pasteText, setPasteText, importPaste,
    aisLicenses, setAisLicenses, aisPrice, setAisPrice,
    renewalYears, setRenewalYears, renewalPrice, setRenewalPrice,
    perOrgTotals, generate, busy,
  } = p as never as {
    orgs: Organization[]; serviceTypes: string[]; serviceType: string; setServiceType: (v: string) => void;
    selectedOrgs: string[]; toggleOrg: (k: string) => void; tierFor: (k: string) => Tier | undefined;
    mode: PriceMode; setMode: (v: PriceMode) => void;
    incService: boolean; setIncService: (v: boolean) => void; incAis: boolean; setIncAis: (v: boolean) => void;
    incRenewal: boolean; setIncRenewal: (v: boolean) => void;
    clientOrgFull: string; setClientOrgFull: (v: string) => void; clientOrgShort: string; setClientOrgShort: (v: string) => void;
    clientFio: string; setClientFio: (v: string) => void; salutation: string; setSalutation: (v: string) => void;
    kpDate: string; setKpDate: (v: string) => void; kpNumber: string; setKpNumber: (v: string) => void;
    requestNumber: string; setRequestNumber: (v: string) => void; requestDate: string; setRequestDate: (v: string) => void;
    validityPeriod: string; setValidityPeriod: (v: string) => void;
    executors: Executor[]; executorId: number | ''; setExecutorId: (v: number | '') => void;
    rows: CalcRow[]; setRows: React.Dispatch<React.SetStateAction<CalcRow[]>>;
    pasteText: string; setPasteText: (v: string) => void; importPaste: () => void;
    aisLicenses: string; setAisLicenses: (v: string) => void; aisPrice: string; setAisPrice: (v: string) => void;
    renewalYears: string; setRenewalYears: (v: string) => void; renewalPrice: string; setRenewalPrice: (v: string) => void;
    perOrgTotals: Array<{ key: string; name: string; serviceTotal: number; ais: number; renewal: number; grand: number; hasTemplate: boolean }>;
    generate: (format?: 'docx' | 'pdf' | 'both') => void; busy: boolean;
  };

  const input = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#029cda]';
  const label = 'block text-xs font-medium text-gray-500 mb-1';
  const panel = 'bg-[#F6F7F9] rounded-2xl border border-gray-100 p-5 space-y-4';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {/* Организации + услуга */}
        <div className={panel}>
          <div>
            <div className={label}>Тип услуги</div>
            <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className={input}>
              {serviceTypes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <div className={label}>Организации (от кого КП) — отметьте все нужные, будет по одному КП на каждую</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {orgs.map((o) => {
                const t = tierFor(o.key);
                const active = selectedOrgs.includes(o.key);
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => toggleOrg(o.key)}
                    className={`text-left px-3 py-2 rounded-xl border text-sm transition ${
                      active ? 'border-[#029cda] bg-[#EAF6FC]' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${active ? 'bg-[#029cda] border-[#029cda] text-white' : 'border-gray-300'}`}>{active ? '✓' : ''}</span>
                      <span className="font-medium text-[#313131]">{o.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 pl-6">
                      {t ? `${fmtMoney(mode === 'tender' ? t.pricePerHaTender : t.pricePerHaDirect)} ₽/га · АИС ${fmtMoney(t.aisPrice)} ₽` : 'нет тарифа для этой услуги'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              <div className={label}>Режим цены</div>
              <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-200">
                {(['direct', 'tender'] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)} className={`px-3 py-1.5 rounded-md text-sm ${mode === m ? 'bg-[#029cda] text-white' : 'text-gray-600'}`}>
                    {m === 'direct' ? 'Прямой контракт' : 'Торги'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className={label}>Что включаем в КП</div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Chk checked={incService} onChange={setIncService} text="Услуга" />
                <Chk checked={incAis} onChange={setIncAis} text='АИС «Единая среда»' />
                <Chk checked={incRenewal} onChange={setIncRenewal} text="Пролонгация" />
              </div>
            </div>
          </div>
        </div>

        {/* Данные клиента */}
        <div className={panel}>
          <div className="text-sm font-semibold text-[#313131]">👤 Данные клиента</div>
          <div>
            <div className={label}>Полное наименование организации клиента *</div>
            <input value={clientOrgFull} onChange={(e) => setClientOrgFull(e.target.value)} className={input} placeholder='Администрация Николаевского муниципального района' />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className={label}>Короткое название (для имени файла)</div>
              <input value={clientOrgShort} onChange={(e) => setClientOrgShort(e.target.value)} className={input} placeholder="Николаевский р-н" />
            </div>
            <div>
              <div className={label}>Обращение</div>
              <select value={salutation} onChange={(e) => setSalutation(e.target.value)} className={input}>
                <option value="">Авто (по ФИО)</option>
                <option value="Уважаемый">Уважаемый</option>
                <option value="Уважаемая">Уважаемая</option>
              </select>
            </div>
          </div>
          <div>
            <div className={label}>Полное ФИО клиента *</div>
            <input value={clientFio} onChange={(e) => setClientFio(e.target.value)} className={input} placeholder="Иванов Иван Иванович" />
            <div className="text-xs text-gray-400 mt-1">Система сама сделает «Иванов И.И.» и подберёт обращение по роду.</div>
          </div>
        </div>

        {/* Параметры КП */}
        <div className={panel}>
          <div className="text-sm font-semibold text-[#313131]">📄 Параметры КП</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className={label}>Дата КП (пусто = сегодня)</div>
              <input type="date" value={kpDate} onChange={(e) => setKpDate(e.target.value)} className={input} />
            </div>
            <div>
              <div className={label}>Номер КП (пусто = авто)</div>
              <input value={kpNumber} onChange={(e) => setKpNumber(e.target.value)} className={input} placeholder="КП-…" />
            </div>
            <div>
              <div className={label}>Срок действия</div>
              <input value={validityPeriod} onChange={(e) => setValidityPeriod(e.target.value)} className={input} />
            </div>
            <div>
              <div className={label}>№ запроса заказчика</div>
              <input value={requestNumber} onChange={(e) => setRequestNumber(e.target.value)} className={input} />
            </div>
            <div>
              <div className={label}>Дата запроса заказчика</div>
              <input type="date" value={requestDate} onChange={(e) => setRequestDate(e.target.value)} className={input} />
            </div>
            <div>
              <div className={label}>Исполнитель (менеджер) *</div>
              <select value={executorId} onChange={(e) => setExecutorId(e.target.value ? Number(e.target.value) : '')} className={input}>
                <option value="">Выберите…</option>
                {executors.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.fio}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Таблица расчёта */}
        <div className={panel}>
          <div className="text-sm font-semibold text-[#313131]">📊 Таблица расчёта (территории / участки)</div>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="pb-1 w-8">№</th>
                  <th className="pb-1">Наименование территории</th>
                  <th className="pb-1">Кадастровый номер</th>
                  <th className="pb-1 w-28">Площадь, м²</th>
                  <th className="pb-1 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="py-1 text-gray-400">{i + 1}</td>
                    <td className="py-1 pr-2">
                      <input value={r.name} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className={input} />
                    </td>
                    <td className="py-1 pr-2">
                      <input value={r.cadastral} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, cadastral: e.target.value } : x)))} className={input} />
                    </td>
                    <td className="py-1 pr-2">
                      <input value={r.areaSqm} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, areaSqm: e.target.value } : x)))} className={input} inputMode="decimal" />
                    </td>
                    <td className="py-1">
                      <button onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-600 px-2">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => setRows((rs) => [...rs, emptyRow()])} className="text-sm text-[#029cda] hover:text-[#0280b5]">+ Добавить строку</button>
          <div>
            <div className={label}>Быстрый импорт из Excel (Наименование ⭾ Кадастр ⭾ Площадь м², по строке на участок)</div>
            <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} className={`${input} h-20 font-mono text-xs`} placeholder={'Город Николаевск\t27:20:0010103:566\t113537'} />
            <button onClick={importPaste} disabled={!pasteText.trim()} className="mt-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-[#313131] hover:bg-gray-50 disabled:opacity-40">Добавить из вставки</button>
          </div>
        </div>

        {/* АИС / Пролонгация */}
        {(incAis || incRenewal) && (
          <div className={panel}>
            {incAis && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className={label}>АИС: количество лицензий</div>
                  <input value={aisLicenses} onChange={(e) => setAisLicenses(e.target.value)} className={input} inputMode="numeric" />
                </div>
                <div>
                  <div className={label}>АИС: цена за лицензию (пусто = из тарифа)</div>
                  <input value={aisPrice} onChange={(e) => setAisPrice(e.target.value)} className={input} inputMode="decimal" placeholder="из тарифа организации" />
                </div>
              </div>
            )}
            {incRenewal && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className={label}>Пролонгация: лет</div>
                  <input value={renewalYears} onChange={(e) => setRenewalYears(e.target.value)} className={input} inputMode="numeric" />
                </div>
                <div>
                  <div className={label}>Пролонгация: цена за год (пусто = из тарифа)</div>
                  <input value={renewalPrice} onChange={(e) => setRenewalPrice(e.target.value)} className={input} inputMode="decimal" placeholder="из тарифа организации" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Правая колонка: матрица итогов + действия */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 sticky top-4">
          <div className="text-sm font-semibold text-[#313131]">💰 Итоги по организациям</div>
          {perOrgTotals.length === 0 && <div className="text-sm text-gray-400">Выберите организации слева.</div>}
          {perOrgTotals.map((t) => (
            <div key={t.key} className="border border-gray-100 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-[#313131]">{t.name}</span>
                {!t.hasTemplate && <span className="text-[10px] text-red-500">нет шаблона</span>}
              </div>
              <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                {t.serviceTotal > 0 && <div>Услуга: {fmtMoney(t.serviceTotal)} ₽</div>}
                {t.ais > 0 && <div>АИС: {fmtMoney(t.ais)} ₽</div>}
                {t.renewal > 0 && <div>Пролонгация: {fmtMoney(t.renewal)} ₽</div>}
              </div>
              <div className="text-lg font-bold text-[#313131] mt-1">{fmtMoney(t.grand)} ₽</div>
            </div>
          ))}

          <button
            onClick={() => generate('docx')}
            disabled={busy || perOrgTotals.length === 0}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-50"
          >
            {busy ? 'Генерация…' : selectedOrgs.length > 1 ? `📦 Скачать ${selectedOrgs.length} DOCX (ZIP)` : '📄 Скачать DOCX'}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => generate('pdf')}
              disabled={busy || perOrgTotals.length === 0}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-[#2563eb] text-white hover:bg-[#1d4ed8] disabled:opacity-50"
            >
              📕 PDF
            </button>
            <button
              onClick={() => generate('both')}
              disabled={busy || perOrgTotals.length === 0}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-[#d97706] text-white hover:bg-[#b45309] disabled:opacity-50"
            >
              📄+📕 DOCX+PDF
            </button>
          </div>
          <div className="text-[11px] text-gray-400 text-center">PDF — через сервис pdf-service (LibreOffice). Рассылка на почту — следующий этап.</div>
        </div>
      </div>
    </div>
  );
}

function Chk({ checked, onChange, text }: { checked: boolean; onChange: (v: boolean) => void; text: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`px-3 py-1.5 rounded-lg text-sm border ${checked ? 'border-[#029cda] bg-[#EAF6FC] text-[#0b5c7d]' : 'border-gray-200 bg-white text-gray-600'}`}
    >
      {checked ? '✓ ' : ''}{text}
    </button>
  );
}

/* ═══════════════ Вкладка «Шаблоны» ═══════════════ */
function TemplatesTab({
  orgs, serviceTypes, templates, onChanged, setStatus,
}: {
  orgs: Organization[];
  serviceTypes: string[];
  templates: TemplateMeta[];
  onChanged: () => void;
  setStatus: (s: string) => void;
}) {
  const [name, setName] = useState('');
  const [svc, setSvc] = useState(serviceTypes[0] || 'ИМЗ');
  const [orgKey, setOrgKey] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const upload = async () => {
    if (!file) return setStatus('Приложите .docx');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', name || file.name.replace(/\.docx$/i, ''));
      fd.append('serviceType', svc);
      fd.append('orgKey', orgKey);
      const res = await fetch('/api/kp/templates', { method: 'POST', credentials: 'include', body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Ошибка загрузки');
      setStatus(`Шаблон загружен · плейсхолдеров: ${d.placeholders?.length ?? 0}`);
      setName(''); setFile(null);
      onChanged();
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const del = async (id: number) => {
    if (!confirm('Удалить шаблон?')) return;
    await fetch(`/api/kp/templates?id=${id}`, { method: 'DELETE', credentials: 'include' });
    onChanged();
  };

  const input = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#029cda]';
  const label = 'block text-xs font-medium text-gray-500 mb-1';

  return (
    <div className="space-y-4">
      <details className="bg-[#EAF6FC] border border-[#cbe8f5] rounded-2xl p-4">
        <summary className="text-sm font-semibold text-[#0b5c7d] cursor-pointer">📌 Справочник алиасов (что подставляется в шаблон)</summary>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-[#0b5c7d]">
          <div><b>Шапка и подписант берутся из настроек компании:</b></div><div></div>
          {[
            ['{{company_header}}', 'текстовая шапка компании'],
            ['{{company_header_image}}', 'шапка-картинка'],
            ['{{sender_org}} / {{sender_org_short}}', 'название компании'],
            ['{{signer_role}} / {{signer_name}}', 'должность и ФИО подписанта'],
            ['{{signature}} / {{stamp}}', 'подпись и печать (картинки)'],
            ['{{kp_number}} / {{line_kp_number}}', 'номер (пусто, если выкл. у компании)'],
            ['{{kp_date}} / {{kp_validity_period}}', 'дата и срок КП'],
            ['{{client_org_full}} / {{client_fio_full}}', 'клиент'],
            ['{{client_fio_short}} / {{client_salutation}}', '«Иванов И.И.», обращение'],
            ['{{client_request_reference}}', '№ … от … (входящий запрос)'],
            ['{{executor_fio}} / {{executor_phone}}', 'исполнитель-менеджер'],
            ['{{cadastral_table}}', 'таблица участков с ИТОГО'],
            ['{{area_ha}} / {{location}}', 'площадь и местоположение'],
            ['{{total_cost}} / {{total_cost_in_words}}', 'итог и прописью'],
            ['{{ais_total}} / {{line_ais_offer}}', 'АИС: сумма и блок-предложение'],
            ['{{renewal_total}} / {{renewal_period}}', 'пролонгация'],
          ].map(([a, desc]) => (
            <div key={a} className="flex justify-between gap-2">
              <code className="font-mono">{a}</code>
              <span className="text-[#4a7d92] text-right">{desc}</span>
            </div>
          ))}
          <div className="col-span-full text-[11px] text-[#4a7d92] mt-2">
            Плейсхолдеры вида {'{{line_*}}'} удаляют свой абзац, если значение пустое (условные строки).
          </div>
        </div>
      </details>

      <div className="bg-[#F6F7F9] rounded-2xl border border-gray-100 p-5 space-y-3">
        <div className="text-sm font-semibold text-[#313131]">➕ Загрузить шаблон услуги (.docx с алиасами {'{{...}}'})</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <div className={label}>Название</div>
            <input value={name} onChange={(e) => setName(e.target.value)} className={input} placeholder="ИМЗ Экострой" />
          </div>
          <div>
            <div className={label}>Тип услуги *</div>
            <select value={svc} onChange={(e) => setSvc(e.target.value)} className={input}>
              {serviceTypes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div className={label}>Организация (пусто = общий)</div>
            <select value={orgKey} onChange={(e) => setOrgKey(e.target.value)} className={input}>
              <option value="">Для всех организаций</option>
              {orgs.map((o) => <option key={o.key} value={o.key}>{o.name}</option>)}
            </select>
          </div>
        </div>
        <input type="file" accept=".docx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" />
        <div>
          <button onClick={upload} disabled={busy || !file} className="px-4 py-2 text-sm rounded-lg bg-[#029cda] text-white hover:bg-[#0280b5] disabled:opacity-50">
            {busy ? 'Загрузка…' : 'Загрузить шаблон'}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {templates.length === 0 && <div className="text-sm text-gray-400">Шаблонов пока нет.</div>}
        {templates.map((t) => (
          <div key={t.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
            <div>
              <div className="font-medium text-sm text-[#313131]">
                {t.name}{' '}
                <span className="text-xs bg-[#EAF6FC] text-[#0b5c7d] px-2 py-0.5 rounded ml-1">{t.serviceType}</span>{' '}
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{t.orgKey ? orgs.find((o) => o.key === t.orgKey)?.shortName || t.orgKey : 'общий'}</span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{t.filename} · плейсхолдеров: {t.placeholders.length}</div>
            </div>
            <button onClick={() => del(t.id)} className="text-red-500 hover:text-red-600 text-sm px-2">Удалить</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ Вкладка «История» ═══════════════ */
function HistoryTab({ setStatus }: { setStatus: (s: string) => void }) {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/kp/history', { credentials: 'include' });
      const d = await res.json();
      setRows(d.rows || []);
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [setStatus]);

  useEffect(() => { load(); }, [load]);

  const del = async (id: number) => {
    await fetch(`/api/kp/history?id=${id}`, { method: 'DELETE', credentials: 'include' });
    load();
  };

  if (loading) return <div className="text-sm text-gray-400 p-4">Загрузка…</div>;

  return (
    <div className="space-y-2">
      {rows.length === 0 && <div className="text-sm text-gray-400">История пуста.</div>}
      {rows.map((r) => (
        <div key={r.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div className="min-w-0">
            <div className="font-medium text-sm text-[#313131] truncate">{r.title || r.clientOrg}</div>
            <div className="text-xs text-gray-400">
              {r.orgName} · {r.serviceType} · {r.format} · создал: {r.createdBy} · {new Date(r.createdAt).toLocaleString('ru-RU')}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-semibold text-[#313131]">{fmtMoney(r.totalCost)} ₽</span>
            <a href={`/api/kp/history/${r.id}/download`} className="text-sm text-[#029cda] hover:text-[#0280b5]">Скачать</a>
            <button onClick={() => del(r.id)} className="text-red-500 hover:text-red-600 text-sm">Удалить</button>
          </div>
        </div>
      ))}
    </div>
  );
}
