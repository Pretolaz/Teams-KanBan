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

function setupQuickReplies() {
    console.log("TeamsFlow: Monitorando expansão v20 (The Infiltrator)...");

    const syncToEditor = (el, text) => {
        // Dispara eventos que o CKEditor/React monitoram para colagem
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', text);

        const pasteEvent = new ClipboardEvent('paste', {
            clipboardData: dataTransfer,
            bubbles: true,
            cancelable: true
        });

        el.dispatchEvent(pasteEvent);

        // Garante que o input event seja disparado como 'insertFromPaste'
        const inputEvent = new InputEvent('input', {
            inputType: 'insertFromPaste',
            data: text,
            bubbles: true
        });
        el.dispatchEvent(inputEvent);
    };

    // Conjunto para evitar re-entrada na mesma execução
    const activeExpansions = new Set();

    const handleExpansion = (el) => {
        if (isExpanding) return;

        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const node = range.startContainer;
        const offset = range.startOffset;

        // Só processamos em nós de texto
        if (node.nodeType !== Node.TEXT_NODE) return;

        const textContent = node.textContent || "";
        const textBeforeCursor = textContent.substring(0, offset);

        responsesCache.forEach(resp => {
            const trigger = resp.trigger;
            // Limpeza de caracteres invisíveis (ZWSP) comuns no Teams
            const cleanText = textBeforeCursor.replace(/\u200B/g, '');

            if (cleanText.endsWith(trigger) && !activeExpansions.has(trigger)) {
                console.log(`TeamsFlow: [MATCH] v28 corrigindo duplicação de "${trigger}"...`);

                isExpanding = true;
                activeExpansions.add(trigger);

                try {
                    const replacement = resp.text + " ";
                    const triggerLen = trigger.length;

                    // --- Passo 1: Selecionar o Gatilho ---
                    const expandRange = document.createRange();
                    const startPos = Math.max(0, offset - triggerLen);
                    expandRange.setStart(node, startPos);
                    expandRange.setEnd(node, offset);

                    // Coloca o foco na seleção do gatilho
                    selection.removeAllRanges();
                    selection.addRange(expandRange);

                    // --- Passo 2: Substituição via Simulação de Colagem ---
                    // Em vez de deleteContents(), vamos deixar o evento de paste 
                    // sobrescrever a seleção atual (que é o próprio gatilho).
                    // Isso é o que um "colar" real faz e o CKEditor aceita melhor.
                    syncToEditor(el, replacement);

                    // --- Passo 3: Limpeza de Segurança ---
                    // Se por algum motivo o editor duplicou (inseriu ao lado em vez de substituir)
                    // fazemos uma limpeza manual rápida no próximo frame
                    setTimeout(() => {
                        const currentText = node.textContent;
                        if (currentText.includes(trigger + resp.text)) {
                            console.log("TeamsFlow: Detectada duplicação, limpando...");
                            const badString = trigger + resp.text;
                            node.textContent = currentText.replace(badString, resp.text + " ");
                        }

                        isExpanding = false;
                        activeExpansions.delete(trigger);
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                    }, 500);

                } catch (err) {
                    console.error("TeamsFlow Error v28:", err);
                    isExpanding = false;
                    activeExpansions.delete(trigger);
                }
            }
        });
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
