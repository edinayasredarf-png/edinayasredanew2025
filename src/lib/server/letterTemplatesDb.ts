import "server-only";
import { getTimewebPool } from "@/lib/timewebPg";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Простой текст (абзацы + «•»-списки) → HTML для TipTap-редактора. */
export function plainToHtml(text: string): string {
  const lines = text.replace(/\r/g, "").split("\n");
  const out: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      out.push(`<ul>${list.map((li) => `<li><p>${escapeHtml(li)}</p></li>`).join("")}</ul>`);
      list = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    if (line.startsWith("•")) {
      list.push(line.replace(/^•\s*/, "").replace(/;$/, ""));
    } else {
      flush();
      out.push(`<p>${escapeHtml(line)}</p>`);
    }
  }
  flush();
  return out.join("");
}

export interface LetterTemplate {
  key: string; // 'sfera' | 'ekostroy'
  name: string;
  body: string; // основной текст письма (без шапки/адресата/обращения — они авто)
  header_image: string; // URL изображения бланка (верхний колонтитул)
  signer_role: string; // «Директор ООО «Сфера»»
  signature_image: string; // URL изображения подписи руководителя
  signer_name: string; // «А.В. Статов»
  executor: string; // нижний колонтитул: Исп.: … / тел. / email
  filename_pattern: string;
  email_subject: string; // тема письма (с тегами)
  email_body: string; // текст самого email (HTML/текст, с тегами); PDF — вложением
  updated_at?: string;
}

const DEFAULT_BODY_TEXT = `В рамках реализации Указа Президента РФ от 7 мая 2024 года N 309 «О национальных целях развития Российской Федерации на период до 2030 года и на перспективу до 2036 года» регионам необходимо обеспечить инвентаризацию и цифровизацию данных о местах захоронений.

В этой связи особенно важно обеспечить своевременный и качественный цифровой учет данных. Для решения этой задачи предлагаем рассмотреть внедрение автоматизированной информационной системы «Единая среда» для Вашего муниципалитета, что позволит снизить затраты на содержание объектов и их инвентаризацию, сократит сроки проведения работ.

АИС «Единая среда» — это программное решение, которое представляет собой интерактивную карту с возможностью нанесения любых объектов благоустройства с привязкой к точным геопространственным данным. Доступ к системе осуществляется с любого устройства: ПК, планшет, смартфон.

Уже более 250 муниципальных образований успешно используют систему «Единая среда», что позволяет им корректно предоставлять данные для загрузки в отраслевую цифровую платформу «Управление захоронениями». Рязанская область, Ханты-Мансийский автономный округ - Югра успешно прошли пилотирование, внедрив автоматизированную информационную систему «Единая среда», и получили поддержку для проведения последующих работ по инвентаризации и автоматическому формированию перечня кладбищ и паспортов захоронений. Результаты проведенных мероприятий были отмечены на совещании Минцифры.

Система «Единая среда» позволит:
• упростить процесс учета: отказаться от бумажных и табличных архивов и вести реестры мест захоронений и зеленых насаждений в удобной, интуитивно понятной системе;
• управлять территорией в едином интерфейсе: контролировать состояние и планировать работы по содержанию мест захоронений, зеленых насаждений и других объектов благоустройства;
• экономить бюджетные средства за счет автоматизации процессов;
• контролировать работу различных подрядных организаций;
• исключить риски потери данных: вся информация находится в облачном хранилище на российских серверах;
• минимизировать риски ошибок при актуализации сведений об объектах;
• создать гибкую и современную систему управления местами захоронений, зелеными насаждениями и другими объектами благоустройства.

АИС «Единая среда» включена в реестр отечественного ПО, разработана при поддержке Минстроя и Минцифры РФ. Система позволяет легко и быстро интегрировать собранные данные с отраслевой платформой «Управление захоронениями».

Команда наших аккредитованных экспертов также готова провести работы по инвентаризации мест захоронений, зеленых насаждений и других объектов благоустройства.

В связи с вышеизложенным, прошу назначить ответственных для проведения встречи по ВКС 23.07.2026 (ЧТ) в 13.00 мск, где обсудим: как провести инвентаризацию наиболее эффективно, как вести электронный учет захоронений и зеленых насаждений, как правильно выстроить техническое задание и осуществить контроль подрядчика, как экономить бюджет при повторной инвентаризации и актуализации данных.

Активная ссылка на ВКС: https://my.mts-link.ru/j/EdinayaSreda/22094070028`;

const DEFAULT_BODY = plainToHtml(DEFAULT_BODY_TEXT);

const EXECUTOR = `Исп.: Бабаева Наталья Владимировна
Тел.: 8 (800) 550-56-12
Email: offer@единаясреда.рф`;

const DEFAULT_EMAIL_SUBJECT = "Внедрение АИС «Единая среда» — <<Должность сокр>>";

const DEFAULT_EMAIL_BODY = `<p><<ОБРАЩЕНИЕ>> <<ИО>>!</p>
<p>Направляем Вам официальное письмо о возможности внедрения автоматизированной информационной системы «Единая среда» для Вашего муниципалитета. Документ прилагается в формате PDF.</p>
<p>Будем рады ответить на вопросы и обсудить детали.</p>
<p>С уважением,<br/>команда «Единая среда»<br/>Тел.: 8 (800) 550-56-12 · offer@единаясреда.рф</p>`;

