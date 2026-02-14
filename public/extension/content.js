
console.log("TeamsFlow: Iniciando motor de produtividade...");

// Injetar Botão Flutuante e Iframe
function injectUI() {
  if (document.getElementById('tf-root')) return;

  const root = document.createElement('div');
  root.id = 'tf-root';
  document.documentElement.appendChild(root);

  // Botão
  const btn = document.createElement('div');
  btn.id = 'tf-trigger';
  btn.innerHTML = 'T';
  btn.title = 'TeamsFlow Productivity';
  
  // Iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'tf-iframe';
  iframe.src = chrome.runtime.getURL('sidebar.html');
  iframe.className = 'hidden';

  root.appendChild(btn);
  root.appendChild(iframe);

  btn.onclick = () => {
    iframe.classList.toggle('hidden');
  };
}

// Scraper de Chats do Teams
function getRecentChats() {
  // Tenta múltiplos seletores dependendo da versão do Teams
  const chatElements = document.querySelectorAll('[data-tid="chat-list-item"], .chat-list-item, [role="listitem"]');
  const chats = [];
  
  chatElements.forEach(el => {
    const nameEl = el.querySelector('[data-tid="chat-list-item-text"], .truncate');
    const msgEl = el.querySelector('.last-message, .message-text');
    if (nameEl && nameEl.innerText.trim()) {
      chats.push({
        name: nameEl.innerText.trim(),
        lastMsg: msgEl ? msgEl.innerText.trim() : 'Conversa aberta'
      });
    }
  });
  return chats;
}

// Comunicação com o Iframe
window.addEventListener('message', (event) => {
  const iframe = document.getElementById('tf-iframe');
  if (event.data.type === 'TEAMSFLOW_CLOSE') {
    iframe.classList.add('hidden');
  }
  if (event.data.type === 'TEAMSFLOW_GET_CHATS') {
    iframe.contentWindow.postMessage({
      type: 'TEAMSFLOW_CHATS_DATA',
      chats: getRecentChats()
    }, '*');
  }
});

// Auto-Replace de Respostas Rápidas
document.addEventListener('input', (e) => {
  const target = e.target;
  if (target.tagName === 'DIV' && target.getAttribute('role') === 'textbox') {
    const text = target.innerText;
    chrome.storage.local.get(['tf_responses'], (result) => {
      const resps = result.tf_responses || [];
      resps.forEach(r => {
        if (text.endsWith(r.trigger + ' ')) {
          const newText = text.replace(r.trigger + ' ', r.text);
          target.innerText = newText;
          // Mover cursor para o fim
          const range = document.createRange();
          const sel = window.getSelection();
          range.setStart(target.childNodes[0], target.innerText.length);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      });
    });
  }
});

// Garantir que a UI apareça
setInterval(injectUI, 2000);
