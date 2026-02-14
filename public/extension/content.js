console.log("TeamsFlow: Motor de produtividade ativo.");

let isSidebarOpen = false;

// 1. Injetor de Botão Flutuante
function injectUI() {
  if (document.getElementById('teamsflow-trigger')) return;

  const btn = document.createElement('button');
  btn.id = 'teamsflow-trigger';
  btn.innerHTML = 'T';
  btn.style.cssText = `
    position: fixed; bottom: 20px; right: 20px; z-index: 10000;
    width: 50px; height: 50px; border-radius: 25px;
    background: #4f46e5; color: white; border: none; font-weight: bold;
    cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  `;
  btn.onclick = toggleSidebar;
  btn.onmouseover = () => btn.style.transform = 'scale(1.1)';
  btn.onmouseout = () => btn.style.transform = 'scale(1)';
  document.documentElement.appendChild(btn);

  const iframe = document.createElement('iframe');
  iframe.id = 'teamsflow-sidebar';
  iframe.src = chrome.runtime.getURL('sidebar.html');
  iframe.style.cssText = `
    position: fixed; top: 0; right: -100%; width: 100%; height: 100%;
    z-index: 9999; border: none; background: rgba(255,255,255,0.8);
    backdrop-filter: blur(10px); transition: right 0.4s ease;
  `;
  document.documentElement.appendChild(iframe);
}

function toggleSidebar() {
  const iframe = document.getElementById('teamsflow-sidebar');
  isSidebarOpen = !isSidebarOpen;
  iframe.style.right = isSidebarOpen ? '0' : '-100%';
  if (isSidebarOpen) syncChats();
}

// 2. Scraper de Chats (Específico para Teams V2)
function syncChats() {
  const chats = [];
  // Procura por itens na lista de chat lateral
  const chatElements = document.querySelectorAll('div[data-tid="chat-list-item"], .chat-list-item, [role="listitem"]');
  
  chatElements.forEach((el, index) => {
    if (index > 10) return; // Limita aos 10 primeiros
    const nameEl = el.querySelector('[data-tid="chat-list-item-title"], .ui-chat-item__header');
    const msgEl = el.querySelector('[data-tid="chat-list-item-last-message"], .ui-chat-item__message');
    
    if (nameEl) {
      chats.push({
        id: 'chat_' + index,
        title: nameEl.innerText.trim(),
        content: msgEl ? msgEl.innerText.trim() : 'Clique para ver conversa'
      });
    }
  });

  const iframe = document.getElementById('teamsflow-sidebar');
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({ type: 'TEAMSFLOW_CHATS_DATA', chats }, '*');
  }
}

// 3. Sistema de Respostas Rápidas
document.addEventListener('input', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.getAttribute('contenteditable') === 'true') {
    const text = e.target.innerText || e.target.value;
    if (text.includes('/')) {
      chrome.storage.local.get(['tf_responses'], (data) => {
        const responses = data.tf_responses || [];
        responses.forEach(resp => {
          if (text.endsWith(resp.trigger + ' ')) {
            const newValue = text.replace(resp.trigger + ' ', resp.text);
            if (e.target.value !== undefined) e.target.value = newValue;
            else e.target.innerText = newValue;
          }
        });
      });
    }
  }
});

// Escuta mensagens do Iframe
window.addEventListener('message', (event) => {
  if (event.data.type === 'TEAMSFLOW_TOGGLE') toggleSidebar();
});

setInterval(injectUI, 2000);
syncChats();