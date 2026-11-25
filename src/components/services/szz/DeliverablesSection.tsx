'use client';
import DeliverablesGallery from '../DeliverablesGallery';
const materials = [
  ['Проект санитарно-защитной зоны', ['project'], true],
  ['Программа и протоколы исследований', ['research'], true],
  ['Карта и координатное описание границ', ['boundary'], false],
  ['Материалы экспертизы и СЭЗ', ['expertise'], true],
  ['Решение об установлении СЗЗ и сведения ЕГРН', ['decision'], true],
  ['Границы и документы в АИС «Единая среда»', ['registry'], false],
] as const;
const groups = [{ title: 'Материалы СЗЗ', folders: materials.map(([title, images, folder]) => ({ title, images: [...images], labels: [`${title} — схема состава материалов`], folder })) }];
export default function DeliverablesSection() {
  return <DeliverablesGallery root="/img/szz/deliverables/" id="szz-deliverables" groups={groups} subtitle="Состав комплекта зависит от объекта и договора. Ниже — схемы структуры материалов. Заключения и решение выдаются уполномоченными организациями по результатам рассмотрения; мы сопровождаем их получение." />;
}
