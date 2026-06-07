// sons.js — Sons procedurais via Web Audio API (sem arquivos externos)

let ctx = null;

function getCtx() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Gera um buffer de ruído branco com duração em segundos
function criarRuido(ac, duracao) {
  const bufSize = Math.floor(ac.sampleRate * duracao);
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  return src;
}

// ── 1. Tiro de canhão ─────────────────────────────────────────────────────────
export function som_tiro() {
  const ac = getCtx(); if (!ac) return;
  const now = ac.currentTime;

  const ruido = criarRuido(ac, 0.8);
  const filtro = ac.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.setValueAtTime(400, now);
  filtro.frequency.exponentialRampToValueAtTime(80, now + 0.4);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(1.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

  ruido.connect(filtro);
  filtro.connect(gain);
  gain.connect(ac.destination);
  ruido.start(now);
  ruido.stop(now + 0.8);
}

// ── 2. Água (miss) — projétil caindo no oceano ────────────────────────────────
export function som_agua() {
  try {
    const ac = getCtx(); if (!ac) return;
    const agora = ac.currentTime;

    // Camada 1: Impacto inicial — transiente seco e grave (~0.08s)
    const bufImpacto = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.08), ac.sampleRate);
    const dadosImpacto = bufImpacto.getChannelData(0);
    for (let i = 0; i < dadosImpacto.length; i++) dadosImpacto[i] = Math.random() * 2 - 1;
    const srcImpacto = ac.createBufferSource();
    srcImpacto.buffer = bufImpacto;

    const filtroImpacto = ac.createBiquadFilter();
    filtroImpacto.type = 'lowpass';
    filtroImpacto.frequency.value = 300;

    const gainImpacto = ac.createGain();
    gainImpacto.gain.setValueAtTime(1.2, agora);
    gainImpacto.gain.exponentialRampToValueAtTime(0.001, agora + 0.08);

    srcImpacto.connect(filtroImpacto);
    filtroImpacto.connect(gainImpacto);
    gainImpacto.connect(ac.destination);
    srcImpacto.start(agora);

    // Camada 2: Sploosh principal — ruído filtrado com pitch caindo (~0.8s)
    const bufSploosh = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.8), ac.sampleRate);
    const dadosSploosh = bufSploosh.getChannelData(0);
    for (let i = 0; i < dadosSploosh.length; i++) dadosSploosh[i] = Math.random() * 2 - 1;
    const srcSploosh = ac.createBufferSource();
    srcSploosh.buffer = bufSploosh;

    const filtroSploosh = ac.createBiquadFilter();
    filtroSploosh.type = 'lowpass';
    filtroSploosh.frequency.setValueAtTime(800, agora + 0.05);
    filtroSploosh.frequency.exponentialRampToValueAtTime(150, agora + 0.8);

    const gainSploosh = ac.createGain();
    gainSploosh.gain.setValueAtTime(0.001, agora + 0.04);
    gainSploosh.gain.linearRampToValueAtTime(0.9, agora + 0.1);
    gainSploosh.gain.exponentialRampToValueAtTime(0.001, agora + 0.9);

    srcSploosh.connect(filtroSploosh);
    filtroSploosh.connect(gainSploosh);
    gainSploosh.connect(ac.destination);
    srcSploosh.start(agora + 0.04);

    // Camada 3: Borbulhas residuais — 6 a 8 osciladores curtos com delay aleatório
    const numBolhas = 6 + Math.floor(Math.random() * 3);
    for (let b = 0; b < numBolhas; b++) {
      const delay    = 0.15 + Math.random() * 0.6;
      const freq     = 200  + Math.random() * 400;
      const duracao  = 0.04 + Math.random() * 0.1;

      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, agora + delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, agora + delay + duracao);

      const gainBolha = ac.createGain();
      gainBolha.gain.setValueAtTime(0.001, agora + delay);
      gainBolha.gain.linearRampToValueAtTime(0.15, agora + delay + 0.01);
      gainBolha.gain.exponentialRampToValueAtTime(0.001, agora + delay + duracao);

      osc.connect(gainBolha);
      gainBolha.connect(ac.destination);
      osc.start(agora + delay);
      osc.stop(agora + delay + duracao + 0.05);
    }
  } catch {
    // silencioso — browser sem suporte a AudioContext
  }
}

