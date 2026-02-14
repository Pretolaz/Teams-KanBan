// TeamsFlow Content Script
let sidebarVisible = false;

// Injetar Botão de Acesso no Teams
function injectTeamsFlowButton() {
  if (document.getElementById('teamsflow-toggle')) return;

  const btn = document.createElement('button');
  btn.id = 'teamsflow-toggle';
  btn.innerHTML = 'T';
  btn.title = 'Abrir Kanban TeamsFlow';
  document.body.appendChild(btn);

  btn.addEventListener('click', toggleSidebar);
}

function toggleSidebar() {
  sidebarVisible = !sidebarVisible;
  const container = document.getElementById('teamsflow-container');
  if (container) {
    container.style.transform = sidebarVisible ? 'translateX(0)' : 'translateX(100%)';
  }
}

// Injetar o Iframe do Dashboard
function injectSidebar() {
  if (document.getElementById('teamsflow-container')) return;

  const container = document.createElement('div');
  container.id = 'teamsflow-container';
  
  const iframe = document.createElement('iframe');
  // Em produção, use a URL do seu site hospedado. Em dev, localhost:9002
  iframe.src = 'http://localhost:9002/kanban?mode=extension';
  iframe.id = 'teamsflow-iframe';
  
  container.appendChild(iframe);
  document.body.appendChild(container);
}

// Escutar comandos de atalhos (/)
document.addEventListener('input', (e) => {
  if (e.target.tagName === 'DIV' && e.target.getAttribute('contenteditable') === 'true') {
    const text = e.target.innerText;
    chrome.storage.local.get(['tf_responses'], (result) => {
      const responses = result.tf_responses || [];
      responses.forEach(resp => {
        if (text.includes(resp.trigger)) {
          const newText = text.replace(resp.trigger, resp.text);
          e.target.innerText = newText;
          // Mover cursor para o fim
          const range = document.createRange();
          const sel = window.getSelection();
          range.setStart(e.target.childNodes[0], e.target.innerText.length);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      });
    });
  }
});

// Comunicação entre Extensão e Iframe
window.addEventListener('message', (event) => {
  if (event.data.type === 'TEAMSFLOW_SYNC') {
    chrome.storage.local.set({ 
      tf_columns: event.data.data.columns,
      tf_cards: event.data.data.cards,
      tf_responses: event.data.data.responses
    });
  }
  
  if (event.data.type === 'TEAMSFLOW_GET_CONTEXT') {
    // Tenta capturar o nome do contato no Teams (seletor aproximado)
    const chatTitle = document.querySelector('[data-tid="chat-title"]')?.innerText || 'Conversa sem nome';
    const iframe = document.getElementById('teamsflow-iframe');
    iframe.contentWindow.postMessage({ 
      type: 'TEAMSFLOW_CONTEXT_RESPONSE', 
      context: { title: chatTitle, url: window.location.href } 
    }, '*');
  }
});

// Inicialização
const initInterval = setInterval(() => {
  if (document.body) {
    injectTeamsFlowButton();
    injectSidebar();
    clearInterval(initInterval);
  }
}, 1000);