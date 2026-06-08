import { useReducer, useEffect, useState } from 'react';
import './App.css';
import TelaConfiguracao from './components/TelaConfiguracao';
import TelaJogo from './components/TelaJogo';
import TelaFim from './components/TelaFim';
import TelaLogin from './components/TelaLogin';
import { verificarFimAntecipado } from './utils/gameLogic';
import { supabase } from './lib/supabase';

export const NAVIOS_DISPONIVEIS = [
  { id: 'porta-avioes', nome: 'Porta-aviões', tamanho: 5, quantidade: 1, emoji: '🛳️' },
  { id: 'encouracado', nome: 'Encouraçado', tamanho: 4, quantidade: 1, emoji: '⚓' },
  { id: 'contratorpedeiro', nome: 'Contratorpedeiro', tamanho: 3, quantidade: 2, emoji: '🚢' },
  { id: 'submarino', nome: 'Submarino', tamanho: 2, quantidade: 2, emoji: '🤿' },
];

const estadoInicial = {
  tela: 'configuracao',
  naviosPosicionados: [],
  questoes: [],
  jogo: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_NAVIOS':
      return { ...state, naviosPosicionados: action.navios };

    case 'SET_QUESTOES':
      return { ...state, questoes: action.questoes };

    case 'INICIAR_JOGO': {
      const celulasNavios = {};
      action.naviosPosicionados.forEach(n => {
        n.celulas.forEach(([r, c]) => {
          celulasNavios[`${r},${c}`] = { navioId: n.uid, navio: n };
        });
      });

      const naviosVivos = action.naviosPosicionados.map(n => ({
        ...n,
        acertos: 0,
        afundado: false,
        anunciado: false, // impede o banner de reaparecer em ataques futuros
      }));

      return {
        ...state,
        tela: 'jogo',
        naviosPosicionados: action.naviosPosicionados,
        jogo: {
          celulasNavios,
          naviosVivos,
          atacadas: {},
          times: {
            azul: { pontos: 0, nome: 'Time Azul' },
            vermelho: { pontos: 0, nome: 'Time Vermelho' },
          },
          timeAtual: 'azul',
          bombasRodada: 3,
          bombasUsadas: 0,
          historico: [],
          ultimoAtaque: null,
          // Navio que afundou no ataque atual (aguardando modal fechar)
          navioAfundouNesteAtaque: null,
          // Navio a anunciar APÓS o modal fechar (lido pelo TelaJogo)
          navioRecemAfundado: null,
          // Preenchido quando virada se torna matematicamente impossível
          fimAntecipado: null,
        },
      };
    }

    case 'ATACAR_CELULA': {
      const { row, col } = action;
      const chave = `${row},${col}`;
      const jogo = state.jogo;

      if (jogo.atacadas[chave] || jogo.bombasUsadas >= jogo.bombasRodada) return state;

      const acertou = !!jogo.celulasNavios[chave];
      const navioId = acertou ? jogo.celulasNavios[chave].navioId : null;
      // Captura quem atacou ANTES de trocar o turno
      const timeQueAtacou = jogo.timeAtual;

      const novasAtacadas = {
        ...jogo.atacadas,
        [chave]: { resultado: acertou ? 'acerto' : 'agua', navioId },
      };

      // Atualiza acertos do navio atingido; detecta afundamento
      let navioAfundouNesteAtaque = null;
      const naviosVivos = jogo.naviosVivos.map(n => {
        if (n.uid !== navioId) return n;
        const acertos = n.acertos + 1;
        const afundado = acertos >= n.celulas.length;
        const atualizado = { ...n, acertos, afundado };
        // Só registra "afundou neste ataque" se ainda não foi anunciado
        if (afundado && !n.anunciado) navioAfundouNesteAtaque = atualizado;
        return atualizado;
      });

      const novoHistorico = [
        { time: jogo.timeAtual, row, col, resultado: acertou ? 'acerto' : 'agua' },
        ...jogo.historico,
      ].slice(0, 20);

      const novoBombasUsadas = jogo.bombasUsadas + 1;
      const trocarTurno = novoBombasUsadas >= jogo.bombasRodada;

      // Momento 2 — água: verifica fim antecipado (acerto verifica depois, no modal)
      let fimAntecipado = jogo.fimAntecipado ?? null;
      if (!acertou && !fimAntecipado) {
        const r = verificarFimAntecipado(jogo.times, naviosVivos);
        if (r.fimAntecipado) fimAntecipado = r;
      }

      return {
        ...state,
        jogo: {
          ...jogo,
          atacadas: novasAtacadas,
          naviosVivos,
          bombasUsadas: trocarTurno ? 0 : novoBombasUsadas,
          timeAtual: trocarTurno
            ? jogo.timeAtual === 'azul' ? 'vermelho' : 'azul'
            : jogo.timeAtual,
          historico: novoHistorico,
          // timeQueAtacou permite que o modal mostre o time correto mesmo após troca de turno
          ultimoAtaque: { row, col, acertou, navioId, timeQueAtacou },
          navioAfundouNesteAtaque,
          // Limpa anúncio anterior ao iniciar novo ataque
          navioRecemAfundado: null,
          fimAntecipado,
        },
      };
    }

    case 'PONTUAR_TIME': {
      const { time, pontos } = action;
      const navioAfundado = state.jogo.navioAfundouNesteAtaque;

      // Marca o navio como anunciado para não repetir o banner
      const naviosVivos = navioAfundado
        ? state.jogo.naviosVivos.map(n =>
            n.uid === navioAfundado.uid ? { ...n, anunciado: true } : n
          )
        : state.jogo.naviosVivos;

      // Momento 1 — após fechar modal com acerto: usa os novos pontos para verificar
      const novosTimes = {
        ...state.jogo.times,
        [time]: { ...state.jogo.times[time], pontos: state.jogo.times[time].pontos + pontos + (navioAfundado ? 3 : 0) },
      };
      let fimAntecipado = state.jogo.fimAntecipado ?? null;
      if (!fimAntecipado) {
        const r = verificarFimAntecipado(novosTimes, naviosVivos);
        if (r.fimAntecipado) fimAntecipado = r;
      }

      return {
        ...state,
        jogo: {
          ...state.jogo,
          naviosVivos,
          times: novosTimes,
          ultimoAtaque: null,
          navioAfundouNesteAtaque: null,
          // Move para "recém afundado" → TelaJogo exibe o banner
          navioRecemAfundado: navioAfundado ?? null,
          fimAntecipado,
        },
      };
    }

    case 'FECHAR_MODAL_QUESTAO': {
      const navioAfundado = state.jogo.navioAfundouNesteAtaque;

      const naviosVivos = navioAfundado
        ? state.jogo.naviosVivos.map(n =>
            n.uid === navioAfundado.uid ? { ...n, anunciado: true } : n
          )
        : state.jogo.naviosVivos;

      // Momento 1 — após fechar modal com erro: pontos não mudaram, verifica com placar atual
      let fimAntecipado = state.jogo.fimAntecipado ?? null;
      if (!fimAntecipado) {
        const r = verificarFimAntecipado(state.jogo.times, naviosVivos);
        if (r.fimAntecipado) fimAntecipado = r;
      }

      return {
        ...state,
        jogo: {
          ...state.jogo,
          naviosVivos,
          ultimoAtaque: null,
          navioAfundouNesteAtaque: null,
          navioRecemAfundado: navioAfundado ?? null,
          fimAntecipado,
        },
      };
    }

    // Limpa o banner de afundamento após ele ser exibido
    case 'LIMPAR_ANUNCIO_AFUNDADO':
      return {
        ...state,
        jogo: { ...state.jogo, navioRecemAfundado: null },
      };

    case 'SET_FIM_ANTECIPADO':
      return {
        ...state,
        jogo: { ...state.jogo, fimAntecipado: action.info },
      };

    case 'IR_PARA_FIM':
      return { ...state, tela: 'fim' };

    case 'JOGAR_NOVAMENTE':
      return { ...estadoInicial, questoes: state.questoes };

    case 'NOVA_CONFIGURACAO':
      return { ...estadoInicial };

    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, estadoInicial);
  const [sessao, setSessao] = useState(undefined); // undefined = carregando

  // Verifica sessão inicial e escuta mudanças de auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const todosAfundados =
    state.jogo != null &&
    state.jogo.naviosVivos.every(n => n.afundado);

  useEffect(() => {
    if (state.tela === 'jogo' && todosAfundados) {
      const t = setTimeout(() => dispatch({ type: 'IR_PARA_FIM' }), 1200);
      return () => clearTimeout(t);
    }
  }, [state.tela, todosAfundados]);

  // Ainda verificando sessão
  if (sessao === undefined) return null;

  // Sem sessão → tela de login
  if (!sessao) return <TelaLogin />;

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <div className="app">
      <button
        onClick={handleLogout}
        style={{
          position: 'fixed', top: 12, right: 16, zIndex: 1100,
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)',
          color: '#90b8d8', padding: '6px 14px', borderRadius: '8px',
          fontSize: '0.78rem', cursor: 'pointer', backdropFilter: 'blur(4px)',
        }}
      >
        Sair
      </button>

      {state.tela === 'configuracao' && (
        <TelaConfiguracao
          naviosPosicionados={state.naviosPosicionados}
          questoes={state.questoes}
          onSetNavios={navios => dispatch({ type: 'SET_NAVIOS', navios })}
          onSetQuestoes={questoes => dispatch({ type: 'SET_QUESTOES', questoes })}
          onIniciarJogo={naviosPosicionados =>
            dispatch({ type: 'INICIAR_JOGO', naviosPosicionados })
          }
        />
      )}

      {state.tela === 'jogo' && (
        <TelaJogo
          jogo={state.jogo}
          questoes={state.questoes}
          naviosPosicionados={state.naviosPosicionados}
          onAtacar={(row, col) => dispatch({ type: 'ATACAR_CELULA', row, col })}
          onPontuar={(time, pontos) => dispatch({ type: 'PONTUAR_TIME', time, pontos })}
          onFecharModal={() => dispatch({ type: 'FECHAR_MODAL_QUESTAO' })}
          onLimparAnuncio={() => dispatch({ type: 'LIMPAR_ANUNCIO_AFUNDADO' })}
          onFimAntecipado={() => dispatch({ type: 'IR_PARA_FIM' })}
          todosAfundados={todosAfundados}
        />
      )}

      {state.tela === 'fim' && (
        <TelaFim
          jogo={state.jogo}
          onJogarNovamente={() => dispatch({ type: 'JOGAR_NOVAMENTE' })}
          onNovaConfiguracao={() => dispatch({ type: 'NOVA_CONFIGURACAO' })}
        />
      )}
    </div>
  );
}
