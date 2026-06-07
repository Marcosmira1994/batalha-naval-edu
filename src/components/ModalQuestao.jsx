import { useState, useEffect, useRef, useMemo } from 'react';
import { som_acerto_questao, som_erro_questao } from '../utils/sons';
import styles from './ModalQuestao.module.css';

const TEMPO_LIMITE = 30;
const LETRAS = ['A', 'B', 'C', 'D'];

// Cores dos confetes (tons dos dois times + dourado)
const CORES_CONFETE = ['#2d7dd2', '#60a5fa', '#e63946', '#f87171', '#ffd60a', '#4ade80', '#c084fc'];

// Gera posições aleatórias para os confetes — geradas uma vez por montagem
function gerarConfetes(n) {
  return Array.from({ length: n }, (_, i) => ({
    left: `${5 + Math.random() * 90}%`,
    top: `${-10 - Math.random() * 20}px`,
    background: CORES_CONFETE[i % CORES_CONFETE.length],
    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
    width: `${6 + Math.random() * 6}px`,
    height: `${6 + Math.random() * 6}px`,
    animationDuration: `${0.9 + Math.random() * 0.8}s`,
    animationDelay: `${Math.random() * 0.3}s`,
  }));
}

export default function ModalQuestao({ questao, timeAtual, nomeTime, onResponder }) {
  const [selecionada, setSelecionada] = useState(null);
  const [respondido, setRespondido] = useState(false);
  const [acertou, setAcertou] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(TEMPO_LIMITE);
  // Shake visual quando erra
  const [sacudido, setSacudido] = useState(false);
  const timerRef = useRef(null);
  // Ref evita corrida entre timeout e clique manual
  const respondidoRef = useRef(false);

  // Confetes gerados uma única vez
  const confetes = useMemo(() => gerarConfetes(22), []);

  // Countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTempoRestante(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          if (!respondidoRef.current) {
            respondidoRef.current = true;
            setRespondido(true);
            setAcertou(false);
            som_erro_questao();
            ativarShake();
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  function ativarShake() {
    setSacudido(true);
    setTimeout(() => setSacudido(false), 650);
  }

  function responder(opcao) {
    if (respondidoRef.current) return;
    clearInterval(timerRef.current);
    respondidoRef.current = true;

    const correto = opcao === questao.correta;
    setSelecionada(opcao);
    setRespondido(true);
    setAcertou(correto);

    if (correto) {
      som_acerto_questao();
    } else {
      som_erro_questao();
      ativarShake();
    }
  }

  if (!questao) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <p style={{ padding: 24 }}>Nenhuma questão disponível!</p>
          <button style={{ margin: '0 24px 24px', padding: '12px 24px' }} onClick={() => onResponder(false)}>
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const porcentagemTimer = (tempoRestante / TEMPO_LIMITE) * 100;
  const corTimer = tempoRestante > 15 ? '#4ade80' : tempoRestante > 8 ? '#fbbf24' : '#f87171';
  const timeout = tempoRestante === 0 && respondido && selecionada === null;

  return (
    <div className={styles.overlay}>
      <div
        className={`
          ${styles.modal}
          ${respondido ? (acertou ? styles.modalAcerto : styles.modalErro) : ''}
          ${sacudido ? styles.shake : ''}
        `}
      >
        {/* Confetes — visíveis apenas na resposta correta */}
        {acertou && respondido && (
          <div className={styles.confetesContainer} aria-hidden>
            {confetes.map((c, i) => (
              <div key={i} className={styles.confete} style={c} />
            ))}
          </div>
        )}

        {/* Flash de fundo vermelho no erro — via CSS classe */}
        {!acertou && respondido && <div className={styles.flashErro} aria-hidden />}

        {/* Header */}
        <div className={`${styles.header} ${timeAtual === 'azul' ? styles.headerAzul : styles.headerVermelho}`}>
          <div className={styles.headerLeft}>
            <span className={styles.timeEmoji}>{timeAtual === 'azul' ? '🔵' : '🔴'}</span>
            <div>
              <div className={styles.timeNome}>{nomeTime}</div>
              <div className={styles.disciplina}>{questao.disciplina}</div>
            </div>
          </div>
          <div className={styles.timerCircle} style={{ borderColor: corTimer }}>
            <span className={styles.timerNumero} style={{ color: corTimer }}>
              {tempoRestante}
            </span>
          </div>
        </div>

        {/* Barra de timer */}
        <div className={styles.timerBarra}>
          <div
            className={styles.timerPreenchimento}
            style={{
              width: `${porcentagemTimer}%`,
              background: corTimer,
              transition: 'width 1s linear, background 0.5s',
            }}
          />
        </div>

        {/* Enunciado */}
        <div className={styles.enunciado}>
          <span className={styles.enunciadoLabel}>❓ Questão</span>
          <p className={styles.enunciadoTexto}>{questao.enunciado}</p>
        </div>

        {/* Alternativas */}
        <div className={styles.alternativas}>
          {questao.tipo === 'multipla' &&
            questao.alternativas.map((alt, i) => {
              let classe = styles.alternativa;
              if (respondido) {
                if (i === questao.correta) classe = `${styles.alternativa} ${styles.altCorreta}`;
                else if (i === selecionada) classe = `${styles.alternativa} ${styles.altErrada}`;
              } else if (i === selecionada) {
                classe = `${styles.alternativa} ${styles.altSelecionada}`;
              }
              return (
                <button key={i} className={classe} onClick={() => responder(i)} disabled={respondido}>
                  <span className={styles.altLetra}>{LETRAS[i]}</span>
                  <span>{alt}</span>
                </button>
              );
            })}

          {questao.tipo === 'vf' &&
            [0, 1].map(opcao => {
              const label = opcao === 0 ? '✓ Verdadeiro' : '✗ Falso';
              let classe = styles.alternativa;
              if (respondido) {
                if (opcao === questao.correta) classe = `${styles.alternativa} ${styles.altCorreta}`;
                else if (opcao === selecionada) classe = `${styles.alternativa} ${styles.altErrada}`;
              } else if (opcao === selecionada) {
                classe = `${styles.alternativa} ${styles.altSelecionada}`;
              }
              return (
                <button key={opcao} className={`${classe} ${styles.altVF}`} onClick={() => responder(opcao)} disabled={respondido}>
                  <span className={styles.altLetra}>{opcao === 0 ? 'V' : 'F'}</span>
                  <span>{label}</span>
                </button>
              );
            })}
        </div>

        {/* Resultado */}
        {respondido && (
          <div className={`${styles.resultado} ${acertou ? styles.resultadoAcerto : styles.resultadoErro}`}>
            {timeout ? (
              <>
                ⏰ Tempo esgotado!
                <span>A resposta era: <strong>
                  {questao.tipo === 'multipla'
                    ? `${LETRAS[questao.correta]}) ${questao.alternativas[questao.correta]}`
                    : questao.correta === 0 ? 'Verdadeiro' : 'Falso'}
                </strong></span>
              </>
            ) : acertou ? (
              <>🎉 Correto! +1 ponto para {nomeTime}!</>
            ) : (
              <>
                ❌ Incorreto!
                <span>A resposta era: <strong>
                  {questao.tipo === 'multipla'
                    ? `${LETRAS[questao.correta]}) ${questao.alternativas[questao.correta]}`
                    : questao.correta === 0 ? 'Verdadeiro' : 'Falso'}
                </strong></span>
              </>
            )}
          </div>
        )}

        {/* Botão continuar */}
        {respondido && (
          <button
            className={`${styles.btnFechar} ${acertou ? styles.btnFecharAcerto : styles.btnFecharErro}`}
            onClick={() => onResponder(acertou)}
          >
            {acertou ? '🎊 Continuar (+1 ponto)' : '➡️ Continuar'}
          </button>
        )}
      </div>
    </div>
  );
}
