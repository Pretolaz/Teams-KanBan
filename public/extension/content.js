
// TeamsFlow Content Script
console.log("TeamsFlow: Script carregado");

// Injetar Botão Flutuante
const btn = document.createElement('div');
btn.id = 'teamsflow-trigger';
btn.innerHTML = 'T';
document.body.appendChild(btn);

// Injetar Sidebar Container
const sidebar = document.createElement('div');
sidebar.id = 'teamsflow-sidebar';
sidebar.innerHTML = `
  <div class="tf-header">
    <span>TeamsFlow Kanban</span>
    <button id="tf-close">×</button>
  </div>
  <iframe id="tf-iframe" src="${chrome.runtime.getURL('sidebar.html')}"></iframe>
`;
document.body.appendChild(sidebar);

// Lógica de Abrir/Fechar
btn.addEventListener('click', () => {
  sidebar.classList.toggle('active');
});

document.addEventListener('click', (e) => {
  if (e.target.id === 'tf-close') sidebar.classList.remove('active');
});

// Captura de Contexto do Teams
window.addEventListener('message', (event) => {
  if (event.data.type === 'TF_GET_TEAMS_DATA') {
    // Tenta encontrar o nome do contato atual no Teams
    const contactNameEl = document.querySelector('[data-tid="chat-title"], .chat-header-title, h1');
    const contactName = contactNameEl ? contactNameEl.innerText : "Conversa Desconhecida";
    
    event.source.postMessage({
      type: 'TF_TEAMS_DATA_RESPONSE',
      data: {
        title: contactName,
        url: window.location.href
      }
    }, event.origin);
  }
});

// Respostas Rápidas (Monitorar digitação)
document.addEventListener('input', (e) => {
  const target = e.target;
  if (target.getAttribute('contenteditable') === 'true' || target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
    const text = target.innerText || target.value;
    if (text.includes('/')) {
      chrome.storage.local.get(['tf_responses'], (result) => {
        const responses = result.tf_responses || [];
        responses.forEach(res => {
          if (text.endsWith(res.trigger + ' ') || text.endsWith(res.trigger + '\n')) {
            const newValue = text.replace(res.trigger, res.text);
            if (target.getAttribute('contenteditable') === 'true') {
              target.innerText = newValue;
            } else {
              target.value = newValue;
            }
            // Mover cursor para o fim
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
