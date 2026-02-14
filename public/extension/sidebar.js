// Gerenciamento de Estado
let cards = [];
let responses = [];

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    const data = await chrome.storage.local.get(['tf_cards', 'tf_responses']);
    cards = data.tf_cards || [];
    responses = data.tf_responses || [];
    
    renderKanban();
    renderResponses();

    // Ouvir mensagens do content.js (Scraper)
    window.addEventListener('message', (event) => {
        if (event.data.type === 'TEAMSFLOW_CHATS_DATA') {
            updateRecentChats(event.data.chats);
        }
    });

    // Solicitar chats iniciais
    window.parent.postMessage({ type: 'TEAMSFLOW_GET_CHATS' }, '*');
});

// Navegação
document.getElementById('btn-kanban').onclick = () => switchView('kanban');
document.getElementById('btn-responses').onclick = () => switchView('responses');
document.getElementById('btn-close').onclick = () => {
    window.parent.postMessage({ type: 'TEAMSFLOW_CLOSE' }, '*');
};

function switchView(view) {
    document.getElementById('view-kanban').classList.toggle('hidden', view !== 'kanban');
    document.getElementById('view-responses').classList.toggle('hidden', view !== 'responses');
    document.getElementById('btn-kanban').classList.toggle('active', view === 'kanban');
    document.getElementById('btn-responses').classList.toggle('active', view === 'responses');
    document.getElementById('view-title').innerText = view === 'kanban' ? 'Board Kanban' : 'Respostas Rápidas';
}

// Lógica de Kanban
function renderKanban() {
    const lists = ['todo', 'doing', 'done'];
    lists.forEach(id => {
        const el = document.getElementById(`list-${id}`);
        el.innerHTML = '';
        cards.filter(c => c.columnId === id).forEach(card => {
            const cardEl = createCardElement(card);
            el.appendChild(cardEl);
        });
        
        el.ondragover = (e) => e.preventDefault();
        el.ondrop = (e) => {
            const cardData = JSON.parse(e.dataTransfer.getData('text/plain'));
            moveCard(cardData.id, id, cardData);
        };
    });
}

function updateRecentChats(chats) {
    const list = document.getElementById('list-recent');
    if (!chats || chats.length === 0) {
        list.innerHTML = '<p style="text-align:center; padding: 20px; color: #666;">Nenhum chat visível. Abra a aba de chat do Teams.</p>';
        return;
    }
    list.innerHTML = '';
    chats.forEach(chat => {
        const chatEl = document.createElement('div');
        chatEl.className = 'card';
        chatEl.draggable = true;
        chatEl.innerHTML = `<h4>${chat.name}</h4><p>${chat.lastMessage}</p>`;
        chatEl.ondragstart = (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({ 
                id: 'temp-' + Date.now(), 
                title: chat.name, 
                content: chat.lastMessage,
                isNew: true 
            }));
        };
        list.appendChild(chatEl);
    });
}

function createCardElement(card) {
    const div = document.createElement('div');
    div.className = 'card';
    div.draggable = true;
    div.innerHTML = `
        <div style="display:flex; justify-content:space-between;">
            <h4>${card.title}</h4>
            <button class="delete-btn" style="font-size: 0.8rem;">&times;</button>
        </div>
        <p>${card.content}</p>
    `;
    div.querySelector('.delete-btn').onclick = () => deleteCard(card.id);
    div.ondragstart = (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify(card));
    };
    return div;
}

async function moveCard(cardId, columnId, data) {
    if (data.isNew) {
        cards.push({ id: Math.random().toString(36).substr(2, 9), title: data.title, content: data.content, columnId });
    } else {
        cards = cards.map(c => c.id === cardId ? { ...c, columnId } : c);
    }
    await chrome.storage.local.set({ tf_cards: cards });
    renderKanban();
}

async function deleteCard(id) {
    cards = cards.filter(c => c.id !== id);
    await chrome.storage.local.set({ tf_cards: cards });
    renderKanban();
}

// Lógica de Respostas
document.getElementById('save-response').onclick = async () => {
    const trigger = document.getElementById('resp-trigger').value;
    const text = document.getElementById('resp-text').value;
    
    if (!trigger.startsWith('/') || !text) {
        alert('O gatilho deve começar com / e o texto não pode estar vazio.');
        return;
    }

    const newResp = { id: Date.now().toString(), trigger, text };
    responses.push(newResp);
    await chrome.storage.local.set({ tf_responses: responses });
    
    document.getElementById('resp-trigger').value = '';
    document.getElementById('resp-text').value = '';
    renderResponses();
};

function renderResponses() {
    const list = document.getElementById('responses-list');
    list.innerHTML = '';
    responses.forEach(resp => {
        const div = document.createElement('div');
        div.className = 'response-item';
        div.innerHTML = `
            <div><strong>${resp.trigger}</strong>: ${resp.text.substring(0, 50)}...</div>
            <button class="delete-btn" data-id="${resp.id}">&times;</button>
        `;
        div.querySelector('.delete-btn').onclick = () => deleteResponse(resp.id);
        list.appendChild(div);
    });
}

async function deleteResponse(id) {
    responses = responses.filter(r => r.id !== id);
    await chrome.storage.local.set({ tf_responses: responses });
    renderResponses();
}