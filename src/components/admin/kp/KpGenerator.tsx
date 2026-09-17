'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import nextDynamic from 'next/dynamic';
import KpSettings from './KpSettings';

const RichEditor = nextDynamic(() => import('@/components/blog/RichEditor'), { ssr: false });

import { Spinner, LoadingBlock } from '@/components/admin/ui/Spinner';
import { composeTier, composeLines, isCombinedService, serviceComponents } from '@/lib/kp/serviceComposition';
import { positionWithCompany } from '@/lib/kp/companyCase';
import { evalFormulaSafe } from './formulaClient';
import KpCalcGrid from './KpCalcGrid';
import KpAutocomplete from './KpAutocomplete';
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

/** Состав КП по названию услуги: услуга / АИС «ЕС» / пролонгация. */
function deriveIncludes(svc: string): { service: boolean; ais: boolean; renewal: boolean } {
  const prolong = svc.includes('Пролонгац');
  const es = svc.includes('ЕС') || svc.includes('Единая');
  return { service: !prolong && svc !== 'ЕС', ais: es && !prolong, renewal: prolong };
}

/** Стоимость услуги по строкам через колонку-стоимость таблицы (для превью). */
function computeServiceTotal(columns: CalcColumn[], rows: RowData[], scope: Record<string, number>, areaUnit: 'sqm' | 'ha' = 'sqm'): number {
  const costCol = columns.find((c) => c.isCost) || columns.find((c) => c.key === 'cost_tender') || columns.find((c) => c.key === 'cost');
  if (!costCol) return 0;
  let total = 0;
  rows.forEach((row, ri) => {
    const s: Record<string, number> = { ...scope, row_index: ri + 1 };
    for (const c of columns) {
      if (c.kind === 'number') s[c.key] = toNum(row[c.key]);
      else if (c.kind === 'const') s[c.key] = toNum(c.constValue);
      else if (c.kind === 'text') s[c.key] = toNum(row[c.key]);
    }
    if (areaUnit === 'ha' && 'area_sqm' in s) s.area_sqm *= 10000;
    if (row.__pd) s.price_direct = toNum(row.__pd);
    if (row.__pt) s.price_tender = toNum(row.__pt);
    if (row.__p) s.price = toNum(row.__p);
    for (const c of columns) {
      if (c.kind === 'formula') s[c.key] = (row.__manual === '1' && row[c.key]) ? toNum(row[c.key]) : evalFormulaSafe(c.formula || '0', s);
    }
    total += s[costCol.key] || 0;
  });
  return total;
}

interface BatchClient { orgFull: string; fio?: string; position?: string; areaTotal?: string; quantity?: string; }

interface PreviewTable { headers: string[]; align: string[]; rows: string[][]; footers: string[][]; serviceTotal: number; }

function fmtRangeC(min: number, max: number, money: boolean): string {
  const f = money ? fmtMoney : (n: number) => String(n);
  return max > min + 0.005 ? `${f(min)} – ${f(max)}` : f(min);
}

/** Клиентский расчёт таблицы для предпросмотра (зеркало серверного computeTable, с диапазоном). */
function computePreviewTable(columns: CalcColumn[], rows: RowData[], base: Record<string, number>, areaUnit: 'sqm' | 'ha' = 'sqm'): PreviewTable {
  const headers = columns.map((c) => c.label);
  const align = columns.map((c) => c.align || (c.kind === 'text' ? 'left' : 'center'));
  const costIdx = columns.findIndex((c) => c.isCost);
  const sums = columns.map(() => 0);
  const sumsMax = columns.map(() => 0);
  const body = rows.map((row, ri) => {
    const s: Record<string, number> = { ...base, row_index: ri + 1 };
    for (const c of columns) {
      if (c.kind === 'number') s[c.key] = toNum(row[c.key]);
      else if (c.kind === 'const') s[c.key] = toNum(c.constValue);
      else if (c.kind === 'text') s[c.key] = toNum(row[c.key]);
    }
    if (areaUnit === 'ha' && 'area_sqm' in s) s.area_sqm *= 10000;
    const sMax: Record<string, number> = { ...s };
    if (row.__pd) { s.price_direct = toNum(row.__pd); sMax.price_direct = toNum(row.__pdMax) || toNum(row.__pd); }
    if (row.__pt) { s.price_tender = toNum(row.__pt); sMax.price_tender = toNum(row.__ptMax) || toNum(row.__pt); }
    if (row.__p) { s.price = toNum(row.__p); sMax.price = toNum(row.__pMax) || toNum(row.__p); }
    return columns.map((c, ci) => {
      let n = 0; let nMax = 0; let text = '';
      if (c.kind === 'index') { n = nMax = ri + 1; text = String(ri + 1); }
      else if (c.kind === 'text') { text = (row[c.key] || '').toString(); }
      else if (c.kind === 'const') { text = c.constValue || ''; n = nMax = toNum(c.constValue); }
      else if (c.kind === 'number') { n = nMax = toNum(row[c.key]); text = row[c.key] ? (c.money ? fmtMoney(n) : String(n)) : ''; }
      else if (c.kind === 'formula') {
        const manual = row.__manual === '1' && row[c.key];
        n = manual ? toNum(row[c.key]) : evalFormulaSafe(c.formula || '0', s);
        nMax = manual ? n : evalFormulaSafe(c.formula || '0', sMax);
        s[c.key] = n; sMax[c.key] = nMax;
        text = fmtRangeC(n, nMax, Boolean(c.money || c.isCost));
      }
      if (c.sum || c.isCost) { sums[ci] += n; sumsMax[ci] += nMax; }
      return text;
    });
  });
  const footer = columns.map((c, ci) => ci === 0 ? 'ВСЕГО' : ((c.sum || c.isCost) ? fmtRangeC(sums[ci], sumsMax[ci], Boolean(c.money || c.isCost)) : ''));
  return { headers, align, rows: body, footers: [footer], serviceTotal: costIdx >= 0 ? sums[costIdx] : 0 };
}

