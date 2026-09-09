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

export interface CalcRow {
  name: string;
  cadastral: string;
  areaSqm: string;
}

export type PriceMode = 'direct' | 'tender';
