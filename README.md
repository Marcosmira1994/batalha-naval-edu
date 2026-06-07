# ⚓ Batalha Naval Educacional

Jogo educacional de Batalha Naval para uso em sala de aula, com sistema de perguntas e respostas integrado.

## Requisitos

- Node.js 18+
- npm 9+

## Instalação

```bash
npm install
```

## Executar em desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:5173

## Gerar build para produção

```bash
npm run build
npm run preview
```

---

## Como usar

### 1. Tela do Professor (Configuração)

**Aba "Posicionamento dos Navios"**
- Arraste os navios do painel lateral para o grid 10×10
- Use os botões Horizontal / Vertical para escolher a orientação antes de arrastar
- Clique em um navio já posicionado no grid para selecioná-lo e usar as opções de Girar ou Remover
- O botão "Resetar posições" remove todos os navios do grid

**Navios disponíveis:**
| Navio | Tamanho | Quantidade |
|-------|---------|------------|
| Porta-aviões 🛳️ | 5 casas | 1 |
| Encouraçado ⚓ | 4 casas | 1 |
| Contratorpedeiro 🚢 | 3 casas | 2 |
| Submarino 🤿 | 2 casas | 2 |

**Aba "Cadastro de Questões"**
- Preencha o formulário e clique em "Adicionar questão"
- Tipos suportados: Múltipla Escolha (A/B/C/D) e Verdadeiro/Falso
- Edite ou exclua questões pela lista à direita
- Recomendado: mínimo de 6 questões

### 2. Iniciar o Jogo

O botão "Iniciar Jogo" fica disponível quando:
- Todos os 6 navios estão posicionados no grid
- Pelo menos 1 questão foi cadastrada

### 3. Tela de Jogo

- **Time Azul** e **Time Vermelho** se alternam
- Cada time tem **3 bombas por rodada**
- Clique em uma célula do oceano para atacar
- 💦 Água = miss, turno continua
- 💥 Acerto = abre modal com uma questão
  - Resposta correta dentro de 30s: **+1 ponto**
  - Resposta incorreta ou timeout: 0 pontos
- Quando todas as casas de um navio são acertadas → **navio afundado!**

### 4. Fim de Jogo

Aparece quando todos os navios são afundados. Exibe:
- Vencedor com animação de confetes
- Placar final
- Estatísticas da partida
- Opções: Jogar Novamente (mantém questões) ou Nova Configuração

---

## Estrutura do projeto

```
src/
├── App.jsx                    — Raiz: gerencia telas e estado global
├── components/
│   ├── TelaConfiguracao.jsx   — Tela do professor (abas)
│   ├── GridConfig.jsx         — Grid com drag-and-drop de navios
│   ├── FormQuestao.jsx        — Formulário e lista de questões
│   ├── TelaJogo.jsx           — Tela principal do jogo
│   ├── GridJogo.jsx           — Grid do oceano durante o jogo
│   ├── PainelPlacar.jsx       — Painel lateral (navios, turno, histórico)
│   ├── ModalQuestao.jsx       — Modal com questão e timer
│   └── TelaFim.jsx            — Tela de fim de jogo
```
