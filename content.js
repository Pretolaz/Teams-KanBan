// Teams KanBan Flow - Content Script v13
let uiInjected = false;
let responsesCache = [];

function updateResponsesCache() {
    try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
            chrome.storage.local.get(['responses'], (data) => {
                if (chrome.runtime.lastError) return;
                responsesCache = data.responses || [];
                console.log(`Teams KanBan Flow: Cache atualizado (${responsesCache.length} atalhos).`);
            });
        }
    } catch (e) {
        console.warn("Teams KanBan Flow: Contexto invalidado.");
    }
}

function injectUI() {
    if (uiInjected || !document.body) return;
    console.log("Teams KanBan Flow: Injetando UI...");

    const sidebarFrame = document.createElement('iframe');
    sidebarFrame.src = chrome.runtime.getURL('sidebar.html');
    sidebarFrame.id = 'tf-iframe';
    sidebarFrame.style.display = 'none';
    sidebarFrame.style.position = 'fixed';
    sidebarFrame.style.zIndex = '9999998';
    document.body.appendChild(sidebarFrame);

    const triggerButton = document.createElement('button');
    triggerButton.id = 'tf-trigger';
    triggerButton.textContent = 'TKF';
    triggerButton.style.position = 'fixed';
    triggerButton.style.zIndex = '9999999';
    document.body.appendChild(triggerButton);

    triggerButton.title = 'Teams KanBan Flow (Alt+K)';

    triggerButton.onclick = () => {
        const isHidden = sidebarFrame.style.display === 'none';
        sidebarFrame.style.display = isHidden ? 'block' : 'none';
        if (sidebarFrame.style.display === 'block') {
            updateChats(sidebarFrame);
            updateResponsesCache();
        }
    };

    // Atalho de teclado Alt+K
    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key === 'k') {
            e.preventDefault();
            triggerButton.click();
        }
    });

    window.addEventListener('message', (event) => {
        if (event.data.type === 'TEAMSFLOW_CLOSE') sidebarFrame.style.display = 'none';
        if (event.data.type === 'TEAMSFLOW_REQUEST_CHATS') updateChats(sidebarFrame);
        if (event.data.type === 'TEAMSFLOW_GOTO_CHAT') {
            navigateToChat(event.data.name);
            // Fecha o sidebar após um pequeno delay para garantir que o
            // clique no chat seja processado antes do iframe sumir
            setTimeout(() => { sidebarFrame.style.display = 'none'; }, 300);
        }
    });

    uiInjected = true;
    setupQuickReplies();
}

let isExpanding = false;
let lastTriggerMatch = "";
let lastTriggerTime = 0;

