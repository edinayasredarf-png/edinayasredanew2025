'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import styles from './DeliverablesGallery.module.css';

export interface DeliverableFolder {
  title: string;
  images: string[];
  labels: string[];
  folder?: boolean;
}

export default function DeliverablesGallery({ root, groups, id, subtitle = 'Примеры материалов, которые входят в результат инвентаризации.' }: {
  root: string;
  groups: Array<{ title: string; folders: DeliverableFolder[] }>;
  id: string;
  subtitle?: string;
}) {
  const [tab, setTab] = useState(0);
  const folders = groups[tab].folders;
  const [gallery, setGallery] = useState<{ folder: number; image: number } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const active = gallery ? folders[gallery.folder] : null;

  useEffect(() => {
    if (!gallery) return;
    const modal = dialog.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal?.showModal();
    return () => {
      modal?.close();
      document.body.style.overflow = overflow;
      opener.current?.focus({ preventScroll: true });
    };
  }, [gallery?.folder]);

  const move = (direction: number) => setGallery((current) => current && ({
    ...current,
    image: (current.image + direction + folders[current.folder].images.length) % folders[current.folder].images.length,
  }));

  return (
    <section className={styles.section} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>Какие документы вы получаете</h2>
      <p className={styles.subtitle}>{subtitle}</p>
      {groups.length > 1 && (
        <div className={styles.tabs} role="tablist" aria-label="Вид инвентаризации">
          {groups.map((group, index) => (
            <button key={group.title} type="button" role="tab" id={`${id}-tab-${index}`} aria-selected={tab === index}
              aria-controls={`${id}-panel`} tabIndex={tab === index ? 0 : -1}
              onClick={() => setTab(index)}
              onKeyDown={(event) => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                event.preventDefault();
                const next = event.key === 'Home' ? 0 : event.key === 'End' ? groups.length - 1 : (tab + (event.key === 'ArrowRight' ? 1 : -1) + groups.length) % groups.length;
                setTab(next);
                document.getElementById(`${id}-tab-${next}`)?.focus();
              }}>{group.title}</button>
          ))}
        </div>
      )}
      <div id={`${id}-panel`} role={groups.length > 1 ? 'tabpanel' : undefined} aria-labelledby={groups.length > 1 ? `${id}-tab-${tab}` : undefined} className={styles.grid} data-count={folders.length}>
        {folders.map((folder, folderIndex) => (
          <button type="button" key={folder.title} className={styles.card}
            aria-label={`Открыть ${folder.title.toLowerCase()}, ${folder.images.length} изображения`}
            onClick={(event) => { opener.current = event.currentTarget; setGallery({ folder: folderIndex, image: 0 }); }}>
            <span className={styles.preview} aria-hidden="true">
              <span className={folder.folder === false ? styles.plan : styles.stack}>
                {folder.images.map((name, index) => (
                  <Image key={name} src={`${root}${name}-thumb.avif`} alt="" width={110} height={150}
                    className={styles.sheet} style={{ '--rotation': `${(index - (folder.images.length - 1) / 2) * 16}deg`, '--offset': `${(index - (folder.images.length - 1) / 2) * 43}px` } as CSSProperties} />
                ))}
                {folder.folder !== false && <Image src="/img/imz/deliverables/folder.svg" alt="" width={145} height={105} className={styles.folder} />}
              </span>
            </span>
            <span className={styles.title}>{folder.title}</span>
          </button>
        ))}
      </div>
      {gallery && active && (
        <dialog ref={dialog} className={styles.dialog} aria-label={active.title}
          onCancel={(event) => { event.preventDefault(); setGallery(null); }}
          onClick={(event) => { if (event.target === event.currentTarget) setGallery(null); }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
            if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
          }}>
          <div className={styles.viewer}>
            <div className={styles.toolbar}>
              <span>{active.title}</span>
              <button type="button" onClick={() => setGallery(null)} aria-label="Закрыть просмотр">×</button>
            </div>
            <div className={styles.stage}
              onTouchStart={(event) => { touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
              onTouchEnd={(event) => {
                const start = touch.current;
                touch.current = null;
                if (!start || event.changedTouches.length === 0) return;
                const dx = event.changedTouches[0].clientX - start.x;
                const dy = event.changedTouches[0].clientY - start.y;
                if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
              }}>
              <button className={styles.previous} type="button" aria-label="Предыдущее изображение" onClick={() => move(-1)}>‹</button>
              <img key={active.images[gallery.image]} src={`${root}${active.images[gallery.image]}.avif`} alt={active.labels[gallery.image]} className={styles.fullImage} />
              <button className={styles.next} type="button" aria-label="Следующее изображение" onClick={() => move(1)}>›</button>
            </div>
            <p className={styles.caption} aria-live="polite">{active.labels[gallery.image]} · {gallery.image + 1} / {active.images.length}</p>
            <div className={styles.dots}>
              {active.images.map((name, index) => (
                <button type="button" key={name} aria-label={`Изображение ${index + 1}`} aria-current={gallery.image === index ? 'true' : undefined}
                  onClick={() => setGallery({ ...gallery, image: index })} />
              ))}
            </div>
          </div>
        </dialog>
      )}
    </section>
  );
}
