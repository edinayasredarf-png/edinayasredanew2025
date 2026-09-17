'use client';

import React from 'react';
import { evalFormulaSafe } from './formulaClient';
import type { CalcColumn, CalcTableDef, RowData } from './types';

function num(v: string | undefined): number {
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/\s+/g, '').replace(',', '.'));
  return isFinite(n) ? n : 0;
}
function fmtMoney(n: number): string {
  const v = Math.round((n + Number.EPSILON) * 100) / 100;
  const [i, d = '00'] = v.toFixed(2).split('.');
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + '.' + d;
}
function fmtNum(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString('ru-RU') : fmtMoney(n);
}

export interface PreviewScope {
  price: number;
  price_direct: number;
  price_tender: number;
  min_ha: number;
}

/** Вычисляет ячейку формулы/индекса для превью в гриде. */
function cellPreview(col: CalcColumn, row: RowData, rowIndex: number, cols: CalcColumn[], scope: PreviewScope): string {
  const s: Record<string, number> = { ...scope, row_index: rowIndex + 1 };
  for (const c of cols) {
    if (c.kind === 'number') s[c.key] = num(row[c.key]);
    else if (c.kind === 'const') s[c.key] = num(c.constValue);
    else if (c.kind === 'text') s[c.key] = num(row[c.key]); // «5 Га» → 5
  }
  // Пер-строчная цена из раздела «Цены» (по первой выбранной компании).
  if (row.__pd) s.price_direct = num(row.__pd);
  if (row.__pt) s.price_tender = num(row.__pt);
  if (row.__p) s.price = num(row.__p);
  // формулы слева направо
  let val = 0;
  for (const c of cols) {
    if (c.kind === 'formula') {
      s[c.key] = (row.__manual === '1' && row[c.key] !== undefined && row[c.key] !== '')
        ? num(row[c.key])
        : evalFormulaSafe(c.formula || '0', s);
      if (c.key === col.key) val = s[c.key];
    }
  }
  return col.money || col.isCost ? fmtMoney(val) : fmtNum(val);
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-zа-я0-9]+/gi, ' ').trim();

/** Разбор буфера Excel (TSV): строки → массивы ячеек, выравнивание по ширине. */
function parseClipboard(text: string): string[][] {
  const lines = text.replace(/\r/g, '').split('\n');
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  const grid = lines.map((l) => l.split('\t').map((c) => c.trim()));
  const width = grid.reduce((m, r) => Math.max(m, r.length), 0);
  return grid.map((r) => { while (r.length < width) r.push(''); return r; });
}

