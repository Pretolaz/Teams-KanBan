// TeamsFlow Pro - Content Script
let hasInitialized = false;

function initializeTeamsFlow() {
    if (hasInitialized) return;
    const chatList = document.querySelector('[data-tid="chat-list-entry"]');
    if (!document.body || !chatList) return;

    hasInitialized = true;
    clearInterval(initInterval);
    console.log("TeamsFlow: UI do Teams detectada. Injetando funcionaldades.");

    const sidebarFrame = document.createElement('iframe');
    sidebarFrame.src = chrome.runtime.getURL('sidebar.html');
    sidebarFrame.id = 'teamsflow-sidebar';
    sidebarFrame.style.display = 'none';
    document.body.appendChild(sidebarFrame);

    const triggerButton = document.createElement('button');
    triggerButton.id = 'teamsflow-trigger';
    triggerButton.textContent = 'TF';
    document.body.appendChild(triggerButton);

    triggerButton.onclick = () => {
        const isVisible = sidebarFrame.style.display === 'block';
        sidebarFrame.style.display = isVisible ? 'none' : 'block';
    };

    // Ouve mensagens DA SIDEBAR
    window.addEventListener('message', (event) => {
        // Ignora mensagens que não sejam da nossa sidebar
        if (event.source !== sidebarFrame.contentWindow) return;

        if (event.data.type === 'TEAMSFLOW_CLOSE') {
            sidebarFrame.style.display = 'none';
        }

        if (event.data.type === 'TEAMSFLOW_REQUEST_CHATS') {
            const recentChats = getRecentChats();
            // Envia a resposta de volta para a sidebar que pediu
            sidebarFrame.contentWindow.postMessage({ type: 'TF_RECENT_CHATS', chats: recentChats }, '*');
        }
    });
}

function getRecentChats() {
    const chatItems = document.querySelectorAll('[data-tid="chat-list-entry"]');
    const chats = [];
    chatItems.forEach(item => {
        const nameEl = item.querySelector('.truncate');
        const messageEl = item.querySelector('[data-tid="message-preview-text"]');
        if (nameEl && messageEl) {
            chats.push({
                id: 'chat-' + nameEl.textContent.trim().replace(/\s+/g, '-'),
                name: nameEl.textContent.trim(),
                lastMessage: messageEl.textContent.trim(),
                createdAt: new Date().toISOString()
            });
        }
    });
    return chats;
}

console.log("TeamsFlow: Iniciando motor... Esperando pela UI do Teams.");
const initInterval = setInterval(initializeTeamsFlow, 1500);
