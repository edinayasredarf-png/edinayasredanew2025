import Image from 'next/image';
import styles from './portfolio.module.css';

const poster = '/statov/portrait-video.jpg';

export function Portrait() {

  return (
    <div className={styles.portraitFrame}>
      <div className={styles.portraitMedia}>
        <Image src={poster} alt="Андрей Статов" width={720} height={720} priority unoptimized />
      </div>
    </div>
  );
}
