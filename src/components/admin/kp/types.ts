// Общие типы генератора КП для клиентских компонентов (зеркало серверных).

export interface Organization {
  key: string;
  name: string;
  shortName: string;
  directorRole: string;
  directorFio: string;
  requisites: string;
  phone: string;
  email: string;
  headerImage: string;
  headerText: string;
  stampImage: string;
  signatureImage: string;
  writeKpNumber: boolean;
  mailAccountId: number | null;
  isActive: boolean;
  sortOrder: number;
}

export interface Tier {
  orgKey: string;
  serviceType: string;
  pricePerHaDirect: number;
  pricePerHaTender: number;
  aisPrice: number;
  renewalPerYear: number;
  minHectares: number;
}

export interface Executor {
  id: number;
  fio: string;
  phone: string;
  email: string;
  isActive: boolean;
  sortOrder: number;
}

export interface TemplateMeta {
  id: number;
  name: string;
  serviceType: string;
  orgKey: string | null;
  filename: string;
  placeholders: string[];
  sizeBytes: number;
  skipAutoBlocks: boolean;
  source: string;
  updatedAt: string;
}

export interface HistoryRow {
  id: number;
  title: string;
  clientOrg: string;
  serviceType: string;
  orgKey: string;
  orgName: string;
  format: string;
  totalCost: number;
  createdBy: string;
  createdAt: string;
}

export type PriceMode = 'direct' | 'tender';

export type ColAlign = 'left' | 'center' | 'right';
export type ColKind = 'index' | 'text' | 'number' | 'const' | 'formula';

export interface CalcColumn {
  key: string;
  label: string;
  kind: ColKind;
  formula?: string;
  constValue?: string;
  align?: ColAlign;
  sum?: boolean;
  isCost?: boolean;
  money?: boolean;
}

export interface CalcTableDef {
  key: string;
  name: string;
  columns: CalcColumn[];
  isActive: boolean;
  sortOrder: number;
}

/** Строка расчётной таблицы: ключ_колонки → значение. */
export type RowData = Record<string, string>;

export interface ServiceType {
  name: string;
  sortOrder: number;
  isActive: boolean;
  rowFormula: string;
}

export interface HeaderLayout {
  left: string[];
  center: string[];
  right: string[];
}

export interface Alias {
  key: string;
  label: string;
  value: string;
  isCustom: boolean;
  sortOrder: number;
}
