let currentView = 'kanban';
let store = { cards: [], responses: [], recentChats: [] };

// Inicia escutando mensagens do content.js
window.addEventListener('message', (event) => {
  if (event.data.type === 'TEAMSFLOW_CHATS_DATA') {
    store.recentChats = event.data.chats;
    renderKanban();
  }
});

function loadData() {
  chrome.storage.local.get(['tf_cards', 'tf_responses'], (data) => {
    store.cards = data.tf_cards || [];
    store.responses = data.tf_responses || [];
    renderKanban();
    renderResponses();
  });
}

function saveData() {
  chrome.storage.local.set({ 
    tf_cards: store.cards, 
    tf_responses: store.responses 
  });
}

function renderKanban() {
  const recentList = document.getElementById('recent-list');
  const todoList = document.getElementById('todo-list');
  const doingList = document.getElementById('doing-list');

  // Chats Recentes (Voláteis)
  recentList.innerHTML = store.recentChats.length ? '' : '<p class="text-xs opacity-50 italic">Abra a aba Chat no Teams.</p>';
  store.recentChats.forEach(chat => {
    const card = createCardEl(chat, true);
    recentList.appendChild(card);
  });

  // Cards Persistentes
  todoList.innerHTML = '';
  doingList.innerHTML = '';
  store.cards.forEach(card => {
    const el = createCardEl(card, false);
    if (card.columnId === 'todo') todoList.appendChild(el);
    else if (card.columnId === 'doing') doingList.appendChild(el);
  });

  document.getElementById('count-recent').innerText = store.recentChats.length;
  document.getElementById('count-todo').innerText = store.cards.filter(c => c.columnId === 'todo').length;
  document.getElementById('count-doing').innerText = store.cards.filter(c => c.columnId === 'doing').length;
}

function createCardEl(data, isRecent) {
  const div = document.createElement('div');
  div.className = 'kanban-card group';
  div.draggable = true;
  div.innerHTML = `
    <span class="card-title">${data.title}</span>
    <p class="card-content">${data.content || 'Sem mensagens recentes'}</p>
    ${!isRecent ? `<button class="delete-card hidden group-hover:block text-[10px] text-red-500 mt-2">Remover</button>` : ''}
  `;

  div.addEventListener('dragstart', (e) => {
    const dragData = isRecent ? { ...data, columnId: 'todo', id: 'new_' + Date.now() } : data;
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  });

  const delBtn = div.querySelector('.delete-card');
  if (delBtn) {
    delBtn.onclick = () => {
      store.cards = store.cards.filter(c => c.id !== data.id);
      saveData();
      renderKanban();
    };
  }

  return div;
}

function renderResponses() {
  const list = document.getElementById('responses-list');
  list.innerHTML = '';
  store.responses.forEach(resp => {
    const div = document.createElement('div');
    div.className = 'bg-white p-3 rounded shadow-sm border relative group';
    div.innerHTML = `
      <div class="font-bold text-indigo-600 text-xs">${resp.trigger}</div>
      <div class="text-[11px] opacity-70 truncate">${resp.text}</div>
      <button class="delete-resp absolute top-2 right-2 hidden group-hover:block text-red-500 text-xs">&times;</button>
    `;
    div.querySelector('.delete-resp').onclick = () => {
      store.responses = store.responses.filter(r => r.id !== resp.id);
      saveData();
      renderResponses();
    };
    list.appendChild(div);
  });
}

// Configuração de Drag & Drop
document.querySelectorAll('.kanban-column').forEach(col => {
  col.addEventListener('dragover', e => e.preventDefault());
  col.addEventListener('drop', e => {
    e.preventDefault();
    const droppedData = JSON.parse(e.dataTransfer.getData('text/plain'));
    const targetColId = col.querySelector('h3').innerText.toLowerCase().includes('fazer') ? 'todo' : 'doing';
    
    // Se for um chat novo sendo arrastado
    if (droppedData.id.toString().startsWith('new_')) {
      droppedData.columnId = targetColId;
      store.cards.push(droppedData);
    } else {
      // Se for um card existente sendo movido
      store.cards = store.cards.map(c => c.id === droppedData.id ? { ...c, columnId: targetColId } : c);
    }
    
    saveData();
    renderKanban();
  });
});

// Navegação
document.getElementById('btn-kanban').onclick = () => {
  document.getElementById('kanban-view').classList.remove('hidden');
  document.getElementById('responses-view').classList.add('hidden');
  document.getElementById('view-title').innerText = 'Board Kanban';
};

document.getElementById('btn-responses').onclick = () => {
  document.getElementById('kanban-view').classList.add('hidden');
  document.getElementById('responses-view').classList.remove('hidden');
  document.getElementById('view-title').innerText = 'Respostas Rápidas';
};

document.getElementById('btn-close').onclick = () => {
  window.parent.postMessage({ type: 'TEAMSFLOW_TOGGLE' }, '*');
};

document.getElementById('btn-save-resp').onclick = () => {
  const trigger = document.getElementById('resp-trigger').value;
  const text = document.getElementById('resp-text').value;
  if (trigger && text) {
    store.responses.push({ id: Date.now(), trigger, text });
    saveData();
    renderResponses();
    document.getElementById('resp-trigger').value = '';
    document.getElementById('resp-text').value = '';
  }
};

loadData();