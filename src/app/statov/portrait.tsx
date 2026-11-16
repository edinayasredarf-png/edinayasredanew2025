import Image from 'next/image';
import styles from './portfolio.module.css';

const poster = '/statov/portrait-video.jpg';
const topics = ['Экология', 'Цифровые решения', 'Семейная история'];

export function Portrait() {
  return () => preference.removeEventListener('change', update);
  }, []);

  return (
    <div className={styles.portraitFrame}>
      <div className={styles.portraitMedia}>
        <Image src={poster} alt="Андрей Статов" width={720} height={720} priority unoptimized />
      </div>
      <ul className={styles.portraitTopics} aria-label="Направления работы">
        {topics.map((topic) => <li key={topic}>{topic}</li>)}
      </ul>
    </div>
  );
}
