
console.log("TeamsFlow: Iniciando motor de produtividade...");

// Injetar Botão e Iframe
function injectTeamsFlow() {
    if (document.getElementById('tf-float-btn')) return;

    // Botão Flutuante
    const btn = document.createElement('div');
    btn.id = 'tf-float-btn';
    btn.innerHTML = 'T';
    btn.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; width: 50px; height: 50px;
        background: #6264a7; color: white; border-radius: 50%; display: flex;
        align-items: center; justify-content: center; font-weight: bold;
        cursor: pointer; z-index: 999999; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-family: sans-serif; transition: transform 0.2s;
    `;
    btn.onmouseover = () => btn.style.transform = 'scale(1.1)';
    btn.onmouseout = () => btn.style.transform = 'scale(1)';
    
    // Iframe do Kanban
    const iframe = document.createElement('iframe');
    iframe.id = 'tf-iframe';
    iframe.src = chrome.runtime.getURL('sidebar.html');
    iframe.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        border: none; z-index: 999998; display: none; background: transparent;
    `;

    btn.onclick = () => {
        iframe.style.display = iframe.style.display === 'none' ? 'block' : 'none';
    };

    document.documentElement.appendChild(iframe);
    document.documentElement.appendChild(btn);
}

// Tenta injetar a cada 2 segundos (Teams reconstrói o DOM)
setInterval(injectTeamsFlow, 2000);

// Scraper de Chats
function getRecentChats() {
    // Seletores para o Teams V2
    const chatItems = document.querySelectorAll('[data-tid="chat-list-item"]');
    const chats = [];
    
    chatItems.forEach(item => {
        const nameEl = item.querySelector('.fui-StyledText'); // Nome do contato
        const msgEl = item.querySelector('.fui-ChatListItem__message'); // Última msg
        
        if (nameEl) {
            chats.push({
                name: nameEl.innerText.trim(),
                lastMsg: msgEl ? msgEl.innerText.trim() : ""
            });
        }
    });
    return chats;
}

// Comunicação com o Iframe
window.addEventListener('message', (event) => {
    if (event.data.type === 'TEAMSFLOW_CLOSE') {
        document.getElementById('tf-iframe').style.display = 'none';
    }
    if (event.data.type === 'TEAMSFLOW_GET_CHATS') {
        const chats = getRecentChats();
        const iframe = document.getElementById('tf-iframe');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ 
                type: 'TEAMSFLOW_CHATS_DATA', 
                chats: chats 
            }, '*');
        }
    }
});

// Auto-Replace de Respostas Rápidas
document.addEventListener('input', async (e) => {
    const input = e.target;
    if (input.tagName === 'INPUT' || input.getAttribute('role') === 'textbox' || input.isContentEditable) {
        const text = input.innerText || input.value || "";
        const words = text.split(/\s/);
        const lastWord = words[words.length - 1];

        if (lastWord.startsWith('/')) {
            const storage = await chrome.storage.local.get('tf_responses');
            const responses = storage.tf_responses || [];
            const match = responses.find(r => r.trigger === lastWord);

            if (match) {
                if (input.isContentEditable) {
                    input.innerText = text.replace(lastWord, match.text);
                } else {
                    input.value = text.replace(lastWord, match.text);
                }
                // Dispara evento para o Teams perceber a mudança
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    }
}, true);
