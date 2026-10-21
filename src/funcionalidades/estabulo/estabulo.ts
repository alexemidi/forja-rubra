/* Adaptador do Estábulo: conserva o contrato de parceiros do herói ativo. */
(()=>{
 const catalog=window.__FORJA_DATA__.montarias;
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 loadGuildStorage();
 function render(){
  const search=document.getElementById('stableSearch').value.toLocaleLowerCase('pt-BR');
  document.getElementById('stableCatalog').innerHTML=catalog.filter(p=>p.nome.toLocaleLowerCase('pt-BR').includes(search)).map(p=>`<article class="stable-card" data-mount-card="${p.id}"><h3>${escape(p.nome)}</h3><label>Tamanho <select data-size>${RegrasMontarias.tamanhosMontaria(p.id).map(s=>`<option>${s}</option>`).join('')}</select></label><p>${escape(p.descricao)}</p><label>Patamar concedido <select data-tier><option value="iniciante">Iniciante</option><option value="veterano">Veterano</option><option value="mestre">Mestre</option></select></label><button class="btn btn-primary" type="button" data-receive="${p.id}">Receber montaria</button></article>`).join('');
  const owned=(guildState.partners||[]).map((p,index)=>({p,index})).filter(({p})=>p.partnerType==='Montaria'||p.type==='montaria'||RegrasMontarias.especieMontaria([p.type,p.tipo].join(' ')));
  document.getElementById('stableOwned').innerHTML=owned.length?owned.map(({p,index})=>`<div class="stable-owned"><strong>${escape(p.name||p.nome)}</strong><span>${escape(p.mountSize||'')} · ${escape(p.tier||p.grau||'iniciante')}</span><button class="btn" type="button" data-release="${index}">Dispensar</button></div>`).join(''):'<p class="stable-note">Nenhuma montaria recebida.</p>';
 }
 document.getElementById('stableSearch').addEventListener('input',render);
 document.addEventListener('click',event=>{
  const receive=event.target.closest('[data-receive]'),release=event.target.closest('[data-release]');
  if(receive){
   const p=catalog.find(p=>p.id===receive.dataset.receive),card=receive.closest('[data-mount-card]');
   if(!p)return;
   guildState.partners.push({name:p.nome,type:p.id,tipo:p.id,partnerType:'Montaria',tier:card.querySelector('[data-tier]').value,mountSize:card.querySelector('[data-size]').value,mountId:crypto.randomUUID(),benefit:p.descricao});
   saveGuildStorage();render();document.getElementById('stableStatus').textContent=p.nome+' adicionado à ficha.';
  }
  if(release){guildState.partners.splice(Number(release.dataset.release),1);saveGuildStorage();render();}
 });
 render();
})();
