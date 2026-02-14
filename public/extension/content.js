
console.log("TeamsFlow: Motor de produtividade ativo.");

let overlay = null;

// Tenta injetar o botão de acesso
function injectTrigger() {
  if (document.getElementById('tf-trigger')) return;

  const btn = document.createElement('div');
  btn.id = 'tf-trigger';
  btn.innerHTML = `
    <div style="width:50px; height:50px; background:#6264A7; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,0.3); transition: transform 0.2s;">
      T
    </div>
  `;
  btn.style.cssText = "position:fixed; bottom:20px; right:20px; z-index:9999999;";
  
  btn.onclick = () => toggleOverlay();
  btn.onmouseover = () => btn.firstElementChild.style.transform = "scale(1.1)";
  btn.onmouseout = () => btn.firstElementChild.style.transform = "scale(1)";

  (document.body || document.documentElement).appendChild(btn);
}

function toggleOverlay() {
  if (overlay) {
    overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
  } else {
    createOverlay();
  }
}

function createOverlay() {
  overlay = document.createElement('div');
  overlay.id = 'tf-overlay';
  overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; z-index:10000000; border:none;";
  
  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('sidebar.html');
  iframe.style.cssText = "width:100%; height:100%; border:none;";
  
  overlay.appendChild(iframe);
  document.body.appendChild(overlay);
}

// Scraper de Chats - Teams V2 (Seletores baseados em atributos funcionais)
function scrapeTeamsChats() {
  const chats = [];
  // Procura por itens que tenham o texto do nome e o texto da mensagem
  const chatElements = document.querySelectorAll('[data-tid="chat-list-item"], [role="listitem"]');
  
  chatElements.forEach((el, index) => {
    // Busca o nome (geralmente em um elemento com dir="auto")
    const titleEl = el.querySelector('[dir="auto"], h3, span[class*="title"]');
    // Busca a última mensagem
    const snippetEl = el.querySelector('[class*="snippet"], [class*="message"], span[class*="content"]');
    
    if (titleEl && titleEl.innerText.trim()) {
      chats.push({
        id: `teams-chat-${index}`,
        title: titleEl.innerText.trim(),
        content: snippetEl ? snippetEl.innerText.trim() : "Sem visualização",
        url: window.location.href
      });
    }
  });
  
  return chats;
}

// Listener para comandos vindos do Iframe
window.addEventListener('message', (event) => {
  if (event.data.type === 'TF_CLOSE') {
    if (overlay) overlay.style.display = 'none';
  }
  
  if (event.data.type === 'TF_GET_CHATS') {
    const chats = scrapeTeamsChats();
    // Retorna os dados para o Iframe
    const iframe = document.querySelector('#tf-overlay iframe');
    if (iframe) {
      iframe.contentWindow.postMessage({ type: 'TF_CHATS_DATA', chats }, '*');
    }
  }
});

// Auto-Replace de Respostas Rápidas
document.addEventListener('input', (e) => {
  const target = e.target;
  if (target.getAttribute('contenteditable') === 'true' || target.tagName === 'TEXTAREA') {
    const text = target.innerText || target.value;
    
    chrome.storage.local.get(['tf_responses'], (result) => {
      const responses = result.tf_responses || [];
      responses.forEach(resp => {
        // Se o texto termina com o gatilho + espaço
        if (text.endsWith(resp.trigger + ' ')) {
          const newText = text.replace(resp.trigger + ' ', resp.text);
          if (target.getAttribute('contenteditable') === 'true') {
            target.innerText = newText;
          } else {
            target.value = newText;
          }
          // Move o cursor para o fim (opcional, mas recomendado)
        }
      });
    });
  }
});

// Mantém o botão vivo
setInterval(injectTrigger, 2000);
injectTrigger();
