import { useState, useEffect, useRef, useCallback } from 'react';
import GridJogo from './GridJogo';
import PainelPlacar from './PainelPlacar';
import ModalQuestao from './ModalQuestao';
import OndaChoque from './OndaChoque';
import BannerAfundado from './BannerAfundado';
import { som_agua, som_explosao, som_afundou, som_vez_do_time } from '../utils/sons';
import styles from './TelaJogo.module.css';

// Fases da sequência de afundamento
// null → 'explodindo' → 'onda' → 'afundando' → 'banner' → null
const FASE_NENHUMA     = null;
const FASE_EXPLODINDO  = 'explodindo';
const FASE_ONDA        = 'onda';
const FASE_AFUNDANDO   = 'afundando';
const FASE_BANNER      = 'banner';

export default function TelaJogo({
  jogo,
  questoes,
  naviosPosicionados,
  onAtacar,
  onPontuar,
  onFecharModal,
  onLimparAnuncio,
  onFimAntecipado,
  onEncerrarPartida,
  todosAfundados,
}) {
  // ── Estado local da sequência de afundamento ──────────────────────────────
  const [faseSinking, setFaseSinking]   = useState(FASE_NENHUMA);
  const [navioSinking, setNavioSinking] = useState(null);

  // ── Fullscreen ────────────────────────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tamCelula, setTamCelula]       = useState(null); // null = usa padrão CSS

  useEffect(() => {
    function onFsChange() {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      setTamCelula(fs ? Math.floor((window.innerHeight - 120) / 10) : null);
    }
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch { /* browser sem suporte */ }
  }, []);

  // Refs para sons (evitam re-disparos em StrictMode)
  const prevTurnoRef  = useRef(null);
  const prevAtaqueRef = useRef(null);
  // Ref para limpar todos os timers da sequência de afundamento de uma vez
  const timersRef = useRef([]);

  // ── Som: troca de turno ──────────────────────────────────────────────────
  useEffect(() => {
    if (!jogo) return;
    if (prevTurnoRef.current !== null && prevTurnoRef.current !== jogo.timeAtual) {
      som_vez_do_time();
    }
    prevTurnoRef.current = jogo.timeAtual;
  }, [jogo?.timeAtual]);

  // ── Som: resultado de cada ataque ────────────────────────────────────────
  useEffect(() => {
    if (!jogo?.ultimoAtaque) return;
    if (jogo.ultimoAtaque === prevAtaqueRef.current) return;
    prevAtaqueRef.current = jogo.ultimoAtaque;
    jogo.ultimoAtaque.acertou ? som_explosao() : som_agua();
  }, [jogo?.ultimoAtaque]);

  // ── Sequência de afundamento: 4 fases cronometradas ──────────────────────
  // Dispara quando navioRecemAfundado aparece no estado (após modal fechar)
  useEffect(() => {
    if (!jogo?.navioRecemAfundado) return;

    const navio = jogo.navioRecemAfundado;

    // Limpa timers de sequência anterior (segurança)
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    som_afundou();
    setNavioSinking(navio);
    setFaseSinking(FASE_EXPLODINDO);

    // Calculamos o tempo de esplosão com base no tamanho do navio
    // Cada célula tem delay de 150ms; a última explosão dura ~750ms
    const fimExplosoes = (navio.celulas.length - 1) * 150 + 750;

    const t1 = setTimeout(() => setFaseSinking(FASE_ONDA),      fimExplosoes);
    const t2 = setTimeout(() => setFaseSinking(FASE_AFUNDANDO), fimExplosoes + 600);
    const t3 = setTimeout(() => setFaseSinking(FASE_BANNER),    fimExplosoes + 1100);

    timersRef.current = [t1, t2, t3];

    return () => timersRef.current.forEach(clearTimeout);
  }, [jogo?.navioRecemAfundado]);

  // ── Fecha banner e limpa sequência ───────────────────────────────────────
  function fecharBanner() {
    timersRef.current.forEach(clearTimeout);
    setFaseSinking(FASE_NENHUMA);
    setNavioSinking(null);
    onLimparAnuncio();
  }

  if (!jogo) return null;

  const { times, timeAtual, bombasUsadas, bombasRodada, ultimoAtaque } = jogo;

  function sortearQuestao() {
    if (questoes.length === 0) return null;
    return questoes[Math.floor(Math.random() * questoes.length)];
  }

  const mostrarModal  = !!(ultimoAtaque?.acertou);
  // Fim antecipado: só exibe o modal após o banner de afundamento terminar
  const mostrarModalFimAntecipado = !!jogo.fimAntecipado && faseSinking === FASE_NENHUMA;
  // Grid bloqueado durante banner de afundamento ou modal de fim antecipado
  const gridBloqueado = faseSinking === FASE_BANNER || !!jogo.fimAntecipado;

  // Auto-navega para TelaFim após 3 segundos do modal de fim antecipado
  useEffect(() => {
    if (!mostrarModalFimAntecipado) return;
    const t = setTimeout(() => onFimAntecipado(), 3000);
    return () => clearTimeout(t);
  }, [mostrarModalFimAntecipado]);

  return (
    <div className={styles.container}>
      {/* Botão de tela cheia */}
      <button className={styles.btnFullscreen} onClick={toggleFullscreen}>
        {isFullscreen ? '✕ Sair' : '⛶ Tela Cheia'}
      </button>
      <button
        className={styles.btnEncerrar}
        onClick={() => {
          if (window.confirm('Encerrar a partida agora? O time com mais pontos será declarado vencedor.')) {
            onEncerrarPartida()
          }
        }}
      >
        🏳️ Encerrar Partida
      </button>
      {/* ── Header / Placar ─────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={`${styles.time} ${styles.timeAzul} ${timeAtual === 'azul' ? styles.timeAtivo : ''}`}>
          <span className={styles.timeEmoji}>🔵</span>
          <div>
            <div className={styles.timeNome}>{times.azul.nome}</div>
            <div className={styles.timePontos}>{times.azul.pontos} pts</div>
          </div>
          {timeAtual === 'azul' && <span className={styles.seta}>◀</span>}
        </div>

        <div className={styles.placarCentro}>
          <div className={styles.placarNumeros}>
            <span className={styles.placarAzul}>{times.azul.pontos}</span>
            <span className={styles.placarSeparador}>×</span>
            <span className={styles.placarVermelho}>{times.vermelho.pontos}</span>
          </div>
          <div className={styles.placarTitulo}>⚓ Batalha Naval</div>
          <div className={styles.turnoInfo}>
            Turno de: <strong>{times[timeAtual].nome}</strong>
          </div>
        </div>

        <div className={`${styles.time} ${styles.timeVermelho} ${timeAtual === 'vermelho' ? styles.timeAtivo : ''}`}>
          {timeAtual === 'vermelho' && <span className={styles.seta}>▶</span>}
          <div style={{ textAlign: 'right' }}>
            <div className={styles.timeNome}>{times.vermelho.nome}</div>
            <div className={styles.timePontos}>{times.vermelho.pontos} pts</div>
          </div>
          <span className={styles.timeEmoji}>🔴</span>
        </div>
      </header>

      {/* ── Área principal ──────────────────────────────────────────────── */}
      <main className={styles.main}>
        <div className={styles.gridArea}>
          {/* Contador de bombas */}
          <div className={styles.bombasInfo}>
            <span>💣 Bombas restantes:</span>
            <div className={styles.bombasVisuais}>
              {Array.from({ length: bombasRodada }, (_, i) => (
                <span
                  key={i}
                  className={`${styles.bomba} ${i < (bombasRodada - bombasUsadas) ? styles.bombaAtiva : styles.bombaUsada}`}
                >
                  💣
                </span>
              ))}
            </div>
          </div>

          <GridJogo
            jogo={jogo}
            onAtacar={onAtacar}
            todosAfundados={todosAfundados}
            navioSinking={navioSinking}
            faseSinking={faseSinking}
            bloqueado={gridBloqueado}
            tamCelula={tamCelula}
          />
        </div>

        <PainelPlacar
          jogo={jogo}
          naviosPosicionados={naviosPosicionados}
        />

        {/* Painel lateral visível apenas em fullscreen */}
        <div className={styles.painelFS}>
          {/* Turno + Placar */}
          <div className={styles.fsBloco}>
            <div className={styles.fsLabel}>Vez de</div>
            <div className={`${styles.fsTurnoNome} ${timeAtual === 'azul' ? styles.fsAzul : styles.fsVermelho}`}>
              {times[timeAtual].nome}
            </div>
            <div className={styles.fsPlacar}>
              <div className={styles.fsPlacarTime}>
                <div className={`${styles.fsPlacarNum} ${styles.fsAzul}`}>{times.azul.pontos}</div>
                <div className={styles.fsPlacarNome}>{times.azul.nome}</div>
              </div>
              <span className={styles.fsPlacarSep}>×</span>
              <div className={styles.fsPlacarTime}>
                <div className={`${styles.fsPlacarNum} ${styles.fsVermelho}`}>{times.vermelho.pontos}</div>
                <div className={styles.fsPlacarNome}>{times.vermelho.nome}</div>
              </div>
            </div>
          </div>

          {/* Bombas */}
          <div className={styles.fsBloco}>
            <div className={styles.fsLabel}>Bombas restantes</div>
            <div className={styles.fsBombasRow}>
              {Array.from({ length: bombasRodada }, (_, i) => (
                <span
                  key={i}
                  className={styles.fsBombaIcon}
                  style={{ opacity: i < (bombasRodada - bombasUsadas) ? 1 : 0.2 }}
                >
                  💣
                </span>
              ))}
            </div>
          </div>

          {/* Histórico */}
          <div className={styles.fsBloco} style={{ flex: 1, overflowY: 'auto' }}>
            <div className={styles.fsLabel}>Últimas jogadas</div>
            {jogo.historico.slice(0, 5).map((h, i) => (
              <div key={i} className={styles.fsHistItem}>
                <span>{h.resultado === 'acerto' ? '💥' : '💦'}</span>
                <span>{h.time === 'azul' ? '🔵' : '🔴'}</span>
                <span>{String.fromCharCode(65 + h.row)}{h.col + 1}</span>
              </div>
            ))}
            {jogo.historico.length === 0 && (
              <div style={{ fontSize: '0.75rem', color: '#607090' }}>Nenhuma jogada ainda</div>
            )}
          </div>
        </div>
      </main>

      {/* ── Modal de questão ─────────────────────────────────────────────── */}
      {mostrarModal && (
        <ModalQuestao
          questao={sortearQuestao()}
          timeAtual={ultimoAtaque.timeQueAtacou}
          nomeTime={times[ultimoAtaque.timeQueAtacou].nome}
          onResponder={(acertou) => {
            if (acertou) {
              onPontuar(ultimoAtaque.timeQueAtacou, 1);
            } else {
              onFecharModal();
            }
          }}
        />
      )}

      {/* ── Onda de choque (fase 2 do afundamento) ───────────────────────── */}
      {(faseSinking === FASE_ONDA ||
        faseSinking === FASE_AFUNDANDO ||
        faseSinking === FASE_BANNER) && (
        <OndaChoque key={navioSinking?.uid} />
      )}

      {/* ── Banner de navio afundado (fase 4) ────────────────────────────── */}
      {faseSinking === FASE_BANNER && navioSinking && (
        <BannerAfundado
          navio={navioSinking}
          onFechar={fecharBanner}
        />
      )}

      {/* ── Modal de fim antecipado ───────────────────────────────────────── */}
      {mostrarModalFimAntecipado && (
        <div className={styles.overlayFimAntecipado}>
          <div className={styles.modalFimAntecipado}>
            {jogo.fimAntecipado?.vencedor === 'empate' ? (
              <>
                <div className={styles.faIcone}>🤝</div>
                <h2 className={styles.faTitulo}>Empate!</h2>
                <p className={styles.faSubtitulo}>Os dois times terminaram com a mesma pontuação.</p>
                <div className={styles.faPlacar}>
                  <div className={styles.faTime}>
                    <span className={styles.faTimeLabel}>{times.azul.nome}</span>
                    <span className={`${styles.faTimePontos} ${styles.faAzul}`}>{jogo.fimAntecipado.pontosAzul} pts</span>
                  </div>
                  <span className={styles.faVs}>×</span>
                  <div className={styles.faTime}>
                    <span className={styles.faTimeLabel}>{times.vermelho.nome}</span>
                    <span className={`${styles.faTimePontos} ${styles.faVermelho}`}>{jogo.fimAntecipado.pontosVermelho} pts</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={styles.faIcone}>⚓</div>
                <h2 className={styles.faTitulo}>Vitória Antecipada!</h2>
                <p className={styles.faSubtitulo}>
                  Virada matemática impossível para{' '}
                  <strong>
                    {times[jogo.fimAntecipado.vencedor === 'azul' ? 'vermelho' : 'azul'].nome}
                  </strong>
                </p>
                <div className={styles.faPlacar}>
                  <div className={styles.faTime}>
                    <span className={styles.faTimeLabel}>{times.azul.nome}</span>
                    <span className={`${styles.faTimePontos} ${styles.faAzul}`}>{times.azul.pontos}</span>
                  </div>
                  <span className={styles.faVs}>×</span>
                  <div className={styles.faTime}>
                    <span className={styles.faTimeLabel}>{times.vermelho.nome}</span>
                    <span className={`${styles.faTimePontos} ${styles.faVermelho}`}>{times.vermelho.pontos}</span>
                  </div>
                </div>
                <p className={styles.faExplicacao}>
                  Máx. possível para{' '}
                  {times[jogo.fimAntecipado.vencedor === 'azul' ? 'vermelho' : 'azul'].nome}:{' '}
                  <strong>{jogo.fimAntecipado.maxPossivel} pts</strong>
                </p>
              </>
            )}

            <button className={styles.faBtnIr} onClick={onFimAntecipado}>
              Ver resultado completo →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