export default function KpCalcGrid({
  calcTables, selectedKey, onSelectTable, columns, setColumns, rows, setRows, previewScope,
  onTablesChanged, onImportedTable, setStatus,
}: {
  calcTables: CalcTableDef[];
  selectedKey: string;
  onSelectTable: (key: string) => void;
  columns: CalcColumn[];
  setColumns: React.Dispatch<React.SetStateAction<CalcColumn[]>>;
  rows: RowData[];
  setRows: React.Dispatch<React.SetStateAction<RowData[]>>;
  previewScope: PreviewScope;
  onTablesChanged?: () => void;
  onImportedTable?: (key: string, columns: CalcColumn[], rows: RowData[]) => void;
  setStatus?: (s: string) => void;
}) {
  const input = 'w-full px-2 py-1.5 rounded-md border border-gray-200 text-sm outline-none focus:border-[#029cda] bg-white';
  const inputCols = columns.filter((c) => c.kind === 'text' || c.kind === 'number');

  const setCell = (ri: number, key: string, v: string) =>
    setRows((rs) => rs.map((r, j) => (j === ri ? { ...r, [key]: v } : r)));

  const moveCol = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= columns.length) return;
    setColumns((cs) => {
      const copy = [...cs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };
  const delCol = (i: number) => setColumns((cs) => cs.filter((_, j) => j !== i));
  const addCol = () => {
    const label = prompt('Название новой колонки:');
    if (!label?.trim()) return;
    const base = label.trim().toLowerCase().replace(/[^a-z0-9а-я]+/gi, '_').replace(/^_|_$/g, '').slice(0, 20) || 'col';
    let key = base;
    let n = 2;
    while (columns.some((c) => c.key === key)) key = `${base}_${n++}`;
    setColumns((cs) => [...cs, { key, label: label.trim(), kind: 'text', align: 'left' }]);
  };

  // ─── Вставка из Excel: два режима в одном окне ───
  const [pasteOpen, setPasteOpen] = React.useState(false);
  const [pasteText, setPasteText] = React.useState('');
  const [hasHeader, setHasHeader] = React.useState(true);
  const [importMode, setImportMode] = React.useState<'map' | 'new'>('map');
  const [mapping, setMapping] = React.useState<Record<number, string>>({});
  const [newName, setNewName] = React.useState('');
  const [replaceRows, setReplaceRows] = React.useState(true);
  const [importBusy, setImportBusy] = React.useState(false);

  const grid = React.useMemo(() => parseClipboard(pasteText), [pasteText]);
  const header = hasHeader && grid.length ? grid[0] : grid[0]?.map((_, i) => `Колонка ${i + 1}`) ?? [];
  const dataRows = hasHeader ? grid.slice(1) : grid;

  // Авто-сопоставление столбцов вставки с полями текущей таблицы (по заголовкам).
  React.useEffect(() => {
    if (!pasteOpen || importMode !== 'map' || !header.length) return;
    setMapping((prev) => {
      if (Object.keys(prev).length) return prev;
      const m: Record<number, string> = {};
      header.forEach((h, i) => {
        const hn = norm(h);
        const hit = inputCols.find((c) => norm(c.label) === hn)
          || (hn ? inputCols.find((c) => norm(c.label).includes(hn) || hn.includes(norm(c.label))) : undefined);
        m[i] = hit?.key || '';
      });
      return m;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasteOpen, importMode, pasteText, hasHeader]);

  const resetImport = () => { setPasteText(''); setMapping({}); setNewName(''); };

  const applyMap = () => {
    if (!dataRows.length) return setStatus?.('Нет строк для вставки');
    const built: RowData[] = dataRows
      .filter((r) => r.some((c) => c.trim()))
      .map((r) => {
        const row: RowData = {};
        header.forEach((_, i) => { const key = mapping[i]; if (key) row[key] = r[i] ?? ''; });
        return row;
      });
    setRows((rs) => (replaceRows ? built : [...rs.filter((r) => Object.values(r).some(Boolean)), ...built]));
    setStatus?.(`Вставлено строк: ${built.length}`);
    setPasteOpen(false); resetImport();
  };

  const applyNew = async () => {
    if (!header.length || !dataRows.length) return setStatus?.('Вставьте таблицу с данными');
    // Колонки из заголовка: числовые — если все значения столбца числа.
    const used = new Set<string>();
    const cols: CalcColumn[] = header.map((h, i) => {
      const vals = dataRows.map((r) => (r[i] ?? '').trim()).filter(Boolean);
      const numeric = vals.length > 0 && vals.every((v) => /^-?[\d\s.,]+$/.test(v));
      const base = norm(h).replace(/\s+/g, '_').slice(0, 20) || `col_${i + 1}`;
      let key = base; let n = 2;
      while (used.has(key)) key = `${base}_${n++}`;
      used.add(key);
      return { key, label: h.trim() || `Колонка ${i + 1}`, kind: numeric ? 'number' : 'text', align: numeric ? 'right' : 'left' };
    });
    const newRows: RowData[] = dataRows
      .filter((r) => r.some((c) => c.trim()))
      .map((r) => { const row: RowData = {}; cols.forEach((c, i) => { row[c.key] = r[i] ?? ''; }); return row; });

    const name = newName.trim() || `Из Excel — ${new Date().toLocaleString('ru-RU')}`;
    const key = `xls_${Date.now().toString(36)}`;
    setImportBusy(true);
    try {
      const res = await fetch('/api/kp/tables', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, name, columns: cols, defaultRows: newRows, isActive: true, sortOrder: 100 }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || 'Ошибка сохранения таблицы'); }
      onTablesChanged?.();
      onImportedTable?.(key, cols, newRows);
      setStatus?.(`Таблица создана: ${name} (строк: ${newRows.length})`);
      setPasteOpen(false); resetImport();
    } catch (e) {
      setStatus?.((e as Error).message);
    } finally {
      setImportBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500">Таблица:</span>
        <select
          value={selectedKey}
          onChange={(e) => onSelectTable(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#029cda]"
        >
          {calcTables.map((t) => (
            <option key={t.key} value={t.key}>{t.name}</option>
          ))}
        </select>
        {selectedKey && (
          <span className="text-xs text-gray-400">алиас в шаблоне: <code className="font-mono">{`{{${selectedKey}}}`}</code></span>
        )}
        <button onClick={() => { setPasteOpen((v) => !v); resetImport(); }} className="ml-auto text-sm px-3 py-1.5 rounded-lg bg-[#029cda] text-white hover:bg-[#0280b5]">📋 Вставить из Excel</button>
        <button onClick={addCol} className="text-sm text-[#029cda] hover:text-[#0280b5]">+ Колонка</button>
      </div>

      {pasteOpen && (
        <div className="rounded-xl border border-gray-200 bg-[#F6F7F9] p-4 space-y-3">
          <div className="text-sm font-semibold text-[#313131]">Вставка таблицы из Excel</div>
          <textarea
            value={pasteText}
            onChange={(e) => { setPasteText(e.target.value); setMapping({}); }}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono outline-none focus:border-[#029cda] h-24 bg-white"
            placeholder={'Скопируйте диапазон в Excel (Ctrl+C) и вставьте сюда (Ctrl+V).\nНаименование\tПлощадь\tСтоимость\nГород Николаевск\t80000\t113537'}
          />
          {grid.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-[#313131]">
                  <input type="checkbox" checked={hasHeader} onChange={(e) => { setHasHeader(e.target.checked); setMapping({}); }} />
                  Первая строка — заголовки
                </label>
                <span className="text-gray-400">Распознано: {header.length} столбцов, {dataRows.length} строк</span>
                <div className="ml-auto flex gap-1 bg-white rounded-lg p-1 border border-gray-200">
                  <button onClick={() => setImportMode('map')} className={`px-2.5 py-1 rounded-md ${importMode === 'map' ? 'bg-[#029cda] text-white' : 'text-gray-500'}`}>Сопоставить с таблицей</button>
                  <button onClick={() => setImportMode('new')} className={`px-2.5 py-1 rounded-md ${importMode === 'new' ? 'bg-[#029cda] text-white' : 'text-gray-500'}`}>Новая таблица</button>
                </div>
              </div>

              {/* Превью */}
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                <table className="text-xs border-collapse">
                  <thead>
                    <tr>
                      {header.map((h, i) => (
                        <th key={i} className="border border-gray-200 bg-[#eef2f6] px-2 py-1 text-left font-semibold text-[#313131] min-w-[110px]">
                          <div className="truncate" title={h}>{h || `Колонка ${i + 1}`}</div>
                          {importMode === 'map' && (
                            <select
                              value={mapping[i] ?? ''}
                              onChange={(e) => setMapping((m) => ({ ...m, [i]: e.target.value }))}
                              className="mt-1 w-full px-1 py-0.5 rounded border border-gray-200 text-[11px] font-normal bg-white"
                            >
                              <option value="">— пропустить —</option>
                              {inputCols.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                            </select>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataRows.slice(0, 5).map((r, ri) => (
                      <tr key={ri}>
                        {header.map((_, i) => (
                          <td key={i} className="border border-gray-200 px-2 py-1 text-gray-600 whitespace-nowrap">{r[i] ?? ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {dataRows.length > 5 && <div className="text-[11px] text-gray-400">…и ещё {dataRows.length - 5} строк</div>}

              {importMode === 'map' ? (
                <div className="space-y-2">
                  <div className="text-[11px] text-gray-500">Сопоставьте столбцы Excel с полями таблицы. Колонки-формулы (стоимость по тарифу) заполнятся автоматически.</div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-[#313131] cursor-pointer">
                      <input type="checkbox" checked={replaceRows} onChange={(e) => setReplaceRows(e.target.checked)} />
                      Заменить текущие строки
                    </label>
                    <button onClick={applyMap} className="ml-auto px-4 py-2 text-sm rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d]">Заполнить строки</button>
                    <button onClick={() => setPasteOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-200">Отмена</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-[11px] text-gray-500">Будет создана новая таблица со столбцами из заголовков (данные — как есть, без формул). Она станет выбранной и сохранится для повторного использования.</div>
                  <div className="flex items-center gap-2">
                    <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Название таблицы (необязательно)" className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#029cda] bg-white" />
                    <button onClick={applyNew} disabled={importBusy} className="px-4 py-2 text-sm rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-50">{importBusy ? 'Создание…' : 'Создать таблицу'}</button>
                    <button onClick={() => setPasteOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-200">Отмена</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="overflow-x-auto -mx-5 px-5">
        <table className="text-sm border-collapse">
          <thead>
            <tr>
              {columns.map((c, ci) => (
                <th key={c.key} className="border border-gray-200 bg-[#eef2f6] px-2 py-1 text-xs font-semibold text-[#313131] min-w-[120px]">
                  <div className="flex items-center gap-1 justify-between">
                    <span className="truncate" title={c.label}>{c.label}</span>
                    <span className="flex items-center gap-0.5 text-gray-400">
                      <button onClick={() => moveCol(ci, -1)} className="hover:text-[#029cda]" title="влево">◀</button>
                      <button onClick={() => moveCol(ci, 1)} className="hover:text-[#029cda]" title="вправо">▶</button>
                      <button onClick={() => delCol(ci)} className="hover:text-red-500" title="удалить">✕</button>
                    </span>
                  </div>
                  {c.kind !== 'text' && c.kind !== 'number' && (
                    <div className="text-[10px] font-normal text-gray-400">{c.kind === 'formula' ? 'формула' : c.kind === 'index' ? '№' : 'конст.'}</div>
                  )}
                </th>
              ))}
              <th className="px-1"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => {
              const manual = r.__manual === '1';
              return (
              <tr key={ri}>
                {columns.map((c) => (
                  <td key={c.key} className="border border-gray-200 px-1 py-0.5">
                    {c.kind === 'text' || c.kind === 'number' ? (
                      <input
                        value={r[c.key] ?? ''}
                        onChange={(e) => setCell(ri, c.key, e.target.value)}
                        className={input}
                        inputMode={c.kind === 'number' ? 'decimal' : undefined}
                      />
                    ) : c.kind === 'formula' && manual ? (
                      <input
                        value={r[c.key] ?? ''}
                        onChange={(e) => setCell(ri, c.key, e.target.value)}
                        className={`${input} text-right`}
                        inputMode="decimal"
                        placeholder={cellPreview(c, r, ri, columns, previewScope)}
                        title="Своя сумма (формула отключена для этой строки)"
                      />
                    ) : (
                      <div className="px-2 py-1.5 text-gray-500 text-right">
                        {c.kind === 'index' ? ri + 1 : c.kind === 'const' ? (c.constValue || '') : cellPreview(c, r, ri, columns, previewScope)}
                      </div>
                    )}
                  </td>
                ))}
                <td className="px-1 whitespace-nowrap">
                  {columns.some((c) => c.kind === 'formula') && (
                    <button
                      onClick={() => setRows((rs) => rs.map((x, j) => j === ri ? { ...x, __manual: manual ? '' : '1' } : x))}
                      className={`px-1 ${manual ? 'text-[#16a34a]' : 'text-gray-400 hover:text-[#029cda]'}`}
                      title={manual ? 'Сумма задаётся вручную — вернуть формулу' : 'Ввести сумму вручную'}
                    >✎</button>
                  )}
                  <button onClick={() => setRows((rs) => rs.filter((_, j) => j !== ri))} className="text-red-500 hover:text-red-600 px-1">✕</button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button onClick={() => setRows((rs) => [...rs, {}])} className="text-sm text-[#029cda] hover:text-[#0280b5]">+ Добавить строку</button>
    </div>
  );
}
