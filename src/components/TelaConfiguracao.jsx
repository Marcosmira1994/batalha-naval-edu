import { useState } from 'react';
import GridConfig from './GridConfig';
import FormQuestao from './FormQuestao';
import { NAVIOS_DISPONIVEIS } from '../App';
import styles from './TelaConfiguracao.module.css';

// Conta quantos navios de cada tipo já foram posicionados
function contarNaviosPosicionados(naviosPosicionados) {
  const contagem = {};
  naviosPosicionados.forEach(n => {
    contagem[n.id] = (contagem[n.id] || 0) + 1;
  });
  return contagem;
}

// Verifica se todos os navios obrigatórios foram posicionados
function todosNaviosPosicionados(naviosPosicionados) {
  const contagem = contarNaviosPosicionados(naviosPosicionados);
  return NAVIOS_DISPONIVEIS.every(
    def => (contagem[def.id] || 0) >= def.quantidade
  );
}

export default function TelaConfiguracao({
  naviosPosicionados,
  questoes,
  onSetNavios,
  onSetQuestoes,
  onIniciarJogo,
}) {
  const [aba, setAba] = useState('navios'); // 'navios' | 'questoes'

  const podIniciar = todosNaviosPosicionados(naviosPosicionados) && questoes.length >= 1;
  const contagem = contarNaviosPosicionados(naviosPosicionados);

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <header className={styles.header}>
        <h1 className={styles.titulo}>
          ⚓ Batalha Naval Educacional
        </h1>
        <p className={styles.subtitulo}>Painel do Professor — Configure o jogo</p>
      </header>

      {/* Abas */}
      <div className={styles.abas}>
        <button
          className={`${styles.aba} ${aba === 'navios' ? styles.abaAtiva : ''}`}
          onClick={() => setAba('navios')}
        >
          🗺️ Posicionamento dos Navios
          {todosNaviosPosicionados(naviosPosicionados) && (
            <span className={styles.check}>✓</span>
          )}
        </button>
        <button
          className={`${styles.aba} ${aba === 'questoes' ? styles.abaAtiva : ''}`}
          onClick={() => setAba('questoes')}
        >
          📝 Cadastro de Questões
          {questoes.length > 0 && (
            <span className={styles.badge}>{questoes.length}</span>
          )}
        </button>
      </div>

      {/* Conteúdo da aba */}
      <div className={styles.conteudo}>
        {aba === 'navios' && (
          <GridConfig
            naviosPosicionados={naviosPosicionados}
            onSetNavios={onSetNavios}
            contagem={contagem}
          />
        )}
        {aba === 'questoes' && (
          <FormQuestao
            questoes={questoes}
            onSetQuestoes={onSetQuestoes}
          />
        )}
      </div>

      {/* Rodapé com botão de iniciar */}
      <footer className={styles.footer}>
        {questoes.length < 6 && questoes.length >= 1 && (
          <p className={styles.aviso}>
            ⚠️ Recomendado pelo menos 6 questões. Você tem {questoes.length}.
          </p>
        )}
        {questoes.length === 0 && (
          <p className={styles.aviso}>
            ⚠️ Cadastre ao menos 1 questão para iniciar.
          </p>
        )}
        {!todosNaviosPosicionados(naviosPosicionados) && (
          <p className={styles.aviso}>
            ⚠️ Posicione todos os navios no grid para iniciar.
          </p>
        )}
        <button
          className={styles.btnIniciar}
          disabled={!podIniciar}
          onClick={() => onIniciarJogo(naviosPosicionados)}
        >
          🚀 Iniciar Jogo
        </button>
      </footer>
    </div>
  );
}
