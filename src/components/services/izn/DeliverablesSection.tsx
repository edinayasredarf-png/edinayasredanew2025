'use client';

import DeliverablesGallery, { type DeliverableFolder } from '../DeliverablesGallery';

function documentFolder(title: string, samples: number[], folder = true): DeliverableFolder {
  return {
    title,
    images: samples.map((sample) => `sample-${sample}`),
    labels: samples.map((_, index) => samples.length > 1 ? `${title} — пример ${index + 1}` : title),
    folder,
  };
}

const groups = [
  {
    title: 'ИЗН Линейный',
    folders: [
      documentFolder('Баланс территории объекта зелёных насаждений', [1]),
      documentFolder('Ведомость стационарных инженерно-архитектурных сооружений', [2]),
      documentFolder('Ведомость учёта газонов, травяного покрова, цветников', [3]),
      documentFolder('Ведомость учёта дорожно-тропиночной сети', [5]),
      documentFolder('Ведомость учёта зелёных насаждений', [4]),
      documentFolder('Инвентарный план объекта', [6], false),
      documentFolder('Паспорт объекта озеленения', [9, 7, 8]),
      documentFolder('Файлы LiDAR-съёмки', [0]),
    ],
  },
  {
    title: 'ИЗН Площадной',
    folders: [
      documentFolder('Инвентаризационная ведомость стационарных инженерно-архитектурных сооружений', [14]),
      documentFolder('Инвентаризационная ведомость учёта газонов, травяного покрова, цветников', [15]),
      documentFolder('Инвентаризационная ведомость учёта дорожно-тропиночной сети', [16]),
      documentFolder('Инвентаризационная ведомость учёта зелёных насаждений', [20]),
      documentFolder('Инвентарный план объекта', [17, 18, 19], false),
      documentFolder('Паспорт объекта зелёных насаждений', [24, 21, 22, 23]),
      documentFolder('Файлы LiDAR-съёмки', [10, 11, 12, 13]),
    ],
  },
];

export default function DeliverablesSection() {
  return <DeliverablesGallery id="izn-deliverables" root="/img/izn/deliverables/" groups={groups}
    subtitle="Мы выполняем полный цикл работ — от полевого обследования до передачи готовой цифровой базы." />;
}