const DEFAULTS: LetterTemplate[] = [
  {
    key: "sfera",
    name: "Сфера",
    body: DEFAULT_BODY,
    header_image: "",
    signer_role: "Директор ООО «Сфера»",
    signature_image: "",
    signer_name: "А.В. Статов",
    executor: EXECUTOR,
    filename_pattern: "Сфера_<<Должность сокр>>_<<Дательный падеж ФИО>>_№<<Номер письма>>",
    email_subject: DEFAULT_EMAIL_SUBJECT,
    email_body: DEFAULT_EMAIL_BODY,
  },
  {
    key: "ekostroy",
    name: "Экострой",
    body: DEFAULT_BODY,
    header_image: "",
    signer_role: "Генеральный директор ООО «Экострой»",
    signature_image: "",
    signer_name: "",
    executor: EXECUTOR,
    filename_pattern: "Экострой_<<Должность сокр>>_<<Дательный падеж ФИО>>_№<<Номер письма>>",
    email_subject: DEFAULT_EMAIL_SUBJECT,
    email_body: DEFAULT_EMAIL_BODY,
  },
];

const COLS =
  "key, name, body, header_image, signer_role, signature_image, signer_name, executor, filename_pattern, email_subject, email_body, updated_at";

let ensured = false;
async function ensureTable() {
  if (ensured) return;
  const pool = getTimewebPool();
  await pool.query(`
    create table if not exists letter_templates (
      key text primary key,
      name text not null,
      body text not null default '',
      filename_pattern text not null default '',
      updated_at timestamptz not null default now()
    )
  `);
  // новые колонки (миграция со старой схемы)
  await pool.query(`
    alter table letter_templates
      add column if not exists header_image text default '',
      add column if not exists signer_role text default '',
      add column if not exists signature_image text default '',
      add column if not exists signer_name text default '',
      add column if not exists executor text default '',
      add column if not exists email_subject text default '',
      add column if not exists email_body text default ''
  `);
  // устаревшая колонка старой схемы (мешает seed-INSERT из-за NOT NULL)
  await pool.query(`alter table letter_templates drop column if exists signature`);

  for (const t of DEFAULTS) {
    // засеять, если нет
    await pool.query(
      `insert into letter_templates
        (key, name, body, header_image, signer_role, signature_image, signer_name, executor, filename_pattern, email_subject, email_body)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       on conflict (key) do nothing`,
      [t.key, t.name, t.body, t.header_image, t.signer_role, t.signature_image, t.signer_name, t.executor, t.filename_pattern, t.email_subject, t.email_body]
    );
    // миграция старого тела (с шапкой «№ <<НОМЕР…») → новое; поля заполнить, если пусто
    await pool.query(
      `update letter_templates set
         body = case when body like '№ <<%' or body like '﻿№ <<%' then $2 else body end,
         signer_role = case when coalesce(signer_role,'') = '' then $3 else signer_role end,
         signer_name = case when coalesce(signer_name,'') = '' then $4 else signer_name end,
         executor    = case when coalesce(executor,'')    = '' then $5 else executor end,
         email_subject = case when coalesce(email_subject,'') = '' then $6 else email_subject end,
         email_body    = case when coalesce(email_body,'')    = '' then $7 else email_body end
       where key = $1`,
      [t.key, t.body, t.signer_role, t.signer_name, t.executor, t.email_subject, t.email_body]
    );
  }

  // миграция тел из простого текста в HTML (для редактора и рендера)
  const { rows } = await pool.query("select key, body from letter_templates");
  for (const r of rows as Array<{ key: string; body: string }>) {
    if (r.body && !r.body.includes("<")) {
      await pool.query("update letter_templates set body = $2 where key = $1", [
        r.key,
        plainToHtml(r.body),
      ]);
    }
  }
  ensured = true;
}

export async function dbListTemplates(): Promise<LetterTemplate[]> {
  await ensureTable();
  const pool = getTimewebPool();
  const { rows } = await pool.query(`select ${COLS} from letter_templates order by name`);
  return rows as LetterTemplate[];
}

export async function dbGetTemplate(key: string): Promise<LetterTemplate | null> {
  await ensureTable();
  const pool = getTimewebPool();
  const { rows } = await pool.query(`select ${COLS} from letter_templates where key = $1`, [key]);
  return (rows[0] as LetterTemplate) ?? null;
}

export async function dbUpdateTemplate(t: LetterTemplate): Promise<void> {
  await ensureTable();
  const pool = getTimewebPool();
  await pool.query(
    `update letter_templates set
       name = $2, body = $3, header_image = $4, signer_role = $5,
       signature_image = $6, signer_name = $7, executor = $8,
       filename_pattern = $9, email_subject = $10, email_body = $11, updated_at = now()
     where key = $1`,
    [t.key, t.name, t.body, t.header_image, t.signer_role, t.signature_image, t.signer_name, t.executor, t.filename_pattern, t.email_subject, t.email_body]
  );
}
