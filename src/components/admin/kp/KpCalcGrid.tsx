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
  }
  // формулы слева направо
  let val = 0;
  for (const c of cols) {
    if (c.kind === 'formula') {
      s[c.key] = evalFormulaSafe(c.formula || '0', s);
      if (c.key === col.key) val = s[c.key];
    }
  }
  return col.money || col.isCost ? fmtMoney(val) : fmtNum(val);
}

export default function KpCalcGrid({
  calcTables, selectedKey, onSelectTable, columns, setColumns, rows, setRows, previewScope,
}: {
  calcTables: CalcTableDef[];
  selectedKey: string;
  onSelectTable: (key: string) => void;
  columns: CalcColumn[];
  setColumns: React.Dispatch<React.SetStateAction<CalcColumn[]>>;
  rows: RowData[];
  setRows: React.Dispatch<React.SetStateAction<RowData[]>>;
  previewScope: PreviewScope;
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

  const importPaste = (text: string) => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    const targets = inputCols;
    const parsed: RowData[] = lines.map((l) => {
      const parts = l.split(/\t|;/).map((p) => p.trim());
      const r: RowData = {};
      targets.forEach((c, idx) => { r[c.key] = parts[idx] ?? ''; });
      return r;
    });
    setRows((rs) => [...rs.filter((r) => Object.values(r).some(Boolean)), ...parsed]);
  };

  const [paste, setPaste] = React.useState('');

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
        <button onClick={addCol} className="ml-auto text-sm text-[#029cda] hover:text-[#0280b5]">+ Колонка</button>
      </div>

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
            {rows.map((r, ri) => (
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
                    ) : (
                      <div className="px-2 py-1.5 text-gray-500 text-right">
                        {c.kind === 'index' ? ri + 1 : c.kind === 'const' ? (c.constValue || '') : cellPreview(c, r, ri, columns, previewScope)}
                      </div>
                    )}
                  </td>
                ))}
                <td className="px-1">
                  <button onClick={() => setRows((rs) => rs.filter((_, j) => j !== ri))} className="text-red-500 hover:text-red-600 px-1">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={() => setRows((rs) => [...rs, {}])} className="text-sm text-[#029cda] hover:text-[#0280b5]">+ Добавить строку</button>

      <div>
        <div className="text-xs font-medium text-gray-500 mb-1">Быстрый импорт из Excel (значения через таб; порядок = вводимые колонки)</div>
        <textarea value={paste} onChange={(e) => setPaste(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono outline-none focus:border-[#029cda] h-16 bg-white" placeholder={'Город Николаевск\t27:20:0010103:566\t113537'} />
        <button onClick={() => { importPaste(paste); setPaste(''); }} disabled={!paste.trim()} className="mt-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-[#313131] hover:bg-gray-50 disabled:opacity-40">Добавить из вставки</button>
      </div>
    </div>
  );
}
