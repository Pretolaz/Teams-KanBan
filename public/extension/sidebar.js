
let cards = [];
let responses = [];

// Carrega dados iniciais
function loadData() {
  chrome.storage.local.get(['tf_cards', 'tf_responses'], (result) => {
    cards = result.tf_cards || [];
    responses = result.tf_responses || [
      { id: '1', trigger: '/ola', text: 'Olá! Como posso ajudar você hoje?' },
      { id: '2', trigger: '/reuniao', text: 'Poderia me enviar o link da reunião, por favor?' }
    ];
    renderCards();
    renderResponses();
  });
  
  // Solicita chats recentes ao content.js
  window.parent.postMessage({ type: 'TEAMSFLOW_GET_CHATS' }, '*');
}

// Escuta chats vindos do Teams
window.addEventListener('message', (event) => {
  if (event.data.type === 'TEAMSFLOW_CHATS_DATA') {
    renderNativeChats(event.data.chats);
  }
});

function renderNativeChats(chats) {
  const container = document.getElementById('col-teams');
  container.innerHTML = '';
  
  if (chats.length === 0) {
    container.innerHTML = '<div class="text-xs text-gray-400 text-center py-4 italic">Nenhum chat visível no Teams agora. Abra a aba de chat.</div>';
    return;
  }

  chats.forEach(chat => {
    const el = document.createElement('div');
    el.className = 'bg-white p-4 rounded-xl shadow-sm border border-blue-100 card-drag hover:border-blue-300 transition-all';
    el.draggable = true;
    el.innerHTML = `
      <div class="font-bold text-sm text-gray-800">${chat.title}</div>
      <div class="text-xs text-gray-500 line-clamp-2 mt-1 italic">"${chat.content}"</div>
      <div class="mt-2 text-[10px] text-blue-500 font-bold uppercase tracking-wider">Arraste para organizar</div>
    `;
    
    el.ondragstart = (e) => {
      e.dataTransfer.setData('chat_data', JSON.stringify(chat));
    };
    
    container.appendChild(el);
  });
}

function renderCards() {
  ['todo', 'doing', 'done'].forEach(colId => {
    const container = document.getElementById(`col-${colId}`);
    container.innerHTML = '';
    
    cards.filter(c => c.columnId === colId).forEach(card => {
      const el = document.createElement('div');
      el.className = 'bg-white p-4 rounded-xl shadow-sm border relative group';
      el.innerHTML = `
        <button class="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onclick="deleteCard('${card.id}')">✕</button>
        <div class="font-bold text-sm text-gray-800">${card.title}</div>
        <div class="text-xs text-gray-500 mt-1">${card.content}</div>
        <div class="flex justify-between mt-3">
           <button class="text-xs text-indigo-500 hover:underline" onclick="moveCard('${card.id}', 'prev')">←</button>
           <button class="text-xs text-indigo-500 hover:underline" onclick="moveCard('${card.id}', 'next')">→</button>
        </div>
      `;
      container.appendChild(el);
    });
  });
}

function renderResponses() {
  const container = document.getElementById('responses-list');
  container.innerHTML = '';
  
  responses.forEach(resp => {
    const el = document.createElement('div');
    el.className = 'bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center';
    el.innerHTML = `
      <div>
        <div class="font-mono text-indigo-600 font-bold">${resp.trigger}</div>
        <div class="text-sm text-gray-500 line-clamp-1">${resp.text}</div>
      </div>
      <button class="text-red-400 hover:text-red-600" onclick="deleteResponse('${resp.id}')">Remover</button>
    `;
    container.appendChild(el);
  });
}

// Funções globais expostas para os botões inline
window.deleteCard = (id) => {
  cards = cards.filter(c => c.id !== id);
  saveCards();
};

window.moveCard = (id, direction) => {
  const card = cards.find(c => c.id === id);
  const cols = ['todo', 'doing', 'done'];
  let idx = cols.indexOf(card.columnId);
  if (direction === 'prev' && idx > 0) idx--;
  if (direction === 'next' && idx < cols.length - 1) idx++;
  card.columnId = cols[idx];
  saveCards();
};

window.deleteResponse = (id) => {
  responses = responses.filter(r => r.id !== id);
  saveResponses();
};

function saveCards() {
  chrome.storage.local.set({ tf_cards: cards }, renderCards);
}

function saveResponses() {
  chrome.storage.local.set({ tf_responses: responses }, renderResponses);
}

// Setup de Drag and Drop
document.querySelectorAll('.kanban-drop').forEach(dropArea => {
  dropArea.ondragover = (e) => e.preventDefault();
  dropArea.ondrop = (e) => {
    e.preventDefault();
    const chatData = JSON.parse(e.dataTransfer.getData('chat_data'));
    const targetCol = dropArea.dataset.column;
    
    // Transforma chat em card persistente
    const newCard = {
      ...chatData,
      id: 'card-' + Date.now(),
      columnId: targetCol,
      isNative: false
    };
    
    cards.push(newCard);
    saveCards();
  };
});

// Navegação de Tabs
document.getElementById('tab-kanban').onclick = () => {
  document.getElementById('kanban-view').classList.remove('hidden');
  document.getElementById('responses-view').classList.add('hidden');
  document.getElementById('tab-kanban').classList.add('bg-indigo-100', 'text-indigo-700');
  document.getElementById('tab-responses').classList.remove('bg-indigo-100', 'text-indigo-700');
};

document.getElementById('tab-responses').onclick = () => {
  document.getElementById('kanban-view').classList.add('hidden');
  document.getElementById('responses-view').classList.remove('hidden');
  document.getElementById('tab-responses').classList.add('bg-indigo-100', 'text-indigo-700');
  document.getElementById('tab-kanban').classList.remove('bg-indigo-100', 'text-indigo-700');
};

// Ações
document.getElementById('close-btn').onclick = () => {
  window.parent.postMessage({ type: 'TEAMSFLOW_CLOSE' }, '*');
};

document.getElementById('save-resp-btn').onclick = () => {
  const trigger = document.getElementById('resp-trigger').value;
  const text = document.getElementById('resp-text').value;
  if (trigger && text) {
    responses.push({ id: Date.now().toString(), trigger, text });
    saveResponses();
    document.getElementById('resp-trigger').value = '';
    document.getElementById('resp-text').value = '';
  }
};

loadData();
