'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import type { StatovPhoto } from './telegram';
import styles from './portfolio.module.css';

export function PhotoRail({ photos, channel }: { photos: StatovPhoto[]; channel: string }) {
  const rail = useRef<HTMLDivElement>(null);
  const pauseUntil = useRef(0);
  const hovered = useRef(false);
  const gesture = useRef<{ x: number; left: number; dragging: boolean } | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const track = rail.current;
    if (!track) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let onscreen = false;
    let previous = 0;
    let fraction = 0;
    let direction = 1;

    function step(now: number) {
      frame = 0;
      if (paused || !onscreen || reduced.matches || document.hidden || !track) return;
      const max = track.scrollWidth - track.clientWidth;
      if (max > 1 && previous && !hovered.current && !gesture.current && now > pauseUntil.current) {
        if (track.scrollLeft >= max - 1) direction = -1;
        if (track.scrollLeft <= 1) direction = 1;
        fraction += Math.min(40, now - previous) * 0.035;
        const distance = Math.floor(fraction);
        fraction -= distance;
        if (distance) track.scrollLeft += distance * direction;
      }
      previous = now;
      frame = requestAnimationFrame(step);
    }

    function schedule() {
      cancelAnimationFrame(frame);
      previous = 0;
      frame = requestAnimationFrame(step);
    }

    const observer = new IntersectionObserver(([entry]) => {
      onscreen = entry.isIntersecting;
      schedule();
    });
    observer.observe(track);
    reduced.addEventListener('change', schedule);
    document.addEventListener('visibilitychange', schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      reduced.removeEventListener('change', schedule);
      document.removeEventListener('visibilitychange', schedule);
    };
  }, [paused, photos.length]);

  function pauseBriefly() { pauseUntil.current = performance.now() + 4500; }

  function go(direction: number) {
    pauseBriefly();
    const track = rail.current;
    const width = track?.firstElementChild?.getBoundingClientRect().width ?? 300;
    track?.scrollBy({ left: direction * (width + 14), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const drag = gesture.current;
    if (!drag || Math.abs(event.clientX - drag.x) < 6 && !drag.dragging) return;
    if (!drag.dragging) {
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.dragging = true;
    }
    event.currentTarget.scrollLeft = drag.left + drag.x - event.clientX;
  }

  return <section className={styles.photoSection} aria-labelledby="statov-photos-title">
    <div className={styles.photoHead}>
      <h2 id="statov-photos-title">Фотографии из StatovLIVE</h2>
      <div className={styles.controls}>
        <button type="button" onClick={() => go(-1)} aria-label="Фото влево"><ArrowLeft size={18} /></button>
        <button type="button" className={styles.photoPlay} onClick={() => setPaused(!paused)}
          aria-label={paused ? 'Продолжить автопрокрутку' : 'Приостановить автопрокрутку'}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>
        <button type="button" onClick={() => go(1)} aria-label="Фото вправо"><ArrowRight size={18} /></button>
      </div>
    </div>
    <div className={styles.photoRail} ref={rail}
      onMouseEnter={() => { hovered.current = true; }}
      onMouseLeave={() => { hovered.current = false; gesture.current = null; }}
      onFocusCapture={pauseBriefly} onWheel={pauseBriefly}
      onPointerDown={(event) => {
        pauseBriefly();
        if (event.pointerType === 'mouse' && event.button === 0) {
          gesture.current = { x: event.clientX, left: event.currentTarget.scrollLeft, dragging: false };
        }
      }}
      onPointerMove={move}
      onPointerUp={() => { gesture.current = null; pauseBriefly(); }}
      onPointerCancel={() => { gesture.current = null; }}
      onLostPointerCapture={() => { gesture.current = null; }}>
      {photos.map((photo) => (
        <a key={photo.id} href={channel + '/' + photo.postId} aria-label={'Открыть публикацию в Telegram: ' + photo.label} draggable={false}>
          <Image src={photo.src} alt="" fill unoptimized draggable={false} />
          {!['Ростов', 'StatovLIVE'].includes(photo.label) && <span>{photo.label}</span>}
        </a>
      ))}
    </div>
  </section>;
}
