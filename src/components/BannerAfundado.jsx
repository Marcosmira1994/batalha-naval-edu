import { useEffect, useState } from 'react';
import styles from './BannerAfundado.module.css';

const DURACAO = 4; // segundos até fechar automaticamente

export default function BannerAfundado({ navio, onFechar }) {
  const [contador, setContador] = useState(DURACAO);

  // Countdown + auto-fechar
  useEffect(() => {
    const intervalo = setInterval(() => {
      setContador(c => {
        if (c <= 1) {
          clearInterval(intervalo);
          onFechar();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className={styles.overlay}>
      <div className={styles.banner}>
        <div className={styles.icone}>💀</div>

        <div className={styles.texto}>
          <span className={styles.sub}>NAVIO AFUNDADO!</span>
          <span className={styles.nome}>
            {navio.emoji} {navio.nome}
          </span>
        </div>

        {/* Barra de progresso do auto-fechar */}
        <div className={styles.progressoWrapper}>
          <div
            className={styles.progresso}
            style={{ animationDuration: `${DURACAO}s` }}
          />
        </div>

        <button className={styles.btnContinuar} onClick={onFechar}>
          Continuar ({contador}s)
        </button>
      </div>
    </div>
  );
}
