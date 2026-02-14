console.log("TeamsFlow: Motor de produtividade ativo.");

let overlayVisible = false;

// 1. Injeção do Botão Acionador (Mais resiliente)
function injectTrigger() {
    if (document.getElementById('teamsflow-trigger')) return;

    const btn = document.createElement('div');
    btn.id = 'teamsflow-trigger';
    btn.innerHTML = 'T';
    Object.assign(btn.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '50px',
        height: '50px',
        backgroundColor: '#673AB7',
        color: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: '999999',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        fontWeight: 'bold',
        fontSize: '20px',
        border: '2px solid white'
    });

    btn.onclick = toggleOverlay;
    document.documentElement.appendChild(btn);
}

// 2. Injeção do Iframe Overlay (Tamanho total)
function toggleOverlay() {
    let iframe = document.getElementById('teamsflow-iframe');
    overlayVisible = !overlayVisible;

    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'teamsflow-iframe';
        iframe.src = chrome.runtime.getURL('sidebar.html');
        Object.assign(iframe.style, {
            position: 'fixed',
            inset: '0',
            width: '100vw',
            height: '100vh',
            border: 'none',
            zIndex: '999998',
            display: 'none',
            transition: 'opacity 0.3s'
        });
        document.documentElement.appendChild(iframe);
    }

    iframe.style.display = overlayVisible ? 'block' : 'none';
    if (overlayVisible) scrapeChats();
}

// 3. Scraper de Chats (Específico para Teams V2)
function scrapeChats() {
    // Procura por itens na lista de chat lateral
    const chatItems = document.querySelectorAll('[data-tid="chat-list-item"], .chat-list-item, [role="listitem"]');
    const chats = Array.from(chatItems).map(item => {
        const nameEl = item.querySelector('[data-tid="chat-list-item-title"], .chat-list-item-title, h3, span');
        const msgEl = item.querySelector('.last-message, [data-tid="last-message-body"]');
        return {
            name: nameEl ? nameEl.innerText.trim() : "Contato Desconhecido",
            lastMessage: msgEl ? msgEl.innerText.trim() : "Sem mensagens recentes"
        };
    }).filter(c => c.name !== "");

    const iframe = document.getElementById('teamsflow-iframe');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'TEAMSFLOW_CHATS_DATA', chats }, '*');
    }
}

// 4. Atalhos de Resposta Rápida
document.addEventListener('input', async (e) => {
    const target = e.target;
    if (target.getAttribute('contenteditable') === 'true' || target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        const text = target.innerText || target.value;
        const lastWord = text.split(/\s/).pop();

        if (lastWord.startsWith('/')) {
            const data = await chrome.storage.local.get('tf_responses');
            const match = (data.tf_responses || []).find(r => r.trigger === lastWord);
            
            if (match) {
                const newText = text.replace(lastWord, match.text);
                if (target.getAttribute('contenteditable') === 'true') {
                    target.innerText = newText;
                } else {
                    target.value = newText;
                }
                // Move o cursor para o fim
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(target);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    }
});

// 5. Escuta de eventos do Iframe
window.addEventListener('message', (event) => {
    if (event.data.type === 'TEAMSFLOW_CLOSE') {
        toggleOverlay();
    }
    if (event.data.type === 'TEAMSFLOW_GET_CHATS') {
        scrapeChats();
    }
});

// Tentar injetar a cada 2 segundos caso o Teams remova
setInterval(injectTrigger, 2000);
injectTrigger();