// TeamsFlow Pro - Content Script
console.log("TeamsFlow Pro: Iniciado");

let isKanbanOpen = false;
let isResponsesOpen = false;

// Função para injetar o menu de ações
function injectFlowMenu() {
  if (document.getElementById('tf-flow-menu')) return;

  const menu = document.createElement('div');
  menu.id = 'tf-flow-menu';
  menu.innerHTML = `
    <div class="tf-fab-container">
      <div class="tf-fab-options">
        <button id="tf-btn-responses" title="Respostas Rápidas"><span>R</span></button>
        <button id="tf-btn-kanban" title="Abrir Kanban"><span>K</span></button>
      </div>
      <button id="tf-fab-main" class="tf-fab-main">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M11 3v18"/><path d="M3 8h8"/><path d="M3 13h8"/><path d="M3 18h8"/><path d="M11 13h10"/></svg>
      </button>
    </div>
  `;
  document.body.appendChild(menu);

  document.getElementById('tf-btn-kanban').onclick = toggleKanban;
  document.getElementById('tf-btn-responses').onclick = toggleResponses;
  document.getElementById('tf-fab-main').onclick = () => {
    document.querySelector('.tf-fab-container').classList.toggle('active');
  };
}

function toggleKanban() {
  isKanbanOpen = !isKanbanOpen;
  if (isKanbanOpen) {
    const overlay = document.createElement('iframe');
    overlay.id = 'tf-kanban-overlay';
    overlay.src = chrome.runtime.getURL('kanban.html');
    document.body.appendChild(overlay);
    // Envia os chats recentes para o iframe assim que carregar
    overlay.onload = () => {
      const chats = scrapeRecentChats();
      overlay.contentWindow.postMessage({ type: 'TF_RECENT_CHATS', chats }, '*');
    };
  } else {
    document.getElementById('tf-kanban-overlay')?.remove();
  }
}

function toggleResponses() {
  isResponsesOpen = !isResponsesOpen;
  if (isResponsesOpen) {
    const overlay = document.createElement('iframe');
    overlay.id = 'tf-responses-overlay';
    overlay.src = chrome.runtime.getURL('responses.html');
    document.body.appendChild(overlay);
  } else {
    document.getElementById('tf-responses-overlay')?.remove();
  }
}

// Scraper de conversas reais do Teams
function scrapeRecentChats() {
  const chatElements = document.querySelectorAll('[data-tid="chat-list-item"]');
  const chats = [];
  chatElements.forEach((el, index) => {
    if (index > 10) return; // Limita aos 10 primeiros
    const name = el.querySelector('[class*="title"]')?.innerText || "Contato";
    const msg = el.querySelector('[class*="message"]')?.innerText || "Sem mensagens";
    const url = window.location.href; // Simplificado: usa a URL atual
    chats.push({ id: `recent-${index}`, name, lastMessage: msg, url });
  });
  return chats;
}

// Listener para fechar overlays e outras comunicações
window.addEventListener('message', (event) => {
  if (event.data.type === 'TF_CLOSE_KANBAN') toggleKanban();
  if (event.data.type === 'TF_CLOSE_RESPONSES') toggleResponses();
});

// Monitor de digitação para Respostas Rápidas
document.addEventListener('input', (e) => {
  const target = e.target;
  if (target.tagName === 'DIV' && target.getAttribute('contenteditable') === 'true') {
    const text = target.innerText;
    if (text.includes('/')) {
      chrome.storage.local.get(['responses'], (result) => {
        const responses = result.responses || [];
        responses.forEach(r => {
          if (text.endsWith(r.trigger)) {
            const newText = text.replace(r.trigger, r.text);
            target.innerText = newText;
            // Posiciona o cursor no final
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(target);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        });
      });
    }
  }
});

setInterval(injectFlowMenu, 2000);