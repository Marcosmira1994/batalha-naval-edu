import styles from './SplashEffect.module.css';

// Três anéis concêntricos expandindo — absolutamente posicionado sobre a célula
export default function SplashEffect() {
  return (
    <div className={styles.container} aria-hidden>
      <div className={`${styles.ring} ${styles.r1}`} />
      <div className={`${styles.ring} ${styles.r2}`} />
      <div className={`${styles.ring} ${styles.r3}`} />
    </div>
  );
}
