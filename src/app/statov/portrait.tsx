'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './portfolio.module.css';

const poster = '/statov/portrait-video.jpg';
const topics = ['Экология', 'Цифровые решения', 'Семейная история'];

export function Portrait() {
  const [motionAllowed, setMotionAllowed] = useState(false);

  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setMotionAllowed(!preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  return (
    <div className={styles.portraitFrame}>
      <div className={styles.portraitMedia}>
        {motionAllowed ? (
          <video src="/statov/portrait-loop.mp4" poster={poster} autoPlay loop muted playsInline aria-label="Андрей Статов" />
        ) : (
          <Image src={poster} alt="Андрей Статов" width={720} height={720} priority unoptimized />
        )}
      </div>
      <ul className={styles.portraitTopics} aria-label="Направления работы">
        {topics.map((topic) => <li key={topic}>{topic}</li>)}
      </ul>
    </div>
  );
}
