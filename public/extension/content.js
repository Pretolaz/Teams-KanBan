// Escuta mensagens do Dashboard (se estiver aberto) para sincronizar dados
window.addEventListener("message", (event) => {
  if (event.data && event.data.type === 'TEAMSFLOW_SYNC') {
    chrome.storage.local.set({ 
      'tf_data': event.data.data,
      'last_sync': Date.now()
    }, () => {
      console.log('TeamsFlow: Dados sincronizados do Dashboard.');
    });
  }
});

// Lógica de Substituição de Texto (Gatilhos /)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.getAttribute('contenteditable') === 'true')) {
      const text = activeElement.innerText || activeElement.value || "";
      
      chrome.storage.local.get(['tf_data'], (result) => {
        const responses = result.tf_data?.responses || [];
        
        responses.forEach(resp => {
          if (text.trim() === resp.trigger) {
            if (activeElement.tagName === 'INPUT') {
              activeElement.value = resp.text;
            } else {
              activeElement.innerText = resp.text;
            }
            console.log(`TeamsFlow: Gatilho ${resp.trigger} substituído.`);
          }
        });
      });
    }
  }
}, true);

// Injeta um pequeno indicador visual no Teams
const badge = document.createElement('div');
badge.className = 'teams-flow-badge';
badge.innerText = 'TeamsFlow Ativo';
document.body.appendChild(badge);