export default function KpGenerator() {
  const [tab, setTab] = useState<'create' | 'templates' | 'prices' | 'settings' | 'history' | 'sends' | 'registry'>('create');

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
  const [modeDirect, setModeDirect] = useState(true);
  const [modeTender, setModeTender] = useState(true);
  const [areaUnit, setAreaUnit] = useState<'sqm' | 'ha'>('sqm');
  // «Активный» режим (для одиночной цены `price` и итогов): прямой в приоритете.
  const mode: PriceMode = modeTender && !modeDirect ? 'tender' : 'direct';
  const [ruralSettlement, setRuralSettlement] = useState(false);
  // Состав КП выводится из выбранной услуги (свой шаблон на услугу).
  const inc = deriveIncludes(serviceType);

  const [clientOrgFull, setClientOrgFull] = useState('');
  const [clientFio, setClientFio] = useState('');
  const [clientPosition, setClientPosition] = useState('');
  const [positions, setPositions] = useState<string[]>([]);
  const [posSel, setPosSel] = useState('');
  const lastPosAutoFill = useRef('');
  const [clientTerritory, setClientTerritory] = useState('');
  const [clientAreaTotal, setClientAreaTotal] = useState('');
  const [clientQuantity, setClientQuantity] = useState('');
  const [salutation, setSalutation] = useState('');

  // Bitrix: компания → сделки → загрузка КП в сделку
  const [deals, setDeals] = useState<Array<{ id: string; title: string; stage?: string }>>([]);
  const [dealId, setDealId] = useState('');
  const [uploadToBitrix, setUploadToBitrix] = useState(false);
  const [clientCompanyId, setClientCompanyId] = useState(''); // выбранная компания Bitrix (для контактов)

  const loadDeals = async (companyId: string) => {
    try {
      const res = await fetch(`/api/kp/bitrix/deals?companyId=${encodeURIComponent(companyId)}`, { credentials: 'include' });
      const d = await res.json();
      setDeals(d.deals || []);
      setDealId((d.deals || [])[0]?.id || '');
    } catch {
      setDeals([]);
    }
  };
  const onPickCompany = (it: { id?: string; title: string }) => {
    setClientOrgFull(it.title);
    setClientCompanyId(it.id || '');
    if (it.id) loadDeals(it.id);
    else { setDeals([]); setDealId(''); }
  };
  // Ручное изменение названия компании сбрасывает привязку к компании Bitrix.
  const onChangeCompany = (v: string) => {
    setClientOrgFull(v);
    if (clientCompanyId) { setClientCompanyId(''); setDeals([]); setDealId(''); }
  };

  // Выбор должности из справочника → «Должность + организация в род. падеже».
  const applyPosition = (name: string) => {
    setPosSel(name);
    const v = positionWithCompany(name, clientOrgFull);
    setClientPosition(v);
    lastPosAutoFill.current = v;
  };
  // При смене названия компании перезаполняем поле, если его не правили вручную.
  useEffect(() => {
    if (!posSel) return;
    setClientPosition((cur) => {
      if (cur !== lastPosAutoFill.current) return cur; // правили вручную — не трогаем
      const v = positionWithCompany(posSel, clientOrgFull);
      lastPosAutoFill.current = v;
      return v;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientOrgFull]);

  const [kpDate, setKpDate] = useState('');
  const [kpNumber, setKpNumber] = useState('');
  const [recordRegistry, setRecordRegistry] = useState(false);
  const [requestNumber, setRequestNumber] = useState('');
  const [requestDate, setRequestDate] = useState('');
  const [validityPeriod, setValidityPeriod] = useState('30 дней');
  const [executorId, setExecutorId] = useState<number | ''>('');

  const [calcTables, setCalcTables] = useState<CalcTableDef[]>([]);
  const [selectedTableKey, setSelectedTableKey] = useState('');
  const [columns, setColumns] = useState<CalcColumn[]>([]);
  const [rows, setRows] = useState<RowData[]>([{}]);


  const [busy, setBusy] = useState(false);
  const [mailAccounts, setMailAccounts] = useState<Array<{ id: string; label: string; from_email: string }>>([]);

  useEffect(() => {
    fetch('/api/letters/accounts', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.accounts) setMailAccounts(d.accounts.filter((a: { enabled?: boolean }) => a.enabled)); })
      .catch(() => {});
  }, []);

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
      setPositions(d.positions || []);
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
      setRows(t.defaultRows?.length ? t.defaultRows.map((r) => ({ ...r })) : [{}]);
    }
  }, [calcTables, selectedTableKey]);

  // Колонки = из выбранной таблицы с учётом режима цены (прямой/торги) и единицы площади.
  const deriveColumns = useCallback((cols: CalcColumn[]): CalcColumn[] => {
    return cols
      .filter((c) => !(c.key === 'cost_direct' && !modeDirect) && !(c.key === 'cost_tender' && !modeTender))
      .map((c) => c.key === 'area_sqm' ? { ...c, label: areaUnit === 'ha' ? 'Площадь, га' : 'Площадь, кв.м' } : c);
  }, [modeDirect, modeTender, areaUnit]);

  useEffect(() => {
    const def = calcTables.find((t) => t.key === selectedTableKey);
    if (def) setColumns(deriveColumns(def.columns));
  }, [selectedTableKey, deriveColumns, calcTables]);

  const onSelectTable = (key: string) => {
    const t = calcTables.find((x) => x.key === key);
    if (!t) return;
    setSelectedTableKey(key);
    setRows([{}]);
  };

  // Импорт таблицы из Excel «как есть» → применяем как выбранную.
  const onImportedTable = useCallback((key: string, cols: CalcColumn[], newRows: RowData[]) => {
    setSelectedTableKey(key);
    setColumns(cols);
    setRows(newRows.length ? newRows : [{}]);
  }, []);

  // Строки-услуги выбранной услуги (для комбинированной — объединение компонентов),
  // разложенные по колонкам таблицы, с ценой из тарифа компании (превью — первая).
  const buildRowsForService = useCallback(
    (name: string, tableCols: CalcColumn[], orgKey: string): RowData[] => {
      const lineItemsOf = (svc: string) => services.find((s) => s.name === svc)?.lineItems ?? [];
      const priceOf = (svc: string, key: string) =>
        tiers.find((x) => x.orgKey === orgKey && x.serviceType === svc)?.linePrices?.[key];
      const lines = composeLines(name, lineItemsOf, priceOf);
      if (!lines.length) return [];
      const nameCol = tableCols.find((c) => c.key === 'name') || tableCols.find((c) => c.kind === 'text');
      const unitCol = tableCols.find((c) => ['area', 'area_txt', 'unit'].includes(c.key));
      const colByKey = (k: string) => tableCols.find((c) => c.key === k);
      return lines.map((l) => {
        // __pd/__pt — цена за единицу из «Цен» (по компании); формулы стоимости
        // считают цена × площадь. Для не-формульных таблиц заполняем и cost напрямую.
        const r: RowData = {
          __svc: l.svc, __line: l.key,
          __pd: l.direct ? String(l.direct) : '', __pt: l.tender ? String(l.tender) : '', __p: l.direct ? String(l.direct) : '',
          __pdMax: l.directMax ? String(l.directMax) : '', __ptMax: l.tenderMax ? String(l.tenderMax) : '', __pMax: l.directMax ? String(l.directMax) : '',
        };
        if (nameCol) r[nameCol.key] = l.name;
        if (unitCol) r[unitCol.key] = l.unit;
        const cd = colByKey('cost_direct');
        const ct = colByKey('cost_tender');
        const c1 = colByKey('cost');
        const up = colByKey('unit_price');
        if (up && up.kind === 'number') r.unit_price = l.direct ? String(l.direct) : '';
        if (cd && cd.kind === 'number') r.cost_direct = l.direct ? String(l.direct) : '';
        if (ct && ct.kind === 'number') r.cost_tender = l.tender ? String(l.tender) : '';
        if (c1 && c1.kind === 'number' && !cd) r.cost = l.direct ? String(l.direct) : '';
        return r;
      });
    },
    [services, tiers]
  );

  // Смена услуги → таблица по умолчанию + авто-строки услуги (если заданы).
  const onSelectService = (name: string) => {
    setServiceType(name);
    const svc = services.find((s) => s.name === name);
    const def = svc?.defaultTable;
    const orgKey = selectedOrgs[0] || orgs[0]?.key || '';
    if (def && calcTables.some((t) => t.key === def)) {
      const t = calcTables.find((x) => x.key === def)!;
      setSelectedTableKey(def); // колонки подставит эффект (с учётом режима цены/площади)
      const built = buildRowsForService(name, t.columns, orgKey);
      setRows(built.length ? built : (t.defaultRows?.length ? t.defaultRows.map((r) => ({ ...r })) : [{}]));
      return;
    }
    const built = buildRowsForService(name, columns, orgKey);
    if (built.length) setRows(built);
  };

  // Обновляем цены авто-строк под первую выбранную компанию (превью).
  useEffect(() => {
    const orgKey = selectedOrgs[0] || orgs[0]?.key || '';
    if (!orgKey) return;
    setRows((prev) => {
      if (!prev.length || !prev.every((r) => r.__line)) return prev; // только авто-строки
      return prev.map((r) => {
        const lp = tiers.find((x) => x.orgKey === orgKey && x.serviceType === r.__svc)?.linePrices?.[r.__line as string];
        if (!lp) return r;
        const out: RowData = { ...r };
        out.__pd = lp.direct ? String(lp.direct) : '';
        out.__pt = lp.tender ? String(lp.tender) : '';
        out.__p = lp.direct ? String(lp.direct) : '';
        out.__pdMax = lp.directMax ? String(lp.directMax) : '';
        out.__ptMax = lp.tenderMax ? String(lp.tenderMax) : '';
        out.__pMax = lp.directMax ? String(lp.directMax) : '';
        // Не-формульные ячейки стоимости заполняем напрямую (формулы считаются сами).
        if ('unit_price' in out) out.unit_price = lp.direct ? String(lp.direct) : '';
        if ('cost_direct' in out) out.cost_direct = lp.direct ? String(lp.direct) : '';
        if ('cost_tender' in out) out.cost_tender = lp.tender ? String(lp.tender) : '';
        if ('cost' in out && !('cost_direct' in out)) out.cost = lp.direct ? String(lp.direct) : '';
        return out;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrgs, tiers]);

  // Тариф услуги: для комбинированных (ИЗН + ЕС и т.п.) собирается из атомарных.
  const tierFor = useCallback(
    (orgKey: string): Tier | undefined =>
      composeTier(orgKey, serviceType, (svc) =>
        tiers.find((t) => t.orgKey === orgKey && t.serviceType === svc),
      ) as Tier | undefined,
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
      const serviceTotal = inc.service ? computeServiceTotal(columns, rows, scope, areaUnit) : 0;
      const ais = inc.ais ? toNum(tier?.aisPrice || 0) / (ruralSettlement ? 1.6 : 1) : 0;
      const renewal = inc.renewal ? toNum(tier?.renewalPerYear || 0) : 0;
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
  }, [selectedOrgs, orgs, tierFor, mode, areaUnit, ruralSettlement, inc.service, inc.ais, inc.renewal, rows, columns, templates, serviceType]);

  // Предупреждения о незаполненных ценах (не блокируют, но подсвечивают).
  const priceWarnings = useMemo(() => {
    const out: string[] = [];
    const labelOf = (key: string) => orgs.find((o) => o.key === key)?.shortName || key;
    if (inc.service) {
      const comps = serviceComponents(serviceType);
      const items = comps.flatMap((svc) =>
        (services.find((s) => s.name === svc)?.lineItems ?? []).map((it) => ({ svc, it })),
      );
      for (const key of selectedOrgs) {
        if (items.length) {
          for (const { svc, it } of items) {
            const lp = tiers.find((t) => t.orgKey === key && t.serviceType === svc)?.linePrices?.[it.key];
            if (!lp || (!lp.direct && !lp.tender)) out.push(`${labelOf(key)}: нет цены — «${it.name}»`);
          }
        } else {
          const t = tierFor(key);
          if (!(mode === 'tender' ? t?.pricePerHaTender : t?.pricePerHaDirect)) out.push(`${labelOf(key)}: не задана цена услуги`);
        }
      }
    }
    if (inc.ais) for (const key of selectedOrgs) { if (!tierFor(key)?.aisPrice) out.push(`${labelOf(key)}: не задана цена АИС`); }
    if (inc.renewal) for (const key of selectedOrgs) { if (!tierFor(key)?.renewalPerYear) out.push(`${labelOf(key)}: не задана цена пролонгации`); }
    return out;
  }, [serviceType, selectedOrgs, tiers, services, orgs, inc.service, inc.ais, inc.renewal, mode, tierFor]);

  // Предпросмотр таблиц по каждой выбранной компании (с её ценами).
  const computePreview = useCallback(() => {
    return selectedOrgs.map((key) => {
      const tier = tierFor(key);
      const active = mode === 'tender' ? tier?.pricePerHaTender : tier?.pricePerHaDirect;
      const base: Record<string, number> = {
        price_direct: tier?.pricePerHaDirect ?? 0,
        price_tender: tier?.pricePerHaTender ?? 0,
        price: active ?? 0,
        min_ha: tier?.minHectares ?? 1,
      };
      const rowsForOrg = rows.map((r) => {
        if (!r.__line) return r;
        const lp = tiers.find((t) => t.orgKey === key && t.serviceType === r.__svc)?.linePrices?.[r.__line as string];
        if (!lp) return r;
        return { ...r, __pd: lp.direct ? String(lp.direct) : '', __pt: lp.tender ? String(lp.tender) : '', __p: lp.direct ? String(lp.direct) : '' };
      });
      const table = inc.service ? computePreviewTable(columns, rowsForOrg, base, areaUnit) : null;
      const tot = perOrgTotals.find((t) => t.key === key);
      return {
        key,
        name: orgs.find((o) => o.key === key)?.shortName || key,
        table,
        ais: tot?.ais ?? 0,
        renewal: tot?.renewal ?? 0,
        grand: tot?.grand ?? 0,
      };
    });
  }, [selectedOrgs, tierFor, mode, areaUnit, rows, tiers, columns, perOrgTotals, orgs, inc.service]);

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
      areaUnit,
      ruralSettlement,
      includes: inc,
      client: {
        orgFull: clientOrgFull,
        fioFull: clientFio,
        position: clientPosition || undefined,
        territory: clientTerritory || undefined,
        areaTotal: clientAreaTotal || undefined,
        salutation: salutation || undefined,
        requestNumber: requestNumber || undefined,
        requestDate: requestDate || undefined,
      },
      kp: { date: kpDate || undefined, number: kpNumber || undefined, validityPeriod },
      object: clientQuantity ? { quantityUnits: toNum(clientQuantity) } : undefined,
      table: { key: selectedTableKey, name: calcTables.find((t) => t.key === selectedTableKey)?.name, columns },
      rows: rows.filter((r) => Object.values(r).some((v) => (v || '').trim())),
      ais: inc.ais ? { licenses: 1 } : undefined,
      renewal: inc.renewal ? { years: 1 } : undefined,
    },
    bitrix: uploadToBitrix && dealId ? { dealId, upload: true } : undefined,
    orgKeys: selectedOrgs,
    executorId: executorId || undefined,
    recordRegistry,
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
      let msg = `Готово: ${selectedOrgs.length} КП`;
      const bx = decodeURIComponent(res.headers.get('X-Kp-Bitrix') || '');
      if (bx.startsWith('ok:')) msg += ` · загружено в сделку Bitrix (${bx.slice(3)} файлов)`;
      else if (bx.startsWith('error:')) msg += ` · ⚠️ в Bitrix не загрузилось: ${bx.slice(6)}`;
      setStatus(msg);
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const sendEmail = async (opts: { to: string; subject: string; message: string; accountId: string; asPdf: boolean; perOrg: boolean }): Promise<boolean> => {
    const err = validate();
    if (err) { setStatus(err); return false; }
    if (!opts.to.trim()) { setStatus('Укажите e-mail клиента'); return false; }
    setBusy(true);
    setStatus('Отправка на почту…');
    try {
      const res = await fetch('/api/kp/send', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildPayload(opts.asPdf ? 'pdf' : 'docx'), clientEmail: opts.to, subject: opts.subject, message: opts.message, accountId: opts.accountId, asPdf: opts.asPdf, perOrg: opts.perOrg }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Ошибка отправки');
      if (Array.isArray(d.perOrg)) {
        const okList = d.perOrg.filter((s: { ok: boolean }) => s.ok);
        const failList = d.perOrg.filter((s: { ok: boolean }) => !s.ok);
        setStatus(
          failList.length === 0
            ? `✅ Отправлено от ${okList.length} организаций на ${d.to}`
            : `⚠️ Отправлено ${okList.length} из ${d.perOrg.length}. Ошибки: ${failList.map((s: { org: string; error?: string }) => `${s.org} (${s.error})`).join('; ')}`,
        );
      } else {
        setStatus(d.ok ? `✅ Отправлено на ${d.to} (${d.count} КП)` : `⚠️ Не доставлено${d.rejected?.length ? ': ' + d.rejected.join(', ') : ''}`);
      }
      return Boolean(d.ok);
    } catch (e) {
      setStatus((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const generateBatch = async (clients: BatchClient[], format: 'docx' | 'pdf' | 'both' = 'docx'): Promise<boolean> => {
    if (selectedOrgs.length === 0) { setStatus('Выберите хотя бы одну организацию'); return false; }
    const valid = clients.filter((c) => c.orgFull.trim());
    if (!valid.length) { setStatus('Добавьте хотя бы одного клиента'); return false; }
    const missing = perOrgTotals.filter((t) => !t.hasTemplate).map((t) => t.name);
    if (missing.length) { setStatus(`Нет шаблона (${serviceType}) для: ${missing.join(', ')}`); return false; }
    setBusy(true);
    setStatus(`Пакетная генерация: ${valid.length} клиентов…`);
    try {
      const res = await fetch('/api/kp/generate-batch', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildPayload(format), clients: valid }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Ошибка пакетной генерации'); }
      const blob = await res.blob();
      const cdHeader = res.headers.get('Content-Disposition') || '';
      const m = cdHeader.match(/filename\*=UTF-8''([^;]+)/);
      const filename = m ? decodeURIComponent(m[1]) : 'КП пакет.zip';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      setStatus(`Готово: пакет по ${valid.length} клиентам (${selectedOrgs.length} орг.)`);
      return true;
    } catch (e) {
      setStatus((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  /* ─────────────── Рендер ─────────────── */
  if (loading) {
    return <LoadingBlock label="Загрузка генератора КП…" />;
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
          {(['create', 'templates', 'prices', 'registry', 'settings', 'history', 'sends'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                tab === t ? 'bg-white shadow-sm text-[#313131] font-medium' : 'text-gray-500'
              }`}
            >
              {t === 'create' ? '📝 Создать КП' : t === 'templates' ? '📁 Шаблоны' : t === 'prices' ? '💰 Цены' : t === 'registry' ? '📋 Реестр КП' : t === 'settings' ? '⚙️ Настройки' : t === 'history' ? '🗄 История' : '✉️ Рассылки'}
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
            orgs, serviceTypes, serviceType, onSelectService, inc,
            selectedOrgs, toggleOrg, tierFor, mode, modeDirect, setModeDirect, modeTender, setModeTender, areaUnit, setAreaUnit, ruralSettlement, setRuralSettlement,
            clientOrgFull, onChangeCompany, clientCompanyId,
            clientFio, setClientFio, clientPosition, setClientPosition, clientTerritory, setClientTerritory, clientAreaTotal, setClientAreaTotal, clientQuantity, setClientQuantity, salutation, setSalutation,
            positions, posSel, applyPosition,
            onPickCompany, deals, dealId, setDealId, uploadToBitrix, setUploadToBitrix,
            kpDate, setKpDate, kpNumber, setKpNumber, recordRegistry, setRecordRegistry, requestNumber, setRequestNumber,
            requestDate, setRequestDate, validityPeriod, setValidityPeriod,
            executors, executorId, setExecutorId,
            calcTables, selectedTableKey, onSelectTable, columns, setColumns, rows, setRows, previewScope,
            onTablesChanged: loadMeta, onImportedTable, setStatus,
            perOrgTotals, priceWarnings, computePreview, generate, sendEmail, mailAccounts, generateBatch, busy,
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

      {tab === 'prices' && (
        <PricesTab
          orgs={orgs}
          tiers={tiers}
          services={services}
          onChanged={loadMeta}
          setStatus={setStatus}
        />
      )}

      {tab === 'settings' && (
        <KpSettings
          orgs={orgs}
          executors={executors}
          services={services}
          positions={positions}
          headerLayout={headerLayout}
          aliases={aliases}
          calcTables={calcTables}
          onChanged={loadMeta}
          setStatus={setStatus}
        />
      )}

      {tab === 'history' && <HistoryTab setStatus={setStatus} />}

      {tab === 'sends' && <SendsTab setStatus={setStatus} />}

      {tab === 'registry' && <RegistryTab orgs={orgs} setStatus={setStatus} />}
    </div>
  );
}

/* ═══════════════ Вкладка «Создать КП» ═══════════════ */
type CreateProps = Record<string, unknown>;
function CreateTab(p: CreateProps) {
  const {
    orgs, serviceTypes, serviceType, onSelectService, inc,
    selectedOrgs, toggleOrg, tierFor, mode, modeDirect, setModeDirect, modeTender, setModeTender, areaUnit, setAreaUnit, ruralSettlement, setRuralSettlement,
    clientOrgFull, onChangeCompany, clientCompanyId,
    clientFio, setClientFio, clientPosition, setClientPosition, clientTerritory, setClientTerritory, clientAreaTotal, setClientAreaTotal, clientQuantity, setClientQuantity, salutation, setSalutation,
    positions, posSel, applyPosition,
    onPickCompany, deals, dealId, setDealId, uploadToBitrix, setUploadToBitrix,
    kpDate, setKpDate, kpNumber, setKpNumber, recordRegistry, setRecordRegistry, requestNumber, setRequestNumber,
    requestDate, setRequestDate, validityPeriod, setValidityPeriod,
    executors, executorId, setExecutorId,
    calcTables, selectedTableKey, onSelectTable, columns, setColumns, rows, setRows, previewScope,
    onTablesChanged, onImportedTable, setStatus,
    perOrgTotals, priceWarnings, computePreview, generate, sendEmail, mailAccounts, generateBatch, busy,
  } = p as never as {
    orgs: Organization[]; serviceTypes: string[]; serviceType: string; onSelectService: (v: string) => void;
    inc: { service: boolean; ais: boolean; renewal: boolean };
    selectedOrgs: string[]; toggleOrg: (k: string) => void; tierFor: (k: string) => Tier | undefined;
    mode: PriceMode; modeDirect: boolean; setModeDirect: (v: boolean) => void; modeTender: boolean; setModeTender: (v: boolean) => void;
    areaUnit: 'sqm' | 'ha'; setAreaUnit: (v: 'sqm' | 'ha') => void;
    ruralSettlement: boolean; setRuralSettlement: (v: boolean) => void;
    clientOrgFull: string; onChangeCompany: (v: string) => void; clientCompanyId: string;
    clientFio: string; setClientFio: (v: string) => void; clientPosition: string; setClientPosition: (v: string) => void;
    clientTerritory: string; setClientTerritory: (v: string) => void;
    clientAreaTotal: string; setClientAreaTotal: (v: string) => void;
    clientQuantity: string; setClientQuantity: (v: string) => void; salutation: string; setSalutation: (v: string) => void;
    positions: string[]; posSel: string; applyPosition: (name: string) => void;
    onPickCompany: (it: { id?: string; title: string }) => void;
    deals: Array<{ id: string; title: string; stage?: string }>; dealId: string; setDealId: (v: string) => void;
    uploadToBitrix: boolean; setUploadToBitrix: (v: boolean) => void;
    kpDate: string; setKpDate: (v: string) => void; kpNumber: string; setKpNumber: (v: string) => void;
    recordRegistry: boolean; setRecordRegistry: (v: boolean) => void;
    requestNumber: string; setRequestNumber: (v: string) => void; requestDate: string; setRequestDate: (v: string) => void;
    validityPeriod: string; setValidityPeriod: (v: string) => void;
    executors: Executor[]; executorId: number | ''; setExecutorId: (v: number | '') => void;
    calcTables: CalcTableDef[]; selectedTableKey: string; onSelectTable: (k: string) => void;
    columns: CalcColumn[]; setColumns: React.Dispatch<React.SetStateAction<CalcColumn[]>>;
    rows: RowData[]; setRows: React.Dispatch<React.SetStateAction<RowData[]>>;
    previewScope: { price: number; price_direct: number; price_tender: number; min_ha: number };
    onTablesChanged: () => void; onImportedTable: (key: string, columns: CalcColumn[], rows: RowData[]) => void; setStatus: (s: string) => void;
    perOrgTotals: Array<{ key: string; name: string; serviceTotal: number; ais: number; renewal: number; grand: number; hasTemplate: boolean }>;
    priceWarnings: string[];
    computePreview: () => Array<{ key: string; name: string; table: PreviewTable | null; ais: number; renewal: number; grand: number }>;
    generate: (format?: 'docx' | 'pdf' | 'both') => void;
    sendEmail: (opts: { to: string; subject: string; message: string; accountId: string; asPdf: boolean; perOrg: boolean }) => Promise<boolean>;
    mailAccounts: Array<{ id: string; label: string; from_email: string }>;
    generateBatch: (clients: BatchClient[], format?: 'docx' | 'pdf' | 'both') => Promise<boolean>;
    busy: boolean;
  };

  const input = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#029cda]';
  const label = 'block text-xs font-medium text-gray-500 mb-1';
  const panel = 'bg-[#F6F7F9] rounded-2xl border border-gray-100 p-5 space-y-4';

  const [preview, setPreview] = React.useState<ReturnType<typeof computePreview> | null>(null);
  const [mailOpen, setMailOpen] = React.useState(false);
  const [mailTo, setMailTo] = React.useState('');
  const [mailSubject, setMailSubject] = React.useState('Коммерческое предложение');
  const [mailMessage, setMailMessage] = React.useState('Здравствуйте!\n\nНаправляем коммерческое предложение во вложении. Будем рады сотрудничеству.');
  const [mailAccountId, setMailAccountId] = React.useState('default');
  const [mailAsPdf, setMailAsPdf] = React.useState(false);
  const [mailPerOrg, setMailPerOrg] = React.useState(false);
  const [batchOpen, setBatchOpen] = React.useState(false);
  const [batchClients, setBatchClients] = React.useState<BatchClient[]>([{ orgFull: '', fio: '' }]);
  const [batchPaste, setBatchPaste] = React.useState('');

  const batchAddPaste = () => {
    const lines = batchPaste.replace(/\r/g, '').split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    const parsed: BatchClient[] = lines.map((l) => {
      const [orgFull = '', fio = '', areaTotal = '', quantity = ''] = l.split('\t');
      return { orgFull: orgFull.trim(), fio: fio.trim(), areaTotal: areaTotal.trim(), quantity: quantity.trim() };
    });
    setBatchClients((prev) => [...prev.filter((c) => c.orgFull.trim()), ...parsed]);
    setBatchPaste('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {/* Организации + услуга */}
        <div className={panel}>
          <div>
            <div className={label}>Тип услуги</div>
            <select value={serviceType} onChange={(e) => onSelectService(e.target.value)} className={input}>
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
              <div className={label}>Режим цены (можно оба)</div>
              <div className="flex flex-col gap-1 pt-1">
                <label className="flex items-center gap-2 text-sm text-[#313131] cursor-pointer">
                  <input type="checkbox" checked={modeDirect} onChange={(e) => { const v = e.target.checked; if (!v && !modeTender) return; setModeDirect(v); }} />
                  Прямой контракт
                </label>
                <label className="flex items-center gap-2 text-sm text-[#313131] cursor-pointer">
                  <input type="checkbox" checked={modeTender} onChange={(e) => { const v = e.target.checked; if (!v && !modeDirect) return; setModeTender(v); }} />
                  Торги
                </label>
              </div>
              <div className="text-[11px] text-gray-400 mt-1">В таблице показываются выбранные колонки стоимости.</div>
            </div>
            <div>
              <div className={label}>Единица площади</div>
              <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-200">
                {(['sqm', 'ha'] as const).map((u) => (
                  <button key={u} onClick={() => setAreaUnit(u)} className={`px-3 py-1.5 rounded-md text-sm ${areaUnit === u ? 'bg-[#029cda] text-white' : 'text-gray-600'}`}>
                    {u === 'sqm' ? 'кв. м' : 'гектары'}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm text-[#313131] cursor-pointer mt-2">
                <input type="checkbox" checked={ruralSettlement} onChange={(e) => setRuralSettlement(e.target.checked)} />
                Сельское поселение <span className="text-xs text-gray-400">(цена АИС ÷ 1,6)</span>
              </label>
            </div>
            <div>
              <div className={label}>Входит в услугу</div>
              <div className="flex flex-wrap gap-1 pt-1 text-xs">
                {inc.service && <span className="px-2 py-1 rounded-lg bg-[#EAF6FC] text-[#0b5c7d]">Услуга</span>}
                {inc.ais && <span className="px-2 py-1 rounded-lg bg-[#EAF6FC] text-[#0b5c7d]">АИС «Единая среда»</span>}
                {inc.renewal && <span className="px-2 py-1 rounded-lg bg-[#EAF6FC] text-[#0b5c7d]">Пролонгация</span>}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">Состав определяется выбранной услугой (у каждой свой шаблон и таблица).</div>
            </div>
          </div>
        </div>

        {/* Данные клиента */}
        <div className={panel}>
          <div className="text-sm font-semibold text-[#313131]">👤 Данные клиента</div>
          <div>
            <div className={label}>Полное наименование организации клиента *</div>
            <KpAutocomplete value={clientOrgFull} onChange={onChangeCompany} type="company" onPick={onPickCompany} className={input} placeholder='Администрация Николаевского муниципального района' />
            <div className="text-xs text-gray-400 mt-1">Начните вводить — подставим из Bitrix24. Короткое имя для файла сформируется автоматически.</div>
          </div>
          {deals.length > 0 && (
            <div className="bg-white border border-[#cbe8f5] rounded-xl p-3 space-y-2">
              <div className="text-sm font-semibold text-[#0b5c7d]">🤝 Сделка Bitrix24</div>
              <div>
                <div className={label}>Сделка компании</div>
                <select value={dealId} onChange={(e) => setDealId(e.target.value)} className={input}>
                  <option value="">— не выбрано —</option>
                  {deals.map((d) => <option key={d.id} value={d.id}>{d.title} (#{d.id})</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-[#313131] cursor-pointer">
                <input type="checkbox" checked={uploadToBitrix} onChange={(e) => setUploadToBitrix(e.target.checked)} disabled={!dealId} />
                Загружать готовые КП в сделку (поле «Файл КП»)
              </label>
              <div className="text-[11px] text-gray-400">Файлы (docx/pdf по всем выбранным компаниям) добавятся в сделку при генерации. Внимание: поле перезаписывается новым набором.</div>
            </div>
          )}
          <div>
            <div className={label}>Полное ФИО клиента *</div>
            <KpAutocomplete value={clientFio} onChange={setClientFio} type="contact" companyId={clientCompanyId} onPick={(it) => { setClientFio(it.title); if (it.position) setClientPosition(it.position); }} className={input} placeholder="Иванов Иван Иванович" />
            <div className="text-xs text-gray-400 mt-1">{clientCompanyId ? 'Контакты выбранной компании (из её сделок).' : 'Подсказки по всем контактам Bitrix24.'} «Иванов И.И.» / «Иванову И.И.» и обращение — автоматически.</div>
          </div>
          <div>
            <div className={label}>Обращение</div>
            <select value={salutation} onChange={(e) => setSalutation(e.target.value)} className={`${input} sm:max-w-xs`}>
              <option value="">Авто (по ФИО)</option>
              <option value="Уважаемый">Уважаемый</option>
              <option value="Уважаемая">Уважаемая</option>
            </select>
          </div>
          <div>
            <div className={label}>Должность клиента (для адресата в шапке)</div>
            <div className="flex gap-2">
              <select value={posSel} onChange={(e) => applyPosition(e.target.value)} className={`${input} sm:max-w-[220px]`}>
                <option value="">Выбрать должность…</option>
                {positions.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <input value={clientPosition} onChange={(e) => setClientPosition(e.target.value)} className={`${input} flex-1`} placeholder="Глава администрации района" />
            </div>
            <div className="text-xs text-gray-400 mt-1">Выбор должности подставит «должность + организация в род. падеже» (например, «Глава администрации района») — можно отредактировать. В шапке справа ставится в дательном падеже.</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className={label}>Территория / объект (алиас {'{{territory}}'})</div>
              <input value={clientTerritory} onChange={(e) => setClientTerritory(e.target.value)} className={input} placeholder="города Луганск / Липецкой области" />
            </div>
            <div>
              <div className={label}>Общая площадь (алиас {'{{area_total}}'})</div>
              <input value={clientAreaTotal} onChange={(e) => setClientAreaTotal(e.target.value)} className={input} placeholder="6 Га / 156 507 м²" />
            </div>
            <div>
              <div className={label}>Количество объектов (алиас {'{{quantity_units}}'})</div>
              <input value={clientQuantity} onChange={(e) => setClientQuantity(e.target.value)} className={input} inputMode="numeric" placeholder="200" />
            </div>
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
              <input value={kpNumber} onChange={(e) => setKpNumber(e.target.value)} className={input} placeholder="КП-…" disabled={recordRegistry} />
              <label className="flex items-center gap-2 text-xs text-[#313131] cursor-pointer mt-1">
                <input type="checkbox" checked={recordRegistry} onChange={(e) => setRecordRegistry(e.target.checked)} />
                Записать в реестр (№ по каждой компании)
              </label>
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
            areaUnit={areaUnit}
            onTablesChanged={onTablesChanged}
            onImportedTable={onImportedTable}
            setStatus={setStatus}
          />
        </div>

        {(inc.ais || inc.renewal) && (
          <div className="text-xs text-gray-400">
            {inc.ais && <span>Цена АИС «Единая среда» берётся из тарифа выбранной компании{ruralSettlement ? ' (÷1,6 для сельского поселения)' : ''}. </span>}
            {inc.renewal && <span>Стоимость пролонгации — из тарифа компании.</span>}
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

          {priceWarnings.length > 0 && (
            <div className="text-xs bg-[#FFF7ED] border border-[#fed7aa] text-[#9a3412] rounded-lg px-3 py-2 space-y-0.5">
              <div className="font-medium">⚠️ Проверьте цены (можно продолжить):</div>
              {priceWarnings.slice(0, 8).map((w, i) => <div key={i}>• {w}</div>)}
              {priceWarnings.length > 8 && <div>…и ещё {priceWarnings.length - 8}</div>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPreview(computePreview())}
              disabled={perOrgTotals.length === 0}
              className="px-3 py-2 rounded-lg text-sm font-medium border border-[#029cda] text-[#029cda] hover:bg-[#EAF6FC] disabled:opacity-50"
            >
              👁 Предпросмотр
            </button>
            <button
              onClick={() => setBatchOpen(true)}
              disabled={perOrgTotals.length === 0}
              className="px-3 py-2 rounded-lg text-sm font-medium border border-[#d97706] text-[#b45309] hover:bg-[#fff7ed] disabled:opacity-50"
            >
              📦 Пакет
            </button>
          </div>

          <button
            onClick={() => generate('docx')}
            disabled={busy || perOrgTotals.length === 0}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy && <Spinner size={16} color="#fff" />}
            {busy ? 'Генерация…' : selectedOrgs.length > 1 ? `📦 Скачать ${selectedOrgs.length} DOCX (ZIP)` : '📄 Скачать DOCX'}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => generate('pdf')}
              disabled={busy || perOrgTotals.length === 0}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-[#2563eb] text-white hover:bg-[#1d4ed8] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy && <Spinner size={16} color="#fff" />}
              📕 PDF
            </button>
            <button
              onClick={() => generate('both')}
              disabled={busy || perOrgTotals.length === 0}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-[#d97706] text-white hover:bg-[#b45309] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy && <Spinner size={16} color="#fff" />}
              📄+📕 DOCX+PDF
            </button>
          </div>
          <div className="text-[11px] text-gray-400 text-center">PDF — через сервис pdf-service (LibreOffice).</div>

          <button
            onClick={() => setMailOpen((v) => !v)}
            disabled={perOrgTotals.length === 0}
            className="w-full px-4 py-2 rounded-lg text-sm font-medium border border-[#7c3aed] text-[#7c3aed] hover:bg-[#f5f3ff] disabled:opacity-50"
          >
            ✉️ {mailOpen ? 'Скрыть отправку' : 'Отправить клиенту на почту'}
          </button>

          {mailOpen && (
            <div className="border border-gray-200 rounded-xl p-3 space-y-2 bg-[#FAFBFC]">
              <div>
                <div className={label}>E-mail клиента *</div>
                <input value={mailTo} onChange={(e) => setMailTo(e.target.value)} className={input} placeholder="client@example.ru" type="email" />
              </div>
              <div>
                <div className={label}>Тема</div>
                <input value={mailSubject} onChange={(e) => setMailSubject(e.target.value)} className={input} />
              </div>
              <div>
                <div className={label}>Сообщение</div>
                <textarea value={mailMessage} onChange={(e) => setMailMessage(e.target.value)} className={`${input} h-24`} />
              </div>
              <label className="flex items-center gap-2 text-xs text-[#313131] cursor-pointer">
                <input type="checkbox" checked={mailPerOrg} onChange={(e) => setMailPerOrg(e.target.checked)} />
                От каждой организации отдельным письмом (из её ящика)
              </label>
              {!mailPerOrg && (
                <div>
                  <div className={label}>Ящик отправки</div>
                  <select value={mailAccountId} onChange={(e) => setMailAccountId(e.target.value)} className={input}>
                    <option value="default">Основной (по умолчанию)</option>
                    {mailAccounts.map((a) => <option key={a.id} value={a.id}>{a.label} ({a.from_email})</option>)}
                  </select>
                </div>
              )}
              <label className="flex items-center gap-2 text-xs text-[#313131] cursor-pointer">
                <input type="checkbox" checked={mailAsPdf} onChange={(e) => setMailAsPdf(e.target.checked)} />
                Вложение в PDF (нужен pdf-service; иначе DOCX)
              </label>
              <div className="text-[11px] text-gray-400">
                {mailPerOrg
                  ? `${selectedOrgs.length} писем клиенту — по одному от каждой организации из её ящика (задаётся в Настройках компании).`
                  : `Одно письмо, во вложении ${selectedOrgs.length} КП (по одному на организацию).`}
              </div>
              <button
                onClick={() => sendEmail({ to: mailTo, subject: mailSubject, message: mailMessage, accountId: mailAccountId, asPdf: mailAsPdf, perOrg: mailPerOrg })}
                disabled={busy || !mailTo.trim() || perOrgTotals.length === 0}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-[#7c3aed] text-white hover:bg-[#6d28d9] disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {busy && <Spinner size={16} color="#fff" />}
                {busy ? 'Отправка…' : '✉️ Отправить'}
              </button>
            </div>
          )}
        </div>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full my-8 p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#313131]">Предпросмотр — {preview.length} КП</h3>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <div className="text-xs text-gray-400">Черновой расчёт по каждой компании. Оформление (шапка, подписант, текст) — из её шаблона при генерации.</div>
            {preview.map((p) => (
              <div key={p.key} className="border border-gray-200 rounded-xl p-4 space-y-2">
                <div className="font-semibold text-sm text-[#313131]">{p.name}</div>
                {p.table && p.table.rows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr>{p.table.headers.map((h, i) => <th key={i} className="border border-gray-200 bg-[#eef2f6] px-2 py-1 font-semibold text-[#313131]">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {p.table.rows.map((r, ri) => (
                          <tr key={ri}>{r.map((cell, ci) => <td key={ci} className={`border border-gray-200 px-2 py-1 ${p.table!.align[ci] === 'left' ? 'text-left' : p.table!.align[ci] === 'right' ? 'text-right' : 'text-center'}`}>{cell}</td>)}</tr>
                        ))}
                        {p.table.footers.map((f, fi) => (
                          <tr key={`f${fi}`} className="font-bold bg-[#FAFBFC]">{f.map((cell, ci) => <td key={ci} className="border border-gray-200 px-2 py-1 text-right">{cell}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <div className="text-xs text-gray-400">Таблица не заполнена.</div>}
                <div className="text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-0.5 pt-1">
                  {p.table && p.table.serviceTotal > 0 && <span>Услуга: <b>{fmtMoney(p.table.serviceTotal)} ₽</b></span>}
                  {p.ais > 0 && <span>АИС: <b>{fmtMoney(p.ais)} ₽</b></span>}
                  {p.renewal > 0 && <span>Пролонгация: <b>{fmtMoney(p.renewal)} ₽</b></span>}
                  <span className="text-[#313131]">Итого: <b>{fmtMoney(p.grand)} ₽</b></span>
                </div>
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <button onClick={() => setPreview(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-[#313131] hover:bg-gray-50">Закрыть</button>
              <button onClick={() => { setPreview(null); generate('docx'); }} disabled={busy} className="px-4 py-2 text-sm rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-50">Всё верно — скачать</button>
            </div>
          </div>
        </div>
      )}

      {batchOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4" onClick={() => setBatchOpen(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full my-8 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#313131]">📦 Пакет по клиентам</h3>
              <button onClick={() => setBatchOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <div className="text-xs text-gray-500">
              Услуга <b>{serviceType}</b>, организаций: <b>{selectedOrgs.length}</b>, таблица/цены — из текущей формы. На каждого клиента будет свой комплект КП (по одному на организацию), всё одним ZIP (папка на клиента).
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_90px_90px_28px] gap-2 text-[11px] text-gray-500 px-1">
                <span>Организация клиента *</span><span>ФИО (кому)</span><span>Площадь</span><span>Кол-во</span><span></span>
              </div>
              {batchClients.map((c, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_90px_90px_28px] gap-2 items-center">
                  <input value={c.orgFull} onChange={(e) => setBatchClients((a) => a.map((x, j) => j === i ? { ...x, orgFull: e.target.value } : x))} className={input} placeholder='ООО "Ромашка"' />
                  <input value={c.fio || ''} onChange={(e) => setBatchClients((a) => a.map((x, j) => j === i ? { ...x, fio: e.target.value } : x))} className={input} placeholder="Иванов И.И." />
                  <input value={c.areaTotal || ''} onChange={(e) => setBatchClients((a) => a.map((x, j) => j === i ? { ...x, areaTotal: e.target.value } : x))} className={input} placeholder="—" />
                  <input value={c.quantity || ''} onChange={(e) => setBatchClients((a) => a.map((x, j) => j === i ? { ...x, quantity: e.target.value } : x))} className={input} placeholder="—" />
                  <button onClick={() => setBatchClients((a) => a.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-600 text-sm">✕</button>
                </div>
              ))}
              <button onClick={() => setBatchClients((a) => [...a, { orgFull: '', fio: '' }])} className="text-sm text-[#029cda] hover:text-[#0280b5]">+ Клиент</button>
            </div>

            <div>
              <div className={label}>Вставка из Excel (столбцы: организация ⇥ ФИО ⇥ площадь ⇥ кол-во)</div>
              <textarea value={batchPaste} onChange={(e) => setBatchPaste(e.target.value)} className={`${input} h-16 font-mono text-xs`} placeholder={'ООО "Ромашка"\tИванов И.И.\t5\t\nООО "Луч"\tПетров П.П.\t12\t'} />
              <button onClick={batchAddPaste} disabled={!batchPaste.trim()} className="mt-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-[#313131] hover:bg-gray-50 disabled:opacity-40">Добавить из вставки</button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-400">Клиентов: {batchClients.filter((c) => c.orgFull.trim()).length} · файлов будет ~{batchClients.filter((c) => c.orgFull.trim()).length * selectedOrgs.length}</span>
              <div className="flex gap-2">
                <button onClick={() => setBatchOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-[#313131] hover:bg-gray-50">Отмена</button>
                <button
                  onClick={async () => { const ok = await generateBatch(batchClients, 'docx'); if (ok) setBatchOpen(false); }}
                  disabled={busy || batchClients.filter((c) => c.orgFull.trim()).length === 0}
                  className="px-4 py-2 text-sm rounded-lg bg-[#d97706] text-white hover:bg-[#b45309] disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {busy && <Spinner size={16} color="#fff" />}
                  {busy ? 'Генерация…' : '📦 Скачать ZIP'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
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
            <button onClick={saveDraft} disabled={busy} className="px-4 py-2 text-sm rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-50 inline-flex items-center gap-2">{busy && <Spinner size={16} color="#fff" />}{busy ? 'Сохранение…' : 'Сохранить шаблон'}</button>
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
        <button onClick={() => setUploadOpen((v) => !v)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-[#313131] hover:bg-gray-50">⤴️ Загрузить .docx (можно несколько)</button>
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

/* Массовая загрузка готовых .docx: drag-and-drop, услуга/компания для каждого. */
type UploadStatus = 'pending' | 'uploading' | 'done' | 'error';
interface UploadItem {
  uid: string;
  file: File;
  name: string;
  serviceType: string;
  orgKey: string;
  skipAuto: boolean;
  status: UploadStatus;
  message?: string;
}

function DocxUpload({ orgs, serviceTypes, onChanged, setStatus }: { orgs: Organization[]; serviceTypes: string[]; onChanged: () => void; setStatus: (s: string) => void }) {
  const defaultSvc = serviceTypes[0] || 'ИМЗ';
  const [items, setItems] = useState<UploadItem[]>([]);
  // Значения по умолчанию для вновь добавляемых файлов (и для «Применить ко всем»).
  const [defSvc, setDefSvc] = useState(defaultSvc);
  const [defOrg, setDefOrg] = useState('');
  const [defSkip, setDefSkip] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const input = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#029cda]';
  const label = 'block text-xs font-medium text-gray-500 mb-1';

  const uid = () =>
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2));

  const addFiles = (files: FileList | File[]) => {
    const docx = Array.from(files).filter(
      (f) => f.name.toLowerCase().endsWith('.docx'),
    );
    const skipped = Array.from(files).length - docx.length;
    if (skipped > 0) setStatus(`Пропущено файлов (не .docx): ${skipped}`);
    if (docx.length === 0) return;
    setItems((prev) => [
      ...prev,
      ...docx.map((file) => ({
        uid: uid(),
        file,
        name: file.name.replace(/\.docx$/i, ''),
        serviceType: defSvc,
        orgKey: defOrg,
        skipAuto: defSkip,
        status: 'pending' as UploadStatus,
      })),
    ]);
  };

  const patch = (id: string, p: Partial<UploadItem>) =>
    setItems((prev) => prev.map((it) => (it.uid === id ? { ...it, ...p } : it)));
  const remove = (id: string) => setItems((prev) => prev.filter((it) => it.uid !== id));

  const applyDefaultsToAll = () =>
    setItems((prev) =>
      prev.map((it) =>
        it.status === 'done'
          ? it
          : { ...it, serviceType: defSvc, orgKey: defOrg, skipAuto: defSkip },
      ),
    );

  const uploadOne = async (it: UploadItem): Promise<boolean> => {
    const fd = new FormData();
    fd.append('file', it.file);
    fd.append('name', it.name || it.file.name.replace(/\.docx$/i, ''));
    fd.append('serviceType', it.serviceType);
    fd.append('orgKey', it.orgKey);
    fd.append('skipAutoBlocks', String(it.skipAuto));
    try {
      const res = await fetch('/api/kp/templates', { method: 'POST', credentials: 'include', body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Ошибка загрузки');
      patch(it.uid, { status: 'done', message: `плейсхолдеров: ${d.placeholders?.length ?? 0}` });
      return true;
    } catch (e) {
      patch(it.uid, { status: 'error', message: (e as Error).message });
      return false;
    }
  };

  const uploadAll = async () => {
    const queue = items.filter((it) => it.status === 'pending' || it.status === 'error');
    if (queue.length === 0) return setStatus('Добавьте файлы для загрузки');
    setBusy(true);
    let ok = 0;
    for (const it of queue) {
      patch(it.uid, { status: 'uploading', message: undefined });
      const success = await uploadOne(it);
      if (success) ok += 1;
    }
    setBusy(false);
    setStatus(`Загружено шаблонов: ${ok} из ${queue.length}`);
    if (ok > 0) onChanged();
  };

  const clearDone = () => setItems((prev) => prev.filter((it) => it.status !== 'done'));

  const pendingCount = items.filter((it) => it.status === 'pending' || it.status === 'error').length;

  const statusView = (it: UploadItem) => {
    if (it.status === 'uploading') return <Spinner size={16} />;
    if (it.status === 'done') return <span className="text-[#16a34a] text-sm" title={it.message}>✓ загружен</span>;
    if (it.status === 'error') return <span className="text-red-500 text-xs" title={it.message}>ошибка</span>;
    return <span className="text-gray-400 text-xs">в очереди</span>;
  };

  return (
    <div className="bg-[#F6F7F9] rounded-2xl border border-gray-100 p-5 space-y-4">
      {/* Значения по умолчанию для новых файлов */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <div className={label}>Услуга по умолчанию</div>
          <select value={defSvc} onChange={(e) => setDefSvc(e.target.value)} className={input}>
            {serviceTypes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <div className={label}>Компания по умолчанию</div>
          <select value={defOrg} onChange={(e) => setDefOrg(e.target.value)} className={input}>
            <option value="">Для всех компаний</option>
            {orgs.map((o) => <option key={o.key} value={o.key}>{o.name}</option>)}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 text-sm text-[#313131] cursor-pointer flex-1">
            <input type="checkbox" checked={defSkip} onChange={(e) => setDefSkip(e.target.checked)} />
            уже с шапкой
          </label>
          {items.length > 0 && (
            <button onClick={applyDefaultsToAll} className="px-3 py-2 text-xs rounded-lg border border-gray-200 text-[#313131] hover:bg-white whitespace-nowrap">
              Применить ко всем
            </button>
          )}
        </div>
      </div>

      {/* Зона drag-and-drop */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed px-4 py-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-[#029cda] bg-[#EAF6FC]' : 'border-gray-300 bg-white hover:border-[#029cda]'}`}
      >
        <div className="text-sm text-[#313131] font-medium">Перетащите сюда файлы .docx</div>
        <div className="text-xs text-gray-400 mt-1">или нажмите, чтобы выбрать несколько файлов</div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {/* Очередь файлов */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.uid} className="bg-white border border-gray-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <div className={label}>Название</div>
                  <input value={it.name} onChange={(e) => patch(it.uid, { name: e.target.value })} className={input} />
                  <div className="text-[11px] text-gray-400 mt-0.5 truncate" title={it.file.name}>{it.file.name}</div>
                </div>
                <div>
                  <div className={label}>Услуга *</div>
                  <select value={it.serviceType} onChange={(e) => patch(it.uid, { serviceType: e.target.value })} className={input}>
                    {serviceTypes.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <div className={label}>Компания</div>
                  <select value={it.orgKey} onChange={(e) => patch(it.uid, { orgKey: e.target.value })} className={input}>
                    <option value="">Для всех компаний</option>
                    {orgs.map((o) => <option key={o.key} value={o.key}>{o.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 justify-between sm:justify-end">
                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer whitespace-nowrap">
                  <input type="checkbox" checked={it.skipAuto} onChange={(e) => patch(it.uid, { skipAuto: e.target.checked })} />
                  с шапкой
                </label>
                <div className="w-20 text-right">{statusView(it)}</div>
                <button onClick={() => remove(it.uid)} disabled={it.status === 'uploading'} className="text-red-500 hover:text-red-600 text-sm disabled:opacity-40">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button onClick={uploadAll} disabled={busy || pendingCount === 0} className="px-4 py-2 text-sm rounded-lg bg-[#029cda] text-white hover:bg-[#0280b5] disabled:opacity-50 inline-flex items-center gap-2">
          {busy && <Spinner size={16} color="#fff" />}
          {busy ? 'Загрузка…' : pendingCount > 0 ? `Загрузить (${pendingCount})` : 'Загрузить'}
        </button>
        {items.some((it) => it.status === 'done') && (
          <button onClick={clearDone} disabled={busy} className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-[#313131] hover:bg-white disabled:opacity-50">Убрать загруженные</button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════ Вкладка «Цены» ═══════════════ */
const PRICE_TABS = [
  { key: 'direct', label: '₽ прямой' },
  { key: 'tender', label: '₽ торги' },
  { key: 'ais', label: 'АИС и пролонгация' },
] as const;
type PriceTab = (typeof PRICE_TABS)[number]['key'];
type ScalarField = 'pricePerHaDirect' | 'pricePerHaTender' | 'aisPrice' | 'renewalPerYear';

const isAisPurchase = (name: string) => name.trim() === 'ЕС';
const isRenewalService = (name: string) => /пролонгац/i.test(name);

/** Строка матрицы цен: либо позиция услуги (line), либо скалярная цена услуги. */
type PriceRow =
  | { kind: 'line'; svc: string; lineKey: string; label: string }
  | { kind: 'scalar'; svc: string; scalarField: ScalarField; label: string };

/** Сводная матрица цен: услуги/позиции (строки) × компании (столбцы) по виду цены. */
function PricesTab({
  orgs, tiers, services, onChanged, setStatus,
}: {
  orgs: Organization[];
  tiers: Tier[];
  services: ServiceType[];
  onChanged: () => void;
  setStatus: (s: string) => void;
}) {
  const [tab, setTab] = useState<PriceTab>('direct');
  const [busy, setBusy] = useState(false);

  // Цены задаются только для атомарных услуг. Комбинированные (ИЗН + ЕС и т.п.)
  // берут цены компонентов автоматически — собственной цены у них нет.
  const atomicServices = useMemo(() => services.filter((s) => !isCombinedService(s.name)), [services]);
  const combinedServices = useMemo(() => services.filter((s) => isCombinedService(s.name)).map((s) => s.name), [services]);
  const lineItemsOf = React.useCallback(
    (svc: string) => services.find((s) => s.name === svc)?.lineItems ?? [],
    [services],
  );

  // Локальное редактируемое состояние: orgKey → serviceType → Tier (со строковыми ценами).
  const buildMap = React.useCallback((): Record<string, Record<string, Tier>> => {
    const m: Record<string, Record<string, Tier>> = {};
    for (const o of orgs) {
      m[o.key] = {};
      for (const s of atomicServices) {
        const t = tiers.find((x) => x.orgKey === o.key && x.serviceType === s.name);
        m[o.key][s.name] = t
          ? { ...t, linePrices: { ...(t.linePrices || {}) } }
          : { orgKey: o.key, serviceType: s.name, pricePerHaDirect: 0, pricePerHaTender: 0, aisPrice: 0, renewalPerYear: 0, minHectares: 1, linePrices: {} };
      }
    }
    return m;
  }, [orgs, atomicServices, tiers]);

  const [map, setMap] = useState<Record<string, Record<string, Tier>>>(buildMap);

  const lineDir: 'direct' | 'tender' = tab === 'tender' ? 'tender' : 'direct';

  // Матрица строк под выбранную вкладку.
  const priceRows = useMemo<PriceRow[]>(() => {
    const rows: PriceRow[] = [];
    if (tab === 'ais') {
      // Только АИС «Единая среда» (покупка) и пролонгация.
      for (const s of atomicServices) {
        if (isAisPurchase(s.name)) rows.push({ kind: 'scalar', svc: s.name, scalarField: 'aisPrice', label: `${s.name} — АИС «Единая среда» (покупка)` });
      }
      for (const s of atomicServices) {
        if (isRenewalService(s.name)) rows.push({ kind: 'scalar', svc: s.name, scalarField: 'renewalPerYear', label: `${s.name} — пролонгация (за год)` });
      }
      return rows;
    }
    // Прямой/торги: только услуги-работы; АИС и пролонгацию не показываем.
    const scalarField: ScalarField = tab === 'tender' ? 'pricePerHaTender' : 'pricePerHaDirect';
    for (const s of atomicServices) {
      if (isAisPurchase(s.name) || isRenewalService(s.name)) continue;
      const items = lineItemsOf(s.name);
      if (items.length > 0) {
        for (const it of items) rows.push({ kind: 'line', svc: s.name, lineKey: it.key, label: `${s.name} — ${it.name}` });
      } else {
        rows.push({ kind: 'scalar', svc: s.name, scalarField, label: s.name });
      }
    }
    return rows;
  }, [atomicServices, lineItemsOf, tab]);

  const maxField: 'directMax' | 'tenderMax' = lineDir === 'tender' ? 'tenderMax' : 'directMax';

  const getVal = (orgKey: string, row: PriceRow): number => {
    const t = map[orgKey]?.[row.svc];
    if (!t) return 0;
    if (row.kind === 'line') return t.linePrices?.[row.lineKey]?.[lineDir] ?? 0;
    return (t[row.scalarField] as number) ?? 0;
  };
  const getMax = (orgKey: string, row: PriceRow): number => {
    if (row.kind !== 'line') return 0;
    return map[orgKey]?.[row.svc]?.linePrices?.[row.lineKey]?.[maxField] ?? 0;
  };

  const setLine = (orgKey: string, row: Extract<PriceRow, { kind: 'line' }>, key: 'direct' | 'tender' | 'directMax' | 'tenderMax', val: number) =>
    setMap((prev) => {
      const t = prev[orgKey][row.svc];
      const lp = { ...(t.linePrices || {}) };
      const cur = lp[row.lineKey] || { direct: 0, tender: 0 };
      lp[row.lineKey] = { ...cur, [key]: val };
      return { ...prev, [orgKey]: { ...prev[orgKey], [row.svc]: { ...t, linePrices: lp } } };
    });

  const setVal = (orgKey: string, row: PriceRow, val: number) => {
    if (row.kind === 'line') { setLine(orgKey, row, lineDir, val); return; }
    setMap((prev) => ({ ...prev, [orgKey]: { ...prev[orgKey], [row.svc]: { ...prev[orgKey][row.svc], [row.scalarField]: val } } }));
  };
  const setMax = (orgKey: string, row: PriceRow, val: number) => {
    if (row.kind === 'line') setLine(orgKey, row, maxField, val);
  };

  const save = async () => {
    setBusy(true);
    let ok = 0;
    try {
      for (const o of orgs) {
        const orgTiers = atomicServices.map((s) => map[o.key][s.name]);
        const res = await fetch('/api/kp/organizations', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ org: o, tiers: orgTiers }),
        });
        if (res.ok) ok += 1;
      }
      setStatus(`Цены сохранены (компаний: ${ok} из ${orgs.length})`);
      onChanged();
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const numCell = 'w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-right outline-none focus:border-[#029cda]';

  if (orgs.length === 0) {
    return <div className="text-sm text-gray-400 p-4">Сначала добавьте компании во вкладке «Настройки».</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[#313131]">💰 Цены по услугам</h3>
          <p className="text-xs text-gray-500">Услуги/позиции — строки, компании — столбцы. Выберите вид цены и заполните ячейки.</p>
        </div>
        <div className="flex gap-1 bg-[#F6F7F9] rounded-xl p-1">
          {PRICE_TABS.map((f) => (
            <button
              key={f.key}
              onClick={() => setTab(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs ${tab === f.key ? 'bg-white shadow-sm text-[#313131] font-medium' : 'text-gray-500'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
              <th className="px-3 py-2 sticky left-0 bg-white">Услуга / позиция</th>
              {orgs.map((o) => (
                <th key={o.key} className="px-3 py-2 min-w-[120px] text-right" title={o.name}>{o.shortName || o.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {priceRows.length === 0 && (
              <tr>
                <td colSpan={orgs.length + 1} className="px-3 py-4 text-xs text-gray-400 text-center">
                  {tab === 'ais' ? 'Нет услуг АИС/пролонгации (ЕС, «Пролонгация ЕС»).' : 'Нет услуг для этой вкладки.'}
                </td>
              </tr>
            )}
            {priceRows.map((row, i) => (
              <tr key={`${row.svc}#${row.kind === 'line' ? row.lineKey : 'scalar'}`} className={i % 2 ? 'bg-[#FAFBFC]' : ''}>
                <td className="px-3 py-1.5 text-[#313131] sticky left-0 bg-inherit whitespace-nowrap">{row.label}</td>
                {orgs.map((o) => (
                  <td key={o.key} className="px-2 py-1">
                    {row.kind === 'line' && tab !== 'ais' ? (
                      <div className="flex items-center gap-1">
                        <input className={numCell} inputMode="decimal" value={getVal(o.key, row) || ''} onChange={(e) => setVal(o.key, row, Number(e.target.value) || 0)} placeholder="от" title="Цена за ед. (от)" />
                        <span className="text-gray-300">–</span>
                        <input className={numCell} inputMode="decimal" value={getMax(o.key, row) || ''} onChange={(e) => setMax(o.key, row, Number(e.target.value) || 0)} placeholder="до" title="Верх диапазона (необязательно)" />
                      </div>
                    ) : (
                      <input
                        className={numCell}
                        inputMode="decimal"
                        value={getVal(o.key, row) || ''}
                        onChange={(e) => setVal(o.key, row, Number(e.target.value) || 0)}
                        placeholder="0"
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {combinedServices.length > 0 && (
        <div className="text-xs text-gray-500 bg-[#EAF6FC] border border-[#cbe8f5] rounded-lg px-3 py-2 space-y-1">
          <div className="font-medium text-[#0b5c7d]">Комбинированные услуги отдельной цены не имеют — строки и цены берутся из компонентов:</div>
          {combinedServices.map((s) => (
            <div key={s}>• <span className="text-[#313131]">{s}</span> = {serviceComponents(s).join(' + ')}</div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={busy} className="px-4 py-2 text-sm rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-50 inline-flex items-center gap-2">
          {busy && <Spinner size={16} color="#fff" />}
          {busy ? 'Сохранение…' : 'Сохранить цены'}
        </button>
        <span className="text-xs text-gray-400">Цена по позиции — за единицу. «до» задаёт диапазон (стоимость и итог станут «от–до»); пусто = одно число.</span>
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

  if (loading) return <LoadingBlock />;

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

/* ═══════════════ Вкладка «Рассылки» (трекинг писем) ═══════════════ */
interface SendRow {
  id: string; email: string; from_email: string; subject: string; template_name: string;
  status: 'ok' | 'error'; error: string; delivery_status: string;
  opened_at: string | null; last_opened_at: string | null; open_count: number; created_at: string;
}
const SEND_PERIODS = [
  { key: 'today', label: 'Сегодня', days: 0 },
  { key: 'week', label: 'Неделя', days: 6 },
  { key: 'month', label: 'Месяц', days: 29 },
  { key: 'all', label: 'Всё', days: -1 },
] as const;

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function SendsTab({ setStatus }: { setStatus: (s: string) => void }) {
  const [rows, setRows] = useState<SendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<typeof SEND_PERIODS[number]['key']>('week');

  const load = useCallback(async (p: typeof period) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const def = SEND_PERIODS.find((x) => x.key === p)!;
      if (def.days >= 0) {
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - def.days);
        params.set('from', ymd(from));
        params.set('to', ymd(to));
      }
      const res = await fetch(`/api/kp/sends?${params.toString()}`, { credentials: 'include' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Ошибка');
      setRows(d.rows || []);
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [setStatus]);

  useEffect(() => { load(period); }, [load, period]);

  const opened = rows.filter((r) => r.open_count > 0).length;
  const sentOk = rows.filter((r) => r.status === 'ok').length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-[#F6F7F9] rounded-xl p-1">
          {SEND_PERIODS.map((p) => (
            <button key={p.key} onClick={() => setPeriod(p.key)} className={`px-3 py-1.5 rounded-lg text-sm ${period === p.key ? 'bg-white shadow-sm text-[#313131] font-medium' : 'text-gray-500'}`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500">Всего: {rows.length} · доставлено: {sentOk} · открыто: {opened}</div>
      </div>

      {loading ? <LoadingBlock /> : rows.length === 0 ? (
        <div className="text-sm text-gray-400">За период рассылок нет.</div>
      ) : (
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-3 py-2">Кому</th>
                <th className="px-3 py-2">Тема / КП</th>
                <th className="px-3 py-2">От кого</th>
                <th className="px-3 py-2">Статус</th>
                <th className="px-3 py-2">Открыто</th>
                <th className="px-3 py-2">Когда</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-50">
                  <td className="px-3 py-2 text-[#313131] whitespace-nowrap">{r.email}</td>
                  <td className="px-3 py-2 text-gray-600">{r.subject}<div className="text-[11px] text-gray-400">{r.template_name}</div></td>
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{r.from_email || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.status === 'ok'
                      ? <span className="text-[#16a34a]">✓ отправлено{r.delivery_status === 'bounced' ? ' · возврат' : ''}</span>
                      : <span className="text-red-500" title={r.error}>ошибка</span>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.open_count > 0
                      ? <span className="text-[#0b5c7d]" title={r.last_opened_at ? new Date(r.last_opened_at).toLocaleString('ru-RU') : ''}>👁 {r.open_count}×</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{new Date(r.created_at).toLocaleString('ru-RU')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="text-[11px] text-gray-400">Открытие фиксируется по картинке-пикселю: сигнал косвенный (почтовые клиенты могут блокировать картинки или подгружать их сами).</div>
    </div>
  );
}

/* ═══════════════ Вкладка «Реестр КП» ═══════════════ */
interface RegistryRow {
  id: number; number: number; letterDate: string; addressee: string; subject: string;
  executor: string; incomingNo: string; incomingDate: string; note: string; replyTo: string;
}

function RegistryTab({ orgs, setStatus }: { orgs: Organization[]; setStatus: (s: string) => void }) {
  const [orgKey, setOrgKey] = useState('');
  const [rows, setRows] = useState<RegistryRow[]>([]);
  const [nextNumber, setNextNumber] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!orgKey && orgs[0]) setOrgKey(orgs[0].key); }, [orgs, orgKey]);

  const load = useCallback(async (key: string) => {
    if (!key) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/kp/registry?orgKey=${encodeURIComponent(key)}`, { credentials: 'include' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Ошибка');
      setRows(d.rows || []);
      setNextNumber(d.nextNumber || 1);
    } catch (e) { setStatus((e as Error).message); } finally { setLoading(false); }
  }, [setStatus]);

  useEffect(() => { if (orgKey) load(orgKey); }, [orgKey, load]);

  const patchLocal = (id: number, p: Partial<RegistryRow>) => setRows((rs) => rs.map((r) => r.id === id ? { ...r, ...p } : r));
  const saveField = async (id: number, patch: Record<string, unknown>) => {
    await fetch('/api/kp/registry', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, patch }) });
  };
  const addRow = async () => {
    const res = await fetch('/api/kp/registry', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orgKey }) });
    const d = await res.json();
    if (!res.ok) return setStatus(d.error || 'Ошибка');
    load(orgKey);
  };
  const delRow = async (id: number) => {
    if (!confirm('Удалить строку реестра?')) return;
    await fetch(`/api/kp/registry?id=${id}`, { method: 'DELETE', credentials: 'include' });
    load(orgKey);
  };

  const cell = 'w-full px-1.5 py-1 rounded border border-transparent hover:border-gray-200 focus:border-[#029cda] text-sm outline-none bg-transparent';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-500">Компания-отправитель:</span>
        <select value={orgKey} onChange={(e) => setOrgKey(e.target.value)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#029cda]">
          {orgs.map((o) => <option key={o.key} value={o.key}>{o.shortName || o.name}</option>)}
        </select>
        <span className="text-xs text-gray-400">Следующий №: <b className="text-[#313131]">{nextNumber}</b></span>
        <button onClick={addRow} className="ml-auto text-sm px-3 py-1.5 rounded-lg bg-[#029cda] text-white hover:bg-[#0280b5]">+ Строка</button>
      </div>

      {loading ? <LoadingBlock /> : rows.length === 0 ? (
        <div className="text-sm text-gray-400">Реестр пуст. Записи добавляются автоматически при генерации КП (галочка «Записать в реестр») или вручную.</div>
      ) : (
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-2 py-2 w-12">№</th>
                <th className="px-2 py-2 w-28">Дата</th>
                <th className="px-2 py-2 min-w-[240px]">Организация (адресат)</th>
                <th className="px-2 py-2 min-w-[160px]">Краткое содержание</th>
                <th className="px-2 py-2 w-32">Исполнитель</th>
                <th className="px-2 py-2 w-24">вх. №</th>
                <th className="px-2 py-2 w-28">вх. дата</th>
                <th className="px-2 py-2 min-w-[140px]">Примечание</th>
                <th className="px-2 py-1 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 align-top">
                  <td className="px-2 py-1"><input className={`${cell} w-10 text-center`} value={r.number} onChange={(e) => patchLocal(r.id, { number: Number(e.target.value) || 0 })} onBlur={() => saveField(r.id, { number: r.number })} /></td>
                  <td className="px-2 py-1"><input className={cell} value={r.letterDate} onChange={(e) => patchLocal(r.id, { letterDate: e.target.value })} onBlur={() => saveField(r.id, { letterDate: r.letterDate })} /></td>
                  <td className="px-2 py-1"><textarea rows={2} className={`${cell} resize-y`} value={r.addressee} onChange={(e) => patchLocal(r.id, { addressee: e.target.value })} onBlur={() => saveField(r.id, { addressee: r.addressee })} /></td>
                  <td className="px-2 py-1"><input className={cell} value={r.subject} onChange={(e) => patchLocal(r.id, { subject: e.target.value })} onBlur={() => saveField(r.id, { subject: r.subject })} /></td>
                  <td className="px-2 py-1"><input className={cell} value={r.executor} onChange={(e) => patchLocal(r.id, { executor: e.target.value })} onBlur={() => saveField(r.id, { executor: r.executor })} /></td>
                  <td className="px-2 py-1"><input className={cell} value={r.incomingNo} onChange={(e) => patchLocal(r.id, { incomingNo: e.target.value })} onBlur={() => saveField(r.id, { incomingNo: r.incomingNo })} /></td>
                  <td className="px-2 py-1"><input className={cell} value={r.incomingDate} onChange={(e) => patchLocal(r.id, { incomingDate: e.target.value })} onBlur={() => saveField(r.id, { incomingDate: r.incomingDate })} /></td>
                  <td className="px-2 py-1"><input className={cell} value={r.note} onChange={(e) => patchLocal(r.id, { note: e.target.value })} onBlur={() => saveField(r.id, { note: r.note })} /></td>
                  <td className="px-1 py-1"><button onClick={() => delRow(r.id)} className="text-red-500 hover:text-red-600">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="text-[11px] text-gray-400">Правки сохраняются при выходе из поля. № письма присваивается поочерёдно по этой компании; при генерации КП с галочкой «Записать в реестр» строка создаётся автоматически.</div>
    </div>
  );
}
