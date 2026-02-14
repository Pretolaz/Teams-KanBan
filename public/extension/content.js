
console.log('TeamsFlow: Iniciando motor de produtividade...');

function injectFlowButton() {
  if (document.getElementById('teamsflow-trigger')) return;

  const btn = document.createElement('div');
  btn.id = 'teamsflow-trigger';
  btn.innerHTML = 'T';
  btn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    background: #673AB7;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-weight: bold;
    font-size: 20px;
    z-index: 999999;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    transition: transform 0.2s;
  `;
  
  btn.onmouseover = () => btn.style.transform = 'scale(1.1)';
  btn.onmouseout = () => btn.style.transform = 'scale(1)';
  
  btn.onclick = () => {
    const iframe = document.getElementById('teamsflow-sidebar');
    if (iframe) {
      iframe.style.display = iframe.style.display === 'none' ? 'block' : 'none';
    }
  };

  document.documentElement.appendChild(btn);
}

function injectSidebar() {
  if (document.getElementById('teamsflow-sidebar')) return;

  const iframe = document.createElement('iframe');
  iframe.id = 'teamsflow-sidebar';
  iframe.src = chrome.runtime.getURL('sidebar.html');
  iframe.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    border: none;
    z-index: 999998;
    display: none;
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(5px);
  `;
  document.documentElement.appendChild(iframe);
}

// Escuta mensagens vindas do Iframe (sidebar.js)
window.addEventListener('message', (event) => {
  if (event.data.type === 'TEAMSFLOW_CLOSE') {
    document.getElementById('teamsflow-sidebar').style.display = 'none';
  }
  
  if (event.data.type === 'TEAMSFLOW_GET_CHATS') {
    const chats = [];
    // Tenta encontrar itens da lista de chat do Teams
    const chatElements = document.querySelectorAll('[data-tid="chat-list-item"], [role="listitem"]');
    
    chatElements.forEach((el, index) => {
      if (index > 10) return; // Limita a 10
      const titleEl = el.querySelector('[data-tid="chat-list-item-title"], .title, h3');
      const msgEl = el.querySelector('.last-message, .preview');
      
      if (titleEl) {
        chats.push({
          id: 'teams-' + index,
          title: titleEl.innerText.trim(),
          content: msgEl ? msgEl.innerText.trim() : 'Sem mensagens recentes',
          priority: 'Low',
          isNative: true
        });
      }
    });

    const iframe = document.getElementById('teamsflow-sidebar');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'TEAMSFLOW_CHATS_DATA', chats }, '*');
    }
  }
});

// Respostas Rápidas: Auto-replace
document.addEventListener('input', (e) => {
  const target = e.target;
  if (target.tagName === 'DIV' && target.getAttribute('contenteditable') === 'true') {
    chrome.storage.local.get(['tf_responses'], (result) => {
      const responses = result.tf_responses || [];
      const text = target.innerText;
      
      responses.forEach(resp => {
        if (text.includes(resp.trigger)) {
          // Substitui o gatilho pelo texto
          const newText = text.replace(resp.trigger, resp.text);
          target.innerText = newText;
          
          // Move o cursor para o final (Teams precisa disso para registrar a mudança)
          const range = document.createRange();
          const sel = window.getSelection();
          range.setStart(target.childNodes[0], target.childNodes[0].length);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      });
    });
  }
});

// Verifica periodicamente se o botão sumiu (devido a navegação interna do Teams)
setInterval(() => {
  injectFlowButton();
  injectSidebar();
}, 2000);
