/**
 * Potencial máximo que um time ainda pode atingir (upper bound teórico).
 * Usado pelo PainelPlacar para o indicador visual.
 */
export function calcularPotencialMaximo(pontosAtual, naviosVivos) {
  const celulasRestantes = naviosVivos
    .filter(n => !n.afundado)
    .reduce((total, n) => total + (n.celulas.length - n.acertos), 0);
  const naviosRestantes = naviosVivos.filter(n => !n.afundado).length;
  return pontosAtual + celulasRestantes * 2 + naviosRestantes * 3;
}

/**
 * Verifica se algum time não pode mais matematicamente alcançar o adversário.
 *
 * @param {object} placarAtual  - { azul: { pontos }, vermelho: { pontos } }
 * @param {Array}  naviosVivos  - array com .afundado, .celulas, .acertos
 * @returns {{ fimAntecipado, vencedor, pontosVencedor, pontosPercedor, maxPossivel }}
 */
export function verificarFimAntecipado(placarAtual, naviosVivos) {
  const pontosAzul     = placarAtual.azul.pontos;
  const pontosVermelho = placarAtual.vermelho.pontos;

  const celulasNaoAtingidas = naviosVivos
    .filter(n => !n.afundado)
    .reduce((total, n) => total + (n.celulas.length - n.acertos), 0);
  const naviosNaoAfundados = naviosVivos.filter(n => !n.afundado).length;

  // Máximo que QUALQUER time ainda pode ganhar (ambos compartilham o mesmo tabuleiro)
  const maxGanho = celulasNaoAtingidas * 1 + naviosNaoAfundados * 3;

  const maxFinalAzul     = pontosAzul     + maxGanho;
  const maxFinalVermelho = pontosVermelho + maxGanho;

  // Vermelho não consegue mais alcançar o azul (diferença > 1 ponto)
  if (maxFinalVermelho < pontosAzul - 1) {
    return {
      fimAntecipado:  true,
      vencedor:       'azul',
      pontosVencedor: pontosAzul,
      pontosPercedor: pontosVermelho,
      maxPossivel:    maxFinalVermelho,
    };
  }

  // Azul não consegue mais alcançar o vermelho (diferença > 1 ponto)
  if (maxFinalAzul < pontosVermelho - 1) {
    return {
      fimAntecipado:  true,
      vencedor:       'vermelho',
      pontosVencedor: pontosVermelho,
      pontosPercedor: pontosAzul,
      maxPossivel:    maxFinalAzul,
    };
  }

  return { fimAntecipado: false };
}