// ── 3. Explosão (acerto em navio) ─────────────────────────────────────────────
export function som_explosao() {
  const ac = getCtx(); if (!ac) return;
  const now = ac.currentTime;

  // Ruído grave com decaimento longo
  const ruido = criarRuido(ac, 1.2);
  const filtro = ac.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.setValueAtTime(600, now);
  filtro.frequency.exponentialRampToValueAtTime(50, now + 1.2);
  const g1 = ac.createGain();
  g1.gain.setValueAtTime(1.8, now);
  g1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
  ruido.connect(filtro);
  filtro.connect(g1);
  g1.connect(ac.destination);
  ruido.start(now);
  ruido.stop(now + 1.2);

  // Clique de impacto inicial
  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, now);
  osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
  const g2 = ac.createGain();
  g2.gain.setValueAtTime(0.8, now);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc.connect(g2);
  g2.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.3);
}

// ── 4. Navio afundado ─────────────────────────────────────────────────────────
export function som_afundou() {
  const ac = getCtx(); if (!ac) return;
  const now = ac.currentTime;

  // Explosão grave e longa
  const ruido = criarRuido(ac, 2.5);
  const filtro = ac.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.setValueAtTime(800, now);
  filtro.frequency.exponentialRampToValueAtTime(40, now + 2.5);
  const g1 = ac.createGain();
  g1.gain.setValueAtTime(2.0, now);
  g1.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
  ruido.connect(filtro);
  filtro.connect(g1);
  g1.connect(ac.destination);
  ruido.start(now);
  ruido.stop(now + 2.5);

  // Metal rangendo em camadas
  [220, 233, 196].forEach((freq, i) => {
    const osc = ac.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now + 0.3 + i * 0.15);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 1.5);
    const g = ac.createGain();
    g.gain.setValueAtTime(0, now + 0.3 + i * 0.15);
    g.gain.linearRampToValueAtTime(0.3, now + 0.4 + i * 0.15);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(now + 0.3 + i * 0.15);
    osc.stop(now + 2.0);
  });

  // Borbulhas afundando
  const ruido2 = criarRuido(ac, 1.5);
  const filtro2 = ac.createBiquadFilter();
  filtro2.type = 'bandpass';
  filtro2.frequency.setValueAtTime(2000, now + 1.0);
  filtro2.frequency.exponentialRampToValueAtTime(400, now + 2.5);
  filtro2.Q.value = 2;
  const g2 = ac.createGain();
  g2.gain.setValueAtTime(0.5, now + 1.0);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
  ruido2.connect(filtro2);
  filtro2.connect(g2);
  g2.connect(ac.destination);
  ruido2.start(now + 1.0);
  ruido2.stop(now + 2.5);
}

// ── 5. Acerto na questão ──────────────────────────────────────────────────────
export function som_acerto_questao() {
  const ac = getCtx(); if (!ac) return;
  const now = ac.currentTime;

  // Dó-Mi-Sol ascendente
  [261.63, 329.63, 392.00].forEach((freq, i) => {
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ac.createGain();
    const t = now + i * 0.18;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  });
}

// ── 6. Erro na questão ────────────────────────────────────────────────────────
export function som_erro_questao() {
  const ac = getCtx(); if (!ac) return;
  const now = ac.currentTime;

  // Si-Sol descendente com onda quadrada
  [246.94, 196.00].forEach((freq, i) => {
    const osc = ac.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    const g = ac.createGain();
    const t = now + i * 0.22;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.25, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  });
}

// ── 7. Troca de turno ─────────────────────────────────────────────────────────
export function som_vez_do_time() {
  const ac = getCtx(); if (!ac) return;
  const now = ac.currentTime;

  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.setValueAtTime(550, now + 0.12);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.35, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.3);
}
