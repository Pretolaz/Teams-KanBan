
// TeamsFlow Content Script - Resiliente
console.log("TeamsFlow: Script carregado");

function scrapeTeamsChats() {
  const chats = [];
  // Seletores comuns no Teams Web para itens de chat
  const chatElements = document.querySelectorAll('[data-tid="chat-list-item"], .chat-list-item, [role="listitem"]');
  
  chatElements.forEach((el, index) => {
    // Tenta encontrar o nome do contato e a última mensagem
    const titleEl = el.querySelector('.name, [class*="title"], h3, span[class*="name"]');
    const msgEl = el.querySelector('.last-message, [class*="last-message"], [class*="preview"]');
    
    if (titleEl) {
      chats.push({
        id: `teams-chat-${index}`,
        title: titleEl.innerText.trim(),
        content: msgEl ? msgEl.innerText.trim() : "Sem mensagem recente",
        isLive: true
      });
    }
  });

  return chats.slice(0, 15); // Pega os 15 primeiros
}

function injectTeamsFlow() {
  if (document.getElementById('teamsflow-root')) return;

  const container = document.createElement('div');
  container.id = 'teamsflow-root';
  container.innerHTML = `
    <div id="tf-fab" title="TeamsFlow">T</div>
    <div id="tf-overlay" style="display: none;">
      <iframe id="tf-iframe" src="${chrome.runtime.getURL('sidebar.html')}"></iframe>
    </div>
  `;
  document.body.appendChild(container);

  const fab = container.querySelector('#tf-fab');
  const overlay = container.querySelector('#tf-overlay');

  fab.onclick = () => {
    const isVisible = overlay.style.display === 'block';
    overlay.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) {
      // Ao abrir, envia os chats capturados para o iframe
      setTimeout(() => {
        const iframe = document.getElementById('tf-iframe');
        iframe.contentWindow.postMessage({ 
          type: 'TEAMSFLOW_LOAD_CHATS', 
          chats: scrapeTeamsChats() 
        }, '*');
      }, 500);
    }
  };
}

// Escuta mensagens do Iframe (ex: fechar overlay)
window.addEventListener('message', (event) => {
  if (event.data.type === 'TEAMSFLOW_CLOSE_OVERLAY') {
    const overlay = document.getElementById('tf-overlay');
    if (overlay) overlay.style.display = 'none';
  }
});

// Auto-substituição de gatilhos no input do Teams
document.addEventListener('input', (e) => {
  const target = e.target;
  if (target.getAttribute('contenteditable') === 'true' || target.tagName === 'TEXTAREA') {
    chrome.storage.local.get(['tf_responses'], (result) => {
      const responses = result.tf_responses || [];
      const text = target.innerText || target.value;
      
      responses.forEach(resp => {
        if (text.includes(resp.trigger)) {
          const newText = text.replace(resp.trigger, resp.text);
          if (target.getAttribute('contenteditable') === 'true') {
            target.innerText = newText;
          } else {
            target.value = newText;
          }
          // Move o cursor para o final
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
});

setInterval(injectTeamsFlow, 2000);
