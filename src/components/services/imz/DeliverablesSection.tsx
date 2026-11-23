'use client';
import DeliverablesGallery from '../DeliverablesGallery';
const root = '/img/imz/deliverables/';
const folders = [
  { title: 'Паспорт захоронения', images: ['passport-1', 'passport-2', 'passport-3'], labels: ['Реестр захоронений', 'Справочники реестра', 'Реестр кладбищ'] },
  { title: 'Геоданные', images: ['cemetery', 'graves'], labels: ['Геоданные кладбища — Cemetery.geojson', 'Геоданные захоронений — Graves.geojson'] },
  { title: 'Архив с фотографиями', images: ['photo-1', 'photo-2', 'photo-3'], labels: ['Общий вид места захоронения', 'Фотография надмогильного сооружения', 'Фотографии захоронений на участке'] },
  { title: 'Файлы 3D-модели вашего кладбища', images: ['cemetery-model'], labels: ['3D-модель кладбища'], video: '/img/imz/deliverables/cemetery-model.mp4' },
];

export default function DeliverablesSection() {
  return <DeliverablesGallery root={root} id="imz-deliverables" groups={[{ title: 'ИМЗ', folders }]} />;
}
