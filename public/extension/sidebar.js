
/**
 * TeamsFlow - Sidebar Logic
 * Gerencia o Kanban local dentro da barra lateral.
 */

const DEFAULT_COLUMNS = [
  { id: 'todo', name: 'A Fazer', color: '#673AB7' },
  { id: 'doing', name: 'Fazendo', color: '#FF9800' },
  { id: 'done', name: 'Concluído', color: '#4CAF50' }
];

let state = {
  columns: [],
  cards: []
};

// Carregar dados iniciais
function loadData() {
  chrome.storage.local.get(['tf_columns', 'tf_cards'], (result) => {
    state.columns = result.tf_columns || DEFAULT_COLUMNS;
    state.cards = result.tf_cards || [];
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
  const container = document.getElementById('kanban');
  container.innerHTML = '';

  if (state.columns.length === 0) {
    container.innerHTML = '<div class="empty-state">Nenhuma coluna configurada.</div>';
    return;
  }

  state.columns.forEach(col => {
    const colDiv = document.createElement('div');
    colDiv.className = 'column';
    
    const colCards = state.cards.filter(c => c.columnId === col.id);
    
    colDiv.innerHTML = `
      <div class="column-header">
        <span>${col.name}</span>
        <small>${colCards.length}</small>
      </div>
      <div class="cards" id="cards-${col.id}"></div>
    `;
    
    const cardsList = colDiv.querySelector('.cards');
    colCards.forEach(card => {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'card';
      cardDiv.style.borderLeftColor = col.color;
      
      cardDiv.innerHTML = `
        <span class="card-title">${card.title}</span>
        <div class="card-meta">Prioridade: ${card.priority}</div>
        <div class="card-actions">
          <button class="btn-icon move-left" data-id="${card.id}">◀</button>
          <button class="btn-icon delete" data-id="${card.id}">🗑️</button>
          <button class="btn-icon move-right" data-id="${card.id}">▶</button>
        </div>
      `;

      // Eventos dos botões do card
      cardDiv.querySelector('.delete').onclick = () => deleteCard(card.id);
      cardDiv.querySelector('.move-left').onclick = () => moveCard(card.id, -1);
      cardDiv.querySelector('.move-right').onclick = () => moveCard(card.id, 1);
      
      cardsList.appendChild(cardDiv);
    });

    container.appendChild(colDiv);
  });
}

function deleteCard(id) {
  state.cards = state.cards.filter(c => c.id !== id);
  saveData();
  render();
}

function moveCard(cardId, direction) {
  const card = state.cards.find(c => c.id === cardId);
  const currentColIndex = state.columns.findIndex(col => col.id === card.columnId);
  const nextColIndex = currentColIndex + direction;
  
  if (nextColIndex >= 0 && nextColIndex < state.columns.length) {
    card.columnId = state.columns[nextColIndex].id;
    saveData();
    render();
  }
}

// Botão de Captura: Pede contexto para o content script (Teams)
document.getElementById('btn-capture').onclick = () => {
  window.parent.postMessage({ type: 'GET_TEAMS_CONTEXT' }, '*');
};

// Ouvir resposta do Teams com o contexto
window.addEventListener('message', (event) => {
  if (event.data.type === 'TEAMS_CONTEXT_RESPONSE') {
    const newCard = {
      id: Math.random().toString(36).substr(2, 9),
      columnId: state.columns[0].id,
      title: event.data.title,
      content: 'Resumo pendente...',
      priority: 'Medium',
      teamsUrl: event.data.url,
      createdAt: Date.now()
    };
    state.cards.push(newCard);
    saveData();
    render();
  }
  
  if (event.data.type === 'REFRESH_DATA') {
    loadData();
  }
});

// Inicializar
loadData();
