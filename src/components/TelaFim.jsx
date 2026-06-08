import { useEffect, useState } from 'react';
import styles from './TelaFim.module.css';

// Gera confetes simples com CSS
function Confetes() {
  const cores = ['#ffd60a', '#00b4d8', '#4ade80', '#f87171', '#c084fc', '#fb923c'];
  return (
    <div className={styles.confetes} aria-hidden>
      {Array.from({ length: 60 }, (_, i) => (
        <div
          key={i}
          className={styles.confete}
          style={{
            left: `${Math.random() * 100}%`,
            background: cores[Math.floor(Math.random() * cores.length)],
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
            width: `${6 + Math.random() * 8}px`,
            height: `${6 + Math.random() * 8}px`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

export default function TelaFim({ jogo, onJogarNovamente, onNovaConfiguracao, onVoltarInicio }) {
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    setTimeout(() => setMostrar(true), 200);
  }, []);

  if (!jogo) return null;

  const { times } = jogo;
  const pontosAzul = times.azul.pontos;
  const pontosVermelho = times.vermelho.pontos;

  let vencedor = null;
  let empate = false;
  if (pontosAzul > pontosVermelho) vencedor = 'azul';
  else if (pontosVermelho > pontosAzul) vencedor = 'vermelho';
  else empate = true;

  // Fim antecipado sobrescreve vencedor (pode diferir dos pontos em caso de empate)
  const fimAntecipado = jogo.fimAntecipado;
  if (fimAntecipado?.fimAntecipado) {
    vencedor = fimAntecipado.vencedor;
    empate = fimAntecipado.vencedor === 'empate';
  }

  const naviosAfundados = jogo.naviosVivos.filter(n => n.afundado).length;
  const totalNavios = jogo.naviosVivos.length;
  const totalJogadas = Object.keys(jogo.atacadas).length;
  const totalAcertos = Object.values(jogo.atacadas).filter(a => a.resultado === 'acerto').length;

  return (
    <div className={styles.container}>
      <Confetes />

      <div className={`${styles.card} ${mostrar ? styles.cardVisivel : ''}`}>
        <div className={styles.trofeu}>
          {empate ? '🤝' : '🏆'}
        </div>

        <h1 className={styles.titulo}>
          {empate
            ? 'Empate!'
            : `${times[vencedor].nome} venceu!`}
        </h1>

        <div className={styles.vencedorDetalhe}>
          {!empate && (
            <span className={`${styles.vencedorBadge} ${vencedor === 'azul' ? styles.badgeAzul : styles.badgeVermelho}`}>
              {vencedor === 'azul' ? '🔵' : '🔴'} Campeão da Batalha
            </span>
          )}
          {fimAntecipado?.fimAntecipado && (
            <span className={styles.antecipadoBadge}>
              {fimAntecipado.vencedor === 'empate'
                ? '🤝 Empate — mesma pontuação!'
                : '⚡ Vitória antecipada — virada impossível'}
            </span>
          )}
        </div>

        {/* Placar */}
        <div className={styles.placar}>
          <div className={`${styles.timeCard} ${styles.timeAzul} ${vencedor === 'azul' ? styles.timevencedor : ''}`}>
            <div className={styles.timeEmoji}>🔵</div>
            <div className={styles.timeNome}>{times.azul.nome}</div>
            <div className={styles.timePontos}>{pontosAzul}</div>
            <div className={styles.timeLegenda}>pontos</div>
            {vencedor === 'azul' && <div className={styles.coroa}>👑</div>}
          </div>

          <div className={styles.vs}>VS</div>

          <div className={`${styles.timeCard} ${styles.timeVermelho} ${vencedor === 'vermelho' ? styles.timevencedor : ''}`}>
            <div className={styles.timeEmoji}>🔴</div>
            <div className={styles.timeNome}>{times.vermelho.nome}</div>
            <div className={styles.timePontos}>{pontosVermelho}</div>
            <div className={styles.timeLegenda}>pontos</div>
            {vencedor === 'vermelho' && <div className={styles.coroa}>👑</div>}
          </div>
        </div>

        {/* Estatísticas */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNumero}>{totalJogadas}</span>
            <span className={styles.statLabel}>Jogadas</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumero}>{totalAcertos}</span>
            <span className={styles.statLabel}>Acertos 💥</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumero}>{naviosAfundados}/{totalNavios}</span>
            <span className={styles.statLabel}>Navios afundados</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumero}>
              {totalJogadas > 0 ? Math.round((totalAcertos / totalJogadas) * 100) : 0}%
            </span>
            <span className={styles.statLabel}>Precisão</span>
          </div>
        </div>

        {/* Botões */}
        <div className={styles.acoes}>
          <button className={styles.btnNovamente} onClick={onJogarNovamente}>
            🔄 Jogar Novamente
            <span className={styles.btnSub}>mantém as questões cadastradas</span>
          </button>
          <button className={styles.btnNovo} onClick={onNovaConfiguracao}>
            🆕 Nova Configuração
            <span className={styles.btnSub}>reinicia tudo do zero</span>
          </button>
          <button className={styles.btnInicio} onClick={onVoltarInicio}>
            🏠 Voltar ao Início
            <span className={styles.btnSub}>ir para a tela de listas</span>
          </button>
        </div>
      </div>
    </div>
  );
}
