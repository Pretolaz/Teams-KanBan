// TeamsFlow Pro - Content Script
let uiInjected = false;

function injectUI() {
    if (uiInjected || !document.body) return;
    console.log("TeamsFlow: Injetando componentes de UI...");

    const sidebarFrame = document.createElement('iframe');
    sidebarFrame.src = chrome.runtime.getURL('sidebar.html');
    sidebarFrame.id = 'tf-iframe';
    sidebarFrame.style.display = 'none';
    sidebarFrame.style.position = 'fixed';
    sidebarFrame.style.zIndex = '9999998';
    document.body.appendChild(sidebarFrame);

    const triggerButton = document.createElement('button');
    triggerButton.id = 'tf-trigger';
    triggerButton.textContent = 'TF';
    triggerButton.style.position = 'fixed';
    triggerButton.style.zIndex = '9999999';
    document.body.appendChild(triggerButton);

    triggerButton.onclick = () => {
        const isHidden = sidebarFrame.style.display === 'none';
        sidebarFrame.style.display = isHidden ? 'block' : 'none';
        if (sidebarFrame.style.display === 'block') {
            updateChats(sidebarFrame);
        }
    };

    window.addEventListener('message', (event) => {
        if (event.data.type === 'TEAMSFLOW_CLOSE') {
            sidebarFrame.style.display = 'none';
        }
        if (event.data.type === 'TEAMSFLOW_REQUEST_CHATS') {
            updateChats(sidebarFrame);
        }
        if (event.data.type === 'TEAMSFLOW_GOTO_CHAT') {
            navigateToChat(event.data.name);
        }
    });

    uiInjected = true;
    startDetectionLoop(sidebarFrame);
}

function updateChats(frame) {
    const chats = getRecentChats();
    frame.contentWindow.postMessage({ type: 'TF_RECENT_CHATS', chats: chats }, '*');
}

function startDetectionLoop(frame) {
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            const chats = getRecentChats();
            frame.contentWindow.postMessage({ type: 'TF_RECENT_CHATS', chats: chats }, '*');
        }
    }, 5000);
}

function navigateToChat(name) {
    console.log(`TeamsFlow: Tentando navegar para chat: ${name}`);
    const titleSpans = Array.from(document.querySelectorAll('span[id^="title-chat-list-item_"]'));
    const target = titleSpans.find(s => s.textContent.trim() === name);

    if (target) {
        const clickable = target.closest('[role="row"], [role="listitem"], .fui-ListItem');
        if (clickable) {
            clickable.click();
            console.log("TeamsFlow: Navegação executada.");
        }
    }
}

function getRecentChats() {
    // Foca nos IDs de títulos identificados pelo usuário
    const titleSpans = Array.from(document.querySelectorAll('span[id^="title-chat-list-item_"]'));
    const chats = [];

    titleSpans.forEach((span, index) => {
        const name = span.textContent.trim();

        // Detecta se há mensagem não lida (geralmente uma bolinha ou badge no container)
        const itemContainer = span.closest('[role="row"], [role="listitem"], .fui-ListItem');
        let hasUnread = false;
        if (itemContainer) {
            // No Teams v2, itens não lidos costumam ter um badge ou classe de negrito no título
            const badge = itemContainer.querySelector('[class*="badge"], [class*="unread"], .fui-PresenceBadge');
            const isBold = window.getComputedStyle(span).fontWeight >= 600;
            hasUnread = !!badge || isBold;
        }

        if (name && name !== "Chats") {
            chats.push({
                id: 'chat-' + (name.replace(/[^a-zA-Z0-9]/g, '-') || index),
                name: name,
                hasUnread: hasUnread,
                createdAt: new Date().toISOString()
            });
        }
    });

    return chats.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i).slice(0, 25);
}

console.log("TeamsFlow: Motor Corporativo v8 (Semáforo + Unread) Ativo.");
injectUI();
setInterval(injectUI, 5000);
