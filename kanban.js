// TeamsFlow Pro - Kanban Logic
let db = { cards: [] };

document.getElementById('close-btn').onclick = () => {
  window.parent.postMessage({ type: 'TF_CLOSE_KANBAN' }, '*');
};

function loadData() {
  chrome.storage.local.get(['cards'], (result) => {
    db.cards = result.cards || [];
    renderBoard();
  });
}

function renderBoard() {
  const columns = ['todo', 'doing', 'done'];
  columns.forEach(colId => {
    const container = document.getElementById(`${colId}-list`);
    container.innerHTML = '';
    db.cards.filter(c => c.columnId === colId).forEach(card => {
      container.appendChild(createCardElement(card));
    });
  });
}

function createCardElement(card, isRecent = false) {
  const div = document.createElement('div');
  div.className = 'card';
  div.draggable = true;
  div.innerHTML = `
    <h4>${card.name}</h4>
    <p>${card.lastMessage}</p>
    <span class="date">${new Date(card.createdAt || Date.now()).toLocaleDateString()}</span>
  `;
  
  div.ondragstart = (e) => {
    e.dataTransfer.setData('cardId', card.id);
    e.dataTransfer.setData('isRecent', isRecent);
    if (isRecent) {
      e.dataTransfer.setData('cardData', JSON.stringify(card));
    }
  };
  
  return div;
}

// Configura Drop nas colunas
['todo', 'doing', 'done'].forEach(colId => {
  const container = document.getElementById(`${colId}-list`);
  const colEl = document.getElementById(`col-${colId}`);
  
  colEl.ondragover = (e) => e.preventDefault();
  colEl.ondrop = (e) => {
    const cardId = e.dataTransfer.getData('cardId');
    const isRecent = e.dataTransfer.getData('isRecent') === 'true';
    
    if (isRecent) {
      const cardData = JSON.parse(e.dataTransfer.getData('cardData'));
      const newCard = {
        ...cardData,
        id: 'card-' + Date.now(),
        columnId: colId,
        createdAt: Date.now()
      };
      db.cards.push(newCard);
    } else {
      db.cards = db.cards.map(c => c.id === cardId ? { ...c, columnId: colId } : c);
    }
    
    chrome.storage.local.set({ cards: db.cards }, loadData);
  };
});

// Ouve as conversas recentes enviadas pelo content.js
window.addEventListener('message', (event) => {
  if (event.data.type === 'TF_RECENT_CHATS') {
    const container = document.getElementById('list-recent');
    container.innerHTML = '';
    event.data.chats.forEach(chat => {
      container.appendChild(createCardElement(chat, true));
    });
  }
});

loadData();