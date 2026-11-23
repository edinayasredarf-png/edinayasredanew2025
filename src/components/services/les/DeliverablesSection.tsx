'use client';

import DeliverablesGallery, { type DeliverableFolder } from '../DeliverablesGallery';

function material(title: string, samples: number[], folder = true): DeliverableFolder {
  return {
    title,
    images: samples.map((sample) => `sample-${sample}`),
    labels: samples.map((_, index) => samples.length > 1 ? `${title} — пример ${index + 1}` : title),
    folder,
  };
}

const groups = [
  {
    title: 'I этап —\nПодготовительные работы',
    folders: [
      material('Отчёт о выполнении подготовительных работ', [2, 3]),
      material('Абрисы', [0, 1], false),
      material('Приложение 1 — Протокол 1 ЛУС', [4]),
    ],
  },
  {
    title: 'II этап —\nПолевые работы',
    folders: [
      material('Акт коллективной тренировки', [6, 5]),
      material('Карточка таксации', [7]),
      material('Архив фотофиксации каждого квартала', [10, 11, 12]),
      material('Отчёт о полевых работах', [8, 9]),
    ],
  },
  {
    title: 'III этап —\nМатериалы лесоустройства',
    folders: [
      material('Проект лесничества', [26, 24, 25]),
      material('Графическое описание границ лесничества и перечень границ (прил. 1)', [16, 17, 18, 14]),
      material('Графическое описание лесных кварталов и перечень границ (прил. 2)', [22, 19, 20, 21, 15]),
      material('Карта-схема лесничества (прил. 3)', [23], false),
      material('Проект эксплуатационных, защитных, резервных лесов, ОЗУ', [38, 39, 40, 41]),
      material('Графическое описание и перечень границ ЗЛ (прил. 1)', [31]),
      material('Графическое описание и перечень границ ОЗУ (прил. 2)', [32, 33, 34, 35]),
      material('Карты-схемы категорий защитных лесов и ОЗУ (прил. 3, 4)', [36, 37]),
      material('Графические описания в формате mid/mif', [13]),
      material('Проект мероприятий по сохранению лесов', [28, 29, 30, 27]),
      material('Проект защитных лесов', [38, 39, 40, 41]),
    ],
    collections: [
      { title: 'Проект лесничества', indices: [0, 1, 2, 3] },
      { title: 'Проект эксплуатационных, защитных, резервных лесов, ОЗУ', indices: [4, 5, 6, 7] },
      { indices: [8, 9, 10] },
    ],
  },
];

export default function DeliverablesSection() {
  return <DeliverablesGallery root="/img/les/deliverables/" id="les-deliverables" groups={groups}
    subtitle="Мы выполняем полный цикл работ — от полевого обследования до передачи готовой цифровой базы." />;
}
