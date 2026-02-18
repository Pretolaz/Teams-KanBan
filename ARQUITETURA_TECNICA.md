# Documentação Técnica de Engenharia Reversa e Seletores - TeamsFlow Pro

Este documento serve como guia de manutenção para localizar e ajustar seletores e lógicas caso a interface do Microsoft Teams (Web Corporativo) mude.

---

## ⌨️ 1. Respostas Rápidas (Text Expansion)

### Desafio Técnico (CKEditor 5)
O Teams utiliza o CKEditor 5, que gerencia o estado do texto através de um modelo interno (React/Redux). Edições diretas no DOM ou substituições parciais são frequentemente revertidas ou duplicadas devido ao buffer de sincronização do editor.

### Melhorias de Usabilidade (v53.5 - Smart Suggestions):
1.  **Padronização de Gatilho (`\`)**:
    - **Motivação**: Evitar conflito com os comandos de slash (`/`) nativos do Teams.
    - **Implementação**: A interface da sidebar agora força e valida o prefixo `\` no cadastro.
2.  **Sugestões Inteligentes (IntelliSense)**:
    - **Detecção**: Um listener de `input` monitora a palavra atual sendo digitada. Se começar com `\`, dispara a busca.
    - **Interface**:
        - Pop-up flutuante posicionado **acima** do cursor (cálculo de `rect.top - height`).
        - Lista filtrada em tempo real baseada no cache local (`responsesCache`).
    - **Integração**: Ao selecionar uma sugestão, o script simula a deleção do texto parcial e insere o gatilho completo, aproveitando o mesmo pipeline de expansão robusto da v53.4.

### Como funciona a substituição (v53.4 - Classic + Regex Fix):
- **Detecção Cirúrgica**: O script utiliza Regex com escape específico para suporte a barra invertida (`\`), garantindo que gatilhos como `\b` sejam tratados corretamente como texto e não como caracteres especiais.
- **A Estratégia "Classic Atomic Paste"**:
  1.  **Seleção Clássica**: Retornamos ao uso do `document.createRange()` padrão, que provou ser o mais compatível com o Teams.
  2.  **Delay Estratégico**: Um pequeno pause de 10ms é respeitado após a seleção e antes da colagem. Isso é crucial para que o ciclo de vida do React do Teams reconheça e "trave" a seleção.
  3.  **Atomic Paste**: Despachamos o `ClipboardEvent('paste')` contendo a resposta.
  4.  **Confiabilidade**: Diferente das tentativas de "Instant Paste" que causaram race conditions, esta abordagem dá tempo ao editor para se preparar, garantindo a substituição limpa.

### Pontos de Manutenção:
- **Bloqueio Temporal**: A variável `lastTriggerTime` gerencia o tempo entre expansões.
- **Classe do Editor**: Atualmente detectado via `[contenteditable="true"]` e `data-tid="ckeditor"`.
- **Nó de Texto**: A lógica baseia-se em `Node.TEXT_NODE`. Estruturas de editor complexas (Shadow DOM) podem exigir revisão desta detecção.

---

## 📋 2. Quadro Kanban (Data Scraping & Navigation)

### Localização dos Chats:
O script vasculha a barra lateral esquerda em busca dos nomes das conversas.

- **Seletores Atuais**:
  - Títulos: `span[id^="title-chat-list-item_"]`, `[data-tid*="chat-list-item-title"]`.
  - Container do Item: Busca o ancestral mais próximo com as classes `.fui-ListItem` ou `.fui-TreeItem`, ou o `role="row"` / `role="treeitem"`.

### Detecção de Não Lidas:
- **Lógica**: Busca por elementos com classes que contenham `unread`, badges de presença ou verifica se o `fontWeight` do título é maior ou igual a 600 (Bold).

### Navegação Automática:
- **Como funciona**: Quando você clica em um card no Kanban, o script envia o nome do chat para a página pai. O `content.js` localiza o elemento na barra lateral e simula uma sequência de eventos: `mousedown` -> `mouseup` -> `click`.
- **Por que essa sequência?** O Teams ignora cliques sintéticos simples. Ele precisa sentir a pressão e liberação do mouse para acionar a navegação do React.

### Personalização de Colunas:
- **Trigger**: Botão `✏️` (`.col-edit-btn`) no cabeçalho de cada coluna personalizável.
- **Painel Inline**: Criado dinamicamente via JS e inserido antes da `.card-list` da coluna.
- **Armazenamento**: `chrome.storage.local`, chave `colPrefs`. Estrutura:
  ```json
  {
    "colPrefs": {
      "todo":  { "name": "A Fazer",      "color": "#673AB7" },
      "doing": { "name": "Em Progresso", "color": "#FF9800" },
      "done":  { "name": "Concluído",    "color": "#4CAF50" }
    }
  }
  ```
- **Aplicação**: A função `applyColPrefs()` atualiza o `textContent` e `style.color` do `h2` de cada coluna, e adiciona `borderTop` colorido no container da coluna.
- **Coluna Excluída**: `col-recent` (Chats Recentes) não possui o botão de edição.

---

## 👤 3. Interação com o Usuário (UI Injection)

### Botão Flutuante (TF):
- Injetado diretamente no `document.body` com `id="tf-trigger"`.
- Possui `zIndex: 9999999` para flutuar sobre todos os elementos do Teams.

### Sidebar (Iframe):
- Injetado como um `<iframe>` com `id="tf-iframe"`.
- A comunicação entre a Sidebar e o Teams é feita via `window.postMessage`, permitindo que a Sidebar (extensão) peça ações ao `content.js` (que tem acesso ao DOM do Teams).

---

## 🔍 4. Mapeamento de Seletores e Interações (DOM Hooks)

Esta seção lista os elementos cruciais do DOM do Teams que o script captura. **Se o Teams atualizar e algo parar de funcionar, comece verificando estes seletores:**

### A. Editor de Texto (Onde você digita)
O script monitora eventos de `input` e `keyup` em qualquer elemento que corresponda a:
- Atributo `contenteditable="true"`
- Atributo `data-tid="ckeditor"`
- *Nota*: O script sobe a árvore DOM (`el.closest`) procurando um container editável se o evento ocorrer num nó filho.

### B. Lista de Chats (Sidebar Esquerda)
Para popular o Kanban, o script varre o DOM buscando:
1.  **Título da Conversa (Nome do Chat)**:
    - `span[id^="title-chat-list-item_"]` (Padrão V1/V2 misto)
    - `[data-tid*="chat-list-item-title"]` (Atributo de teste confiável)
    - `.fui-TreeItem__content` (Fluent UI moderno)
    - `[role="treeitem"]` (Acessibilidade)

2.  **Container do Item de Chat (O elemento clicável)**:
    - Buscamos o pai (`closest`) que tenha: `[role="row"]`, `[role="listitem"]`, `.fui-ListItem` ou `.fui-TreeItem`.
    - *Ação*: Disparamos `mousedown`, `mouseup` e `click` neste container para abrir o chat.

3.  **Indicador de Não Lido (Unread Badge)**:
    - `.fui-PresenceBadge` (Badge de status/notificação)
    - `[aria-label*="não lida"]` ou `[aria-label*="unread"]` (Acessibilidade)
    - Fallback visual: Verificamos se o `fontWeight` do título é `>= 600` (Negrito).

### C. Pop-up de Sugestões (Injetado pelo Script)
- **ID**: `#tf-suggestion-box` (Container absoluto)
- **Posicionamento**: Calculado via `getBoundingClientRect()` do cursor de texto (Range).
  - Topo: `rect.top + window.scrollY - boxHeight - 5` (Acima do cursor)
  - Esquerda: `rect.left + window.scrollX`

---

## 🛠️ Guia de Ajuste Rápido
Se o Teams mudar, verifique no inspetor de elementos por estas classes/atributos. Frequentemente a Microsoft muda os nomes das classes (ex: de `.fui-ListItem` para algo hashado como `.abc-123`), mas mantém os atributos `data-tid` ou `role`. **Priorize seletores baseados em atributos (`[]`) ao invés de classes (`.`)**.
