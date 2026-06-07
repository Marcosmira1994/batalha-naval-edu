import { useState } from 'react';
import styles from './FormQuestao.module.css';

const DISCIPLINAS = [
  'Matemática', 'Português', 'Ciências', 'História', 'Geografia', 'Inglês', 'Outro',
];

const QUESTAO_VAZIA = {
  disciplina: 'Matemática',
  enunciado: '',
  tipo: 'multipla', // 'multipla' | 'vf'
  alternativas: ['', '', '', ''],
  correta: 0, // índice para multipla, 0=V 1=F para vf
  dificuldade: 'Médio',
};

let idCounter = 0;
function gerarId() { return ++idCounter; }

export default function FormQuestao({ questoes, onSetQuestoes }) {
  const [form, setForm] = useState({ ...QUESTAO_VAZIA, alternativas: ['', '', '', ''] });
  const [editandoId, setEditandoId] = useState(null);
  const [erros, setErros] = useState({});

  function validar() {
    const e = {};
    if (!form.enunciado.trim()) e.enunciado = 'Enunciado é obrigatório';
    if (form.tipo === 'multipla') {
      form.alternativas.forEach((alt, i) => {
        if (!alt.trim()) e[`alt${i}`] = 'Alternativa vazia';
      });
    }
    return e;
  }

  function salvar() {
    const e = validar();
    if (Object.keys(e).length > 0) { setErros(e); return; }
    setErros({});

    if (editandoId !== null) {
      onSetQuestoes(questoes.map(q =>
        q.id === editandoId ? { ...form, id: editandoId } : q
      ));
      setEditandoId(null);
    } else {
      onSetQuestoes([...questoes, { ...form, alternativas: [...form.alternativas], id: gerarId() }]);
    }
    setForm({ ...QUESTAO_VAZIA, alternativas: ['', '', '', ''] });
  }

  function editar(q) {
    setEditandoId(q.id);
    setForm({
      disciplina: q.disciplina,
      enunciado: q.enunciado,
      tipo: q.tipo,
      alternativas: [...q.alternativas],
      correta: q.correta,
      dificuldade: q.dificuldade,
    });
    setErros({});
    window.scrollTo(0, 0);
  }

  function excluir(id) {
    onSetQuestoes(questoes.filter(q => q.id !== id));
    if (editandoId === id) { cancelar(); }
  }

  function cancelar() {
    setEditandoId(null);
    setForm({ ...QUESTAO_VAZIA, alternativas: ['', '', '', ''] });
    setErros({});
  }

  function setAlt(i, valor) {
    const alts = [...form.alternativas];
    alts[i] = valor;
    setForm(f => ({ ...f, alternativas: alts }));
  }

  const LETRAS = ['A', 'B', 'C', 'D'];
  const corLabel = ['Fácil', 'Médio', 'Difícil'];
  const corCor = { Fácil: '#4ade80', Médio: '#fbbf24', Difícil: '#f87171' };

  return (
    <div className={styles.container}>
      {/* Formulário */}
      <div className={styles.formulario}>
        <h3 className={styles.formTitulo}>
          {editandoId !== null ? '✏️ Editando questão' : '➕ Nova questão'}
        </h3>

        <div className={styles.linha}>
          <div className={styles.campo}>
            <label>Disciplina</label>
            <select
              value={form.disciplina}
              onChange={e => setForm(f => ({ ...f, disciplina: e.target.value }))}
            >
              {DISCIPLINAS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div className={styles.campo}>
            <label>Dificuldade</label>
            <select
              value={form.dificuldade}
              onChange={e => setForm(f => ({ ...f, dificuldade: e.target.value }))}
            >
              {corLabel.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div className={styles.campo}>
            <label>Tipo</label>
            <select
              value={form.tipo}
              onChange={e => setForm(f => ({ ...f, tipo: e.target.value, correta: 0 }))}
            >
              <option value="multipla">Múltipla Escolha</option>
              <option value="vf">Verdadeiro / Falso</option>
            </select>
          </div>
        </div>

        <div className={styles.campo}>
          <label>Enunciado da questão</label>
          <textarea
            rows={3}
            placeholder="Digite o enunciado aqui..."
            value={form.enunciado}
            onChange={e => setForm(f => ({ ...f, enunciado: e.target.value }))}
            className={erros.enunciado ? styles.campoErro : ''}
          />
          {erros.enunciado && <span className={styles.msgErro}>{erros.enunciado}</span>}
        </div>

        {form.tipo === 'multipla' && (
          <div className={styles.alternativas}>
            <label>Alternativas</label>
            {form.alternativas.map((alt, i) => (
              <div key={i} className={styles.linhaAlternativa}>
                <button
                  className={`${styles.btnLetra} ${form.correta === i ? styles.btnCorreta : ''}`}
                  onClick={() => setForm(f => ({ ...f, correta: i }))}
                  title="Clique para marcar como correta"
                >
                  {LETRAS[i]}
                </button>
                <input
                  placeholder={`Alternativa ${LETRAS[i]}`}
                  value={alt}
                  onChange={e => setAlt(i, e.target.value)}
                  className={`${styles.inputAlternativa} ${erros[`alt${i}`] ? styles.campoErro : ''}`}
                />
                {form.correta === i && (
                  <span className={styles.tagCorreta}>✓ Correta</span>
                )}
              </div>
            ))}
            <p className={styles.dicaAlternativa}>
              Clique na letra para marcar a alternativa correta
            </p>
          </div>
        )}

        {form.tipo === 'vf' && (
          <div className={styles.vf}>
            <label>Resposta correta</label>
            <div className={styles.vfOpcoes}>
              <button
                className={`${styles.btnVF} ${form.correta === 0 ? styles.btnVFAtivo : ''}`}
                onClick={() => setForm(f => ({ ...f, correta: 0 }))}
              >
                ✓ Verdadeiro
              </button>
              <button
                className={`${styles.btnVF} ${form.correta === 1 ? styles.btnVFAtivo : ''}`}
                onClick={() => setForm(f => ({ ...f, correta: 1 }))}
              >
                ✗ Falso
              </button>
            </div>
          </div>
        )}

        <div className={styles.acoes}>
          {editandoId !== null && (
            <button className={styles.btnCancelar} onClick={cancelar}>
              Cancelar
            </button>
          )}
          <button className={styles.btnSalvar} onClick={salvar}>
            {editandoId !== null ? '💾 Salvar alterações' : '➕ Adicionar questão'}
          </button>
        </div>
      </div>

      {/* Lista de questões */}
      <div className={styles.lista}>
        <h3 className={styles.listaTitulo}>
          Questões cadastradas
          <span className={styles.listaBadge}>{questoes.length}</span>
        </h3>

        {questoes.length === 0 && (
          <div className={styles.vazio}>
            Nenhuma questão cadastrada ainda. Adicione questões no formulário ao lado.
          </div>
        )}

        {questoes.map((q, idx) => (
          <div key={q.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardNumero}>#{idx + 1}</span>
              <span className={styles.cardDisciplina}>{q.disciplina}</span>
              <span
                className={styles.cardDificuldade}
                style={{ color: corCor[q.dificuldade] }}
              >
                {q.dificuldade}
              </span>
              <span className={styles.cardTipo}>
                {q.tipo === 'multipla' ? 'M.E.' : 'V/F'}
              </span>
            </div>

            <p className={styles.cardEnunciado}>{q.enunciado}</p>

            {q.tipo === 'multipla' && (
              <div className={styles.cardAlts}>
                {q.alternativas.map((alt, i) => (
                  <span
                    key={i}
                    className={`${styles.cardAlt} ${i === q.correta ? styles.cardAltCorreta : ''}`}
                  >
                    {LETRAS[i]}) {alt}
                  </span>
                ))}
              </div>
            )}

            {q.tipo === 'vf' && (
              <p className={styles.cardVF}>
                Resposta: <strong>{q.correta === 0 ? 'Verdadeiro ✓' : 'Falso ✗'}</strong>
              </p>
            )}

            <div className={styles.cardAcoes}>
              <button className={styles.btnEditar} onClick={() => editar(q)}>
                ✏️ Editar
              </button>
              <button className={styles.btnExcluir} onClick={() => excluir(q.id)}>
                🗑️ Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
