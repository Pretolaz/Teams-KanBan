// TeamsFlow Pro - Sidebar Logic

// Garante que o script só vai rodar depois que o HTML for totalmente carregado
document.addEventListener('DOMContentLoaded', () => {
  const kanbanFrame = document.getElementById('kanban-frame');
  const closeBtn = document.getElementById('btn-close'); // ID CORRIGIDO
  const kanbanBtn = document.getElementById('btn-kanban'); // ID CORRIGIDO

  if (closeBtn) {
    closeBtn.onclick = () => {
      window.parent.postMessage({ type: 'TEAMSFLOW_CLOSE' }, '*');
    };
  }

  if (kanbanBtn) {
    kanbanBtn.onclick = () => {
      if (kanbanFrame) {
        kanbanFrame.style.display = 'block';
      }
      // Solicita os chats recentes ao content script
      window.parent.postMessage({ type: 'TEAMSFLOW_REQUEST_CHATS' }, '*');
    };
  }

  // Ouve mensagens do Kanban (para fechar) e do Content Script (com os chats)
  window.addEventListener('message', (event) => {
    // Mensagem para fechar o Kanban vinda do kanban.js
    if (event.data.type === 'TF_CLOSE_KANBAN') {
      if (kanbanFrame) {
        kanbanFrame.style.display = 'none';
      }
    }

    // Recebe os chats recentes do content.js e os repassa para o kanban.js
    if (event.data.type === 'TF_RECENT_CHATS') {
      if (kanbanFrame && kanbanFrame.contentWindow) {
        kanbanFrame.contentWindow.postMessage(event.data, '*');
      }
    }
  });
});
