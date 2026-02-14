
let currentCards = [];
let quickResponses = [];

// Navegação
document.getElementById('btn-kanban').onclick = () => {
  document.getElementById('view-kanban').classList.remove('hidden');
  document.getElementById('view-responses').classList.add('hidden');
};

document.getElementById('btn-responses').onclick = () => {
  document.getElementById('view-kanban').classList.add('hidden');
  document.getElementById('view-responses').classList.remove('hidden');
  renderResponses();
};

document.getElementById('btn-close').onclick = () => {
  window.parent.postMessage({ type: 'TEAMSFLOW_CLOSE' }, '*');
};

// Carregar Dados
function loadData() {
  chrome.storage.local.get(['tf_cards', 'tf_responses'], (result) => {
    currentCards = result.tf_cards || [];
    quickResponses = result.tf_responses || [];
    renderKanban();
    renderResponses();
  });
}

// Renderizar Kanban
function renderKanban() {
  const columns = ['todo', 'doing', 'done'];
  columns.forEach(colId => {
    const el = document.getElementById(`col-${colId}`);
    el.innerHTML = '';
    currentCards.filter(c => c.columnId === colId).forEach(card => {
      el.appendChild(createCardUI(card));
    });
    
    // Drag and Drop
    el.ondragover = (e) => e.preventDefault();
    el.ondrop = (e) => {
      const cardId = e.dataTransfer.getData('text');
      moveCard(cardId, colId);
    };
  });
}

function createCardUI(card) {
  const div = document.createElement('div');
  div.className = 'card';
  div.draggable = true;
  div.innerHTML = `
    <div class="card-name">${card.title}</div>
    <div class="card-msg">"${card.content || 'Sem mensagens'}"</div>
  `;
  div.ondragstart = (e) => e.dataTransfer.setData('text', card.id);
  return div;
}

function moveCard(cardId, newColId) {
  currentCards = currentCards.map(c => c.id === cardId ? { ...c, columnId: newColId } : c);
  chrome.storage.local.set({ tf_cards: currentCards }, renderKanban);
}

// Renderizar Respostas
function renderResponses() {
  const list = document.getElementById('responses-list');
  list.innerHTML = '';
  quickResponses.forEach((resp, index) => {
    const div = document.createElement('div');
    div.className = 'resp-item shadow-sm';
    div.innerHTML = `
      <div class="flex justify-between items-start mb-2">
        <span class="resp-trigger">${resp.trigger}</span>
        <button class="text-red-500 text-xs font-bold" onclick="deleteResponse(${index})">Excluir</button>
      </div>
      <div class="text-xs text-gray-600 line-clamp-2">${resp.text}</div>
    `;
    list.appendChild(div);
  });
}

// Salvar Resposta
document.getElementById('btn-save-resp').onclick = () => {
  const trigger = document.getElementById('resp-trigger').value;
  const text = document.getElementById('resp-text').value;
  if (trigger && text) {
    quickResponses.push({ trigger, text, id: Date.now().toString() });
    chrome.storage.local.set({ tf_responses: quickResponses }, () => {
      document.getElementById('resp-trigger').value = '';
      document.getElementById('resp-text').value = '';
      renderResponses();
    });
  }
};

window.deleteResponse = (index) => {
  quickResponses.splice(index, 1);
  chrome.storage.local.set({ tf_responses: quickResponses }, renderResponses);
};

// Escutar mensagens do Teams (Content Script)
window.addEventListener('message', (event) => {
  if (event.data.type === 'TEAMSFLOW_CHATS_DATA') {
    renderRecentChats(event.data.chats);
  }
});

function renderRecentChats(chats) {
  const el = document.getElementById('col-recent');
  el.innerHTML = '';
  if (!chats || chats.length === 0) {
    el.innerHTML = '<p class="text-xs text-gray-500 italic p-2 text-center">Nenhum chat visível. Abra a aba de chat do Teams.</p>';
    return;
  }
  chats.forEach(chat => {
    const div = document.createElement('div');
    div.className = 'card border-l-blue-500';
    div.draggable = true;
    div.innerHTML = `
      <div class="card-name">${chat.name}</div>
      <div class="card-msg">Ultima: ${chat.lastMsg}</div>
    `;
    div.ondragstart = (e) => {
      const newCard = {
        id: 'card_' + Date.now(),
        title: chat.name,
        content: chat.lastMsg,
        columnId: 'todo',
        createdAt: Date.now()
      };
      e.dataTransfer.setData('text', newCard.id);
      // Ao dropar em qualquer coluna, o moveCard cuidará de adicionar se não existir
      if (!currentCards.find(c => c.title === chat.name)) {
        currentCards.push(newCard);
      }
    };
    el.appendChild(div);
  });
}

// Iniciar
loadData();
// Pedir chats
window.parent.postMessage({ type: 'TEAMSFLOW_GET_CHATS' }, '*');
setInterval(() => {
  window.parent.postMessage({ type: 'TEAMSFLOW_GET_CHATS' }, '*');
}, 5000);
