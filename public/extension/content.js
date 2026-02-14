
// Escuta mensagens do Dashboard para sincronizar dados
window.addEventListener("message", (event) => {
  if (event.data.type === 'TEAMSFLOW_SYNC') {
    chrome.storage.local.set({ tf_data: event.data.data }, () => {
      console.log('TeamsFlow: Dados sincronizados com a extensão!');
    });
  }
});

// Função para buscar respostas salvas
async function getQuickResponses() {
  const result = await chrome.storage.local.get(['tf_data']);
  return result.tf_data?.responses || [];
}

// Lógica de substituição de texto no chat do Teams
document.addEventListener('input', async (e) => {
  const target = e.target;
  if (target.getAttribute('contenteditable') === 'true' || target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
    const text = target.innerText || target.value;
    const responses = await getQuickResponses();

    responses.forEach(resp => {
      if (text.includes(resp.trigger + ' ')) {
        const newText = text.replace(resp.trigger + ' ', resp.text + ' ');
        if (target.getAttribute('contenteditable') === 'true') {
          target.innerText = newText;
        } else {
          target.value = newText;
        }
        
        // Coloca o cursor no final
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(target);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });
  }
});

console.log('TeamsFlow: Extensão ativa no Teams Web.');
