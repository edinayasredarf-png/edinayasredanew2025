'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import nextDynamic from 'next/dynamic';
import KpSettings from './KpSettings';

const RichEditor = nextDynamic(() => import('@/components/blog/RichEditor'), { ssr: false });

import { evalFormulaSafe } from './formulaClient';
import KpCalcGrid from './KpCalcGrid';
import type { Organization, Tier, Executor, TemplateMeta, HistoryRow, PriceMode, ServiceType, HeaderLayout, Alias, CalcColumn, CalcTableDef, RowData } from './types';

/* ─────────────── Утилиты расчёта (клиентские, для превью) ─────────────── */
function toNum(v: string | number | undefined): number {
  if (v == null) return 0;
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  const n = parseFloat(String(v).replace(/\s+/g, '').replace(',', '.'));
  return isFinite(n) ? n : 0;
}
function fmtMoney(n: number): string {
  const [i, d = '00'] = (Math.round(n * 100) / 100).toFixed(2).split('.');
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + '.' + d;
}

/** Стоимость услуги по строкам через колонку-стоимость таблицы (для превью). */
function computeServiceTotal(columns: CalcColumn[], rows: RowData[], scope: Record<string, number>): number {
  const costCol = columns.find((c) => c.isCost);
  if (!costCol) return 0;
  let total = 0;
  rows.forEach((row, ri) => {
    const s: Record<string, number> = { ...scope, row_index: ri + 1 };
    for (const c of columns) {
      if (c.kind === 'number') s[c.key] = toNum(row[c.key]);
      else if (c.kind === 'const') s[c.key] = toNum(c.constValue);
    }
    for (const c of columns) {
      if (c.kind === 'formula') s[c.key] = evalFormulaSafe(c.formula || '0', s);
    }
    total += s[costCol.key] || 0;
  });
  return total;
}

