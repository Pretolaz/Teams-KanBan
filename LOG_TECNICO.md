# Log Técnico de Implementações - TeamsFlow Pro

Este documento registra todas as interações assertivas, correções e novas funcionalidades implementadas no projeto, detalhando a abordagem técnica utilizada para cada acerto.

## 📅 [2026-02-18] - Glassmorphism + Personalização de Colunas

### 🎨 Melhorias Visuais
1.  **Glassmorphism no Kanban**: O fundo do painel agora é semitransparente com `backdrop-filter: blur(18px)`, deixando o Teams visível por trás. As colunas e cards também ganharam camadas de blur próprias para um efeito de vidro em profundidade.
2.  **Personalização de Colunas**: As colunas "A Fazer", "Em Progresso" e "Concluído" agora têm um botão ✏️ que abre um painel inline para editar:
    - **Nome** da coluna (até 20 caracteres).
    - **Cor** do título, escolhida em uma paleta de 12 cores.
    - As preferências são salvas em `chrome.storage.local` (chave `colPrefs`) e restauradas automaticamente.

### 📁 Arquivos Modificados
- `sidebar.css`: Glassmorphism (`.overlay-container`, `.column`, `.card`) + estilos do painel de edição.
- `sidebar.html`: Botão ✏️ e `data-col-id` nas colunas personalizáveis.
- `kanban.js`: Lógica de `loadColPrefs`, `saveColPrefs`, `applyColPrefs`, `openEditPanel`.

---

## 📅 [2026-02-17] - Smart Suggestions & Backslash Enforcement (v53.5)

