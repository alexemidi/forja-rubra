/* Inicialização comum. Os catálogos não são gravados no armazenamento pessoal. */
(()=>{
  'use strict';
  const page=document.currentScript.dataset.page;
  const base=new URL('../../',document.currentScript.src),contexts=new Map();
  const getFetch = () => (typeof window !== 'undefined' && typeof window.fetch === 'function' ? window.fetch : null)
    || (typeof window !== 'undefined' && window.parent && typeof window.parent.fetch === 'function' ? window.parent.fetch : null)
    || (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function' ? globalThis.fetch : null);
  // Recursos estáticos locais: recuperar somente falhas transitórias de transporte.
  // Respostas HTTP inválidas continuam sendo reportadas imediatamente.
  const load=async url=>{
    const f=getFetch();let response;
    for(let attempt=0;attempt<3;attempt++){
      try{response=await f(new URL(url,base));break}
      catch(error){if(attempt===2)throw error;await new Promise(resolve=>setTimeout(resolve,150*(attempt+1)))}
    }
    if(!response.ok)throw Error(`${url}: HTTP ${response.status}`);return response;
  };
  const script=url=>new Promise((resolve,reject)=>{
    const s=document.createElement('script');s.src=new URL(url,base);
    const cleanup=()=>window.removeEventListener('error',executionError);
    const executionError=event=>{
      if(event.filename!==s.src)return;
      cleanup();reject(event.error||Error(event.message));
    };
    window.addEventListener('error',executionError);
    s.onload=()=>{cleanup();resolve()};
    s.onerror=()=>{cleanup();s.remove();reject(Error('Não foi possível carregar '+url))};
    document.body.append(s);
  });
  const jsonRequests=new Map();
  function json(file){
    if(!jsonRequests.has(file))jsonRequests.set(file,load(file).then(r=>r.json()).catch(error=>{jsonRequests.delete(file);throw error}));
    return jsonRequests.get(file);
  }
  let pdfPromise;
  const styleRequests=new Map();
  const pagePreloads=new Map();
  /**
   * Baixa os recursos de uma página sem executar seus scripts. A navegação
   * continua usando a inicialização normal, mas encontra os arquivos no cache
   * quando o usuário abre uma área a partir da ficha.
   * @param {string} pageName chave da página no manifesto
   * @returns {Promise<void>}
   */
  function preloadPage(pageName){
    if(!pagePreloads.has(pageName))pagePreloads.set(pageName,json('paginas.json').then(async manifest=>{
      const entry=manifest[pageName];
      if(!entry)return;
      const scripts=(entry.scripts||[]).flat(Infinity);
      const data=Object.values(entry.data||{});
      await Promise.allSettled([...new Set([...scripts,...data])].map(async file=>{
        const response=await load(file);
        await response.arrayBuffer();
      }));
    }).catch(error=>{
      pagePreloads.delete(pageName);
      throw error;
    }));
    return pagePreloads.get(pageName);
  }
  let transitionTimer,transitionOwner;
  function loader(){
    let el=document.getElementById('forja-loader');
    if(!el){el=document.createElement('div');el.id='forja-loader';el.className='forja-loader';el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.innerHTML='<div class="forja-loading-eye" aria-hidden="true"></div><p>Preparando sua jornada<small>Carregando…</small></p>';document.body.append(el);}
    return el;
  }
  function showLoading(){const el=loader();el.hidden=false;el.classList.remove('is-finished');document.documentElement.dataset.forjaLoading='true';}
  function endLoading(owner){if(owner&&transitionOwner!==owner)return;clearTimeout(transitionTimer);transitionOwner=null;delete document.documentElement.dataset.forjaLoading;const el=document.getElementById('forja-loader');if(el)el.hidden=true;}
  function waitForFrame(frame){
    endLoading();transitionOwner=frame;
    transitionTimer=setTimeout(()=>{if(transitionOwner===frame)showLoading()},180);
    frame.addEventListener('load',()=>{if(frame.contentDocument?.documentElement.dataset.forjaReady==='true')endLoading(frame)},{once:true});
  }
  window.Forja={
    loadStyle(file){
      if(!styleRequests.has(file))styleRequests.set(file,new Promise((resolve,reject)=>{
        const link=document.createElement('link');link.rel='stylesheet';link.href=new URL(file,base);
        link.onload=resolve;link.onerror=()=>{link.remove();styleRequests.delete(file);reject(Error('Não foi possível carregar '+file))};
        document.head.append(link);
      }));
      return styleRequests.get(file);
    },
    preloadPage,
    showLoading,
    endLoading,
    frameReady(child){const frame=[...document.querySelectorAll('iframe')].find(f=>f.contentWindow===child);if(frame)endLoading(frame)},
    getContext(token,child){const ctx=contexts.get(token);if(!ctx||ctx.frame.contentWindow!==child)throw Error('Sessão de catálogo inválida');return structuredClone(ctx.value)},
    mount(frame,url,value){
      for(const [token,ctx] of contexts)if(ctx.frame===frame||!ctx.frame.isConnected)contexts.delete(token);
      waitForFrame(frame);
      const token=crypto.randomUUID();contexts.set(token,{frame,value});
      frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-downloads');
      frame.removeAttribute('srcdoc');frame.src=new URL(url+'?sessao='+encodeURIComponent(token),base).href;
    },
    loadPdf(){
      if(!pdfPromise)pdfPromise=Promise.all([script('assets/vendor/pako.min.js'),script('assets/vendor/pdf-lib.min.js'),load('assets/pdf/ficha-padrao.pdf').then(r=>r.arrayBuffer()).then(b=>{Forja.pdfBytes=new Uint8Array(b)})]).catch(error=>{pdfPromise=null;throw error});
      return pdfPromise;
    }
  };
  Forja.loadStyle('src/estilos/carregamento.css');
  loader();
  document.addEventListener('click',event=>{
    const link=event.target.closest?.('a[href]');
    if(!link||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||link.download||(link.target&&link.target!=='_self'))return;
    const destination=new URL(link.href,location.href);
    if(destination.origin===location.origin&&destination.pathname!==location.pathname&&destination.pathname.endsWith('.html'))showLoading();
  },true);
  window.addEventListener('beforeunload',showLoading);
  window.addEventListener('pageshow',()=>{if(document.documentElement.dataset.forjaReady==='true')endLoading()});
  // Bloqueia mensagens entre origens e janelas que não pertencem à integração ativa.
  window.addEventListener('message',event=>{
    if(!String(event.data?.channel||'').startsWith('forja'))return;
    const ownFrame=[...document.querySelectorAll('iframe')].some(f=>f.contentWindow===event.source);
    const parentMessage=window.parent!==window&&event.source===window.parent;
    if(event.origin!==location.origin||(!ownFrame&&!parentMessage))event.stopImmediatePropagation();
  },true);
  window.__FORJA_READY__=(async()=>{
    // O modo local não depende da rede para iniciar.
    if(window.__FORJA_ENV__?.ENABLE_CLOUD===true && !window.supabase){
      await script('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    }
    await script('js/runtime.js');
    const token=new URL(location.href).searchParams.get('sessao');
    if(token&&window.parent!==window){if(window.parent.location.origin!==location.origin)throw Error('Origem inválida');window.__FORJA_CONTEXT__=window.parent.Forja.getContext(token,window)}
    const manifest=await json('paginas.json'),entry=manifest[page];
    // Antecipar downloads sem antecipar execução (a ordem dos scripts é contratual).
    for(const file of entry.scripts){const hint=document.createElement('link');hint.rel='preload';hint.as='script';hint.href=new URL(file,base);document.head.append(hint)}
    window.__FORJA_DATA__={};
    window.BOOKS={
      basico: 'Livro Básico',
      jogo_do_ano: 'Jogo do Ano',
      herois_de_arton: 'Heróis de Arton',
      ameacas_de_arton: 'Ameaças de Arton',
      deuses_de_arton: 'Deuses de Arton',
      atlas_de_arton: 'Atlas de Arton',
      dragao_brasil: 'Dragão Brasil'
    };
    await Promise.all(Object.entries(entry.data).map(async([key,file])=>{
      const value=await json(file);if(key.startsWith('DATA.')){window.__FORJA_DATA__.DATA??={};window.__FORJA_DATA__.DATA[key.slice(5)]=value}else window.__FORJA_DATA__[key]=value;
    }));
    for(const file of entry.scripts)await script(file);
    window.ForjaTopBar?.renderTopbar();
    await Promise.all([...styleRequests.values()]);
    if(page==='criador'||page==='ficha'){
      if(typeof window.prepararFicha==='function')window.prepararFicha();
      Forja.aplicacaoInicializada=true;
      renderStage();
    }
    document.documentElement.dataset.forjaReady='true';
    endLoading();
    if(window.parent!==window&&window.parent.location.origin===location.origin)window.parent.Forja?.frameReady(window);
    window.dispatchEvent(new Event('forja-ready'));
    const loader=document.getElementById('forja-loader');
    if(loader){
      loader.classList.add('is-finished');
      loader.hidden=true;
      loader.remove();
    }
  })().catch(error=>{
    endLoading();if(window.parent!==window&&window.parent.location.origin===location.origin)window.parent.Forja?.frameReady(window);document.documentElement.dataset.forjaReady='error';console.error(error);document.querySelector('#forja-loader')?.remove();
    const warning=document.createElement('p');warning.setAttribute('role','alert');warning.textContent='Não foi possível iniciar a Forja. '+error.message+' ';
    const recovery=document.createElement('a');recovery.href=new URL('backup.html',base);recovery.textContent='Abrir backup e recuperação';warning.append(recovery);
    document.body.prepend(warning);
  });
})();
