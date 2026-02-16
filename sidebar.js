// TeamsFlow Pro - Sidebar Logic

document.addEventListener('DOMContentLoaded', () => {
  const btnKanban = document.getElementById('btn-kanban');
  const btnResponses = document.getElementById('btn-responses');
  const btnClose = document.getElementById('btn-close');

  const viewKanban = document.getElementById('view-kanban');
  const viewResponses = document.getElementById('view-responses');

  const respTrigger = document.getElementById('resp-trigger');
  const respText = document.getElementById('resp-text');
  const btnSaveResp = document.getElementById('btn-save-resp');
  const responsesList = document.getElementById('responses-list');

  // --- Navegação ---
  btnKanban.onclick = () => {
    viewKanban.classList.add('active');
    viewResponses.classList.remove('active');
    btnKanban.classList.add('active');
    btnResponses.classList.remove('active');
    window.parent.postMessage({ type: 'TEAMSFLOW_REQUEST_CHATS' }, '*');
  };

  btnResponses.onclick = () => {
    viewResponses.classList.add('active');
    viewKanban.classList.remove('active');
    btnResponses.classList.add('active');
    btnKanban.classList.remove('active');
    loadResponses();
  };

  btnClose.onclick = () => {
    window.parent.postMessage({ type: 'TEAMSFLOW_CLOSE' }, '*');
  };

  // --- Lógica de Respostas Rápidas ---
  function loadResponses() {
    chrome.storage.local.get(['responses'], (data) => {
      const list = data.responses || [];
      responsesList.innerHTML = '';
      list.forEach(resp => {
        const item = document.createElement('div');
        item.className = 'resp-item';
        item.innerHTML = `
                    <code>${resp.trigger}</code>
                    <p>${resp.text}</p>
                    <button class="delete-resp" data-id="${resp.id}">×</button>
                `;
        responsesList.appendChild(item);
      });

      // Botão excluir
      document.querySelectorAll('.delete-resp').forEach(btn => {
        btn.onclick = () => {
          const id = btn.getAttribute('data-id');
          const newList = list.filter(r => r.id != id);
          chrome.storage.local.set({ responses: newList }, loadResponses);
        };
      });
    });
  }

  btnSaveResp.onclick = () => {
    const trigger = respTrigger.value.trim();
    const text = respText.value.trim();
    if (!trigger || !text) return;

    chrome.storage.local.get(['responses'], (data) => {
      const list = data.responses || [];
      list.push({ trigger, text, id: Date.now() });
      chrome.storage.local.set({ responses: list }, () => {
        respTrigger.value = '';
        respText.value = '';
        loadResponses();
      });
    });
  };

  // Solicita chats iniciais
  setTimeout(() => {
    window.parent.postMessage({ type: 'TEAMSFLOW_REQUEST_CHATS' }, '*');
  }, 500);

  loadResponses(); // Carrega inicialment
});