export default function KpGenerator() {
  const [tab, setTab] = useState<'create' | 'templates' | 'settings' | 'history'>('create');

  // Справочники
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [headerLayout, setHeaderLayout] = useState<HeaderLayout>({ left: [], center: [], right: [] });
  const [aliases, setAliases] = useState<Alias[]>([]);
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
  const [clientPosition, setClientPosition] = useState('');
  const [salutation, setSalutation] = useState('');

  const [kpDate, setKpDate] = useState('');
  const [kpNumber, setKpNumber] = useState('');
  const [requestNumber, setRequestNumber] = useState('');
  const [requestDate, setRequestDate] = useState('');
  const [validityPeriod, setValidityPeriod] = useState('30 дней');
  const [executorId, setExecutorId] = useState<number | ''>('');

  const [calcTables, setCalcTables] = useState<CalcTableDef[]>([]);
  const [selectedTableKey, setSelectedTableKey] = useState('');
  const [columns, setColumns] = useState<CalcColumn[]>([]);
  const [rows, setRows] = useState<RowData[]>([{}]);

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
      setServices(d.services || []);
      if (d.headerLayout) setHeaderLayout(d.headerLayout);
      setAliases(d.aliases || []);
      setCalcTables(d.calcTables || []);
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  // Инициализация выбранной таблицы расчёта.
  useEffect(() => {
    if (!calcTables.length) return;
    if (!selectedTableKey || !calcTables.some((t) => t.key === selectedTableKey)) {
      const t = calcTables[0];
      setSelectedTableKey(t.key);
      setColumns(t.columns);
      setRows([{}]);
    }
  }, [calcTables, selectedTableKey]);

  const onSelectTable = (key: string) => {
    const t = calcTables.find((x) => x.key === key);
    if (!t) return;
    setSelectedTableKey(key);
    setColumns(t.columns);
    setRows([{}]);
  };

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
    return selectedOrgs.map((key) => {
      const org = orgs.find((o) => o.key === key);
      const tier = tierFor(key);
      const perHa = mode === 'tender' ? tier?.pricePerHaTender ?? 0 : tier?.pricePerHaDirect ?? 0;
      const scope = {
        price: perHa,
        price_direct: tier?.pricePerHaDirect ?? 0,
        price_tender: tier?.pricePerHaTender ?? 0,
        min_ha: tier?.minHectares ?? 1,
      };
      const serviceTotal = incService ? computeServiceTotal(columns, rows, scope) : 0;
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
  }, [selectedOrgs, orgs, tierFor, mode, incService, incAis, incRenewal, aisLicenses, aisPrice, renewalYears, renewalPrice, rows, columns, templates, serviceType]);

  const previewTier = tierFor(selectedOrgs[0] || '');
  const previewScope = {
    price: mode === 'tender' ? previewTier?.pricePerHaTender ?? 0 : previewTier?.pricePerHaDirect ?? 0,
    price_direct: previewTier?.pricePerHaDirect ?? 0,
    price_tender: previewTier?.pricePerHaTender ?? 0,
    min_ha: previewTier?.minHectares ?? 1,
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
        position: clientPosition || undefined,
        salutation: salutation || undefined,
        requestNumber: requestNumber || undefined,
        requestDate: requestDate || undefined,
      },
      kp: { date: kpDate || undefined, number: kpNumber || undefined, validityPeriod },
      table: { key: selectedTableKey, name: calcTables.find((t) => t.key === selectedTableKey)?.name, columns },
      rows: rows.filter((r) => Object.values(r).some((v) => (v || '').trim())),
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
            clientFio, setClientFio, clientPosition, setClientPosition, salutation, setSalutation,
            kpDate, setKpDate, kpNumber, setKpNumber, requestNumber, setRequestNumber,
            requestDate, setRequestDate, validityPeriod, setValidityPeriod,
            executors, executorId, setExecutorId,
            calcTables, selectedTableKey, onSelectTable, columns, setColumns, rows, setRows, previewScope,
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
          aliases={aliases}
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
          services={services}
          headerLayout={headerLayout}
          aliases={aliases}
          calcTables={calcTables}
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
    clientFio, setClientFio, clientPosition, setClientPosition, salutation, setSalutation,
    kpDate, setKpDate, kpNumber, setKpNumber, requestNumber, setRequestNumber,
    requestDate, setRequestDate, validityPeriod, setValidityPeriod,
    executors, executorId, setExecutorId,
    calcTables, selectedTableKey, onSelectTable, columns, setColumns, rows, setRows, previewScope,
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
    clientFio: string; setClientFio: (v: string) => void; clientPosition: string; setClientPosition: (v: string) => void; salutation: string; setSalutation: (v: string) => void;
    kpDate: string; setKpDate: (v: string) => void; kpNumber: string; setKpNumber: (v: string) => void;
    requestNumber: string; setRequestNumber: (v: string) => void; requestDate: string; setRequestDate: (v: string) => void;
    validityPeriod: string; setValidityPeriod: (v: string) => void;
    executors: Executor[]; executorId: number | ''; setExecutorId: (v: number | '') => void;
    calcTables: CalcTableDef[]; selectedTableKey: string; onSelectTable: (k: string) => void;
    columns: CalcColumn[]; setColumns: React.Dispatch<React.SetStateAction<CalcColumn[]>>;
    rows: RowData[]; setRows: React.Dispatch<React.SetStateAction<RowData[]>>;
    previewScope: { price: number; price_direct: number; price_tender: number; min_ha: number };
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
                <Chk checked={incService} onChange={setIncService} text="Услуга" desc="Основная услуга по таблице расчёта" />
                <Chk checked={incAis} onChange={setIncAis} text='АИС «Единая среда»' desc="Продажа системы: лицензии + обучение и внедрение" />
                <Chk checked={incRenewal} onChange={setIncRenewal} text="Пролонгация" desc="Продление, поддержка и обновления по годам" />
              </div>
              <div className="text-[11px] text-gray-400 mt-1">Итоговая стоимость = сумма отмеченных блоков. Отмечайте нужные продукты для этого КП.</div>
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
            <div className="text-xs text-gray-400 mt-1">Система сама сделает «Иванов И.И.» / «Иванову И.И.» (дат.) и подберёт обращение по роду.</div>
          </div>
          <div>
            <div className={label}>Должность клиента (для адресата в шапке)</div>
            <input value={clientPosition} onChange={(e) => setClientPosition(e.target.value)} className={input} placeholder="Глава администрации" />
            <div className="text-xs text-gray-400 mt-1">В шапке справа ставится в дательном падеже: «Главе администрации».</div>
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

        {/* Таблица расчёта — конфигурируемая (Excel-стиль) */}
        <div className={panel}>
          <div className="text-sm font-semibold text-[#313131]">📊 Таблица расчёта</div>
          <KpCalcGrid
            calcTables={calcTables}
            selectedKey={selectedTableKey}
            onSelectTable={onSelectTable}
            columns={columns}
            setColumns={setColumns}
            rows={rows}
            setRows={setRows}
            previewScope={previewScope}
          />
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

function Chk({ checked, onChange, text, desc }: { checked: boolean; onChange: (v: boolean) => void; text: string; desc?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`text-left px-3 py-2 rounded-lg text-sm border ${checked ? 'border-[#029cda] bg-[#EAF6FC] text-[#0b5c7d]' : 'border-gray-200 bg-white text-gray-600'}`}
    >
      <div className="font-medium">{checked ? '✓ ' : ''}{text}</div>
      {desc && <div className="text-[11px] text-gray-400 leading-tight mt-0.5">{desc}</div>}
    </button>
  );
}

