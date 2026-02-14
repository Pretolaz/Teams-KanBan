
# TeamsFlow - Extensão para Microsoft Teams

Este projeto é uma ferramenta de produtividade composta por um **Dashboard Web** (Next.js) e uma **Extensão do Chrome**.

## Como testar a Extensão no seu Chrome:

1.  Abra o Google Chrome.
2.  Vá para `chrome://extensions/`.
3.  No canto superior direito, ative o **Modo do desenvolvedor**.
4.  Clique no botão **Carregar sem compactação** (Load unpacked).
5.  Navegue até a pasta do projeto e selecione a pasta: `public/extension`.
6.  Agora, abra o [Microsoft Teams Web](https://teams.microsoft.com/) no seu navegador.
7.  Teste digitando um comando (ex: `/bomdia`) se você tiver configurado no storage da extensão. 

## Como usar o Dashboard:

O Dashboard (este site que você está vendo agora) serve para gerenciar seus cards do Kanban e suas respostas rápidas. Futuramente, ele será sincronizado com a extensão via Firebase.

## Funcionalidades atuais:
- **Kanban**: Organize tarefas derivadas do chat.
- **Respostas Rápidas**: Crie atalhos (ex: `/ok`) para textos longos.
- **IA (GenKit)**: Resumo automático de conversas e sugestão de prioridade.
