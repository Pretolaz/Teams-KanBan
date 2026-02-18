// TeamsFlow Pro - Kanban Logic
let db = { cards: [] };

// Auxiliar para verificar se o contexto ainda é válido
function isContextValid() {
  return typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id;
}

function loadData() {
  if (!isContextValid()) {
    console.warn("TeamsFlow: Contexto inválido em loadData.");
    return;
  }
  chrome.storage.local.get(['cards'], (result) => {
    if (chrome.runtime.lastError) return;
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

  // Status padrão: verde
  const status = card.status || 'green';
  const note = card.note || '';

  div.innerHTML = `
    <div class="card-header">
      ${card.hasUnread ? '<span class="unread-icon" title="Mensagem não lida">⚡</span>' : ''}
      <h4>${card.name}</h4>
      <div class="semaphore">
        <div class="status-dot red ${status === 'red' ? 'active' : ''}" data-status="red" title="Urgente"></div>
        <div class="status-dot yellow ${status === 'yellow' ? 'active' : ''}" data-status="yellow" title="Atenção"></div>
        <div class="status-dot green ${status === 'green' ? 'active' : ''}" data-status="green" title="No Prazo"></div>
      </div>
    </div>
    <input type="text" class="card-note" placeholder="Adicione uma nota..." maxlength="50" value="${note}">
  `;

  // --- Lógica de Navegação ---
  div.onclick = (e) => {
    // Se clicou no input ou no semáforo, não navega
    if (e.target.tagName === 'INPUT' || e.target.classList.contains('status-dot')) return;
    window.parent.postMessage({ type: 'TEAMSFLOW_GOTO_CHAT', name: card.name }, '*');
  };

  // --- Lógica de Arrastar ---
  div.ondragstart = (e) => {
    e.dataTransfer.setData('cardId', card.id);
    e.dataTransfer.setData('isRecent', isRecent);
    if (isRecent) {
      e.dataTransfer.setData('cardData', JSON.stringify(card));
    }
  };

  // --- Lógica de Nota ---
  const noteInput = div.querySelector('.card-note');
  noteInput.onchange = () => {
    updateCardData(card.id, { note: noteInput.value });
  };

  // --- Lógica de Semáforo ---
  div.querySelectorAll('.status-dot').forEach(dot => {
    dot.onclick = () => {
      const newStatus = dot.getAttribute('data-status');
      updateCardData(card.id, { status: newStatus });
      // UI feedback imediato
      div.querySelectorAll('.status-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
    };
  });

  return div;
}

function updateCardData(cardId, data) {
  if (!isContextValid()) {
    alert("A extensão foi atualizada. Por favor, atualize a página do Teams.");
    return;
  }
  db.cards = db.cards.map(c => c.id === cardId ? { ...c, ...data } : c);
  chrome.storage.local.set({ cards: db.cards });
}

// Configura Drop nas colunas
['todo', 'doing', 'done'].forEach(colId => {
  const colEl = document.getElementById(`col-${colId}`);
  if (!colEl) return;

  colEl.ondragover = (e) => e.preventDefault();
  colEl.ondrop = (e) => {
    if (!isContextValid()) {
      alert("A extensão foi atualizada. Por favor, atualize a página do Teams.");
      return;
    }
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
        status: 'green',
        note: '',
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
    if (!isContextValid()) {
      alert("A extensão foi atualizada. Por favor, atualize a página do Teams.");
      return;
    }
    if (confirm('Deseja realmente limpar as colunas "A Fazer", "Em Progresso" e "Concluído"? Os chats recentes não serão afetados.')) {
      db.cards = [];
      try {
        chrome.storage.local.set({ cards: [] }, () => {
          if (chrome.runtime.lastError) {
            console.error("Erro ao resetar:", chrome.runtime.lastError);
            return;
          }
          console.log("TeamsFlow: Quadros resetados.");
          loadData();
        });
      } catch (e) {
        console.error("TeamsFlow: Falha crítica no reset.", e);
        alert("Ocorreu um erro ao resetar. Tente atualizar a página.");
      }
    }
  };
}

loadData();

// =============================================
// PERSONALIZAÇÃO DE COLUNAS (Nome + Cor)
// =============================================

const COLUMN_COLORS = [
  '#673AB7', '#3F51B5', '#2196F3', '#00BCD4',
  '#4CAF50', '#8BC34A', '#FF9800', '#FF5722',
  '#F44336', '#E91E63', '#9C27B0', '#607D8B'
];

const DEFAULT_COLS = {
  todo:  { name: 'A Fazer',      color: '#673AB7' },
  doing: { name: 'Em Progresso', color: '#FF9800' },
  done:  { name: 'Concluído',    color: '#4CAF50' }
};

function applyColPrefs(prefs) {
  ['todo', 'doing', 'done'].forEach(colId => {
    const p = prefs[colId] || DEFAULT_COLS[colId];
    const titleEl = document.getElementById(`col-${colId}-title`);
    const colEl   = document.getElementById(`col-${colId}`);
    if (titleEl) {
      titleEl.textContent = p.name;
      titleEl.style.color = p.color;
    }
    if (colEl) {
      colEl.style.borderTop = `3px solid ${p.color}`;
    }
  });
}

function loadColPrefs(cb) {
  if (!isContextValid()) return;
  chrome.storage.local.get(['colPrefs'], (result) => {
    const prefs = result.colPrefs || {};
    applyColPrefs(prefs);
    if (cb) cb(prefs);
  });
}

function saveColPrefs(prefs) {
  if (!isContextValid()) return;
  chrome.storage.local.set({ colPrefs: prefs });
}

function openEditPanel(colId, currentPrefs) {
  // Fecha qualquer painel aberto
  document.querySelectorAll('.col-edit-panel').forEach(p => p.remove());

  const p = currentPrefs[colId] || DEFAULT_COLS[colId];
  const colEl = document.getElementById(`col-${colId}`);
  const cardList = document.getElementById(`${colId}-list`);

  const panel = document.createElement('div');
  panel.className = 'col-edit-panel open';
  panel.id = `edit-panel-${colId}`;

  // Campo de nome
  const nameLabel = document.createElement('label');
  nameLabel.textContent = 'Nome da Coluna';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = p.name;
  nameInput.maxLength = 20;

  // Paleta de cores
  const colorLabel = document.createElement('label');
  colorLabel.textContent = 'Cor do Título';
  const colorRow = document.createElement('div');
  colorRow.className = 'color-row';

  let selectedColor = p.color;

  COLUMN_COLORS.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'col-color-swatch' + (color === selectedColor ? ' selected' : '');
    swatch.style.background = color;
    swatch.title = color;
    swatch.onclick = () => {
      selectedColor = color;
      colorRow.querySelectorAll('.col-color-swatch').forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');
    };
    colorRow.appendChild(swatch);
  });

  // Botão salvar
  const saveBtn = document.createElement('button');
  saveBtn.className = 'col-edit-save';
  saveBtn.textContent = '✓ Salvar';
  saveBtn.onclick = () => {
    const newName = nameInput.value.trim() || DEFAULT_COLS[colId].name;
    currentPrefs[colId] = { name: newName, color: selectedColor };
    saveColPrefs(currentPrefs);
    applyColPrefs(currentPrefs);
    panel.remove();
  };

  panel.appendChild(nameLabel);
  panel.appendChild(nameInput);
  panel.appendChild(colorLabel);
  panel.appendChild(colorRow);
  panel.appendChild(saveBtn);

  // Insere o painel antes da lista de cards
  colEl.insertBefore(panel, cardList);
  nameInput.focus();
}

// Inicializa personalização
loadColPrefs((prefs) => {
  document.querySelectorAll('.col-edit-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const colId = btn.getAttribute('data-col');
      const existingPanel = document.getElementById(`edit-panel-${colId}`);
      if (existingPanel) {
        existingPanel.remove(); // Toggle: fecha se já aberto
      } else {
        openEditPanel(colId, { ...prefs });
      }
    };
  });
});