function setupQuickReplies() {
    console.log("Teams KanBan Flow: Monitorando expansão v53.4 (v53 + Regex Fix)...");

    const syncToEditor = (el, text) => {
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', text);

        // Conversão para HTML para garantir que o CKEditor respeite as quebras de linha
        // CKEditor e outros Rich Text Editors preferem text/html para formatação
        const escapeHtml = (unsafe) => {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        };
        const html = escapeHtml(text).replace(/\n/g, '<br>');
        dataTransfer.setData('text/html', html);

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

            // v53.4: Correção Crítica de Regex para Backslash
            // Transforma \b em \\u200B*b e não em \b (backspace)
            const escapedTrigger = trigger.split('').map(c => c === '\\' ? '\\\\' : c).join('\\u200B*');
            const triggerRegex = new RegExp(escapedTrigger + '$');

            const match = suffix.match(triggerRegex);

            if (match) {
                // Proteção contra múltiplos disparos
                if (trigger === lastTriggerMatch && (Date.now() - lastTriggerTime) < 2000) return;

                console.log(`Teams KanBan Flow: [MATCH] v53.4 para "${trigger}"...`);

                isExpanding = true;
                lastTriggerMatch = trigger;
                lastTriggerTime = Date.now();

                try {
                    const replacement = resp.text + " ";
                    const matchLen = match[0].length;

                    // 1. SELEÇÃO CIRÚRGICA (v53 CLÁSSICA)
                    el.focus();
                    const surgicalRange = document.createRange();
                    surgicalRange.setStart(node, offset - matchLen);
                    surgicalRange.setEnd(node, offset);
                    sel.removeAllRanges();
                    sel.addRange(surgicalRange);

                    // Delay crucial da v53 que garantia a estabilidade
                    await new Promise(r => setTimeout(r, 10));

                    // 2. ATOMIC PASTE (Deixa o CKEditor resolver)
                    syncToEditor(el, replacement);

                    // 3. FINALIZAÇÃO E VERIFICAÇÃO POSTERIOR
                    setTimeout(() => {
                        // Verificação de segurança v53 original
                        if (el.textContent.includes(trigger)) {
                            console.warn("Teams KanBan Flow: Atomic Paste falhou na remoção. Tentando fallback v53...");
                            // Fallback clássico v53
                            try {
                                const range = document.createRange();
                                range.selectNodeContents(el);
                                const text = el.textContent;
                                const idx = text.lastIndexOf(trigger);
                                if (idx !== -1) {
                                    range.setStart(el.firstChild, idx);
                                    range.setEnd(el.firstChild, idx + trigger.length);
                                    sel.removeAllRanges();
                                    sel.addRange(range);
                                    document.execCommand('delete', false, null);
                                    syncToEditor(el, replacement);
                                }
                            } catch (e) { }
                        }

                        // Restaura cursor
                        try {
                            const lastRange = document.createRange();
                            lastRange.selectNodeContents(el);
                            lastRange.collapse(false);
                            sel.removeAllRanges();
                            sel.addRange(lastRange);
                        } catch (e) { }

                        setTimeout(() => { isExpanding = false; }, 400);
                        console.log("Teams KanBan Flow: Ciclo v53.4 finalizado.");
                    }, 100);

                    break;

                } catch (err) {
                    console.error("TeamsFlow Error v53.4:", err);
                    isExpanding = false;
                }
            }
        }
    };


    // --- Lógica do Popup de Sugestões ---
    let suggestionBox = null;
    let selectedIndex = -1;
    let currentMatch = null;

    const createSuggestionBox = () => {
        if (document.getElementById('tf-suggestion-box')) return;
        suggestionBox = document.createElement('div');
        suggestionBox.id = 'tf-suggestion-box';
        document.body.appendChild(suggestionBox);
    };

    const hideSuggestions = () => {
        if (suggestionBox) {
            suggestionBox.style.display = 'none';
            selectedIndex = -1;
            currentMatch = null;
        }
    };

    const showSuggestions = (rect, matches, query) => {
        if (!suggestionBox) createSuggestionBox();

        suggestionBox.innerHTML = '';
        suggestionBox.style.display = 'block';

        // Renderiza primeiro para calcular altura
        matches.forEach((resp, index) => {
            const item = document.createElement('div');
            item.className = 'tf-suggestion-item';
            if (index === selectedIndex) item.classList.add('active');

            item.innerHTML = `
                <span class="tf-suggestion-trigger">${resp.trigger}</span>
                <span class="tf-suggestion-preview">${resp.text.substring(0, 30)}${resp.text.length > 30 ? '...' : ''}</span>
            `;

            item.onmousedown = (e) => {
                e.preventDefault(); // Impede perda de foco
                completeSuggestion(resp, query);
            };

            suggestionBox.appendChild(item);
        });

        // Posicionamento ACIMA do cursor
        const boxHeight = suggestionBox.offsetHeight;
        suggestionBox.style.top = (rect.top + window.scrollY - boxHeight - 5) + 'px';
        suggestionBox.style.left = (rect.left + window.scrollX) + 'px';
    };

    const completeSuggestion = (resp, query) => {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        const node = range.startContainer;
        const offset = range.startOffset;

        // Remove o que foi digitado até agora (ex: \bo)
        const queryLen = query.length;

        // Ajuste fino: Se o usuário clicou, precisamos garantir que o foco está no lugar certo
        // A lógica de expansão original (handleExpansion) cuida da troca completa
        // Aqui simula a digitação completa do gatilho + espaço para ativar o handleExpansion existente

        // 1. Remove o texto parcial
        const surgicalRange = document.createRange();
        surgicalRange.setStart(node, offset - queryLen);
        surgicalRange.setEnd(node, offset);
        sel.removeAllRanges();
        sel.addRange(surgicalRange);
        document.execCommand('delete');

        // 2. Insere o gatilho completo
        document.execCommand('insertText', false, resp.trigger + ' ');

        hideSuggestions();
    };

    const handleInput = (e) => {
        const el = e.target;
        const sel = window.getSelection();
        if (!sel.rangeCount) return;

        const range = sel.getRangeAt(0);
        const node = range.startContainer;
        const offset = range.startOffset;

        if (node.nodeType !== Node.TEXT_NODE) {
            hideSuggestions();
            return;
        }

        const text = node.textContent;
        // Pega a palavra atual sendo digitada
        const textBeforeCursor = text.substring(0, offset);
        const lastWordMatch = textBeforeCursor.match(/(\\[^\s]*)$/); // Captura algo começando com \ até o cursor

        if (lastWordMatch) {
            const query = lastWordMatch[0];

            // Filtra respostas que começam com o que foi digitado
            const matches = responsesCache.filter(r => r.trigger.startsWith(query));

            if (matches.length > 0) {
                const rect = range.getBoundingClientRect();
                if (rect.width === 0 && rect.height === 0) {
                    // Fallback se range collapsed não der rect (as vezes acontece)
                    const span = document.createElement('span');
                    span.textContent = '|';
                    range.insertNode(span);
                    const spanRect = span.getBoundingClientRect();
                    span.parentNode.removeChild(span);
                    showSuggestions(spanRect, matches, query);
                } else {
                    showSuggestions(rect, matches, query);
                }
            } else {
                hideSuggestions();
            }
        } else {
            hideSuggestions();
        }
    };

    ['input', 'keyup', 'click'].forEach(evtType => {
        document.addEventListener(evtType, (e) => {
            const el = e.target;
            const isEditor = el && (
                el.getAttribute('contenteditable') === 'true' ||
                el.getAttribute('data-tid') === 'ckeditor' ||
                el.closest('[contenteditable="true"]')
            );

            if (isEditor) {
                if (evtType === 'input' || evtType === 'keyup') handleInput(e);
                // Fecha se clicar fora
                if (evtType === 'click' && !e.target.closest('#tf-suggestion-box')) hideSuggestions();
            }

            // Mantém a lógica original de expansão no input/keyup
            if (isEditor && (evtType === 'input' || evtType === 'keyup')) handleExpansion(el);
        }, true);
    });
}

