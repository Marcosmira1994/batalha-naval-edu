import { useState, useEffect, useRef } from 'react';
import { som_tiro } from '../utils/sons';
import SplashEffect from './SplashEffect';
import ExplosaoEffect from './ExplosaoEffect';
import styles from './GridJogo.module.css';
import portaAvioesUrl from '../assets/navios/porta-avioes.svg';
import encouracadoUrl from '../assets/navios/encouracado.svg';
import contratorpedeiroUrl from '../assets/navios/contratorpedeiro.svg';
import submarinoUrl from '../assets/navios/submarino.svg';

const SVG_NAVIOS = {
  'porta-avioes': portaAvioesUrl,
  'encouracado': encouracadoUrl,
  'contratorpedeiro': contratorpedeiroUrl,
  'submarino': submarinoUrl,
};

// Dimensões base do grid (refletem GridJogo.module.css — default 52px)
const CELL_SIZE_DEFAULT = 52;
const HEADER_H          = 36;
const LABEL_W           = 36;
const WRAPPER_PAD       = 12;

const TAMANHO = 10;
const LETRAS = ['A','B','C','D','E','F','G','H','I','J'];

export default function GridJogo({
  jogo,
  onAtacar,
  todosAfundados,
  navioSinking,   // objeto do navio sendo afundado (ou null)
  faseSinking,    // null | 'explodindo' | 'onda' | 'afundando' | 'banner'
  bloqueado,      // impede cliques durante sequência de afundamento
  tamCelula,      // tamanho em px da célula (fullscreen dinâmico; null = padrão CSS)
}) {
  const CELL_SIZE = tamCelula || CELL_SIZE_DEFAULT;
  const { atacadas, bombasUsadas, bombasRodada } = jogo;
  const semBombas = bombasUsadas >= bombasRodada;

  // Animação do ataque mais recente (splash ou explosão individual)
  const [animAtual, setAnimAtual] = useState(null); // { chave, tipo }
  const prevAtaqueRef = useRef(null);

  // Explosões em cadeia nas células do navio afundado
  // Gerenciadas aqui com timeout próprio para persistir além da troca de fase
  const [celulasExplosao, setCelulasExplosao] = useState({});

  // Detecta novo ataque e inicia animação na célula
  useEffect(() => {
    if (!jogo.ultimoAtaque) return;
    if (jogo.ultimoAtaque === prevAtaqueRef.current) return;
    prevAtaqueRef.current = jogo.ultimoAtaque;

    const { row, col, acertou } = jogo.ultimoAtaque;
    const chave = `${row},${col}`;
    setAnimAtual({ chave, tipo: acertou ? 'explosao' : 'splash' });

    const t = setTimeout(() => setAnimAtual(null), 1600);
    return () => clearTimeout(t);
  }, [jogo.ultimoAtaque]);

  // Quando entra na fase 'explodindo', monta as explosões em cadeia por célula
  useEffect(() => {
    if (faseSinking !== 'explodindo' || !navioSinking) {
      setCelulasExplosao({});
      return;
    }

    const mapa = {};
    navioSinking.celulas.forEach(([r, c], i) => {
      mapa[`${r},${c}`] = i * 150; // delay escalonado em 150ms por célula
    });
    setCelulasExplosao(mapa);

    // Remove após a última explosão terminar
    const ultimoDelay = (navioSinking.celulas.length - 1) * 150 + 1600;
    const t = setTimeout(() => setCelulasExplosao({}), ultimoDelay);
    return () => clearTimeout(t);
  }, [faseSinking, navioSinking]);

  // Mapeia quais células pertencem ao navio sendo afundado e seus índices
  const celulasNavioSinking = navioSinking
    ? Object.fromEntries(navioSinking.celulas.map(([r, c], i) => [`${r},${c}`, i]))
    : {};

  // Navios totalmente afundados excluindo o que ainda está animando
  const naviosAfundados = (jogo.naviosVivos || []).filter(
    n => n.afundado && n.uid !== navioSinking?.uid
  );

  function handleClique(row, col) {
    const chave = `${row},${col}`;
    if (atacadas[chave] || semBombas || todosAfundados || bloqueado) return;
    som_tiro();
    onAtacar(row, col);
  }

  return (
    <div
      className={styles.wrapper}
      style={tamCelula ? { '--cell-size': `${tamCelula}px` } : undefined}
    >
      {/* Cabeçalho colunas */}
      <div className={styles.gridHeader}>
        <div className={styles.corner} />
        {Array.from({ length: TAMANHO }, (_, i) => (
          <div key={i} className={styles.labelCol}>{i + 1}</div>
        ))}
      </div>

      {/* Linhas */}
      {Array.from({ length: TAMANHO }, (_, row) => (
        <div key={row} className={styles.linha}>
          <div className={styles.labelLinha}>{LETRAS[row]}</div>
          {Array.from({ length: TAMANHO }, (_, col) => {
            const chave = `${row},${col}`;
            const ataque = atacadas[chave];
            const clicavel = !ataque && !semBombas && !todosAfundados && !bloqueado;

            // Animação de afundamento nas células do navio
            const sinkingIdx = celulasNavioSinking[chave];
            const isAfundando =
              sinkingIdx !== undefined &&
              (faseSinking === 'afundando' || faseSinking === 'banner');
            const afundarDelay = sinkingIdx !== undefined ? sinkingIdx * 90 : 0;

            return (
              <div
                key={col}
                className={`
                  ${styles.celula}
                  ${ataque?.resultado === 'acerto' ? styles.acerto : ''}
                  ${ataque?.resultado === 'agua' ? styles.agua : ''}
                  ${clicavel ? styles.clicavel : ''}
                  ${!ataque && (semBombas || bloqueado) && !todosAfundados ? styles.bloqueada : ''}
                  ${isAfundando ? styles.afundando : ''}
                `}
                style={isAfundando ? { '--afundar-delay': `${afundarDelay}ms` } : undefined}
                onClick={() => handleClique(row, col)}
                title={
                  ataque
                    ? ataque.resultado === 'acerto' ? '💥 Acerto!' : '💦 Água'
                    : clicavel ? 'Clique para atacar' : ''
                }
              >
                {/* Ícones estáticos do resultado */}
                {ataque?.resultado === 'acerto' && (
                  <span className={styles.emoji}>💥</span>
                )}
                {ataque?.resultado === 'agua' && (
                  <span className={styles.emoji}>💦</span>
                )}
                {!ataque && clicavel && (
                  <span className={styles.miraSutil}>+</span>
                )}

                {/* Animação do ataque individual */}
                {animAtual?.chave === chave && animAtual.tipo === 'splash' && (
                  <SplashEffect />
                )}
                {animAtual?.chave === chave && animAtual.tipo === 'explosao' && (
                  <ExplosaoEffect />
                )}

                {/* Explosão em cadeia (afundamento) */}
                {celulasExplosao[chave] !== undefined && (
                  <ExplosaoEffect delay={celulasExplosao[chave]} />
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Overlays SVG dos navios afundados */}
      {naviosAfundados.map(navio => {
        const [r0, c0] = navio.celulas[0];
        const N = navio.celulas.length;
        const horiz = navio.horizontal !== false;
        const top  = WRAPPER_PAD + HEADER_H + r0 * CELL_SIZE;
        const left = WRAPPER_PAD + LABEL_W  + c0 * CELL_SIZE + (horiz ? 0 : CELL_SIZE);
        return (
          <img
            key={navio.uid}
            src={SVG_NAVIOS[navio.id]}
            alt={navio.nome}
            style={{
              position: 'absolute',
              top,
              left,
              width:  N * CELL_SIZE,
              height: CELL_SIZE,
              filter: 'grayscale(100%) brightness(0.4)',
              pointerEvents: 'none',
              zIndex: 3,
              ...(horiz ? {} : {
                transform: 'rotate(90deg)',
                transformOrigin: 'top left',
              }),
            }}
            draggable={false}
          />
        );
      })}

      {todosAfundados && (
        <div className={styles.overlayFim}>
          🏆 Todos os navios afundados!
        </div>
      )}
    </div>
  );
}
