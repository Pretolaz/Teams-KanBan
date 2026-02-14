
// TeamsFlow Sidebar Logic
let currentView = 'kanban';
let liveChats = [];

// Inicialização e Gerenciamento de Visualização
function switchView(view) {
  currentView = view;
  document.getElementById('kanban-view').style.display = view === 'kanban' ? 'block' : 'none';
  document.getElementById('responses-view').style.display = view === 'responses' ? 'block' : 'none';
  
  if (view === 'kanban') renderKanban();
  else renderResponses();
}

// Escuta dados do Content Script (Chats reais)
window.addEventListener('message', (event) => {
  if (event.data.type === 'TEAMSFLOW_LOAD_CHATS') {
    liveChats = event.data.chats;
    renderKanban();
  }
});

// --- LÓGICA KANBAN ---
function renderKanban() {
  chrome.storage.local.get(['tf_cards', 'tf_columns'], (result) => {
    const savedCards = result.tf_cards || [];
    const columns = result.tf_columns || [
      { id: 'todo', name: 'A Fazer' },
      { id: 'doing', name: 'Fazendo' },
      { id: 'done', name: 'Concluído' }
    ];

    const container = document.getElementById('kanban-container');
    container.innerHTML = '';

    // Coluna 1: Chats Recentes (Live)
    const recentCol = createColumnElement('recent', 'Conversas Recentes', '#6366f1');
    liveChats.forEach(chat => {
      recentCol.querySelector('.cards-list').appendChild(createCardElement(chat, true));
    });
    container.appendChild(recentCol);

    // Colunas de Status
    columns.forEach(col => {
      const colEl = createColumnElement(col.id, col.name, '#94a3b8');
      const colCards = savedCards.filter(c => c.columnId === col.id);
      colCards.forEach(card => {
        colEl.querySelector('.cards-list').appendChild(createCardElement(card, false));
      });
      container.appendChild(colEl);
    });
  });
}

function createColumnElement(id, name, color) {
  const div = document.createElement('div');
  div.className = 'kanban-column';
  div.dataset.id = id;
  div.innerHTML = `
    <div class="column-header">
      <div class="column-dot" style="background: ${color}"></div>
      <span class="column-title">${name}</span>
    </div>
    <div class="cards-list" ondragover="allowDrop(event)" ondrop="drop(event)"></div>
  `;
  return div;
}

function createCardElement(card, isLive) {
  const div = document.createElement('div');
  div.className = 'card';
  div.draggable = true;
  div.id = card.id;
  div.ondragstart = (e) => e.dataTransfer.setData("text", e.target.id);
  div.innerHTML = `
    <div class="card-title">${card.title}</div>
    <div class="card-content">${card.content}</div>
    ${isLive ? '<div class="card-tag">Live</div>' : `<button class="delete-card" onclick="deleteCard('${card.id}')">×</button>`}
  `;
  return div;
}

window.allowDrop = (ev) => ev.preventDefault();

window.drop = (ev) => {
  ev.preventDefault();
  const cardId = ev.dataTransfer.getData("text");
  const columnId = ev.currentTarget.closest('.kanban-column').dataset.id;
  
  if (columnId === 'recent') return; // Não move de volta para recent

  const isFromLive = cardId.startsWith('teams-chat');
  
  chrome.storage.local.get(['tf_cards'], (result) => {
    let cards = result.tf_cards || [];
    
    if (isFromLive) {
      const chat = liveChats.find(c => c.id === cardId);
      if (chat) {
        cards.push({ ...chat, id: 'card-' + Date.now(), columnId });
      }
    } else {
      cards = cards.map(c => c.id === cardId ? { ...c, columnId } : c);
    }
    
    chrome.storage.local.set({ tf_cards: cards }, renderKanban);
  });
};

window.deleteCard = (id) => {
  chrome.storage.local.get(['tf_cards'], (result) => {
    const cards = (result.tf_cards || []).filter(c => c.id !== id);
    chrome.storage.local.set({ tf_cards: cards }, renderKanban);
  });
};

// --- LÓGICA RESPOSTAS RÁPIDAS ---
function renderResponses() {
  chrome.storage.local.get(['tf_responses'], (result) => {
    const responses = result.tf_responses || [
      { id: '1', trigger: '/ola', text: 'Olá! Como posso te ajudar hoje?' },
      { id: '2', trigger: '/ok', text: 'Entendido, muito obrigado pelo retorno.' }
    ];
    
    const list = document.getElementById('responses-list');
    list.innerHTML = '';
    
    responses.forEach(resp => {
      const div = document.createElement('div');
      div.className = 'response-item';
      div.innerHTML = `
        <div>
          <div style="font-weight:bold; color:#6366f1;">${resp.trigger}</div>
          <div style="font-size:12px; color:#64748b;">${resp.text}</div>
        </div>
        <button class="delete-btn" onclick="deleteResponse('${resp.id}')">Excluir</button>
      `;
      list.appendChild(div);
    });
  });
}

window.saveResponse = () => {
  const trigger = document.getElementById('trigger-input').value;
  const text = document.getElementById('text-input').value;
  
  if (!trigger.startsWith('/')) {
    alert("O gatilho deve começar com '/'");
    return;
  }

  chrome.storage.local.get(['tf_responses'], (result) => {
    const responses = result.tf_responses || [];
    responses.push({ id: Date.now().toString(), trigger, text });
    chrome.storage.local.set({ tf_responses: responses }, () => {
      document.getElementById('trigger-input').value = '';
      document.getElementById('text-input').value = '';
      renderResponses();
    });
  });
};

window.deleteResponse = (id) => {
  chrome.storage.local.get(['tf_responses'], (result) => {
    const responses = (result.tf_responses || []).filter(r => r.id !== id);
    chrome.storage.local.set({ tf_responses: responses }, renderResponses);
  });
};

// Botão Fechar
window.closeOverlay = () => {
  window.parent.postMessage({ type: 'TEAMSFLOW_CLOSE_OVERLAY' }, '*');
};

// Inicializa
switchView('kanban');