function updateChats(frame) {
    const chats = getRecentChats();
    frame.contentWindow.postMessage({ type: 'TF_RECENT_CHATS', chats: chats }, '*');
}

function navigateToChat(name) {
    try {
        console.log(`Teams KanBan Flow: Navegando para chat "${name}"...`);

        // Estratégia 1: Elemento exato identificado por inspeção do DOM do Teams
        // O elemento data-inp="simple-collab-unified-chat-switch" é o layout interno
        // do item de chat. Clicar nele abre o chat SEM colapsar a seção/grupo pai.
        // Clicar no container fui-TreeItem faz toggle da seção — NÃO usar.
        const layoutEls = Array.from(document.querySelectorAll('[data-inp="simple-collab-unified-chat-switch"]'));
        let target = layoutEls.find(el => {
            const text = el.textContent.trim().toLowerCase();
            return text && (text.includes(name.toLowerCase()) || name.toLowerCase().includes(text));
        });

        // Estratégia 2 (fallback): Busca pelo span de título e sobe para o layout pai
        if (!target) {
            const titleSpans = Array.from(document.querySelectorAll('span[id^="title-chat-list-item_"]'));
            const titleEl = titleSpans.find(el => {
                const text = el.textContent.trim().toLowerCase();
                return text && (text.includes(name.toLowerCase()) || name.toLowerCase().includes(text));
            });
            if (titleEl) {
                target = titleEl.closest('.fui-TreeItemLayout, [data-inp]') || titleEl.parentElement;
            }
        }

        if (target) {
            console.log('Teams KanBan Flow: Chat encontrado. Acionando via layout interno...');
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });

            target.dispatchEvent(new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
                buttons: 1
            }));

            if (typeof target.focus === 'function') target.focus();
            return true;
        } else {
            // Chat não encontrado — pode estar fora da tela ou em seção recolhida.
            // Apenas loga silenciosamente. O sidebar será fechado normalmente.
            console.warn(`Teams KanBan Flow: Chat "${name}" não visível na barra lateral. Fechando Kanban.`);
            return false;
        }
    } catch (err) {
        // Suprime qualquer erro inesperado para não poluir o console nem
        // gerar alertas na página de extensões do Chrome.
        console.warn('Teams KanBan Flow: Erro silencioso em navigateToChat.', err.message);
        return false;
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
