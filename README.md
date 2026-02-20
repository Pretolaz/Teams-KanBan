# Teams KanBan Flow — Extensão Chrome para Microsoft Teams

> **Kanban visual + Respostas Rápidas diretamente no Microsoft Teams Web.**

---

## ✨ Funcionalidades

### 📋 Quadro Kanban
- Visualize seus chats do Teams como cards em um quadro Kanban com 3 colunas personalizáveis.
- **Arraste** chats da coluna "Chats Recentes" para as colunas do quadro.
- **Clique** em um card para navegar diretamente para aquela conversa no Teams.
- **Semáforo de status** em cada card: 🔴 Urgente · 🟡 Atenção · 🟢 No Prazo.
- **Notas** por card: adicione um lembrete rápido de até 50 caracteres.
- **Remova** cards do quadro com o botão `×` (o chat volta para "Chats Recentes").
- **Personalize** o nome e a cor de cada coluna com o botão ✏️.

### ⌨️ Respostas Rápidas (Text Expansion)
- Cadastre atalhos com prefixo `\` (ex: `\bomdia`) e um texto longo.
- No chat do Teams, digite o atalho e pressione **Espaço** — o texto é expandido automaticamente.
- **Pop-up IntelliSense**: ao digitar `\`, um menu aparece **acima do cursor** com sugestões filtradas em tempo real.
- Suporte a quebras de linha e formatação rica (via CKEditor 5).

### 🎨 Interface
- Design **glassmorphism**: fundo semitransparente com blur, deixando o Teams visível por trás.
- Atalho de teclado **`Alt+K`** para abrir/fechar o painel.
- Botão flutuante **TKF** com tooltip `Alt+K` ao passar o mouse.

---

## 🚀 Instalação (Modo Desenvolvedor)

1. Abra o Google Chrome e acesse `chrome://extensions/`.
2. Ative o **Modo do desenvolvedor** (canto superior direito).
3. Clique em **Carregar sem compactação** (*Load unpacked*).
4. Selecione a **pasta raiz deste projeto** (onde está o `manifest.json`).
5. Acesse o [Microsoft Teams Web](https://teams.microsoft.com/).
6. O botão **TF** aparecerá no canto inferior direito da tela.

---

## 🗂️ Estrutura de Arquivos

```
Teams-KanBan/
├── manifest.json          # Configuração da extensão Chrome (MV3)
├── index.html             # Popup da extensão (ícone da barra do Chrome)
├── content.js             # Script injetado no Teams: navegação, expansão, popup
├── content.css            # Estilos do botão flutuante e popup de sugestões
├── sidebar.html           # Interface do painel principal (Kanban + Respostas)
├── sidebar.css            # Estilos do painel
├── sidebar.js             # Lógica da sidebar: navegação entre views, salvar respostas
├── kanban.js              # Lógica do Kanban (utilizado pela sidebar.html)
├── icons/                 # Ícones da extensão (16, 32, 48, 128px)
├── README.md              # Este arquivo
├── LOG_TECNICO.md         # Histórico cronológico de implementações e correções
└── ARQUITETURA_TECNICA.md # Guia de manutenção: seletores DOM, arquitetura, decisões
```

---

## 💾 Armazenamento de Dados

Todos os dados são salvos **localmente** via `chrome.storage.local`. Nenhum dado é enviado a servidores externos.

| Chave       | Conteúdo                                      |
|-------------|-----------------------------------------------|
| `cards`     | Array de cards do Kanban (nome, coluna, nota, status) |
| `responses` | Array de respostas rápidas (trigger, texto)   |
| `colPrefs`  | Preferências de nome e cor das colunas        |

---

## ⌨️ Atalhos

| Atalho  | Ação                        |
|---------|-----------------------------|
| `Alt+K` | Abre/fecha o painel Kanban  |
| `\atalho` + `Espaço` | Expande a resposta rápida |

---

## 🔧 Manutenção e Compatibilidade

O Teams atualiza sua interface frequentemente. Se algo parar de funcionar:

1. **Clique no card não abre o chat?**
   Verifique se o atributo `data-inp="simple-collab-unified-chat-switch"` ainda existe nos itens da lista de chats (inspecione o elemento).

2. **Chats não aparecem no Kanban?**
   Verifique os seletores `span[id^="title-chat-list-item_"]` e `[data-tid*="chat-list-item-title"]`.

3. **Resposta rápida não expande?**
   Verifique se o editor ainda usa `contenteditable="true"` ou `data-tid="ckeditor"`.

> Consulte `ARQUITETURA_TECNICA.md` para o mapa completo de seletores e decisões técnicas.
> Consulte `LOG_TECNICO.md` para o histórico de bugs e soluções.

---

## 📄 Licença

Uso interno / privado. Não distribuir sem autorização.
