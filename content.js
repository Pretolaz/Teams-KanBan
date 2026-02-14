
/**
 * Motor de Produtividade TeamsFlow
 * Injeta a interface e captura chats
 */

console.log("TeamsFlow: Iniciando motor de produtividade...");

function injectTriggerButton() {
  if (document.getElementById('teamsflow-trigger')) return;

  const btn = document.createElement('div');
  btn.id = 'teamsflow-trigger';
  btn.innerHTML = `
    <div style="width: 50px; height: 50px; background: #6264A7; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border: 2px solid rgba(255,255,255,0.2); transition: transform 0.2s;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M11 3v18"/><path d="M3 11h8"/><path d="M11 15h10"/></svg>
    </div>
  `;
  btn.style.cssText = "position: fixed; bottom: 20px; right: 20px; z-index: 2147483647;";
  
  btn.onclick = () => {
    const overlay = document.getElementById('teamsflow-overlay');
    if (overlay) {
      const isVisible = overlay.style.display !== 'none';
      overlay.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        // Ao abrir, solicita atualização dos chats
        window.postMessage({ type: 'TEAMSFLOW_REQUEST_CHATS' }, '*');
      }
    }
  };

  document.documentElement.appendChild(btn);
}

function injectOverlay() {
  if (document.getElementById('teamsflow-overlay')) return;

  const container = document.createElement('div');
  container.id = 'teamsflow-overlay';
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px);
    z-index: 2147483646;
    display: none;
    align-items: center;
    justify-content: center;
  `;

  const iframe = document.createElement('iframe');
  iframe.id = 'teamsflow-iframe';
  iframe.src = chrome.runtime.getURL('sidebar.html');
  iframe.style.cssText = `
    width: 90%;
    height: 90%;
    border: none;
    border-radius: 16px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    background: transparent;
  `;

  container.appendChild(iframe);
  document.documentElement.appendChild(container);
}

// Scraper de chats aprimorado para Teams V2
function findRecentChats() {
  const chats = [];
  // Seletores mais abrangentes para o Teams moderno
  const items = document.querySelectorAll('[data-tid="chat-list-item"], [role="gridcell"] div[aria-label], .fui-ChatListItem');
  
  items.forEach(item => {
    const nameEl = item.querySelector('[data-tid="chat-list-item-title"], .fui-StyledText, b');
    const msgEl = item.querySelector('[data-tid="chat-list-item-context"], .fui-ChatListItem__message, span');
    
    if (nameEl && nameEl.textContent.trim()) {
      const name = nameEl.textContent.trim();
      // Evita duplicados e nomes de sistema
      if (!chats.find(c => c.name === name) && name.length > 1) {
        chats.push({
          id: 'chat-' + Math.random().toString(36).substr(2, 9),
          name: name,
          lastMessage: msgEl ? msgEl.textContent.trim() : 'Sem mensagens recentes',
          url: window.location.href
        });
      }
    }
  });

  return chats.slice(0, 15); // Top 15 chats
}

// Comunicação
window.addEventListener('message', (event) => {
  if (event.data.type === 'TEAMSFLOW_CLOSE') {
    const overlay = document.getElementById('teamsflow-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  if (event.data.type === 'TEAMSFLOW_REQUEST_CHATS') {
    const iframe = document.getElementById('teamsflow-iframe');
    if (iframe && iframe.contentWindow) {
      const chats = findRecentChats();
      iframe.contentWindow.postMessage({ type: 'TEAMSFLOW_CHATS_DATA', chats }, '*');
    }
  }
});

// Auto-replace de respostas rápidas
document.addEventListener('input', (e) => {
  const target = e.target;
  if (target.getAttribute('contenteditable') === 'true' || target.tagName === 'TEXTAREA') {
    chrome.storage.local.get(['responses'], (result) => {
      const responses = result.responses || [];
      const content = target.innerText || target.value;
      
      responses.forEach(resp => {
        if (content.includes(resp.trigger + ' ')) {
          const newText = content.replace(resp.trigger + ' ', resp.text + ' ');
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
      });
    });
  }
}, true);

// Loop de persistência
setInterval(() => {
  injectTriggerButton();
  injectOverlay();
}, 2000);
