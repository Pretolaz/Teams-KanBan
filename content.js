// TeamsFlow Pro - Content Script v13
let uiInjected = false;
let responsesCache = [];

function updateResponsesCache() {
    try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
            chrome.storage.local.get(['responses'], (data) => {
                if (chrome.runtime.lastError) return;
                responsesCache = data.responses || [];
                console.log(`TeamsFlow: Cache atualizado (${responsesCache.length} atalhos).`);
            });
        }
    } catch (e) {
        console.warn("TeamsFlow: Contexto invalidado.");
    }
}

function injectUI() {
    if (uiInjected || !document.body) return;
    console.log("TeamsFlow: Injetando UI...");

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
            updateResponsesCache();
        }
    };

    window.addEventListener('message', (event) => {
        if (event.data.type === 'TEAMSFLOW_CLOSE') sidebarFrame.style.display = 'none';
        if (event.data.type === 'TEAMSFLOW_REQUEST_CHATS') updateChats(sidebarFrame);
        if (event.data.type === 'TEAMSFLOW_GOTO_CHAT') {
            navigateToChat(event.data.name);
            sidebarFrame.style.display = 'none';
        }
    });

    uiInjected = true;
    setupQuickReplies();
}

let isExpanding = false;
let lastTriggerMatch = "";
let lastTriggerTime = 0;

function setupQuickReplies() {
    console.log("TeamsFlow: Monitorando expansão v51 (The One-Shot)...");

    const syncToEditor = (el, text) => {
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', text);
        const pasteEvent = new ClipboardEvent('paste', {
            clipboardData: dataTransfer,
            bubbles: true,
            cancelable: true
        });
        el.dispatchEvent(pasteEvent);
    };

    const handleExpansion = async (el) => {
        if (isExpanding) return;

        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        const node = range.startContainer;
        const offset = range.startOffset;

        if (node.nodeType !== Node.TEXT_NODE) return;

        const textContent = node.textContent || "";

        for (const resp of responsesCache) {
            const trigger = resp.trigger;
            const suffix = textContent.substring(0, offset);
            const triggerRegex = new RegExp(trigger.split('').join('\\u200B*') + '$');
            const match = suffix.match(triggerRegex);

            if (match) {
                // Proteção contra múltiplos disparos
                if (trigger === lastTriggerMatch && (Date.now() - lastTriggerTime) < 2000) return;

                console.log(`TeamsFlow: [MATCH] v51 (One-Shot) para "${trigger}"...`);

                isExpanding = true;
                lastTriggerMatch = trigger;
                lastTriggerTime = Date.now();

                try {
                    const replacement = resp.text + " ";

                    // 1. LIMPEZA TOTAL IMEDIATA
                    el.focus();
                    sel.selectAllChildren(el);

                    // Comando oficial para o modelo do editor
                    document.execCommand('delete', false, null);

                    // Limpeza física do DOM
                    el.innerHTML = '';
                    el.textContent = '';
                    while (el.firstChild) { el.removeChild(el.firstChild); }

                    // Notifica o React que o campo está vazio
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));

                    // 2. ESPERA PELO REACT/TEAMS (Crucial)
                    await new Promise(r => setTimeout(r, 60));

                    // 3. INSERÇÃO ÚNICA VIA COLAGEM
                    syncToEditor(el, replacement);

                    // 4. LOCK E SINCRONIZAÇÃO FINAL
                    setTimeout(() => {
                        // Faxina de última instância: se o /b voltou, removemos agora
                        if (el.textContent.includes(trigger)) {
                            el.textContent = el.textContent.replace(trigger, "").trim() + " ";
                        }

                        el.dispatchEvent(new CompositionEvent('compositionend', { data: replacement, bubbles: true }));
                        ['input', 'change'].forEach(ev => el.dispatchEvent(new Event(ev, { bubbles: true })));

                        // Resgata cursor
                        try {
                            const lastRange = document.createRange();
                            lastRange.selectNodeContents(el);
                            lastRange.collapse(false);
                            sel.removeAllRanges();
                            sel.addRange(lastRange);
                        } catch (e) { }

                        setTimeout(() => { isExpanding = false; }, 500);
                        console.log("TeamsFlow: Ciclo v51 finalizado com sucesso.");
                    }, 50);

                    break;

                } catch (err) {
                    console.error("TeamsFlow Error v51:", err);
                    isExpanding = false;
                }
            }
        }
    };

    ['input', 'keyup'].forEach(evtType => {
        document.addEventListener(evtType, (e) => {
            const el = e.target;
            const isEditor = el && (
                el.getAttribute('contenteditable') === 'true' ||
                el.getAttribute('data-tid') === 'ckeditor' ||
                el.closest('[contenteditable="true"]')
            );
            if (isEditor) handleExpansion(el);
        }, true);
    });
}

function updateChats(frame) {
    const chats = getRecentChats();
    frame.contentWindow.postMessage({ type: 'TF_RECENT_CHATS', chats: chats }, '*');
}

function navigateToChat(name) {
    console.log(`TeamsFlow: Navegando para chat "${name}"...`);

    // Seletores variados para garantir compatibilidade com Teams V2
    const selectors = [
        'span[id^="title-chat-list-item_"]',
        '[data-tid*="chat-list-item-title"]',
        '.fui-TreeItem__content',
        '[role="treeitem"]'
    ];

    const elements = Array.from(document.querySelectorAll(selectors.join(',')));
    const target = elements.find(el => {
        const text = el.textContent.trim().toLowerCase();
        return text && (text.includes(name.toLowerCase()) || name.toLowerCase().includes(text));
    });

    if (target) {
        const clickable = target.closest('[role="row"], [role="listitem"], [role="treeitem"], .fui-ListItem, .fui-TreeItem') || target;

        console.log("TeamsFlow: Chat encontrado. Acionando...");
        clickable.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Sequência de eventos para "enganar" o React/Teams
        ['mousedown', 'mouseup', 'click'].forEach(evtType => {
            clickable.dispatchEvent(new MouseEvent(evtType, {
                view: window,
                bubbles: true,
                cancelable: true,
                buttons: 1
            }));
        });

        if (typeof clickable.focus === 'function') clickable.focus();
    } else {
        console.warn(`TeamsFlow: Chat "${name}" não localizado na barra lateral.`);
    }
}

function getRecentChats() {
    // Busca abrangente por itens de chat
    const titleElements = Array.from(document.querySelectorAll('span[id^="title-chat-list-item_"], [data-tid*="chat-list-item-title"]'));
    const chats = [];

    titleElements.forEach((el, index) => {
        const name = el.textContent.trim();
        if (!name || name === "Chats" || name === "Conversas") return;

        const itemContainer = el.closest('[role="row"], [role="listitem"], [role="treeitem"], .fui-ListItem, .fui-TreeItem');
        let unread = false;

        if (itemContainer) {
            unread = !!itemContainer.querySelector('[class*="unread"], .fui-PresenceBadge, [aria-label*="não lida"], [aria-label*="unread"]') ||
                window.getComputedStyle(el).fontWeight >= 600;
        }

        chats.push({
            id: 'chat-' + index,
            name: name,
            hasUnread: unread
        });
    });

    // Remove duplicatas e limita a lista
    return chats.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i).slice(0, 25);
}

updateResponsesCache();
injectUI();
setInterval(injectUI, 5000);
setInterval(updateResponsesCache, 10000);