/* ═══════════════ Вкладка «Шаблоны» ═══════════════ */
interface TemplateDraft {
  id?: number;
  name: string;
  serviceType: string;
  orgKey: string;
  bodyHtml: string;
  skipAuto: boolean;
}

function TemplatesTab({
  orgs, serviceTypes, templates, aliases, onChanged, setStatus,
}: {
  orgs: Organization[];
  serviceTypes: string[];
  templates: TemplateMeta[];
  aliases: Alias[];
  onChanged: () => void;
  setStatus: (s: string) => void;
}) {
  const [draft, setDraft] = useState<TemplateDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const openNew = () =>
    setDraft({ name: '', serviceType: serviceTypes[0] || 'ИМЗ', orgKey: '', bodyHtml: '', skipAuto: false });

  const openEdit = async (id: number) => {
    try {
      const res = await fetch(`/api/kp/templates?id=${id}`, { credentials: 'include' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Ошибка');
      const t = d.template;
      setDraft({ id: t.id, name: t.name, serviceType: t.serviceType, orgKey: t.orgKey || '', bodyHtml: t.bodyHtml || '', skipAuto: t.skipAutoBlocks });
    } catch (e) {
      setStatus((e as Error).message);
    }
  };

  const saveDraft = async () => {
    if (!draft) return;
    if (!draft.serviceType) return setStatus('Укажите тип услуги');
    setBusy(true);
    try {
      const payload = {
        id: draft.id,
        name: draft.name || 'Шаблон',
        serviceType: draft.serviceType,
        orgKey: draft.orgKey || null,
        bodyHtml: draft.bodyHtml,
        skipAutoBlocks: draft.skipAuto,
      };
      const res = await fetch('/api/kp/templates', {
        method: draft.id ? 'PATCH' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Ошибка сохранения');
      setStatus('Шаблон сохранён');
      setDraft(null);
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

  const toggleSkip = async (id: number, skipAutoBlocks: boolean) => {
    await fetch('/api/kp/templates', {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, skipAutoBlocks }),
    });
    onChanged();
  };

  const input = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#029cda]';
  const label = 'block text-xs font-medium text-gray-500 mb-1';

  if (draft) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <div className="text-sm font-semibold text-[#313131]">{draft.id ? '✏️ Редактирование шаблона' : '➕ Новый шаблон'}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className={label}>Название</div>
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={input} placeholder="ИМЗ Экострой" />
            </div>
            <div>
              <div className={label}>Тип услуги *</div>
              <select value={draft.serviceType} onChange={(e) => setDraft({ ...draft, serviceType: e.target.value })} className={input}>
                {serviceTypes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div className={label}>Компания (пусто = общий)</div>
              <select value={draft.orgKey} onChange={(e) => setDraft({ ...draft, orgKey: e.target.value })} className={input}>
                <option value="">Для всех компаний</option>
                {orgs.map((o) => <option key={o.key} value={o.key}>{o.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div className={label}>Тело шаблона (форматируйте как в Word; вставляйте алиасы {'{{...}}'} из панели справа)</div>
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <RichEditor key={draft.id || 'new'} initialHtml={draft.bodyHtml} onChange={(html) => setDraft((d) => (d ? { ...d, bodyHtml: html } : d))} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#313131] cursor-pointer">
            <input type="checkbox" checked={draft.skipAuto} onChange={(e) => setDraft({ ...draft, skipAuto: e.target.checked })} />
            Шаблон уже содержит шапку/подписанта (не добавлять автоматически)
          </label>
          <div className="flex gap-2">
            <button onClick={saveDraft} disabled={busy} className="px-4 py-2 text-sm rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-50">{busy ? 'Сохранение…' : 'Сохранить шаблон'}</button>
            <button onClick={() => setDraft(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-[#313131] hover:bg-gray-50">Отмена</button>
          </div>
        </div>
        <div>
          <AliasPanel aliases={aliases} onChanged={onChanged} setStatus={setStatus} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={openNew} className="px-4 py-2 text-sm rounded-lg bg-[#029cda] text-white hover:bg-[#0280b5]">➕ Создать шаблон</button>
        <button onClick={() => setUploadOpen((v) => !v)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-[#313131] hover:bg-gray-50">⤴️ Загрузить .docx</button>
      </div>

      {uploadOpen && <DocxUpload orgs={orgs} serviceTypes={serviceTypes} onChanged={onChanged} setStatus={setStatus} />}

      <div className="space-y-2">
        {templates.length === 0 && <div className="text-sm text-gray-400">Шаблонов пока нет. Создайте новый или загрузите .docx.</div>}
        {templates.map((t) => (
          <div key={t.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
            <div>
              <div className="font-medium text-sm text-[#313131]">
                {t.name}{' '}
                <span className="text-xs bg-[#EAF6FC] text-[#0b5c7d] px-2 py-0.5 rounded ml-1">{t.serviceType}</span>{' '}
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{t.orgKey ? orgs.find((o) => o.key === t.orgKey)?.shortName || t.orgKey : 'общий'}</span>{' '}
                <span className="text-xs text-gray-400">{t.source === 'html' ? 'редактируемый' : '.docx'}</span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">плейсхолдеров: {t.placeholders.length}</div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mt-1 cursor-pointer">
                <input type="checkbox" checked={t.skipAutoBlocks} onChange={(e) => toggleSkip(t.id, e.target.checked)} />
                уже содержит шапку/подписанта (не добавлять авто)
              </label>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => openEdit(t.id)} className="text-sm text-[#029cda] hover:text-[#0280b5]">Изменить</button>
              <button onClick={() => del(t.id)} className="text-red-500 hover:text-red-600 text-sm">Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Панель алиасов: копирование в буфер + создание своих. */
function AliasPanel({ aliases, onChanged, setStatus }: { aliases: Alias[]; onChanged: () => void; setStatus: (s: string) => void }) {
  const [k, setK] = useState('');
  const [lbl, setLbl] = useState('');
  const [val, setVal] = useState('');
  const copy = async (key: string) => {
    try { await navigator.clipboard.writeText(`{{${key}}}`); setStatus(`Скопировано: {{${key}}}`); }
    catch { setStatus(`Вставьте вручную: {{${key}}}`); }
  };
  const create = async () => {
    if (!k.trim()) return setStatus('Укажите ключ алиаса');
    const res = await fetch('/api/kp/aliases', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: k, label: lbl, value: val }),
    });
    const j = await res.json();
    if (!res.ok) return setStatus(j.error || 'Ошибка');
    setK(''); setLbl(''); setVal('');
    setStatus('Алиас создан');
    onChanged();
  };
  const custom = aliases.filter((a) => a.isCustom);
  const builtin = aliases.filter((a) => !a.isCustom);
  const chip = (a: Alias) => (
    <button key={a.key} onClick={() => copy(a.key)} title={`${a.label}${a.isCustom ? ` = ${a.value}` : ''} — нажмите, чтобы скопировать`}
      className="text-left px-2 py-1 rounded border border-gray-200 bg-white hover:border-[#029cda] text-xs">
      <code className="font-mono text-[#0b5c7d]">{`{{${a.key}}}`}</code>
      <span className="text-gray-400 block truncate">{a.label}</span>
    </button>
  );
  return (
    <div className="bg-[#EAF6FC] border border-[#cbe8f5] rounded-2xl p-4 space-y-3 sticky top-4">
      <div className="text-sm font-semibold text-[#0b5c7d]">🏷 Алиасы (клик — копировать)</div>
      <div className="text-[11px] text-[#4a7d92]">Нажмите на алиас, чтобы скопировать, и вставьте в текст (Ctrl+V). Шапка/подписант/таблица подставляются автоматически.</div>
      {custom.length > 0 && (
        <>
          <div className="text-xs font-medium text-[#0b5c7d]">Свои</div>
          <div className="grid grid-cols-2 gap-1">{custom.map(chip)}</div>
        </>
      )}
      <div className="text-xs font-medium text-[#0b5c7d]">Встроенные</div>
      <div className="grid grid-cols-2 gap-1 max-h-72 overflow-y-auto pr-1">{builtin.map(chip)}</div>
      <div className="border-t border-[#cbe8f5] pt-2 space-y-1">
        <div className="text-xs font-medium text-[#0b5c7d]">➕ Новый алиас</div>
        <input value={k} onChange={(e) => setK(e.target.value)} placeholder="ключ (латиница)" className="w-full px-2 py-1 rounded border border-gray-200 text-xs" />
        <input value={lbl} onChange={(e) => setLbl(e.target.value)} placeholder="описание" className="w-full px-2 py-1 rounded border border-gray-200 text-xs" />
        <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="значение (текст)" className="w-full px-2 py-1 rounded border border-gray-200 text-xs" />
        <button onClick={create} className="w-full px-3 py-1.5 rounded-lg bg-[#029cda] text-white text-xs hover:bg-[#0280b5]">Создать</button>
      </div>
    </div>
  );
}

/* Загрузка готового .docx. */
function DocxUpload({ orgs, serviceTypes, onChanged, setStatus }: { orgs: Organization[]; serviceTypes: string[]; onChanged: () => void; setStatus: (s: string) => void }) {
  const [name, setName] = useState('');
  const [svc, setSvc] = useState(serviceTypes[0] || 'ИМЗ');
  const [orgKey, setOrgKey] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [skipAuto, setSkipAuto] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#029cda]';
  const label = 'block text-xs font-medium text-gray-500 mb-1';
  const upload = async () => {
    if (!file) return setStatus('Приложите .docx');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', name || file.name.replace(/\.docx$/i, ''));
      fd.append('serviceType', svc);
      fd.append('orgKey', orgKey);
      fd.append('skipAutoBlocks', String(skipAuto));
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
  return (
    <div className="bg-[#F6F7F9] rounded-2xl border border-gray-100 p-5 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div><div className={label}>Название</div><input value={name} onChange={(e) => setName(e.target.value)} className={input} /></div>
        <div><div className={label}>Тип услуги *</div><select value={svc} onChange={(e) => setSvc(e.target.value)} className={input}>{serviceTypes.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
        <div><div className={label}>Компания (пусто = общий)</div><select value={orgKey} onChange={(e) => setOrgKey(e.target.value)} className={input}><option value="">Для всех компаний</option>{orgs.map((o) => <option key={o.key} value={o.key}>{o.name}</option>)}</select></div>
      </div>
      <input type="file" accept=".docx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" />
      <label className="flex items-center gap-2 text-sm text-[#313131] cursor-pointer">
        <input type="checkbox" checked={skipAuto} onChange={(e) => setSkipAuto(e.target.checked)} />
        Шаблон уже содержит шапку/подписанта
      </label>
      <button onClick={upload} disabled={busy || !file} className="px-4 py-2 text-sm rounded-lg bg-[#029cda] text-white hover:bg-[#0280b5] disabled:opacity-50">{busy ? 'Загрузка…' : 'Загрузить'}</button>
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
