import { useState, useEffect } from 'react';
import { buscarQuestoes, salvarQuestao, apagarQuestao } from '../lib/questoesService';
import styles from './TelaGerenciarLista.module.css';

const LIMITE_QUESTOES = 30;

const ALTS_VAZIAS = ['', '', '', ''];

function formInicial() {
  return {
    tipo: 'multipla',
    enunciado: '',
    alternativas: [...ALTS_VAZIAS],
    correta: 0,
    dificuldade: 'Médio',
  };
}

function labelCorreta(q) {
  const idx = Number(q.resposta_correta);
  if (q.tipo === 'verdadeiro_falso') return idx === 0 ? 'Verdadeiro' : 'Falso';
  return q.alternativas?.[idx] || '—';
}

export default function TelaGerenciarLista({ lista, onVoltar }) {
  const [questoes, setQuestoes]   = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando]   = useState(false);
  const [erro, setErro]           = useState('');
  const [form, setForm]           = useState(formInicial());

  useEffect(() => {
    carregar();
  }, [lista.id]);

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const data = await buscarQuestoes(lista.id);
      setQuestoes(data);
    } catch (e) {
      setErro('Erro ao carregar questões: ' + e.message);
    } finally {
      setCarregando(false);
    }
  }

  async function handleSalvar(e) {
    e.preventDefault();
    if (!form.enunciado.trim()) return;
    setSalvando(true);
    setErro('');
    try {
      const questao = {
        enunciado: form.enunciado.trim(),
        tipo: form.tipo,
        alternativas: form.tipo === 'multipla'
          ? form.alternativas
          : ['Verdadeiro', 'Falso'],
        correta: form.correta,
        dificuldade: form.dificuldade,
      };
      const nova = await salvarQuestao(lista.id, questao);
      setQuestoes(prev => [...prev, nova]);
      setForm(formInicial());
    } catch (e) {
      setErro('Erro ao salvar questão: ' + e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(q) {
    if (!window.confirm('Excluir esta questão?')) return;
    setErro('');
    try {
      await apagarQuestao(q.id);
      setQuestoes(prev => prev.filter(x => x.id !== q.id));
    } catch (e) {
      setErro('Erro ao excluir questão: ' + e.message);
    }
  }

  function setAlt(idx, valor) {
    const alts = [...form.alternativas];
    alts[idx] = valor;
    setForm(f => ({ ...f, alternativas: alts }));
  }

  const limiteAtingido = questoes.length >= LIMITE_QUESTOES;

  const subtitulo = [lista.disciplina, lista.serie]
    .filter(Boolean).join(' · ');

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.cabecalho}>
        <button className={styles.btnVoltar} onClick={onVoltar}>← Voltar</button>
        <div className={styles.cabecalhoInfo}>
          <h1 className={styles.titulo}>{lista.nome}</h1>
          <p className={styles.subtitulo}>
            {subtitulo}{subtitulo ? ' · ' : ''}{questoes.length} questão{questoes.length !== 1 ? 'ões' : ''}
          </p>
        </div>
      </div>

      {erro && <div className={styles.erro}>{erro}</div>}

      <div className={styles.corpo}>
        {/* Lado esquerdo — formulário */}
        <div className={styles.painel}>
          <h2 className={styles.painelTitulo}>Nova Questão</h2>

          {limiteAtingido ? (
            <div className={styles.avisoLimite}>
              ⚠️ Limite de {LIMITE_QUESTOES} questões atingido.<br />Exclua uma para adicionar outra.
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSalvar}>
              {/* Tipo */}
              <div className={styles.campo}>
                <label className={styles.label}>Tipo</label>
                <select
                  className={styles.input}
                  value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value, correta: 0 }))}
                >
                  <option value="multipla">Múltipla Escolha</option>
                  <option value="vf">Verdadeiro ou Falso</option>
                </select>
              </div>

              {/* Enunciado */}
              <div className={styles.campo}>
                <label className={styles.label}>Enunciado *</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  placeholder="Digite a pergunta..."
                  value={form.enunciado}
                  onChange={e => setForm(f => ({ ...f, enunciado: e.target.value }))}
                  required
                />
              </div>

              {/* Alternativas (múltipla) */}
              {form.tipo === 'multipla' && (
                <div className={styles.campo}>
                  <label className={styles.label}>Alternativas — marque a correta</label>
                  {form.alternativas.map((alt, i) => (
                    <div key={i} className={styles.linhaAlt}>
                      <input
                        type="radio"
                        name="correta"
                        checked={form.correta === i}
                        onChange={() => setForm(f => ({ ...f, correta: i }))}
                        className={styles.radio}
                      />
                      <input
                        className={styles.inputAlt}
                        type="text"
                        placeholder={`Alternativa ${String.fromCharCode(65 + i)}`}
                        value={alt}
                        onChange={e => setAlt(i, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* V/F */}
              {form.tipo === 'vf' && (
                <div className={styles.campo}>
                  <label className={styles.label}>Resposta correta</label>
                  <div className={styles.grupoVF}>
                    {['Verdadeiro', 'Falso'].map((op, i) => (
                      <label key={op} className={styles.opcaoVF}>
                        <input
                          type="radio"
                          name="corretaVF"
                          checked={form.correta === i}
                          onChange={() => setForm(f => ({ ...f, correta: i }))}
                          className={styles.radio}
                        />
                        {op}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Dificuldade */}
              <div className={styles.campo}>
                <label className={styles.label}>Dificuldade</label>
                <select
                  className={styles.input}
                  value={form.dificuldade}
                  onChange={e => setForm(f => ({ ...f, dificuldade: e.target.value }))}
                >
                  <option>Fácil</option>
                  <option>Médio</option>
                  <option>Difícil</option>
                </select>
              </div>

              <button className={styles.btnSalvar} type="submit" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar Questão'}
              </button>
            </form>
          )}
        </div>

        {/* Lado direito — lista de questões */}
        <div className={styles.painel}>
          <h2 className={styles.painelTitulo}>
            Questões cadastradas
            <span className={styles.contador}>{questoes.length}/{LIMITE_QUESTOES}</span>
          </h2>

          {carregando ? (
            <div className={styles.loading}>Carregando...</div>
          ) : questoes.length === 0 ? (
            <div className={styles.vazio}>Nenhuma questão cadastrada ainda.</div>
          ) : (
            <div className={styles.listaQuestoes}>
              {questoes.map((q, idx) => (
                <div key={q.id} className={styles.cardQuestao}>
                  <div className={styles.cardTopo}>
                    <span className={styles.numero}>#{idx + 1}</span>
                    <span className={q.tipo === 'verdadeiro_falso' ? styles.badgeVF : styles.badgeME}>
                      {q.tipo === 'verdadeiro_falso' ? 'V/F' : 'M.E.'}
                    </span>
                    <span className={styles.dificuldade}>{q.dificuldade}</span>
                    <button
                      className={styles.btnExcluir}
                      onClick={() => handleExcluir(q)}
                    >
                      🗑
                    </button>
                  </div>
                  <p className={styles.enunciado}>
                    {q.enunciado.length > 80
                      ? q.enunciado.slice(0, 80) + '…'
                      : q.enunciado}
                  </p>
                  <div className={styles.correta}>
                    ✅ {labelCorreta(q)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
