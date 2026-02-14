
/**
 * TeamsFlow Content Script
 * Este script roda dentro do Teams Web para injetar funcionalidades.
 */

console.log("TeamsFlow: Extensão carregada no Teams Web.");

// Função para buscar respostas rápidas do storage
async function getQuickResponses() {
  const data = await chrome.storage.local.get('teamsflow_responses');
  return data.teamsflow_responses || [];
}

// Monitora o campo de digitação do Teams
document.addEventListener('input', async (e) => {
  const target = e.target;
  
  // Verifica se é um campo de texto ou contenteditable (usado pelo Teams)
  if (target.matches('[contenteditable="true"]') || target.tagName === 'TEXTAREA') {
    const text = target.innerText || target.value;
    
    // Procura por gatilhos que começam com /
    if (text.includes('/')) {
      const responses = await getQuickResponses();
      
      responses.forEach(resp => {
        if (text.endsWith(resp.trigger)) {
          const newText = text.replace(resp.trigger, resp.text);
          
          if (target.contentEditable === 'true') {
            target.innerText = newText;
          } else {
            target.value = newText;
          }
          
          // Move o cursor para o final (opcional, mas recomendado)
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(target);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      });
    }
  }
});

// Injeta um botão "Salvar no Kanban" na barra de ferramentas do chat
function injectKanbanButton() {
  const toolbar = document.querySelector('.ck-toolbar__items'); // Seletor genérico, o Teams muda frequentemente
  if (toolbar && !document.getElementById('teamsflow-save-btn')) {
    const btn = document.createElement('button');
    btn.id = 'teamsflow-save-btn';
    btn.innerHTML = '📋';
    btn.title = 'Enviar conversa para o Kanban TeamsFlow';
    btn.style.cssText = 'background: #673AB7; border: none; border-radius: 4px; color: white; margin-left: 8px; cursor: pointer; padding: 4px 8px;';
    
    btn.onclick = () => {
      alert('Conversa capturada! Enviando para o Dashboard TeamsFlow...');
      // Aqui a extensão enviaria os dados para o storage sincronizado
    };
    
    toolbar.appendChild(btn);
  }
}

// Tenta injetar o botão periodicamente (devido ao carregamento dinâmico do Teams)
setInterval(injectKanbanButton, 3000);
