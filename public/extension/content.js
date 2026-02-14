
/**
 * TeamsFlow - Content Script
 * Gerencia a injeção da UI e a lógica de respostas rápidas.
 */

console.log('TeamsFlow: Content Script inicializado');

let sidebarVisible = false;

// Injeção resiliente: verifica a cada 2 segundos se o botão existe
const injectionInterval = setInterval(() => {
  if (!document.getElementById('teamsflow-root-container')) {
    init();
  }
}, 2000);

function init() {
  if (document.getElementById('teamsflow-root-container')) return;

  const container = document.createElement('div');
  container.id = 'teamsflow-root-container';
  
  // Botão Flutuante
  const btn = document.createElement('button');
  btn.id = 'teamsflow-toggle-btn';
  btn.innerHTML = 'T';
  btn.title = 'Abrir Kanban TeamsFlow';
  btn.onclick = toggleSidebar;

  // Iframe da Sidebar (Carrega arquivo LOCAL da extensão)
  const iframe = document.createElement('iframe');
  iframe.id = 'teamsflow-sidebar';
  iframe.src = chrome.runtime.getURL('sidebar.html');
  iframe.style.display = 'none';

  container.appendChild(btn);
  container.appendChild(iframe);
  document.body.appendChild(container);
  
  console.log('TeamsFlow: UI Injetada com sucesso');
  setupQuickResponses();
}

function toggleSidebar() {
  const iframe = document.getElementById('teamsflow-sidebar');
  sidebarVisible = !sidebarVisible;
  iframe.style.display = sidebarVisible ? 'block' : 'none';
  
  if (sidebarVisible) {
    // Avisa a sidebar para atualizar os dados ao abrir
    iframe.contentWindow.postMessage({ type: 'REFRESH_DATA' }, '*');
  }
}

// Lógica de Respostas Rápidas
function setupQuickResponses() {
  document.addEventListener('input', (e) => {
    const target = e.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      const text = target.value || target.innerText || '';
      if (text.includes('/')) {
        chrome.storage.local.get(['tf_responses'], (result) => {
          const responses = result.tf_responses || [];
          responses.forEach(resp => {
            if (text.endsWith(resp.trigger)) {
              const newVal = text.replace(resp.trigger, resp.text);
              if (target.value !== undefined) target.value = newVal;
              else target.innerText = newVal;
              
              // Dispara evento de input para o Teams perceber a mudança
              target.dispatchEvent(new Event('input', { bubbles: true }));
            }
          });
        });
      }
    }
  });
}

// Comunicação: Recebe pedidos da Sidebar (ex: pegar contexto do chat)
window.addEventListener('message', (event) => {
  if (event.data.type === 'GET_TEAMS_CONTEXT') {
    const chatTitle = document.querySelector('[data-tid="chat-list-item-active"] .name-content') || 
                      document.querySelector('.chat-header-title') || 
                      { innerText: 'Conversa Desconhecida' };
    
    event.source.postMessage({
      type: 'TEAMS_CONTEXT_RESPONSE',
      title: chatTitle.innerText.trim(),
      url: window.location.href
    }, '*');
  }
});
