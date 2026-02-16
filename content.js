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
    console.log(`TeamsFlow: Recebida solicitação de navegação para: "${name}"`);

    // 1. Busca pelo título identificado pelo usuário
    const titleSpans = Array.from(document.querySelectorAll('span[id^="title-chat-list-item_"]'));
    const target = titleSpans.find(s => {
        const spanText = s.textContent.trim().toLowerCase();
        const searchName = name.trim().toLowerCase();
        return spanText === searchName || spanText.includes(searchName);
    });

    if (target) {
        // 2. Busca o container clicável (adicionado TreeItem por conta da nova evidência)
        const clickable = target.closest('[role="row"], [role="listitem"], [role="treeitem"], .fui-ListItem, .fui-TreeItem, [data-tid*="chat-list-item"]');

        if (clickable) {
            console.log("TeamsFlow: Elemento clicável (TreeItem) encontrado. Navegando...");

            // Simula clique real para disparar o React
            ['mousedown', 'mouseup', 'click'].forEach(evtType => {
                clickable.dispatchEvent(new MouseEvent(evtType, {
                    view: window, bubbles: true, cancelable: true, buttons: 1
                }));
            });
            clickable.focus();
            return;
        }
    }

    // Fallback: Tenta clicar em qualquer coisa que tenha o nome no Aria-Label
    console.log("TeamsFlow: Tentando navegação via fallback de Aria-Label...");
    const allAria = Array.from(document.querySelectorAll('[aria-label]'));
    const fallbackTarget = allAria.find(el => {
        const label = el.getAttribute('aria-label')?.toLowerCase() || "";
        return label.includes(name.toLowerCase()) && (el.getAttribute('role') === 'treeitem' || el.classList.contains('fui-TreeItem') || el.classList.contains('fui-ListItem'));
    });

    if (fallbackTarget) {
        fallbackTarget.click();
        console.log("TeamsFlow: Navegação via fallback executada.");
    } else {
        console.warn(`TeamsFlow: Não foi possível encontrar o chat "${name}" na tela.`);
    }
}

function getRecentChats() {
    // Busca por títulos com IDs específicos do v2
    const titleSpans = Array.from(document.querySelectorAll('span[id^="title-chat-list-item_"]'));
    const chats = [];

    titleSpans.forEach((span, index) => {
        const name = span.textContent.trim();

        // No Teams v2, o TreeItem/ListItem agora é o container padrão
        const itemContainer = span.closest('[role="row"], [role="listitem"], [role="treeitem"], .fui-ListItem, .fui-TreeItem');
        let hasUnread = false;

        if (itemContainer) {
            // Verifica unread via classe ou presença de bolinha
            const unreadIndicator = itemContainer.querySelector('[class*="unread"], .fui-PresenceBadge, [aria-label*="não lida"]');
            const isBold = window.getComputedStyle(span).fontWeight >= 600;
            hasUnread = !!unreadIndicator || isBold;
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

console.log("TeamsFlow: Motor Corporativo v9 (TreeItem Support) Ativo.");
injectUI();
setInterval(injectUI, 5000);
