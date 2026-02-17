# Documentação Técnica de Engenharia Reversa e Seletores - TeamsFlow Pro

Este documento serve como guia de manutenção para localizar e ajustar seletores e lógicas caso a interface do Microsoft Teams (Web Corporativo) mude.

---

## ⌨️ 1. Respostas Rápidas (Text Expansion)

### Desafio Técnico (CKEditor 5)
O Teams utiliza o CKEditor 5, que gerencia o estado do texto através de um modelo interno (React/Redux). Edições diretas no DOM ou substituições parciais são frequentemente revertidas ou duplicadas devido ao buffer de sincronização do editor.

### Como funciona a substituição (v51 - Definitiva):
- **Detecção Cirúrgica**: O script utiliza Regex para identificar o gatilho ignorando caracteres invisíveis (`\u200B`). Um bloqueio temporal de 2 segundos (Surgical Lock) impede disparos múltiplos indesejados.
- **A Estratégia "The One-Shot"**:
  1.  **Limpeza Química**: Ao detectar o gatilho, o script realiza um *Hard Reset* no campo: usa `selectAllChildren` + `document.execCommand('delete')` para informar ao modelo oficial do editor que o campo está vazio, seguido de limpeza física profunda do DOM (`innerHTML = ''`).
  2.  **Protocolo de Vácuo**: Um delay de 60ms é respeitado para que o ciclo de vida do React do Teams valide o estado nulo do campo.
  3.  **Inserção de Via Única**: A resposta é injetada via simulação de colagem (`ClipboardEvent('paste')`). Esta ação é detectada pelo Teams como uma entrada genuína do usuário.
  4.  **Lock de Modelo**: O disparo de `CompositionEvent('compositionend')` sela a transação no modelo de dados, impedindo restaurações residuais e ativando o botão de "Enviar".

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

---

## 👤 3. Interação com o Usuário (UI Injection)

### Botão Flutuante (TF):
- Injetado diretamente no `document.body` com `id="tf-trigger"`.
- Possui `zIndex: 9999999` para flutuar sobre todos os elementos do Teams.

### Sidebar (Iframe):
- Injetado como um `<iframe>` com `id="tf-iframe"`.
- A comunicação entre a Sidebar e o Teams é feita via `window.postMessage`, permitindo que a Sidebar (extensão) peça ações ao `content.js` (que tem acesso ao DOM do Teams).

---

## 🛠️ Guia de Ajuste Rápido
Se o Teams mudar, verifique no inspetor de elementos:
1. O botão de enviar ("setinha") só aparece depois da digitação? **Ajuste `syncToEditor`**.
2. O clique no Kanban não abre o chat? **Verifique os seletores em `navigateToChat`**.
3. O gatilho não é detectado? **Verifique se o nó de texto ativo mudou de estrutura no `handleExpansion`**.
