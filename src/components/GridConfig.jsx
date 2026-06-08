import { useState, useRef } from 'react';
import { NAVIOS_DISPONIVEIS } from '../App';
import styles from './GridConfig.module.css';
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

const TAMANHO = 10;
const LETRAS = ['A','B','C','D','E','F','G','H','I','J'];

// Gera UID único para cada navio posicionado
let uidCounter = 0;
function gerarUID() { return `navio-${++uidCounter}`; }

// Retorna as células que um navio ocuparia dado início, tamanho e orientação
function calcularCelulas(row, col, tamanho, horizontal) {
  const celulas = [];
  for (let i = 0; i < tamanho; i++) {
    celulas.push(horizontal ? [row, col + i] : [row + i, col]);
  }
  return celulas;
}

// Verifica se as células estão dentro do grid e não colidem
function validarPosicao(celulas, naviosPosicionados, uidExcluir = null) {
  for (const [r, c] of celulas) {
    if (r < 0 || r >= TAMANHO || c < 0 || c >= TAMANHO) return false;
  }
  const ocupadas = new Set();
  naviosPosicionados
    .filter(n => n.uid !== uidExcluir)
    .forEach(n => n.celulas.forEach(([r, c]) => ocupadas.add(`${r},${c}`)));
  for (const [r, c] of celulas) {
    if (ocupadas.has(`${r},${c}`)) return false;
  }
  return true;
}

