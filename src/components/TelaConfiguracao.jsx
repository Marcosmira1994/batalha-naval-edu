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
  listaSelecionada,
  onSetNavios,
  onSetQuestoes,
  onIniciarJogo,
  onTrocarLista,
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
          <div>
            {listaSelecionada ? (
              <div style={{
                background: 'rgba(74,144,217,0.15)',
                border: '1px solid #4a90d9',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{ color: '#7fb3d3', fontSize: '12px' }}>
                    Lista selecionada:
                  </span>
                  <strong style={{ color: 'white', marginLeft: '8px' }}>
                    📚 {listaSelecionada.nome}
                  </strong>
                  {listaSelecionada.disciplina && (
                    <span style={{ color: '#7fb3d3', marginLeft: '8px', fontSize: '13px' }}>
                      · {listaSelecionada.disciplina}
                      {listaSelecionada.serie ? ` · ${listaSelecionada.serie}` : ''}
                    </span>
                  )}
                  <span style={{ color: '#4a90d9', marginLeft: '8px', fontSize: '13px' }}>
                    ({questoes.length} questões)
                  </span>
                </div>
                <button
                  onClick={onTrocarLista}
                  style={{
                    background: 'transparent',
                    border: '1px solid #4a90d9',
                    color: '#4a90d9',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  🔄 Trocar lista
                </button>
              </div>
            ) : (
              <div style={{
                background: 'rgba(255,165,0,0.1)',
                border: '1px solid orange',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ color: '#ffa500', fontSize: '13px' }}>
                  ⚠️ Nenhuma lista selecionada — questões não serão salvas
                </span>
                <button
                  onClick={onTrocarLista}
                  style={{
                    background: 'transparent',
                    border: '1px solid orange',
                    color: 'orange',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  📚 Selecionar lista
                </button>
              </div>
            )}
            <FormQuestao
              questoes={questoes}
              onSetQuestoes={onSetQuestoes}
            />
          </div>
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
