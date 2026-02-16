// TeamsFlow Pro - Content Script
let uiInjected = false;
let chatsInterval = null;

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
            console.log("TeamsFlow: Sidebar aberta, atualizando chats...");
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
    });

    uiInjected = true;
    console.log("TeamsFlow: UI Injetada com sucesso.");
    startChatDetection(sidebarFrame);
}

function updateChats(frame) {
    const chats = getRecentChats();
    console.log(`TeamsFlow: Enviando ${chats.length} chats para a sidebar.`);
    frame.contentWindow.postMessage({ type: 'TF_RECENT_CHATS', chats: chats }, '*');
}

function startChatDetection(frame) {
    if (chatsInterval) clearInterval(chatsInterval);
    chatsInterval = setInterval(() => {
        if (document.visibilityState === 'visible') {
            const chats = getRecentChats();
            if (chats.length > 0) {
                frame.contentWindow.postMessage({ type: 'TF_RECENT_CHATS', chats: chats }, '*');
            }
        }
    }, 4000);
}

function getRecentChats() {
    console.log("TeamsFlow: Buscando chats (Foco em IDs de Título)...");

    // 1. USA A DICA DO USUÁRIO: Busca por spans que comecem com "title-chat-list-item_"
    const titleSpans = Array.from(document.querySelectorAll('span[id^="title-chat-list-item_"]'));

    if (titleSpans.length > 0) {
        console.log(`TeamsFlow: Encontrados ${titleSpans.length} títulos via ID específico.`);
    }

    const chats = [];

    titleSpans.forEach((span, index) => {
        const name = span.textContent.trim();
        let lastMsg = "Sem mensagem...";

        // Tenta encontrar o container do item (geralmente alguns níveis acima)
        // No Teams v2, o item de lista costuma ser um ancestral próximo do título
        const itemContainer = span.closest('[role="row"], [role="listitem"], .fui-ListItem, [class*="item"]');

        if (itemContainer) {
            // Se achou o container, busca a mensagem dentro dele
            const msgEl = itemContainer.querySelector('[class*="message"], [class*="description"], [data-tid*="last-message"]');
            if (msgEl) {
                lastMsg = msgEl.textContent.trim();
            } else {
                // Fallback: procura o próximo span ou div que tenha texto longo dentro do container
                const allTexts = Array.from(itemContainer.querySelectorAll('span'))
                    .map(s => s.textContent.trim())
                    .filter(t => t.length > 3 && t !== name && !/^\d{1,2}:\d{2}/.test(t));
                if (allTexts.length > 0) lastMsg = allTexts[0];
            }
        }

        if (name && name !== "Chats") {
            chats.push({
                id: span.id || 'chat-' + index,
                name: name,
                lastMessage: lastMsg.length > 80 ? lastMsg.substring(0, 80) + "..." : lastMsg,
                createdAt: new Date().toISOString()
            });
        }
    });

    // Fallback: Se a busca por ID falhar, usa a busca por Aria-Label
    if (chats.length === 0) {
        console.log("TeamsFlow: IDs específicos não encontrados. Usando busca por Aria-Label...");
        const ariaItems = Array.from(document.querySelectorAll('div[aria-label]')).filter(el => {
            const label = el.getAttribute('aria-label');
            return label && (label.includes('Chat com') || label.includes('Chat with') || label.includes('Conversa'));
        });

        ariaItems.forEach((item, index) => {
            const label = item.getAttribute('aria-label');
            const name = label.split(',')[0].replace(/Chat (com|with|de|from)\s+/i, '').trim();
            const lastMsg = label.includes(',') ? label.split(',')[1].trim() : "Sem mensagem...";

            if (name && name !== "Chats") {
                chats.push({
                    id: 'aria-chat-' + index,
                    name: name,
                    lastMessage: lastMsg,
                    createdAt: new Date().toISOString()
                });
            }
        });
    }

    // Limpeza de duplicatas
    const finalResult = chats.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i).slice(0, 25);
    console.log(`TeamsFlow: ${finalResult.length} chats extraídos.`);
    return finalResult;
}

console.log("TeamsFlow: Motor Corporativo v6 (Focado em IDs) Ativo.");
injectUI();
setInterval(injectUI, 5000);