export default function GridConfig({ naviosPosicionados, onSetNavios, contagem }) {
  // Navio sendo arrastado do painel lateral
  const [arrastandoDef, setArrastandoDef] = useState(null);
  // Horizontal/vertical do navio sendo arrastado
  const [horizontal, setHorizontal] = useState(true);
  // Células destacadas no hover durante drag
  const [hover, setHover] = useState(null); // { celulas, valido }
  // Navio sendo reposicionado (já posicionado no grid)
  const [reposicionando, setReposicionando] = useState(null);
  // Navio selecionado para girar
  const [selecionado, setSelecionado] = useState(null);

  // Mapeia células para navios posicionados
  const mapaNavios = {};
  naviosPosicionados.forEach(n => {
    n.celulas.forEach(([r, c]) => { mapaNavios[`${r},${c}`] = n; });
  });

  // ─── Drag do painel lateral ─────────────────────────────────────────────
  function handleDragStartDef(def) {
    setArrastandoDef(def);
    setReposicionando(null);
    setSelecionado(null);
  }

  // ─── Drag de navio já no grid ───────────────────────────────────────────
  function handleDragStartGrid(navio, e) {
    e.stopPropagation();
    setReposicionando(navio);
    setArrastandoDef({ ...navio, tamanho: navio.celulas.length });
    setHorizontal(navio.horizontal);
    setSelecionado(null);
  }

  // ─── Hover sobre célula do grid ─────────────────────────────────────────
  function handleCelulaEnter(row, col) {
    const def = arrastandoDef;
    if (!def) return;
    const celulas = calcularCelulas(row, col, def.tamanho, horizontal);
    const valido = validarPosicao(
      celulas,
      naviosPosicionados,
      reposicionando?.uid
    );
    setHover({ celulas, valido });
  }

  function handleCelulaLeave() {
    setHover(null);
  }

  // ─── Soltar navio na célula ──────────────────────────────────────────────
  function handleDrop(row, col) {
    if (!arrastandoDef) return;
    const celulas = calcularCelulas(row, col, arrastandoDef.tamanho, horizontal);
    if (!validarPosicao(celulas, naviosPosicionados, reposicionando?.uid)) {
      setHover(null);
      setArrastandoDef(null);
      setReposicionando(null);
      return;
    }

    let novos;
    if (reposicionando) {
      // Atualiza navio existente
      novos = naviosPosicionados.map(n =>
        n.uid === reposicionando.uid
          ? { ...n, celulas, horizontal }
          : n
      );
    } else {
      // Adiciona novo navio
      novos = [
        ...naviosPosicionados,
        {
          uid: gerarUID(),
          id: arrastandoDef.id,
          nome: arrastandoDef.nome,
          emoji: arrastandoDef.emoji,
          tamanho: arrastandoDef.tamanho,
          celulas,
          horizontal,
        },
      ];
    }

    onSetNavios(novos);
    setArrastandoDef(null);
    setReposicionando(null);
    setHover(null);
  }

  // ─── Remover navio do grid ───────────────────────────────────────────────
  function removerNavio(uid) {
    onSetNavios(naviosPosicionados.filter(n => n.uid !== uid));
    setSelecionado(null);
  }

  // ─── Girar navio já posicionado ──────────────────────────────────────────
  function girarNavio(navio) {
    const novoHorizontal = !navio.horizontal;
    const [r0, c0] = navio.celulas[0];
    const celulas = calcularCelulas(r0, c0, navio.celulas.length, novoHorizontal);
    if (!validarPosicao(celulas, naviosPosicionados, navio.uid)) {
      // Tenta girar na mesma posição — se não couber, avisa
      alert('Não é possível girar neste espaço!');
      return;
    }
    const novos = naviosPosicionados.map(n =>
      n.uid === navio.uid ? { ...n, celulas, horizontal: novoHorizontal } : n
    );
    onSetNavios(novos);
    setSelecionado(null);
  }

  // ─── Resetar tudo ───────────────────────────────────────────────────────
  function resetar() {
    onSetNavios([]);
    setArrastandoDef(null);
    setReposicionando(null);
    setHover(null);
    setSelecionado(null);
  }

  // ─── Posicionamento aleatório ────────────────────────────────────────────
  function posicionarAleatoriamente() {
    const novos = [];
    for (const def of NAVIOS_DISPONIVEIS) {
      for (let q = 0; q < def.quantidade; q++) {
        let colocado = false;
        let tentativas = 0;
        while (!colocado && tentativas < 200) {
          tentativas++;
          const horiz = Math.random() < 0.5;
          const row = Math.floor(Math.random() * TAMANHO);
          const col = Math.floor(Math.random() * TAMANHO);
          const celulas = calcularCelulas(row, col, def.tamanho, horiz);
          if (validarPosicao(celulas, novos)) {
            novos.push({
              uid: gerarUID(),
              id: def.id,
              nome: def.nome,
              emoji: def.emoji,
              tamanho: def.tamanho,
              celulas,
              horizontal: horiz,
            });
            colocado = true;
          }
        }
      }
    }
    onSetNavios(novos);
    setSelecionado(null);
  }

  // Calcula status de cada tipo de navio
  const statusNavios = NAVIOS_DISPONIVEIS.map(def => ({
    ...def,
    posicionados: contagem[def.id] || 0,
    restantes: def.quantidade - (contagem[def.id] || 0),
  }));

  return (
    <div className={styles.container}>
      {/* Painel lateral com navios disponíveis */}
      <aside className={styles.painel}>
        <h3 className={styles.painelTitulo}>Seus Navios</h3>
        <p className={styles.painelDica}>
          Arraste para o grid • Clique no grid para selecionar
        </p>

        <div className={styles.controles}>
          <button
            className={`${styles.btnOrientacao} ${horizontal ? styles.btnAtivo : ''}`}
            onClick={() => setHorizontal(true)}
          >
            ↔ Horizontal
          </button>
          <button
            className={`${styles.btnOrientacao} ${!horizontal ? styles.btnAtivo : ''}`}
            onClick={() => setHorizontal(false)}
          >
            ↕ Vertical
          </button>
        </div>

        <button className={styles.btnAleatorio} onClick={posicionarAleatoriamente}>
          🎲 Posicionamento Aleatório
        </button>

        <div className={styles.listaNavios}>
          {statusNavios.map(def => (
            <div key={def.id} className={styles.grupoNavio}>
              <div className={styles.navioInfo}>
                <span className={styles.navioEmoji}>{def.emoji}</span>
                <div>
                  <div className={styles.navioNome}>{def.nome}</div>
                  <div className={styles.navioTamanho}>
                    {'■'.repeat(def.tamanho)} ({def.tamanho} casas)
                  </div>
                </div>
                <div className={styles.navioContagem}>
                  {def.posicionados}/{def.quantidade}
                </div>
              </div>

              {/* Itens arrastáveis */}
              {Array.from({ length: def.quantidade }).map((_, i) => {
                const jaUsado = i < def.posicionados;
                return (
                  <div
                    key={i}
                    className={`${styles.navioItem} ${jaUsado ? styles.navioUsado : ''}`}
                    draggable={!jaUsado}
                    onDragStart={() => !jaUsado && handleDragStartDef(def)}
                    onDragEnd={() => { setArrastandoDef(null); setHover(null); }}
                  >
                    <img
                      src={SVG_NAVIOS[def.id]}
                      alt={def.nome}
                      className={styles.navioSvg}
                      style={{ width: `${def.tamanho * 14}px` }}
                      draggable={false}
                    />
                    {jaUsado && <span className={styles.usadoTag}>✓ Posicionado</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <button className={styles.btnResetar} onClick={resetar}>
          🔄 Resetar posições
        </button>

        {/* Painel de navio selecionado */}
        {selecionado && (
          <div className={styles.painelSelecionado}>
            <p>Selecionado: <strong>{selecionado.nome}</strong></p>
            <div className={styles.acoesSelecionado}>
              <button
                className={styles.btnAcao}
                onClick={() => girarNavio(selecionado)}
              >
                🔄 Girar
              </button>
              <button
                className={`${styles.btnAcao} ${styles.btnRemover}`}
                onClick={() => removerNavio(selecionado.uid)}
              >
                🗑️ Remover
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Grid de configuração */}
      <div className={styles.gridArea}>
        <div className={styles.gridWrapper}>
          {/* Cabeçalho de colunas */}
          <div className={styles.gridHeader}>
            <div className={styles.cornerVazio} />
            {Array.from({ length: TAMANHO }, (_, i) => (
              <div key={i} className={styles.labelColuna}>{i + 1}</div>
            ))}
          </div>

          {/* Linhas do grid */}
          {Array.from({ length: TAMANHO }, (_, row) => (
            <div key={row} className={styles.gridLinha}>
              <div className={styles.labelLinha}>{LETRAS[row]}</div>
              {Array.from({ length: TAMANHO }, (_, col) => {
                const chave = `${row},${col}`;
                const navioAqui = mapaNavios[chave];

                // Verifica se esta célula está no hover de drag
                const noHover = hover?.celulas?.some(([r, c]) => r === row && c === col);
                const hoverValido = hover?.valido;

                const estaSelecionado = selecionado && navioAqui?.uid === selecionado.uid;

                return (
                  <div
                    key={col}
                    className={`
                      ${styles.celula}
                      ${navioAqui ? styles.celulaOcupada : ''}
                      ${noHover ? (hoverValido ? styles.hoverValido : styles.hoverInvalido) : ''}
                      ${estaSelecionado ? styles.celulaSelecionada : ''}
                    `}
                    onDragOver={e => { e.preventDefault(); handleCelulaEnter(row, col); }}
                    onDrop={() => handleDrop(row, col)}
                    onDragLeave={handleCelulaLeave}
                    onClick={() => {
                      if (navioAqui) {
                        setSelecionado(
                          selecionado?.uid === navioAqui.uid ? null : navioAqui
                        );
                      } else {
                        setSelecionado(null);
                      }
                    }}
                  >
                    {navioAqui && mapaNavios[chave]?.celulas?.[0]?.[0] === row && mapaNavios[chave]?.celulas?.[0]?.[1] === col && (
                      <span
                        className={styles.navioGridEmoji}
                        draggable
                        onDragStart={e => handleDragStartGrid(navioAqui, e)}
                        onDragEnd={() => { setArrastandoDef(null); setHover(null); setReposicionando(null); }}
                        title={`${navioAqui.nome} — arraste para mover`}
                      >
                        {navioAqui.emoji}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <p className={styles.dica}>
          💡 Clique em um navio no grid para selecioná-lo e usar as opções de girar/remover
        </p>
      </div>
    </div>
  );
}