### 🛠️ Melhorias de UX
1.  **Padronização de Gatilho**: A interface agora força o uso de `\` como prefixo para gatilhos, alinhando a instrução do usuário e evitando confusão com comandos do Teams (`/`).
2.  **Pop-up Inteligente**: Implementado um menu de sugestões ("IntelliSense") que aparece **acima** do cursor ao digitar `\`.
    - Filtra as respostas em tempo real.
    - Permite seleção por clique.
    - Preserva a lógica de expansão robusta da v53.4.

### 📁 Arquivos Modificados
- `sidebar.html/js`: Instruções e validação de `\`.
- `content.js/css`: Lógica e estilo do pop-up de sugestões.

---

## 📅 [2026-02-17] - O Retorno do Rei (v53.4 - Classic + Regex Fix)

### 🛠️ Problema
As tentativas de otimização v53.1, v53.2 e v53.3 introduziram instabilidades ao tentar remover o delay de 10ms ou usar APIs de seleção/deleção complexas. A versão v53 original era a mais estável, mas falhava com gatilhos de barra invertida (`\`) apenas por um erro de Regex.

### ✅ Solução Técnica
1.  **Reversão para v53**: O código foi revertido para a lógica exata da v53 (Seleção Range Padrão + Delay de 10ms + Atomic Paste).
2.  **Backslash Fix Isolado**: A ÚNICA alteração aplicada sobre a v53 foi na construção da Regex, escapando o caractere `\` corretamente.
    ```javascript
    trigger.split('').map(c => c === '\\' ? '\\\\' : c).join('\\u200B*')
    ```
    Isso deve garantir a estabilidade da v53 original com o suporte a novos gatilhos.

### 📁 Arquivos Modificados
- `content.js`: Reversão e Correção Pontual.

---

## 📅 [2026-02-17] - A Maldição da Barra Invertida (v53.3)

### 🛠️ Problema
Ao tentar mudar os gatilhos de `/` para `\`, a extensão parou de expandir. O motivo era a construção da Regex: `new RegExp("nb")` funciona, mas `new RegExp("\b")` é interpretado como caractere de controle (backspace) ou word boundary, quebrando a detecção.

### ✅ Solução Técnica
1.  **Regex Escaping**: A função de criação da Regex foi atualizada para escapar explicitamente a barra invertida (`\\`).
    ```javascript
    trigger.split('').map(c => c === '\\' ? '\\\\' : c).join('\\u200B*')
    ```
    Isso garante que um gatilho `\t` seja convertido na Regex `\\t` (literal backslash + t) e não no caractere TAB.

### 📁 Arquivos Modificados
- `content.js`: Ajuste na linha de Regex.

---

## 📅 [2026-02-17] - Refinamento da Seleção (v53.1 - Instant Atomic Paste)

### 🛠️ Problema (v53)
Embora a v53 funcionasse para alguns gatilhos (`/b`), outros (`/t`) falhavam, resultando em concatenação (`/tBoa tarde`) e erros de `selectionchange`. O diagnóstico revelou que o delay de 10ms permitia ao Teams reverter a seleção antes da colagem, e o método `addRange` entrava em conflito com o ciclo de vida do React.

### ✅ Solução Técnica (v53.1)
1.  **Instant Selection (Zero Delay)**: Removemos o `setTimeout(10)`. A colagem deve ocorrer no mesmo ciclo de execução da seleção para evitar interferência do editor.
2.  **Robust Selection API**: Adotamos `sel.setBaseAndExtent()` (quando disponível) no lugar de `removeAllRanges/addRange`. Este método é nativo do WebKit/Blink e manipula a seleção como uma transação única, reduzindo a chance de erros de `selectionchange`.
3.  **Fallback com TreeWalker**: O mecanismo de fallback foi reescrito para usar `TreeWalker` e encontrar o nó de texto exato do gatilho, em vez de assumir cegamente `firstChild`, o que causava falhas silenciosas.

### 📁 Arquivos Modificados
- `content.js`: Refatoração para v53.1.

---

## 📅 [2026-02-16] - O Dilema da Seleção e o Atomic Paste (v53 - DEFINITIVO)

### 🛠️ Problema
A estratégia de deleção manual via DOM (v54) falhou porque o CKEditor restaura o texto deletado ou não atualiza seu modelo em tempo hábil para a verificação, gerando erro de timeout. Já a tentativa inicial de comandos nativos (v52) era bloqueada.

### ✅ Solução Técnica (v53 - Atomic Paste)
1.  **Mudança de Paradigma**: Em vez de lutar com a deleção manual, voltamos a confiar no evento `paste` sobre uma seleção.
2.  **Atomic Paste**: A lógica seleciona o gatilho e despacha imediatamente um `ClipboardEvent('paste')`. 
3.  **Por que funciona?**: Diferente de comandos manuais ou scripts de deleção, o evento `paste` vindo de uma interação do usuário (simulada) é tratado pelo CKEditor como uma transação atômica prioritária: "Substitua o que está selecionado pelo buffer". Isso garante a sincronia imediata do Model e da View, sem gatilhos residuais.

### 📁 Arquivos Modificados
- `content.js`: Arquitetura v53 (Atomic Paste) restaurada.

---

## 📅 [2026-02-16] - O Dilema do Ghost Model (v52)

---

## 📅 [2026-02-16] - O Dilema do Ghost Model (v52)

---

## 📅 [2026-02-16] - A Batalha Final do Gatilho Residual (v44 - v51)

### 🛠️ Problema
O CKEditor 5 do Microsoft Teams V2 provou ser um dos editores mais agressivos do mercado. Ele mantém um buffer interno de sincronização que restaura o gatilho (ex: `/b`) mesmo após deleções bem-sucedidas no DOM, resultando no bug `/bBom dia!` ou na duplicação da resposta rápida.

### ✅ Solução Definitiva: A Estratégia "The One-Shot" (v51)
Após 51 iterações de testes reais, chegamos à arquitetura de substituição definitiva que vence os buffers do Teams e do React:

1.  **Proteção de Gatilho Cirúrgico (Regex)**: O script agora utiliza Regex para identificar o gatilho exato antes da posição do cursor, ignorando caracteres invisíveis (`\u200B`) que o Teams injeta.
2.  **Trava de Segurança (Surgical Lock)**: Implementado um bloqueio temporal de 2 segundos por gatilho. Isso impede que eventos de `input` residuais disparem expansões em cascata, eliminando a duplicidade de respostas.
3.  **Wipe Total (Limpeza Química)**: Ao detectar o match, o script executa um "hard reset" no editor:
    *   `selectAllChildren(el)` + `document.execCommand('delete')` para avisar o modelo oficial do editor que o campo está vazio.
    *   Limpeza física forçada do DOM (`innerHTML`, `textContent` e remoção de nós filhos).
    *   Notificação de vácuo ao React via disparo manual de eventos de `input`.
4.  **Protocolo de Vácuo (Espera do React)**: Um delay de 60ms é inserido após o wipe. Esse tempo é o necessário para o ciclo de vida do React do Teams processar que o campo está nulo, impedindo que ele "mescle" o novo texto com o antigo.
5.  **Inserção de Via Única (The One-Shot)**: A resposta é injetada **exatamente uma vez** via simulação de colagem (`ClipboardEvent('paste')`).
6.  **Lock de Modelo (Composition End)**: O ciclo é encerrado com `CompositionEvent('compositionend')`, o que "carimba" a transação no modelo de dados do CKEditor e habilita o botão de "Enviar" nativo.

### 📁 Arquivos Modificados
- `content.js`: Refatoração central da lógica de expansão.

### 🚀 Resultado
- **Status**: ✅ **FINALIZADO E ESTÁVEL**. Venceu os desafios de residual de gatilho, duplicação de texto e ativação do botão de envio.

---

## 📅 [2026-02-16] - Correção do Botão "Resetar Quadros" e Erro de Contexto

### 🛠️ Problema
O botão de reset não funcionava e gerava o erro `Uncaught Error: Extension context invalidated`.

### ✅ Solução Técnica
1.  **Validação de Contexto**: Função `isContextValid()` verifica a existência de `chrome.runtime.id`.
2.  **Tratamento de Exceções**: Blocos `try/catch` para capturar erros fatais de contexto na persistência de dados.
3.  **Feedback ao Usuário**: Alerta solicitando Refresh caso a conexão seja perdida.

### 📁 Arquivos Modificados
- `kanban.js`: Proteção de contexto e lógica de reset.

---

## 📅 [2026-02-14] - Correção da Navegação GOTO_CHAT (Teams V2)

### 🛠️ Problema
A navegação automática para chats a partir do Kanban falhava devido a mudanças nos seletores do Microsoft Teams V2 (Fluent UI).

### ✅ Solução Técnica
1.  **Seletores Elásticos**: Atualização para buscar elementos baseados em classes Fluent UI (`.fui-ListItem`, `.fui-TreeItem`) e atributos `data-tid`.
2.  **Simulação de Pressão Nativa**: Implementação da sequência de eventos `mousedown` -> `mouseup` -> `click`. O Teams ignora cliques sintéticos isolados; ele precisa da sequência completa de interação do mouse para navegar.

### 📁 Arquivos Modificados
- `content.js`: Atualização das funções `getRecentChats` e `navigateToChat`.
