import styles from './OndaChoque.module.css';

// Anel expansivo de onda de choque — posicionado fixo no centro da tela
export default function OndaChoque() {
  return (
    <div className={styles.overlay} aria-hidden>
      <div className={styles.anel} />
      <div className={`${styles.anel} ${styles.anel2}`} />
    </div>
  );
}
