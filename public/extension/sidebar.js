
/**
 * Lógica da Interface TeamsFlow (sidebar.html)
 */

let state = {
  recentChats: [],
  cards: [],
  responses: []
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupListeners();
  
  // Solicita chats ao carregar
  window.parent.postMessage({ type: 'TEAMSFLOW_REQUEST_CHATS' }, '*');
});

function loadData() {
  chrome.storage.local.get(['cards', 'responses'], (result) => {
    state.cards = result.cards || [];
    state.responses = result.responses || [];
    renderAll();
  });
}

function setupListeners() {
  // Navegação
  document.getElementById('btn-kanban').onclick = () => switchView('kanban');
  document.getElementById('btn-responses').onclick = () => switchView('responses');
  document.getElementById('btn-close').onclick = () => {
    window.parent.postMessage({ type: 'TEAMSFLOW_CLOSE' }, '*');
  };

  // Salvar Resposta
  document.getElementById('btn-save-resp').onclick = saveResponse;

  // Receber mensagens do content.js (via parent)
  window.addEventListener('message', (event) => {
    if (event.data.type === 'TEAMSFLOW_CHATS_DATA') {
      state.recentChats = event.data.chats;
      renderRecentChats();
    }
  });
}

function switchView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  
  document.getElementById(`view-${view}`).classList.add('active');
  document.getElementById(`btn-${view}`).classList.add('active');
}

function renderAll() {
  renderRecentChats();
  renderBoard();
  renderResponses();
}

function renderRecentChats() {
  const list = document.getElementById('list-recent');
  const count = document.getElementById('count-recent');
  
  if (state.recentChats.length === 0) {
    list.innerHTML = '<p class="empty-msg">Nenhum chat visível. Abra a aba de chat do Teams.</p>';
    count.textContent = '0';
    return;
  }

  count.textContent = state.recentChats.length;
  list.innerHTML = state.recentChats.map(chat => `
    <div class="card" draggable="true" ondragstart="onCardDragStart(event, '${chat.id}', 'recent')">
      <h4>${chat.name}</h4>
      <p>${chat.lastMessage}</p>
    </div>
  `).join('');
}

function renderBoard() {
  const columns = ['todo', 'doing', 'done'];
  columns.forEach(colId => {
    const list = document.getElementById(`list-${colId}`);
    const count = document.getElementById(`count-${colId}`);
    const filtered = state.cards.filter(c => c.columnId === colId);
    
    count.textContent = filtered.length;
    list.innerHTML = filtered.map(card => `
      <div class="card" style="border-left-color: ${getColumnColor(colId)}" draggable="true" ondragstart="onCardDragStart(event, '${card.id}', '${colId}')">
        <div style="display:flex; justify-content:space-between; align-items:flex-start">
          <h4>${card.title}</h4>
          <button onclick="deleteCard('${card.id}')" style="background:none; border:none; color:red; cursor:pointer; font-size:10px">X</button>
        </div>
        <p>${card.content}</p>
      </div>
    `).join('');

    // Setup dropzone
    list.ondragover = (e) => e.preventDefault();
    list.ondrop = (e) => onCardDrop(e, colId);
  });
}

function renderResponses() {
  const list = document.getElementById('responses-list');
  list.innerHTML = state.responses.map(resp => `
    <div class="resp-item">
      <code>${resp.trigger}</code>
      <p style="margin-top:10px; font-size:12px">${resp.text}</p>
      <button class="delete-resp" onclick="deleteResponse('${resp.id}')">&times;</button>
    </div>
  `).join('');
}

// Drag & Drop
let draggedCardInfo = null;

window.onCardDragStart = (e, cardId, fromCol) => {
  draggedCardInfo = { id: cardId, from: fromCol };
};

function onCardDrop(e, toColId) {
  e.preventDefault();
  if (!draggedCardInfo) return;

  if (draggedCardInfo.from === 'recent') {
    const chat = state.recentChats.find(c => c.id === draggedCardInfo.id);
    if (chat) {
      const newCard = {
        id: 'card-' + Date.now(),
        columnId: toColId,
        title: chat.name,
        content: chat.lastMessage,
        url: chat.url
      };
      state.cards.push(newCard);
    }
  } else {
    state.cards = state.cards.map(c => 
      c.id === draggedCardInfo.id ? { ...c, columnId: toColId } : c
    );
  }

  saveToStorage();
  renderBoard();
  draggedCardInfo = null;
}

// Ações
function saveResponse() {
  const trigger = document.getElementById('resp-trigger').value;
  const text = document.getElementById('resp-text').value;

  if (!trigger.startsWith('/')) {
    alert("O gatilho deve começar com '/'");
    return;
  }

  if (trigger && text) {
    const newResp = { id: 'resp-' + Date.now(), trigger, text };
    state.responses.push(newResp);
    saveToStorage();
    renderResponses();
    
    document.getElementById('resp-trigger').value = '';
    document.getElementById('resp-text').value = '';
  }
}

window.deleteResponse = (id) => {
  state.responses = state.responses.filter(r => r.id !== id);
  saveToStorage();
  renderResponses();
};

window.deleteCard = (id) => {
  state.cards = state.cards.filter(c => c.id !== id);
  saveToStorage();
  renderBoard();
};

function saveToStorage() {
  chrome.storage.local.set({ 
    cards: state.cards, 
    responses: state.responses 
  });
}

function getColumnColor(col) {
  if (col === 'todo') return '#673AB7';
  if (col === 'doing') return '#FF9800';
  if (col === 'done') return '#4CAF50';
  return '#ccc';
}

function getColumnColor(col) {
  if (col === 'todo') return '#673AB7';
  if (col === 'doing') return '#FF9800';
  if (col === 'done') return '#4CAF50';
  return '#ccc';
}
