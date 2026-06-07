import styles from './PainelPlacar.module.css';
import { calcularPotencialMaximo } from '../utils/gameLogic';

export default function PainelPlacar({ jogo, naviosPosicionados }) {
  const { naviosVivos, historico, timeAtual, times } = jogo;

  const potencialAzul     = calcularPotencialMaximo(times.azul.pontos,     naviosVivos);
  const potencialVermelho = calcularPotencialMaximo(times.vermelho.pontos, naviosVivos);
  const criticoAzul     = times.vermelho.pontos > 0 && potencialAzul     < 1.1 * times.vermelho.pontos;
  const criticoVermelho = times.azul.pontos     > 0 && potencialVermelho < 1.1 * times.azul.pontos;

  const total = naviosVivos.length;
  const afundados = naviosVivos.filter(n => n.afundado).length;

  return (
    <aside className={styles.painel}>
      {/* Situação dos navios */}
      <section className={styles.secao}>
        <h3 className={styles.secaoTitulo}>🚢 Navios no Mar</h3>
        <div className={styles.progresso}>
          <div
            className={styles.progressoBarra}
            style={{ width: `${(afundados / total) * 100}%` }}
          />
        </div>
        <p className={styles.progressoTexto}>
          {afundados} de {total} afundados
        </p>

        <div className={styles.listaNavios}>
          {naviosVivos.map(n => (
            <div
              key={n.uid}
              className={`${styles.navio} ${n.afundado ? styles.navioAfundado : ''}`}
            >
              <span className={styles.navioEmoji}>
                {n.afundado ? '💀' : n.emoji}
              </span>
              <div className={styles.navioInfo}>
                <span className={styles.navioNome}>{n.nome}</span>
                <div className={styles.navioVida}>
                  {n.celulas.map((_, i) => (
                    <span
                      key={i}
                      className={`${styles.vida} ${i < n.acertos ? styles.vidaDanificada : ''}`}
                    />
                  ))}
                </div>
              </div>
              {n.afundado && <span className={styles.afundadoTag}>Afundado</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Potencial máximo */}
      <section className={styles.secao}>
        <h3 className={styles.secaoTitulo}>📊 Potencial Máximo</h3>
        <div className={styles.potencialLinha}>
          <span className={styles.potencialLabel}>🔵 {times.azul.nome}</span>
          <span className={`${styles.potencialNum} ${criticoAzul ? styles.potencialCritico : ''}`}>
            {potencialAzul} pts
          </span>
        </div>
        <div className={styles.potencialLinha}>
          <span className={styles.potencialLabel}>🔴 {times.vermelho.nome}</span>
          <span className={`${styles.potencialNum} ${criticoVermelho ? styles.potencialCritico : ''}`}>
            {potencialVermelho} pts
          </span>
        </div>
        <p className={styles.potencialDica}>Máx. que cada time ainda pode atingir</p>
      </section>

      {/* Turno atual */}
      <section className={styles.secao}>
        <h3 className={styles.secaoTitulo}>🎯 Turno Atual</h3>
        <div className={`${styles.turnoCard} ${timeAtual === 'azul' ? styles.turnoAzul : styles.turnoVermelho}`}>
          <span style={{ fontSize: '1.6rem' }}>
            {timeAtual === 'azul' ? '🔵' : '🔴'}
          </span>
          <div>
            <div className={styles.turnoNome}>{times[timeAtual].nome}</div>
            <div className={styles.turnoSubtitulo}>É a sua vez!</div>
          </div>
        </div>
      </section>

      {/* Histórico */}
      <section className={`${styles.secao} ${styles.secaoHistorico}`}>
        <h3 className={styles.secaoTitulo}>📋 Últimas jogadas</h3>
        {historico.length === 0 && (
          <p className={styles.semHistorico}>Nenhuma jogada ainda.</p>
        )}
        <div className={styles.historicoLista}>
          {historico.map((h, i) => {
            const LETRAS = ['A','B','C','D','E','F','G','H','I','J'];
            return (
              <div key={i} className={styles.historicoItem}>
                <span className={`${styles.histTime} ${h.time === 'azul' ? styles.histAzul : styles.histVermelho}`}>
                  {h.time === 'azul' ? '🔵' : '🔴'}
                </span>
                <span className={styles.histCelula}>
                  {LETRAS[h.row]}{h.col + 1}
                </span>
                <span className={`${styles.histResultado} ${h.resultado === 'acerto' ? styles.histAcerto : styles.histAgua}`}>
                  {h.resultado === 'acerto' ? '💥 Acerto' : '💦 Água'}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
