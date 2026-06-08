import { useState, useEffect } from 'react';
import {
  buscarListas,
  criarLista,
  apagarLista,
  buscarQuestoes,
} from '../lib/questoesService';
import styles from './TelaListas.module.css';

const DISCIPLINAS = [
  'Matemática', 'Português', 'Ciências',
  'História', 'Geografia', 'Inglês', 'Outro',
];

const LIMITE_LISTAS = 5;

function converterQuestao(q) {
  return {
    id: q.id,
    enunciado: q.enunciado,
    tipo: q.tipo === 'verdadeiro_falso' ? 'vf' : 'multipla',
    alternativas: q.alternativas ?? ['', '', '', ''],
    correta: Number(q.resposta_correta),
    dificuldade: q.dificuldade ?? 'Médio',
    disciplina: 'Outro',
  };
}

export default function TelaListas({ onSelecionarLista, onContinuarSemLista, onGerenciarLista }) {
  const [listas, setListas]           = useState([]);
  const [carregando, setCarregando]   = useState(true);
  const [erro, setErro]               = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando]       = useState(false);
  const [carregandoId, setCarregandoId] = useState(null); // lista sendo carregada

  // Form nova lista
  const [nome, setNome]         = useState('');
  const [disciplina, setDisciplina] = useState('Matemática');
  const [serie, setSerie]       = useState('');

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const data = await buscarListas();
      setListas(data);
    } catch (e) {
      setErro('Erro ao carregar listas: ' + e.message);
    } finally {
      setCarregando(false);
    }
  }

  async function handleCriar(e) {
    e.preventDefault();
    if (!nome.trim()) return;
    setSalvando(true);
    setErro('');
    try {
      const nova = await criarLista(nome.trim(), disciplina, serie.trim());
      setListas(prev => [nova, ...prev]);
      setNome('');
      setSerie('');
      setDisciplina('Matemática');
      setMostrarForm(false);
    } catch (e) {
      console.error('ERRO CRIAR LISTA COMPLETO:', e)
      setErro('Erro ao criar lista: ' + (e.message || JSON.stringify(e)))
    } finally {
      setSalvando(false);
    }
  }

  async function handleApagar(lista) {
    if (!window.confirm(`Apagar a lista "${lista.nome}" e todas as suas questões?`)) return;
    setErro('');
    try {
      await apagarLista(lista.id);
      setListas(prev => prev.filter(l => l.id !== lista.id));
    } catch (e) {
      setErro('Erro ao apagar lista: ' + e.message);
    }
  }

  async function handleUsarNoJogo(lista) {
    setCarregandoId(lista.id);
    setErro('');
    try {
      const raw = await buscarQuestoes(lista.id);
      if (raw.length === 0) {
        setErro(`A lista "${lista.nome}" não tem questões cadastradas ainda.`);
        return;
      }
      onSelecionarLista(raw.map(converterQuestao));
    } catch (e) {
      setErro('Erro ao carregar questões: ' + e.message);
    } finally {
      setCarregandoId(null);
    }
  }

  const limiteAtingido = listas.length >= LIMITE_LISTAS;

  return (
    <div className={styles.container}>
      <div className={styles.cabecalho}>
        <h1 className={styles.titulo}>📚 Minhas Listas de Questões</h1>
        <p className={styles.subtitulo}>
          Escolha uma lista para usar no jogo ou crie uma nova
        </p>
      </div>

      {erro && <div className={styles.erro}>{erro}</div>}

      {/* Botão nova lista */}
      <div className={styles.acoes}>
        {limiteAtingido ? (
          <p className={styles.avisoLimite}>
            ⚠️ Limite de {LIMITE_LISTAS} listas atingido. Apague uma para criar outra.
          </p>
        ) : (
          !mostrarForm && (
            <button className={styles.btnNova} onClick={() => setMostrarForm(true)}>
              ＋ Nova Lista
            </button>
          )
        )}
      </div>

      {/* Formulário inline */}
      {mostrarForm && (
        <form className={styles.formNova} onSubmit={handleCriar}>
          <h3 className={styles.formTitulo}>Nova lista</h3>
          <div className={styles.formCampos}>
            <div className={styles.campo}>
              <label className={styles.label}>Nome *</label>
              <input
                className={styles.input}
                type="text"
                placeholder="Ex: Revisão 7º ano"
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
              />
            </div>
            <div className={styles.campo}>
              <label className={styles.label}>Disciplina</label>
              <select
                className={styles.input}
                value={disciplina}
                onChange={e => setDisciplina(e.target.value)}
              >
                {DISCIPLINAS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className={styles.campo}>
              <label className={styles.label}>Série</label>
              <input
                className={styles.input}
                type="text"
                placeholder="Ex: 6º ano"
                value={serie}
                onChange={e => setSerie(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.formBotoes}>
            <button className={styles.btnCriar} type="submit" disabled={salvando}>
              {salvando ? 'Criando...' : 'Criar'}
            </button>
            <button
              className={styles.btnCancelar}
              type="button"
              onClick={() => { setMostrarForm(false); setNome(''); setSerie(''); }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de cards */}
      {carregando ? (
        <div className={styles.loading}>Carregando listas...</div>
      ) : listas.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhuma lista criada ainda.</p>
          <p>Clique em "＋ Nova Lista" para começar.</p>
        </div>
      ) : (
        <div className={styles.grade}>
          {listas.map(lista => (
            <div key={lista.id} className={styles.card}>
              <div className={styles.cardTopo}>
                <div>
                  <div className={styles.cardNome}>{lista.nome}</div>
                  <div className={styles.cardMeta}>
                    {lista.disciplina}{lista.serie ? ` · ${lista.serie}` : ''}
                  </div>
                </div>
              </div>

              <div className={styles.cardBotoes}>
                <button
                  className={styles.btnUsar}
                  onClick={() => handleUsarNoJogo(lista)}
                  disabled={carregandoId === lista.id}
                >
                  {carregandoId === lista.id ? 'Carregando...' : '▶ Usar no jogo'}
                </button>
                <button
                  className={styles.btnGerenciar}
                  onClick={() => onGerenciarLista(lista)}
                  disabled={carregandoId === lista.id}
                >
                  ✏️ Questões
                </button>
                <button
                  className={styles.btnApagar}
                  onClick={() => handleApagar(lista)}
                  disabled={carregandoId === lista.id}
                >
                  🗑 Apagar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rodapé */}
      <div className={styles.rodape}>
        <button className={styles.btnSemLista} onClick={onContinuarSemLista}>
          Continuar sem lista salva →
        </button>
        <p className={styles.rodapeDica}>
          Você poderá cadastrar questões manualmente na próxima tela
        </p>
      </div>
    </div>
  );
}
