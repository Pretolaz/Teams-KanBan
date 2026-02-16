// TeamsFlow Pro - Kanban Logic
let db = { cards: [] };

function loadData() {
  chrome.storage.local.get(['cards'], (result) => {
    db.cards = result.cards || [];
    renderBoard();
  });
}

function renderBoard() {
  const columns = ['todo', 'doing', 'done'];
  columns.forEach(colId => {
    const listId = `${colId}-list`;
    const container = document.getElementById(listId);
    if (!container) return;

    container.innerHTML = '';
    const colCards = db.cards.filter(c => c.columnId === colId);

    // Atualiza o contador (badge)
    const badge = document.getElementById(`count-${colId}`);
    if (badge) badge.textContent = colCards.length;

    colCards.forEach(card => {
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
  const colEl = document.getElementById(`col-${colId}`);
  if (!colEl) return;

  colEl.ondragover = (e) => e.preventDefault();
  colEl.ondrop = (e) => {
    const cardId = e.dataTransfer.getData('cardId');
    const isRecent = e.dataTransfer.getData('isRecent') === 'true';

    if (isRecent) {
      const cardData = JSON.parse(e.dataTransfer.getData('cardData'));
      // Evita duplicatas se já existir no quadro
      if (db.cards.find(c => c.name === cardData.name)) return;

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
    const container = document.getElementById('recent-list');
    const countBadge = document.getElementById('count-recent');
    if (!container) return;

    container.innerHTML = '';
    const chats = event.data.chats || [];
    if (countBadge) countBadge.textContent = chats.length;

    if (chats.length === 0) {
      container.innerHTML = '<p class="empty-msg">Nenhum chat visível. Abra a aba de chat do Teams.</p>';
    } else {
      chats.forEach(chat => {
        container.appendChild(createCardElement(chat, true));
      });
    }
  }
});

// Botão de Reset
const btnReset = document.getElementById('btn-reset-kanban');
if (btnReset) {
  btnReset.onclick = () => {
    if (confirm('Deseja realmente limpar as colunas "A Fazer", "Em Progresso" e "Concluído"? Os chats recentes não serão afetados.')) {
      db.cards = [];
      chrome.storage.local.set({ cards: [] }, () => {
        loadData();
        console.log("TeamsFlow: Kanban resetado pelo usuário.");
      });
    }
  };
}

loadData();

