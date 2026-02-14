
// TeamsFlow Sidebar Logic
const board = document.getElementById('board');
const addChatBtn = document.getElementById('add-chat');

let state = {
  columns: [
    { id: 'todo', name: 'A Fazer', color: '#673AB7' },
    { id: 'doing', name: 'Em Progresso', color: '#FF9800' },
    { id: 'done', name: 'Concluído', color: '#4CAF50' }
  ],
  cards: []
};

// Carregar dados do Chrome Storage
function loadData() {
  chrome.storage.local.get(['tf_columns', 'tf_cards'], (result) => {
    if (result.tf_columns) state.columns = result.tf_columns;
    if (result.tf_cards) state.cards = result.tf_cards;
    render();
  });
}

function saveData() {
  chrome.storage.local.set({
    tf_columns: state.columns,
    tf_cards: state.cards
  });
}

function render() {
  board.innerHTML = '';
  state.columns.forEach(col => {
    const colEl = document.createElement('div');
    colEl.className = 'column';
    colEl.innerHTML = `
      <div class="col-header" style="border-top: 3px solid ${col.color}">
        <strong>${col.name}</strong>
        <span class="count">${state.cards.filter(c => c.columnId === col.id).length}</span>
      </div>
      <div class="cards-container" data-id="${col.id}"></div>
    `;
    
    const cardsContainer = colEl.querySelector('.cards-container');
    state.cards.filter(c => c.columnId === col.id).forEach(card => {
      const cardEl = document.createElement('div');
      cardEl.className = 'card';
      cardEl.innerHTML = `
        <div class="card-title">${card.title}</div>
        <div class="card-meta">
          <span class="prio ${card.priority}">${card.priority}</span>
          <button class="delete-card" data-id="${card.id}">×</button>
        </div>
        ${card.teamsUrl ? `<a href="${card.teamsUrl}" target="_parent" class="link">Abrir Conversa</a>` : ''}
      `;
      cardsContainer.appendChild(cardEl);
    });
    
    board.appendChild(colEl);
  });
}

// Evento: Capturar Chat
addChatBtn.addEventListener('click', () => {
  window.parent.postMessage({ type: 'TF_GET_TEAMS_DATA' }, '*');
});

window.addEventListener('message', (event) => {
  if (event.data.type === 'TF_TEAMS_DATA_RESPONSE') {
    const newData = event.data.data;
    const newCard = {
      id: Date.now().toString(),
      columnId: 'todo',
      title: newData.title,
      teamsUrl: newData.url,
      priority: 'Medium'
    };
    state.cards.push(newCard);
    saveData();
    render();
  }
});

// Evento: Deletar Card
board.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-card')) {
    const id = e.target.dataset.id;
    state.cards = state.cards.filter(c => c.id !== id);
    saveData();
    render();
  }
});

loadData();
