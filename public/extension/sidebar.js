
let tfData = {
  cards: [],
  responses: []
};

let recentChats = [];

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEvents();
  
  // Solicita chats recentes ao content script
  window.parent.postMessage({ type: 'TF_GET_CHATS' }, '*');
});

function loadData() {
  chrome.storage.local.get(['tf_cards', 'tf_responses'], (result) => {
    tfData.cards = result.tf_cards || [];
    tfData.responses = result.tf_responses || [];
    renderAll();
  });
}

function setupEvents() {
  // Navegação
  document.getElementById('btn-kanban').onclick = () => switchView('kanban');
  document.getElementById('btn-responses').onclick = () => switchView('responses');
  
  // Fechar
  document.getElementById('close-sidebar').onclick = () => {
    window.parent.postMessage({ type: 'TF_CLOSE' }, '*');
  };

  // Salvar Resposta
  document.getElementById('save-response').onclick = () => {
    const trigger = document.getElementById('resp-trigger').value;
    const text = document.getElementById('resp-text').value;
    
    if (trigger && text) {
      const newResp = { id: Date.now().toString(), trigger, text };
      tfData.responses.push(newResp);
      chrome.storage.local.set({ tf_responses: tfData.responses }, () => {
        document.getElementById('resp-trigger').value = '';
        document.getElementById('resp-text').value = '';
        renderResponses();
      });
    }
  };

  // Drag and Drop (HTML5 Native)
  document.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('card')) {
      e.dataTransfer.setData('cardId', e.target.dataset.id);
      e.dataTransfer.setData('isRecent', e.target.dataset.recent === 'true');
      e.dataTransfer.setData('title', e.target.querySelector('h4').innerText);
      e.dataTransfer.setData('content', e.target.querySelector('p').innerText);
    }
  });

  document.querySelectorAll('.dropzone').forEach(zone => {
    zone.ondragover = (e) => e.preventDefault();
    zone.ondrop = (e) => {
      e.preventDefault();
      const cardId = e.dataTransfer.getData('cardId');
      const isRecent = e.dataTransfer.getData('isRecent') === 'true';
      const colId = zone.dataset.col;

      if (isRecent) {
        // Criar novo card a partir de um chat recente
        const newCard = {
          id: Date.now().toString(),
          columnId: colId,
          title: e.dataTransfer.getData('title'),
          content: e.dataTransfer.getData('content'),
          priority: 'Medium'
        };
        tfData.cards.push(newCard);
      } else {
        // Mover card existente
        tfData.cards = tfData.cards.map(c => c.id === cardId ? { ...c, columnId: colId } : c);
      }
      
      chrome.storage.local.set({ tf_cards: tfData.cards }, renderKanban);
    };
  });
}

function switchView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`view-${view}`).classList.add('active');
  document.getElementById(`btn-${view}`).classList.add('active');
}

// Ouvir mensagens do Content Script
window.addEventListener('message', (event) => {
  if (event.data.type === 'TF_CHATS_DATA') {
    recentChats = event.data.chats;
    renderRecentChats();
  }
});

function renderAll() {
  renderKanban();
  renderResponses();
}

function renderRecentChats() {
  const list = document.getElementById('list-recent');
  if (recentChats.length === 0) {
    list.innerHTML = '<div class="empty-state">Nenhum chat detectado. Abra a aba de Chat do Teams.</div>';
    return;
  }

  list.innerHTML = recentChats.map(chat => `
    <div class="card" draggable="true" data-id="${chat.id}" data-recent="true">
      <h4>${chat.title}</h4>
      <p>${chat.content}</p>
    </div>
  `).join('');
  document.getElementById('count-recent').innerText = recentChats.length;
}

function renderKanban() {
  const columns = ['todo', 'doing', 'done'];
  columns.forEach(colId => {
    const list = document.querySelector(`.dropzone[data-col="${colId}"]`);
    const filtered = tfData.cards.filter(c => c.columnId === colId);
    list.innerHTML = filtered.map(card => `
      <div class="card" draggable="true" data-id="${card.id}" data-recent="false">
        <div style="display:flex; justify-content:space-between">
          <h4>${card.title}</h4>
          <button onclick="deleteCard('${card.id}')" style="background:none; border:none; color:red; cursor:pointer">&times;</button>
        </div>
        <p>${card.content}</p>
      </div>
    `).join('');
    document.getElementById(`count-${colId}`).innerText = filtered.length;
  });
}

function renderResponses() {
  const list = document.getElementById('response-list');
  list.innerHTML = tfData.responses.map(resp => `
    <div class="resp-card">
      <strong>${resp.trigger}</strong>
      <p>${resp.text}</p>
      <button class="delete-btn" onclick="deleteResponse('${resp.id}')">Excluir</button>
    </div>
  `).join('');
}

window.deleteCard = (id) => {
  tfData.cards = tfData.cards.filter(c => c.id !== id);
  chrome.storage.local.set({ tf_cards: tfData.cards }, renderKanban);
};

window.deleteResponse = (id) => {
  tfData.responses = tfData.responses.filter(r => r.id !== id);
  chrome.storage.local.set({ tf_responses: tfData.responses }, renderResponses);
};
