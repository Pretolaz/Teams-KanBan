
let state = {
    cards: [],
    responses: [],
    recentChats: []
};

// Navegação entre Tabs
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => b.classList.remove('active')); // Corrigido erro de digitação b -> t
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
});

// Fechar
document.getElementById('close-btn').addEventListener('click', () => {
    window.parent.postMessage({ type: 'TEAMSFLOW_CLOSE' }, '*');
});

// Inicialização
async function init() {
    const data = await chrome.storage.local.get(['tf_cards', 'tf_responses']);
    state.cards = data.tf_cards || [];
    state.responses = data.tf_responses || [];
    renderAll();
    
    // Solicita chats reais ao content.js
    window.parent.postMessage({ type: 'TEAMSFLOW_GET_CHATS' }, '*');
}

// Escuta mensagens do Teams (content.js)
window.addEventListener('message', (event) => {
    if (event.data.type === 'TEAMSFLOW_CHATS_DATA') {
        state.recentChats = event.data.chats;
        renderRecentChats();
    }
});

function renderAll() {
    renderRecentChats();
    renderKanban();
    renderResponses();
}

function renderRecentChats() {
    const list = document.getElementById('recent-list');
    list.innerHTML = '';
    
    if (state.recentChats.length === 0) {
        list.innerHTML = '<p class="empty-msg">Nenhum chat visível. Abra a aba de chat do Teams.</p>';
        return;
    }

    state.recentChats.forEach(chat => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h4>${chat.name}</h4>
            <p>${chat.lastMsg || 'Sem mensagens recentes'}</p>
            <div class="card-actions">
                <button class="move-btn" onclick="moveToTodo('${chat.name}', '${chat.lastMsg}')">Mover para A Fazer →</button>
            </div>
        `;
        list.appendChild(card);
    });
}

window.moveToTodo = (name, lastMsg) => {
    const newCard = {
        id: Date.now().toString(),
        columnId: 'todo',
        title: name,
        content: lastMsg,
        createdAt: Date.now()
    };
    state.cards.push(newCard);
    saveCards();
    renderAll();
};

function renderKanban() {
    ['todo', 'doing', 'done'].forEach(colId => {
        const list = document.getElementById(`${colId}-list`);
        list.innerHTML = '';
        state.cards.filter(c => c.columnId === colId).forEach(card => {
            const div = document.createElement('div');
            div.className = 'card';
            div.innerHTML = `
                <h4>${card.title}</h4>
                <p>${card.content}</p>
                <div class="card-actions">
                    <button class="move-btn" onclick="cycleCard('${card.id}')">Próximo</button>
                    <button class="del-btn" onclick="deleteCard('${card.id}')">Excluir</button>
                </div>
            `;
            list.appendChild(div);
        });
    });
}

window.cycleCard = (id) => {
    const card = state.cards.find(c => c.id === id);
    if (card.columnId === 'todo') card.columnId = 'doing';
    else if (card.columnId === 'doing') card.columnId = 'done';
    else card.columnId = 'todo';
    saveCards();
    renderKanban();
};

window.deleteCard = (id) => {
    state.cards = state.cards.filter(c => c.id !== id);
    saveCards();
    renderKanban();
};

function saveCards() {
    chrome.storage.local.set({ tf_cards: state.cards });
}

// Respostas Rápidas
document.getElementById('save-resp-btn').addEventListener('click', () => {
    const trigger = document.getElementById('resp-trigger').value;
    const text = document.getElementById('resp-text').value;
    
    if (trigger && text) {
        state.responses.push({ id: Date.now().toString(), trigger, text });
        chrome.storage.local.set({ tf_responses: state.responses });
        document.getElementById('resp-trigger').value = '';
        document.getElementById('resp-text').value = '';
        renderResponses();
    }
});

function renderResponses() {
    const grid = document.getElementById('responses-grid');
    grid.innerHTML = '';
    state.responses.forEach(r => {
        const div = document.createElement('div');
        div.className = 'response-card';
        div.innerHTML = `
            <code>${r.trigger}</code>
            <p>${r.text}</p>
            <button class="del-btn" onclick="deleteResponse('${r.id}')">Remover</button>
        `;
        grid.appendChild(div);
    });
}

window.deleteResponse = (id) => {
    state.responses = state.responses.filter(r => r.id !== id);
    chrome.storage.local.set({ tf_responses: state.responses });
    renderResponses();
};

init();
