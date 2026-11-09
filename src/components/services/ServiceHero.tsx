'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import Breadcrumbs from '@/components/Breadcrumbs';
import styles from './ServiceHero.module.css';

const imagery = {
  dendrology: { src: '/img/services/izn/hero.avif', alt: 'Дендрологическая экспертиза: обследование деревьев и подготовка заключения', width: 1142, height: 1377 },
  imz: { src: '/img/services/imz/hero.avif', alt: 'Инвентаризация мест захоронений: реестр, карта и геопривязка', width: 1142, height: 1377 },
  izn: { src: '/img/services/izn/hero.avif', alt: 'Инвентаризация зелёных насаждений: учёт деревьев и карта территории', width: 1142, height: 1377 },
  les: { src: '/img/services/les/hero.avif', alt: 'Лесоустройство: обследование лесов, документация и картографирование', width: 1141, height: 1378 },
} as const;

interface ServiceHeroProps {
  service: keyof typeof imagery;
  title: ReactNode;
  description: ReactNode;
  onRequest: () => void;
  onConsult: () => void;
}

/** Shared by the national and city service pages; copy stays with each route. */
export default function ServiceHero({ service, title, description, onRequest, onConsult }: ServiceHeroProps) {
  const image = imagery[service];

  return (
    <div className={styles.shell}>
      <section className={styles.hero}>
        <div className={styles.content}>
          <Breadcrumbs variant="hero" />
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
          <div className={styles.actions}>
            <button type="button" onClick={onRequest} className={styles.primary}>Оставить заявку</button>
            <button type="button" onClick={onConsult} className={styles.secondary}>Получить консультацию</button>
          </div>
        </div>
        <div className={styles.visual}>
          <Image {...image} priority sizes="(max-width: 767px) 240px, (max-width: 1023px) 36vw, 390px" className={styles.image} />
        </div>
      </section>
    </div>
  );
}
