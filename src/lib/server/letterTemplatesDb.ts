import "server-only";
import { getTimewebPool } from "@/lib/timewebPg";

export interface LetterTemplate {
  key: string; // 'sfera' | 'ekostroy'
  name: string;
  body: string;
  signature: string;
  filename_pattern: string;
  updated_at?: string;
}

const DEFAULT_BODY = `№ <<НОМЕР ПИСЬМА>>
от <<ДАТА>>

<<ДОЛЖНОСТЬ>>
<<Дательный падеж ФИО>>

<<ОБРАЩЕНИЕ>> <<ИО>>!

В рамках реализации Указа Президента РФ от 7 мая 2024 года N 309 «О национальных целях развития Российской Федерации на период до 2030 года и на перспективу до 2036 года» регионам необходимо обеспечить инвентаризацию и цифровизацию данных о местах захоронений.

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

const SIGN_SFERA = `С уважением,
Директор ООО «Сфера»                    А.В. Статов

Исп.: Бабаева Наталья Владимировна
Тел.: 8 (800) 550-56-12
Email: offer@единаясреда.рф`;

const SIGN_EKOSTROY = `С уважением,
Генеральный директор ООО «Экострой»                    <Ф.И.О.>

Исп.: Бабаева Наталья Владимировна
Тел.: 8 (800) 550-56-12
Email: offer@единаясреда.рф`;

const DEFAULTS: LetterTemplate[] = [
  {
    key: "sfera",
    name: "Сфера",
    body: DEFAULT_BODY,
    signature: SIGN_SFERA,
    filename_pattern: "Сфера_<<Должность сокр>>_<<Дательный падеж ФИО>>_№<<Номер письма>>",
  },
  {
    key: "ekostroy",
    name: "Экострой",
    body: DEFAULT_BODY,
    signature: SIGN_EKOSTROY,
    filename_pattern: "Экострой_<<Должность сокр>>_<<Дательный падеж ФИО>>_№<<Номер письма>>",
  },
];

let ensured = false;
async function ensureTable() {
  if (ensured) return;
  const pool = getTimewebPool();
  await pool.query(`
    create table if not exists letter_templates (
      key text primary key,
      name text not null,
      body text not null,
      signature text not null,
      filename_pattern text not null,
      updated_at timestamptz not null default now()
    )
  `);
  // засеять дефолты, если их ещё нет
  for (const t of DEFAULTS) {
    await pool.query(
      `insert into letter_templates (key, name, body, signature, filename_pattern)
       values ($1,$2,$3,$4,$5)
       on conflict (key) do nothing`,
      [t.key, t.name, t.body, t.signature, t.filename_pattern]
    );
  }
  ensured = true;
}

export async function dbListTemplates(): Promise<LetterTemplate[]> {
  await ensureTable();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select key, name, body, signature, filename_pattern, updated_at from letter_templates order by name"
  );
  return rows as LetterTemplate[];
}

export async function dbGetTemplate(key: string): Promise<LetterTemplate | null> {
  await ensureTable();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select key, name, body, signature, filename_pattern, updated_at from letter_templates where key = $1",
    [key]
  );
  return (rows[0] as LetterTemplate) ?? null;
}

export async function dbUpdateTemplate(t: LetterTemplate): Promise<void> {
  await ensureTable();
  const pool = getTimewebPool();
  await pool.query(
    `update letter_templates
       set name = $2, body = $3, signature = $4, filename_pattern = $5, updated_at = now()
     where key = $1`,
    [t.key, t.name, t.body, t.signature, t.filename_pattern]
  );
}
