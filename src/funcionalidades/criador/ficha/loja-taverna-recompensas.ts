

const escapeHtml = typeof esc === 'function'
  ? esc
  : (s => String(s ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])));

function ensureRewardModal(){
  let modal=document.getElementById('rewardModal');
  if(modal&&typeof modal.sync==='function')return modal;
  if(!modal){
    modal=document.createElement('div');
    modal.id='rewardModal';
    document.body?.appendChild(modal);
  }
  modal.className='modal-backdrop';
  modal.hidden=true;
  modal.innerHTML=`<section class="confirm-modal reward-modal" role="dialog" aria-modal="true" aria-labelledby="rewardModalTitle" style="max-width:520px;width:95%;background:#0d131c;border:1px solid #233348;border-radius:12px;box-shadow:0 16px 40px rgba(0,0,0,0.75);color:#e2e8f0;padding:24px 28px;box-sizing:border-box;">
    <header style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #1a2638;padding-bottom:14px;margin-bottom:16px;">
      <h3 id="rewardModalTitle" style="margin:0;font-family:'Cinzel',serif;font-size:1.15rem;color:#f1f5f9;display:flex;align-items:center;gap:10px;">
        <span style="color:#d4af37;display:inline-flex;align-items:center;"><svg class="forja-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg></span> Adicionar Recompensa
      </h3>
      <button class="button small" type="button" data-reward-action="close" aria-label="Fechar" style="background:#141d2a;border:1px solid #233348;color:#94a3b8;font-size:1.1rem;line-height:1;padding:2px 8px;border-radius:4px;cursor:pointer;">×</button>
    </header>
    <div class="confirm-modal-body" style="padding:0;">
      <div class="reward-tabs" style="display:flex;gap:8px;margin-bottom:18px;border-bottom:1px solid #1a2638;padding-bottom:10px;">
        <button class="button small active" type="button" id="rewardTabBtnTibars" data-reward-tab="tibars" style="font-size:0.8rem;padding:6px 14px;font-weight:600;">Tibares (+T$)</button>
        <button class="button small" type="button" id="rewardTabBtnItem" data-reward-tab="item" style="font-size:0.8rem;padding:6px 14px;font-weight:600;">Item Grátis</button>
        <button class="button small" type="button" id="rewardTabBtnCustom" data-reward-tab="custom" style="font-size:0.8rem;padding:6px 14px;font-weight:600;">Criar Novo Item</button>
      </div>
      <div id="rewardTabTibars">
        <p style="font-size:0.84rem;color:#94a3b8;margin:0 0 16px 0;line-height:1.5;">Acrescente tibares recebidos como tesouros, recompensas de missões ou espólio. Este valor é somado diretamente aos fundos disponíveis do personagem sem débito.</p>
        <div style="background:#131c28;border:1px solid #233348;border-radius:8px;padding:12px 16px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:0.82rem;color:#cbd5e1;">Saldo atual do herói:</span>
          <strong id="rewardCurrentBalance" style="color:#d4af37;font-size:1.15rem;font-family:'Cinzel',serif;">T$ 0</strong>
        </div>
        <label class="field" style="margin-bottom:14px;display:block;">
          <span style="font-weight:600;font-size:0.84rem;color:#e2e8f0;display:block;margin-bottom:6px;">Quantidade de Tibares a receber:</span>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-weight:bold;color:#d4af37;font-size:1.05rem;">T$</span>
            <input class="input" id="rewardTibarsInput" type="number" min="0.01" step="any" placeholder="Ex: 50, 100, 500..." style="font-size:0.95rem;font-weight:600;flex:1;background:#090d14;border:1px solid #233348;color:#f8fafc;padding:8px 12px;border-radius:6px;">
          </div>
        </label>
        <div style="background:#0e1e19;border:1px solid #164e3b;border-radius:8px;padding:12px 16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:0.82rem;color:#a7f3d0;">Novo saldo após receber:</span>
          <strong id="rewardNewBalance" style="color:#34d399;font-size:1.15rem;font-family:'Cinzel',serif;">T$ 0</strong>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;border-top:1px solid #1a2638;padding-top:16px;">
          <button class="button" type="button" data-reward-action="close" style="padding:7px 16px;background:#141d2a;border:1px solid #233348;color:#cbd5e1;border-radius:6px;cursor:pointer;font-size:0.85rem;">Cancelar</button>
          <button class="button primary" type="button" id="confirmRewardTibars" style="padding:7px 20px;background:#991b1b;border:1px solid #b91c1c;color:#ffffff;border-radius:6px;cursor:pointer;font-size:0.85rem;font-weight:700;">Receber Tibares</button>
        </div>
      </div>
      <div id="rewardTabItem" hidden>
        <p style="font-size:0.84rem;color:#94a3b8;margin:0 0 16px 0;line-height:1.5;">Escolha qualquer item do catálogo oficial para receber gratuitamente como recompensa concedida pelo mestre (custo zero de tibares).</p>
        <div style="background:#131c28;border:1px solid #233348;border-radius:8px;padding:24px 20px;margin:16px 0;text-align:center;">
          <div style="margin-bottom:10px;display:flex;justify-content:center;" aria-hidden="true"><svg class="forja-svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#d4af37;"><path d="M20 12v10H4V12"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg></div>
          <h4 style="margin:0 0 6px 0;color:#f1f5f9;font-family:'Cinzel',serif;font-size:1.05rem;">Resgatar Item no Catálogo</h4>
          <p style="margin:0 0 18px 0;font-size:0.8rem;color:#94a3b8;line-height:1.4;">Ao clicar abaixo, a loja abrirá no modo de recompensa com todos os itens a custo zero.</p>
          <button class="button primary" type="button" id="btnOpenShopForReward" style="font-size:0.9rem;padding:9px 24px;font-weight:700;cursor:pointer;background:#059669;border:1px solid #10b981;color:#ffffff;border-radius:6px;box-shadow:0 2px 8px rgba(5,150,105,0.3);">Abrir Loja e Escolher Item Grátis</button>
        </div>
        <div style="display:flex;justify-content:flex-end;align-items:center;padding-top:14px;border-top:1px solid #1a2638;">
          <button class="button" type="button" data-reward-action="close" style="padding:6px 16px;background:#141d2a;border:1px solid #233348;color:#cbd5e1;border-radius:6px;cursor:pointer;font-size:0.85rem;">Fechar</button>
        </div>
      </div>
      <div id="rewardTabCustom" hidden>
        <p style="font-size:0.84rem;color:#94a3b8;margin:0 0 16px 0;line-height:1.5;">Crie um item inédito baseado em um item existente como inspiração. O novo item pertence apenas a este herói, deve ter um nome único e pelo menos um atributo modificado em relação à inspiração.</p>
        <div style="background:#131c28;border:1px solid #233348;border-radius:8px;padding:12px 14px;margin-bottom:14px;">
          <label class="field" style="display:block;">
            <span style="font-weight:600;font-size:0.82rem;color:#cbd5e1;">Item de Inspiração:</span>
            <select class="select" id="customItemInspirationSelect" style="width:100%;margin-top:6px;background:#090d14;border:1px solid #233348;color:#f8fafc;padding:6px 10px;border-radius:6px;font-size:0.85rem;">
              <option value="">-- Selecione para importar dados como inspiração --</option>
            </select>
          </label>
          <div id="customInspirationInfo" style="font-size:0.75rem;color:#d4af37;margin-top:6px;display:none;"></div>
        </div>
        <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:12px;margin-bottom:12px;">
          <label class="field">
            <span style="font-weight:600;font-size:0.82rem;color:#cbd5e1;">Nome do Novo Item: *</span>
            <input class="input" id="customItemNameInput" type="text" placeholder="Ex: Espada Lunar" style="width:100%;margin-top:4px;background:#090d14;border:1px solid #233348;color:#f8fafc;padding:6px 10px;border-radius:6px;font-size:0.85rem;" required>
          </label>
          <label class="field">
            <span style="font-weight:600;font-size:0.82rem;color:#cbd5e1;">Tipo:</span>
            <select class="select" id="customItemTypeSelect" style="width:100%;margin-top:4px;background:#090d14;border:1px solid #233348;color:#f8fafc;padding:6px 10px;border-radius:6px;font-size:0.85rem;">
              <option value="arma">Arma</option>
              <option value="armadura">Armadura</option>
              <option value="escudo">Escudo</option>
              <option value="municao">Munição</option>
              <option value="item_geral" selected>Item Geral</option>
              <option value="acessorio">Acessório</option>
            </select>
          </label>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
          <label class="field">
            <span style="font-weight:600;font-size:0.82rem;color:#cbd5e1;">Preço base (T$):</span>
            <input class="input" id="customItemPriceInput" type="number" min="0" step="any" value="0" style="width:100%;margin-top:4px;background:#090d14;border:1px solid #233348;color:#f8fafc;padding:6px 10px;border-radius:6px;font-size:0.85rem;">
          </label>
          <label class="field">
            <span style="font-weight:600;font-size:0.82rem;color:#cbd5e1;">Espaços (peso):</span>
            <input class="input" id="customItemSpacesInput" type="number" min="0" step="0.5" value="1" style="width:100%;margin-top:4px;background:#090d14;border:1px solid #233348;color:#f8fafc;padding:6px 10px;border-radius:6px;font-size:0.85rem;">
          </label>
        </div>
        <div id="customWeaponFields" style="display:none;background:#141b26;border:1px solid #233348;border-radius:8px;padding:10px;margin-bottom:12px;">
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
            <label class="field">
              <span style="font-size:0.75rem;color:#cbd5e1;">Dano:</span>
              <input class="input" id="customWeaponDamageInput" type="text" placeholder="Ex: 1d8" value="1d6" style="margin-top:4px;background:#090d14;border:1px solid #233348;color:#f8fafc;padding:5px 8px;border-radius:4px;font-size:0.8rem;">
            </label>
            <label class="field">
              <span style="font-size:0.75rem;color:#cbd5e1;">Crítico:</span>
              <input class="input" id="customWeaponCritInput" type="text" placeholder="Ex: 19/x3" value="20/x2" style="margin-top:4px;background:#090d14;border:1px solid #233348;color:#f8fafc;padding:5px 8px;border-radius:4px;font-size:0.8rem;">
            </label>
            <label class="field">
              <span style="font-size:0.75rem;color:#cbd5e1;">Empunhadura:</span>
              <select class="select" id="customWeaponGripSelect" style="margin-top:4px;background:#090d14;border:1px solid #233348;color:#f8fafc;padding:5px 8px;border-radius:4px;font-size:0.8rem;">
                <option value="uma_mao">Uma mão</option>
                <option value="duas_maos">Duas mãos</option>
                <option value="leve">Leve</option>
              </select>
            </label>
          </div>
        </div>
        <div id="customArmorFields" style="display:none;background:#141b26;border:1px solid #233348;border-radius:8px;padding:10px;margin-bottom:12px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <label class="field">
              <span style="font-size:0.75rem;color:#cbd5e1;">Defesa (+):</span>
              <input class="input" id="customArmorDefenseInput" type="number" min="0" step="1" value="2" style="margin-top:4px;background:#090d14;border:1px solid #233348;color:#f8fafc;padding:5px 8px;border-radius:4px;font-size:0.8rem;">
            </label>
            <label class="field">
              <span style="font-size:0.75rem;color:#cbd5e1;">Penalidade:</span>
              <input class="input" id="customArmorPenaltyInput" type="number" step="1" value="0" style="margin-top:4px;background:#090d14;border:1px solid #233348;color:#f8fafc;padding:5px 8px;border-radius:4px;font-size:0.8rem;">
            </label>
          </div>
        </div>
        <label class="field" style="display:block;margin-bottom:16px;">
          <span style="font-weight:600;font-size:0.82rem;color:#cbd5e1;">Descrição / Propriedades:</span>
          <textarea class="input" id="customItemDescInput" rows="2" placeholder="Descreva os efeitos ou detalhes do item..." style="width:100%;margin-top:4px;resize:vertical;background:#090d14;border:1px solid #233348;color:#f8fafc;padding:6px 10px;border-radius:6px;font-size:0.85rem;"></textarea>
        </label>
        <div style="display:flex;justify-content:flex-end;gap:10px;border-top:1px solid #1a2638;padding-top:16px;">
          <button class="button" type="button" data-reward-action="close" style="padding:7px 16px;background:#141d2a;border:1px solid #233348;color:#cbd5e1;border-radius:6px;cursor:pointer;font-size:0.85rem;">Cancelar</button>
          <button class="button primary" type="button" id="confirmCreateCustomItem" style="padding:7px 20px;background:#059669;border:1px solid #10b981;color:#ffffff;border-radius:6px;cursor:pointer;font-size:0.85rem;font-weight:700;">Criar e Receber</button>
        </div>
      </div>
    </div>
  </section>`;
  document.body?.appendChild(modal);

  let currentInspiration = null;

  function syncCustomTypeFields(){
    const type = document.getElementById('customItemTypeSelect')?.value;
    const wFields = document.getElementById('customWeaponFields');
    const aFields = document.getElementById('customArmorFields');
    if(wFields) wFields.style.display = type === 'arma' ? 'block' : 'none';
    if(aFields) aFields.style.display = (type === 'armadura' || type === 'escudo') ? 'block' : 'none';
  }

  function populateInspirationSelect(){
    const sel = document.getElementById('customItemInspirationSelect');
    if(!sel || sel.options.length > 1) return;
    const items = (DATA.pdfItems || []).slice().sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = `${item.nome} (${item.tipo || 'item'} · T$ ${Number(item.preco?.valor||0)})`;
      sel.appendChild(opt);
    });
  }

  function applyInspiration(item){
    currentInspiration = item;
    const info = document.getElementById('customInspirationInfo');
    if(!item){
      if(info) info.style.display = 'none';
      return;
    }
    if(info){
      info.style.display = 'block';
      info.textContent = `Inspirado em "${item.nome}" (${item.tipo || 'item'}). Modifique o nome e pelo menos um atributo.`;
    }
    const typeSel = document.getElementById('customItemTypeSelect');
    if(typeSel) typeSel.value = item.tipo || 'item_geral';
    const priceInp = document.getElementById('customItemPriceInput');
    if(priceInp) priceInp.value = Number(item.preco?.valor || 0);
    const spacesInp = document.getElementById('customItemSpacesInput');
    if(spacesInp) spacesInp.value = Number(item.espacos || 0);
    const descInp = document.getElementById('customItemDescInput');
    if(descInp) descInp.value = item.textos?.descricao || item.descricao || '';
    if(item.tipo === 'arma'){
      const dmgInp = document.getElementById('customWeaponDamageInput');
      if(dmgInp) dmgInp.value = item.arma?.dano?.principal || '1d6';
      const critInp = document.getElementById('customWeaponCritInput');
      if(critInp){
        const crit = item.arma?.critico;
        critInp.value = crit ? `${crit.margem||20}/x${crit.multiplicador||2}` : '20/x2';
      }
      const gripSel = document.getElementById('customWeaponGripSelect');
      if(gripSel) gripSel.value = item.arma?.empunhaduraId || 'uma_mao';
    } else if(item.tipo === 'armadura' || item.tipo === 'escudo'){
      const defInp = document.getElementById('customArmorDefenseInput');
      const penInp = document.getElementById('customArmorPenaltyInput');
      if(defInp) defInp.value = item.tipo === 'armadura' ? Number(item.armadura?.defesa || 0) : Number(item.escudo?.bonusDefesa || 0);
      if(penInp) penInp.value = item.tipo === 'armadura' ? Number(item.armadura?.penalidade || 0) : Number(item.escudo?.penalidade || 0);
    }
    syncCustomTypeFields();
  }

  function updateTibarsDisplay(){
    const cur=remainingFunds();
    const curEl=document.getElementById('rewardCurrentBalance');
    if(curEl)curEl.textContent=formatTibars(cur);
    const input=document.getElementById('rewardTibarsInput');
    const val=Math.max(0,Number(input?.value)||0);
    const newEl=document.getElementById('rewardNewBalance');
    if(newEl)newEl.textContent=formatTibars(cur+val);
  }

  function renderRewardCatalog(query=''){
    const list=document.getElementById('rewardItemList');
    if(!list)return;
    const q=slug(query);
    const items=(DATA.pdfItems||[]).filter(item=>{
      if(!q)return true;
      return slug(item.nome||'').includes(q)||slug(item.tipo||'').includes(q)||slug(item.categoriaId||'').includes(q);
    }).slice(0,15);
    if(!items.length){
      list.innerHTML='<p class="help" style="padding:10px">Nenhum item encontrado.</p>';
      return;
    }
    list.innerHTML=items.map(item=>`
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;background:#0d121a;border:1px solid var(--border);border-radius:6px;padding:8px 10px">
        <div style="display:flex;flex-direction:column;gap:2px">
          <strong>${esc(item.nome)}</strong>
          <span style="font-size:0.7rem;color:var(--dim)">${esc(item.tipo||'item')} · ${Number(item.espacos||0)} esp. · T$ ${Number(item.preco?.valor||0)}</span>
        </div>
        <button class="button small primary" type="button" data-reward-add-item="${esc(item.id)}">Adicionar Grátis</button>
      </div>
    `).join('');
  }

  modal.addEventListener('click',event=>{
    if(event.target===modal||event.target.closest('[data-reward-action="close"]')){
      modal.hidden=true;
      return;
    }
    const tabBtn=event.target.closest('[data-reward-tab]');
    if(tabBtn){
      const tab=tabBtn.dataset.rewardTab;
      document.getElementById('rewardTabTibars').hidden=tab!=='tibars';
      document.getElementById('rewardTabItem').hidden=tab!=='item';
      document.getElementById('rewardTabCustom').hidden=tab!=='custom';
      document.getElementById('rewardTabBtnTibars').classList.toggle('active',tab==='tibars');
      document.getElementById('rewardTabBtnItem').classList.toggle('active',tab==='item');
      document.getElementById('rewardTabBtnCustom').classList.toggle('active',tab==='custom');
      if(tab==='tibars')updateTibarsDisplay();
      else if(tab==='custom'){
        populateInspirationSelect();
        syncCustomTypeFields();
      }
      return;
    }
    const openShopRewardBtn=event.target.closest('#btnOpenShopForReward');
    if(openShopRewardBtn){
      modal.hidden=true;
      state.isRewardShopMode=true;
      if(!state.finished)state.previousCreationStep=state.step;
      state.sheetView='shop';
      persistNow();
      renderStage();
      return;
    }
    if(event.target.closest('#confirmRewardTibars')){
      const input=document.getElementById('rewardTibarsInput');
      const val=Math.max(0,Number(input?.value)||0);
      if(val<=0){toast('Informe uma quantidade válida de tibares.');return}
      const f=financesState();
      f.rewardFunds=Math.round(((f.rewardFunds||0)+val)*100)/100;
      persistNow();
      if(state.finished&&typeof saveFinishedCharacter==='function')saveFinishedCharacter();
      modal.hidden=true;
      renderStage();
      toast(`+ ${formatTibars(val)} adicionados à ficha como recompensa!`);
      return;
    }
    if(event.target.closest('#confirmCreateCustomItem')){
      const nameInput = document.getElementById('customItemNameInput');
      const newName = (nameInput?.value || '').trim();
      if(!newName){
        toast('Informe um nome para o novo item.');
        nameInput?.focus();
        return;
      }
      if(currentInspiration && newName.toLowerCase() === currentInspiration.nome.toLowerCase()){
        toast(`O nome deve ser diferente do item de inspiração ("${currentInspiration.nome}").`);
        nameInput?.focus();
        return;
      }
      const existingCatalog = [...(DATA.pdfItems||[]), ...(state.customItems||[])];
      if(existingCatalog.some(i => i.nome.toLowerCase() === newName.toLowerCase())){
        toast(`Já existe um item cadastrado com o nome "${newName}". Escolha um nome diferente.`);
        nameInput?.focus();
        return;
      }

      const newType = document.getElementById('customItemTypeSelect')?.value || 'item_geral';
      const newPrice = Math.max(0, Number(document.getElementById('customItemPriceInput')?.value) || 0);
      const newSpaces = Math.max(0, Number(document.getElementById('customItemSpacesInput')?.value) || 0);
      const newDesc = (document.getElementById('customItemDescInput')?.value || '').trim();

      if(currentInspiration){
        let modified = false;
        if(newType !== currentInspiration.tipo) modified = true;
        if(newPrice !== Number(currentInspiration.preco?.valor || 0)) modified = true;
        if(newSpaces !== Number(currentInspiration.espacos || 0)) modified = true;
        const origDesc = (currentInspiration.textos?.descricao || currentInspiration.descricao || '').trim();
        if(newDesc !== origDesc) modified = true;

        if(newType === 'arma'){
          const newDmg = (document.getElementById('customWeaponDamageInput')?.value || '').trim();
          const newCrit = (document.getElementById('customWeaponCritInput')?.value || '').trim();
          const newGrip = document.getElementById('customWeaponGripSelect')?.value;
          const origCrit = currentInspiration.arma?.critico ? `${currentInspiration.arma.critico.margem||20}/x${currentInspiration.arma.critico.multiplicador||2}` : '';
          if(newDmg !== (currentInspiration.arma?.dano?.principal || '')) modified = true;
          if(newCrit !== origCrit) modified = true;
          if(newGrip !== (currentInspiration.arma?.empunhaduraId || '')) modified = true;
        }
        if(newType === 'armadura' || newType === 'escudo'){
          const newDef = Number(document.getElementById('customArmorDefenseInput')?.value) || 0;
          const newPen = Number(document.getElementById('customArmorPenaltyInput')?.value) || 0;
          const origDef = currentInspiration.tipo === 'armadura' ? Number(currentInspiration.armadura?.defesa || 0) : Number(currentInspiration.escudo?.bonusDefesa || 0);
          const origPen = currentInspiration.tipo === 'armadura' ? Number(currentInspiration.armadura?.penalidade || 0) : Number(currentInspiration.escudo?.penalidade || 0);
          if(newDef !== origDef || newPen !== origPen) modified = true;
        }

        if(!modified){
          toast('O item deve ter pelo menos um atributo modificado em relação à inspiração (não pode ser uma cópia exata).');
          return;
        }
      }

      const customId = 'adicionado_pers_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      const customItem = {
        id: customId,
        nome: newName,
        tipo: newType,
        categoriaId: currentInspiration?.categoriaId || (newType === 'arma' ? 'simples' : newType === 'armadura' ? 'leve' : 'sem_categoria'),
        preco: { valor: newPrice, moeda: 'T$' },
        espacos: newSpaces,
        adicionado: true,
        tag: 'adicionado',
        origemInspiracao: currentInspiration?.nome || '',
        textos: {
          descricao: newDesc || 'Item personalizado recebido como recompensa.',
          habilidade: '',
          variavel: ''
        },
        efeitos: currentInspiration?.efeitos ? JSON.parse(JSON.stringify(currentInspiration.efeitos)) : []
      };

      if(newType === 'arma'){
        const critRaw = (document.getElementById('customWeaponCritInput')?.value || '20/x2').trim();
        const critMatch = critRaw.match(/(\d+)\s*\/\s*x?(\d+)/i);
        const critMargem = critMatch ? parseInt(critMatch[1], 10) : 20;
        const critMult = critMatch ? parseInt(critMatch[2], 10) : 2;
        customItem.arma = {
          combateId: currentInspiration?.arma?.combateId || 'corpo_a_corpo',
          empunhaduraId: document.getElementById('customWeaponGripSelect')?.value || 'uma_mao',
          dano: { principal: (document.getElementById('customWeaponDamageInput')?.value || '1d6').trim(), alternativas: [] },
          critico: { margem: critMargem, multiplicador: critMult },
          alcanceId: currentInspiration?.arma?.alcanceId || null,
          tipoDanoIds: currentInspiration?.arma?.tipoDanoIds || ['impacto'],
          propriedadesIds: currentInspiration?.arma?.propriedadesIds || [],
          gruposArmaIds: currentInspiration?.arma?.gruposArmaIds || []
        };
        customItem.equipamento = { equipavel: true, slotsPermitidos: ['mao_direita', 'mao_esquerda'], ocupaMao: true, itemVestido: false };
      } else if(newType === 'armadura'){
        customItem.armadura = {
          defesa: Number(document.getElementById('customArmorDefenseInput')?.value) || 0,
          penalidade: Number(document.getElementById('customArmorPenaltyInput')?.value) || 0,
          categoriaId: currentInspiration?.armadura?.categoriaId || 'leve'
        };
        customItem.equipamento = { equipavel: true, slotsPermitidos: ['armadura'], ocupaMao: false, itemVestido: true };
      } else if(newType === 'escudo'){
        customItem.escudo = {
          bonusDefesa: Number(document.getElementById('customArmorDefenseInput')?.value) || 0,
          penalidade: Number(document.getElementById('customArmorPenaltyInput')?.value) || 0,
          categoriaId: currentInspiration?.escudo?.categoriaId || 'leve'
        };
        customItem.equipamento = { equipavel: true, slotsPermitidos: ['mao_esquerda', 'mao_direita'], ocupaMao: true, itemVestido: false };
      } else if(newType === 'acessorio'){
        customItem.equipamento = { equipavel: true, slotsPermitidos: ['acessorio', 'vestuario'], ocupaMao: false, itemVestido: true };
      } else {
        customItem.equipamento = { equipavel: false, slotsPermitidos: [], ocupaMao: false, itemVestido: false };
      }

      const added = addRewardItemToBackpack(customId, 1, {}, customItem);
      if(!added) return;
      state.customItems = state.customItems || [];
      state.customItems.push(customItem);
      modal.hidden = true;
      toast(`Item personalizado "${newName}" criado e adicionado à mochila!`);
      return;
    }
    const addBtn=event.target.closest('[data-reward-add-item]');
    if(addBtn){
      const itemId=addBtn.dataset.rewardAddItem;
      const added = typeof addRewardItemToBackpack==='function' ? addRewardItemToBackpack(itemId,1) : true;
      if(added === false) return;
      const item=(DATA.pdfItems||[]).find(i=>i.id===itemId);
      modal.hidden=true;
      toast(`"${item?.nome||'Item'}" adicionado à mochila como recompensa grátis!`);
      return;
    }
  });

  const inspSelect = document.getElementById('customItemInspirationSelect');
  if(inspSelect){
    inspSelect.addEventListener('change', () => {
      const chosenId = inspSelect.value;
      const found = (DATA.pdfItems || []).find(i => i.id === chosenId);
      applyInspiration(found || null);
    });
  }

  const typeSelect = document.getElementById('customItemTypeSelect');
  if(typeSelect){
    typeSelect.addEventListener('change', syncCustomTypeFields);
  }

  const searchInput=document.getElementById('rewardItemSearchInput');
  if(searchInput)searchInput.addEventListener('input',()=>renderRewardCatalog(searchInput.value));
  const tibarsInput=document.getElementById('rewardTibarsInput');
  if(tibarsInput)tibarsInput.addEventListener('input',updateTibarsDisplay);

  modal.sync=function(){
    updateTibarsDisplay();
    const input=document.getElementById('rewardTibarsInput');
    if(input)input.value='';
    const search=document.getElementById('rewardItemSearchInput');
    if(search)search.value='';
    renderRewardCatalog('');
    populateInspirationSelect();
    syncCustomTypeFields();
  };
  return modal;
}

function ensureEditCharacterModal(){let modal=document.getElementById('editCharacterModal');if(modal)return modal;modal=document.createElement('div');modal.id='editCharacterModal';modal.className='modal-backdrop';modal.hidden=true;modal.innerHTML='<section class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="editCharacterTitle"><header><h3 id="editCharacterTitle">Salvar ficha editada</h3></header><div class="confirm-modal-body"><p>Você quer substituir a ficha original ou guardar estas alterações como um novo personagem?</p></div><footer><button class="button" type="button" data-edit-save="cancel">Continuar editando</button><button class="button" type="button" data-edit-save="copy">Salvar como nova ficha</button><button class="button primary" type="button" data-edit-save="overwrite">Sobrescrever ficha</button></footer></section>';document.body.appendChild(modal);modal.addEventListener('click',event=>{const action=event.target.closest?.('[data-edit-save]')?.dataset.editSave;if(!action)return;if(action==='cancel'){modal.hidden=true;return}const edit=state.editingCharacter||{},originalId=edit.originalId;if(action==='copy'){delete state.identity.characterId;characterIdentifier()}else if(originalId)state.identity.characterId=originalId;delete state.editingCharacter;state.isEditingFinishedSheet=false;document.body?.classList.remove('is-editing-mode');if(!state.completed.includes(9))state.completed.push(9);state.finished=true;state.sheetView='sheet';modal.hidden=true;persistNow();saveFinishedCharacter();renderStage();window.scrollTo({top:0,behavior:'smooth'})});return modal}
function ensureDeleteCharacterModal(){let modal=document.getElementById('deleteCharacterModal');if(!modal){modal=document.createElement('div');modal.id='deleteCharacterModal';document.body.appendChild(modal)}if(modal.innerHTML?.includes('data-delete-action'))return modal;modal.className='modal-backdrop';modal.hidden=true;modal.innerHTML='<section class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="deleteCharacterTitle"><header><h3 id="deleteCharacterTitle">Apagar Herói</h3></header><div class="confirm-modal-body"><p>Tem certeza que deseja apagar <strong id="deleteHeroName">este herói</strong>? Esta ação removerá a ficha permanentemente.</p></div><footer style="display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;"><button class="button" type="button" data-delete-action="keep">Manter Herói</button><button class="button" type="button" data-delete-action="tavern">Escolher na taverna</button><button class="button" type="button" data-delete-action="main-menu">Voltar ao menu principal</button><button class="button danger primary" type="button" data-delete-action="forge">Forjar Novo Herói</button></footer></section>';modal.addEventListener('click',event=>{if(event.target===modal){modal.hidden=true;return}const btn=event.target.closest?.('[data-delete-action]');if(!btn)return;const action=btn.dataset.deleteAction;if(action==='keep'){modal.hidden=true;return}const id=characterIdentifier();const remaining=characterRoster().filter(item=>item.id!==id);localStorage.setItem(CHARACTER_ROSTER_KEY,JSON.stringify(remaining));modal.hidden=true;if(action==='tavern'){if(remaining.length>0){state=remaining[0].snapshot;normalizeState();localStorage.setItem(STORAGE_KEY,JSON.stringify(state));renderStage();showCharacterPicker();toast('Herói apagado. Escolha outro herói na taverna.')}else{state=defaultState();localStorage.setItem(STORAGE_KEY,JSON.stringify(state));const resetBtn=document.getElementById('resetButton');if(resetBtn)resetBtn.hidden=true;renderStage();toast('Herói apagado. Não há outros heróis na taverna, iniciando nova forja.')}return}if(action==='main-menu'){state=defaultState();localStorage.setItem(STORAGE_KEY,JSON.stringify(state));const resetBtn=document.getElementById('resetButton');if(resetBtn)resetBtn.hidden=true;renderStage();toast('Herói apagado. A tela do menu principal será lançada futuramente.');return}if(action==='forge'){state=defaultState();localStorage.setItem(STORAGE_KEY,JSON.stringify(state));const resetBtn=document.getElementById('resetButton');if(resetBtn)resetBtn.hidden=true;renderStage();toast('Herói apagado. Iniciando a forja de um novo herói.');return}});return modal}
function finishCharacterCreation(){if(state.isPlanningMode){state.isLevelingUp=false;delete state.levelUpBefore;delete state.editingCharacter;state.finished=true;state.sheetView='sheet';state.step=10;persistNow();if(typeof window!=='undefined'&&typeof sessionStorage!=='undefined'&&sessionStorage.getItem('forja_planning_from_ficha')==='true'){sessionStorage.removeItem('forja_planning_from_ficha');window.location.href='ficha.html';return}renderStage();window.scrollTo({top:0,behavior:'smooth'});return}if(state.isLevelingUp){state.isLevelingUp=false;delete state.levelUpBefore;delete state.editingCharacter;if(!state.completed.includes(9))state.completed.push(9);state.finished=true;state.sheetView='sheet';persistNow();if(typeof saveFinishedCharacter==='function')saveFinishedCharacter();renderStage();window.scrollTo({top:0,behavior:'smooth'});toast('Parabéns! Você subiu para o nível '+state.identity.plannedLevel+'!');return}if(state.editingCharacter){ensureEditCharacterModal().hidden=false;return}if(!state.completed.includes(9))state.completed.push(9);state.finished=true;state.sheetView='sheet';persistNow();if(typeof saveFinishedCharacter==='function')saveFinishedCharacter();renderStage();window.scrollTo({top:0,behavior:'smooth'})}
function renderFinalGrimoire(){
  const gSource=spellState().grimoireSource;
  const isWorkshopCraft=['potion','scroll','tattoo','engenhoca'].includes(gSource);
  const isTavernPotion=gSource==='tavern-potion';
  let title=spellState().view==='learned'?'Grimório do Herói':'Grimório Geral';
  if(isTavernPotion)title='Taverna de Arton · Escolha de Magia para Poção';
  else if(gSource==='potion')title='Laboratório do Alquimista · Escolha de Magia para Poção';
  else if(gSource==='scroll')title='Escritório do Escriba · Escolha de Magia para Pergaminho';
  else if(gSource==='tattoo')title='Estúdio do Tatuador · Escolha de Magia Arcana de 1º Círculo';
  else if(gSource==='engenhoca')title='Oficina do Engenhoqueiro · Criação de Engenhocas';
  return '<section class="panel spell-catalog-panel"><div class="panel-body" style="padding:0;"><p class="spell-frame-status" id="spellFrameStatus" role="status">Carregando o Grimório…</p><iframe id="spellGrimoire" class="spell-grimoire" title="'+title+'" sandbox="allow-scripts" style="display:block;width:100%;height:calc(100vh - 70px);height:calc(100dvh - 70px);min-height:480px;border:0;"></iframe></div></section>';
}
function renderShopView(){
  const backLabel=state.finished?'Voltar ao herói':'Voltar à criação';
  const isWorkshop = state.sheetView === 'workshop';
  const isReward = Boolean(state.isRewardShopMode);
  let title = isReward ? 'Resgatar Recompensa · Loja' : 'Loja';
  let extraBtn = '';
  if (isWorkshop) {
    if (!state.contraptionAttach) {
      const secKey = state.workshopSection || 'artesao';
      window.location.replace(`loja.html?oficina=${encodeURIComponent(secKey)}`);
      return '';
    }
    const secKey = state.workshopSection || 'artesao';
    // @ts-ignore
    const rules = typeof RegrasManufatura !== 'undefined' ? RegrasManufatura : null;
    const sec = rules?.secoesOficina?.[secKey] || { title: 'Oficina de Manufatura', icon: '' };
    title = `${sec.title} · Forjar em um Item (${escapeHtml(state.contraptionAttach.spellName)})`;
  }
  const isEngenhoqueiroWorkshop = isWorkshop && (state.workshopSection === 'engenhoqueiro' || state.workshopSection === 'engenhoca');
  const footerHtml = isWorkshop
    ? (state.contraptionAttach
        ? '<div class="sheet-shop-footer forja-autohide-footer" style="display:flex;justify-content:flex-end;align-items:center;gap:12px;padding:10px 24px;background:#0d1117;border-top:1px solid #1a2230;box-sizing:border-box;width:100%;">' +
            '<button class="button" type="button" data-sheet-action="cancel-contraption-attach" style="background:#991b1b;border-color:#b91c1c;color:#ffffff;font-weight:700;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:0.88rem;box-shadow:0 2px 6px rgba(0,0,0,0.3);height:38px;display:inline-flex;align-items:center;justify-content:center;line-height:1;">Voltar à Engenhoca</button>' +
            '<button class="button" type="button" data-sheet-action="contraption-attach-sheet">Voltar à ficha</button>' +
            '<button class="button" type="button" data-sheet-action="change-contraption-workshop" style="background:#1e293b;border-color:#475569;color:#ffffff;font-weight:700;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:0.88rem;box-shadow:0 2px 6px rgba(0,0,0,0.3);height:38px;display:inline-flex;align-items:center;justify-content:center;line-height:1;">Trocar Ofício</button>' +
          '</div>'
        : (isEngenhoqueiroWorkshop
            ? '<div class="sheet-shop-footer forja-autohide-footer" style="display:flex;justify-content:flex-end;align-items:center;gap:12px;padding:10px 24px;background:#0d1117;border-top:1px solid #1a2230;box-sizing:border-box;width:100%;">' +
                '<button class="button" type="button" data-sheet-action="sheet" style="background:#991b1b;border-color:#b91c1c;color:#ffffff;font-weight:700;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:0.88rem;box-shadow:0 2px 6px rgba(0,0,0,0.3);height:38px;display:inline-flex;align-items:center;justify-content:center;line-height:1;">Voltar</button>' +
              '</div>'
            : '<div class="sheet-shop-footer forja-autohide-footer" style="display:flex;justify-content:flex-end;align-items:center;gap:12px;padding:10px 24px;background:#0d1117;border-top:1px solid #1a2230;box-sizing:border-box;width:100%;">' +
                '<button class="button" type="button" data-sheet-action="sheet" style="background:#991b1b;border-color:#b91c1c;color:#ffffff;font-weight:700;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:0.88rem;box-shadow:0 2px 6px rgba(0,0,0,0.3);height:38px;display:inline-flex;align-items:center;justify-content:center;line-height:1;">Voltar</button>' +
                '<button class="button" type="button" data-sheet-action="workshop-hub" style="background:#991b1b;border-color:#b91c1c;color:#ffffff;font-weight:700;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:0.88rem;box-shadow:0 2px 6px rgba(0,0,0,0.3);height:38px;display:inline-flex;align-items:center;justify-content:center;line-height:1;">Trocar Oficina</button>' +
              '</div>'
          ))
    : (isReward
        ? '<div class="sheet-shop-footer forja-autohide-footer" style="display:flex;justify-content:flex-end;align-items:center;gap:12px;padding:10px 24px;background:#0d1117;border-top:1px solid #1a2230;box-sizing:border-box;width:100%;">' +
            '<button class="button" type="button" data-sheet-action="sheet" style="background:#991b1b;border-color:#b91c1c;color:#ffffff;font-weight:700;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:0.88rem;box-shadow:0 2px 6px rgba(0,0,0,0.3);height:38px;display:inline-flex;align-items:center;justify-content:center;line-height:1;">Voltar</button>' +
          '</div>'
        : '<div class="sheet-shop-footer forja-autohide-footer" style="display:flex;justify-content:flex-end;align-items:center;gap:12px;padding:10px 24px;background:#0d1117;border-top:1px solid #1a2230;box-sizing:border-box;width:100%;">' +
            '<button class="button" type="button" data-sheet-action="sheet" style="background:#991b1b;border-color:#b91c1c;color:#ffffff;font-weight:700;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:0.88rem;box-shadow:0 2px 6px rgba(0,0,0,0.3);height:38px;display:inline-flex;align-items:center;justify-content:center;line-height:1;">Voltar</button>' +
            '<button class="button" type="button" data-sheet-shop-reward style="background:#991b1b;border-color:#b91c1c;color:#ffffff;font-weight:700;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:0.88rem;box-shadow:0 2px 6px rgba(0,0,0,0.3);height:38px;display:inline-flex;align-items:center;justify-content:center;line-height:1;">Recompensa</button>' +
            '<button class="button" type="button" data-sheet-shop-checkout style="background:#991b1b;border-color:#b91c1c;color:#ffffff;font-weight:700;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:0.88rem;box-shadow:0 2px 6px rgba(0,0,0,0.3);height:38px;display:inline-flex;align-items:center;justify-content:center;line-height:1;">Finalizar Compra</button>' +
          '</div>');
  return '<section class="panel arsenal-choice-panel" style="display:flex;flex-direction:column;margin-bottom:0;padding:0;"><header class="panel-header" id="arsenalPanelHeader" style="display:none !important;"><h3 class="panel-title" id="arsenalPanelTitle">'+title+'</h3><div style="display:flex;align-items:center;" id="arsenalPanelActions"></div></header><p class="help" id="arsenalStatus" style="display:none !important;">'+(isWorkshop ? 'Carregando os itens da oficina…' : 'Carregando os itens…')+'</p><iframe id="characterArsenal" title="'+title+'" sandbox="allow-scripts" style="width:100%;height:calc(100vh - 60px);height:calc(100dvh - 60px);min-height:520px;border:0;margin:0;padding:0;display:block;"></iframe><div id="arsenalUnresolved"></div>' + footerHtml + '</section>';
}

function renderTavernView(){return '<section class="panel tavern-choice-panel"><iframe id="characterTavern" title="Taverna de Arton" sandbox="allow-scripts" style="display:block;width:100%;height:calc(100dvh - 52px);min-height:480px;border:0"></iframe></section>'}


function showCharacterPicker(){if(state.finished&&typeof saveFinishedCharacter==='function')saveFinishedCharacter();window.location.href='personagens.html'}
const grimoireContextBeforeCharacterSheet=grimoireContext;
grimoireContext=function(){
  if(state.sheetView!=='grimoire')return grimoireContextBeforeCharacterSheet();
  const gSource = spellState().grimoireSource;
  const isWorkshopCraft = ['potion','scroll','tattoo','engenhoca'].includes(gSource);
  const isTavernPotion = gSource === 'tavern-potion';
  const isTavernTattoo = gSource === 'tavern-tattoo';
  const isMenuConsultation = spellState().grimoireSource === 'menu' || isWorkshopCraft || isTavernPotion || isTavernTattoo;
  if(isMenuConsultation){
    const catalogSpells = (DATA.spells || []).map(spell => spell.id);
    let label = 'Grimório Geral';
    let circles = [1, 2, 3, 4, 5];
    let traditions = ['arcana', 'divina'];
    let visibleSpells = catalogSpells;
    let selectableSpells = [];
    let isReadOnly = !isWorkshopCraft && !isTavernPotion && !isTavernTattoo;
    if (isTavernPotion) {
      const circSelected = Number(state.tavernPotionPurchase?.circle) || 1;
      circles = [1, 2, 3, 4, 5];
      label = `Poções da Taverna (${circSelected}º Círculo Selecionado)`;
      visibleSpells = catalogSpells;
      selectableSpells = catalogSpells;
    } else if (isTavernTattoo) {
      const price = Number(state.tavernTattooPurchase?.price) || 1000;
      label = `Tatuagem Mística da Taverna (1º Círculo · T$ ${price.toLocaleString('pt-BR')})`;
      circles = [1];
      traditions = ['arcana', 'divina'];
      visibleSpells = (DATA.spells || []).filter(s => Number(s.circulo || s.circle || 1) === 1).map(s => s.id);
      selectableSpells = visibleSpells;
    } else if (gSource === 'potion') {
      const known = typeof allLearnedSpellIds === 'function' ? allLearnedSpellIds() : [];
      label = known.length ? 'Poções do Alquimista (Magias Conhecidas)' : 'Poções do Alquimista (Nenhuma magia conhecida)';
      visibleSpells = known;
      selectableSpells = known;
    } else if (gSource === 'scroll') {
      const known = typeof allLearnedSpellIds === 'function' ? allLearnedSpellIds() : [];
      label = known.length ? 'Pergaminhos do Escriba (Magias Conhecidas)' : 'Pergaminhos do Escriba (Nenhuma magia conhecida)';
      visibleSpells = known;
      selectableSpells = known;
    } else if (gSource === 'tattoo') {
      label = 'Tatuagem Mística (1º Círculo Arcana)';
      circles = [1];
      traditions = ['arcana'];
      visibleSpells = (DATA.spells || []).filter(s => Number(s.circulo || s.circle || 1) === 1 && (s.tipo === 'arcana' || s.tipo === 'universal')).map(s => s.id);
      selectableSpells = visibleSpells;
    } else if (gSource === 'engenhoca') {
      const lvl = typeof effectiveCharacterLevel === 'function' ? effectiveCharacterLevel() : ((state.progression?.length || 0) + 1);
      // @ts-ignore
      const rules = typeof RegrasManufatura !== 'undefined' ? RegrasManufatura : null;
      const maxCirc = rules ? rules.circuloMaximoEngenhoca(lvl) : (lvl >= 18 ? 5 : (lvl >= 14 ? 4 : (lvl >= 10 ? 3 : (lvl >= 6 ? 2 : 1))));
      circles = [1, 2, 3, 4, 5].filter(c => c <= maxCirc);
      traditions = ['arcana', 'divina'];
      label = `Oficina do Engenhoqueiro (Magias até ${maxCirc}º Círculo)`;
      const engenhocaSpells = (DATA.spells || []).filter(s => Number(s.circulo || s.circle || 1) <= maxCirc).map(s => s.id);
      visibleSpells = engenhocaSpells;
      selectableSpells = engenhocaSpells;
    }
    return {
      channel: 'forja-t20-grimoire-v1',
      type: 'context',
      session: grimoireSession,
      group: isTavernPotion ? 'tavern-potion-grimoire' : (isTavernTattoo ? 'tavern-tattoo-grimoire' : (isWorkshopCraft ? `${gSource}-grimoire` : 'general-consultation')),
      label,
      mode: isTavernPotion ? 'tavern-potion' : (isTavernTattoo ? 'tavern-tattoo' : (isWorkshopCraft ? (gSource === 'engenhoca' ? 'workshop-engenhoca' : `${gSource}-craft`) : 'consult')),
      source: isTavernPotion ? 'tavern-potion' : (isTavernTattoo ? 'tavern-tattoo' : (isWorkshopCraft ? gSource : 'menu')),
      view: 'available',
      readOnly: isReadOnly,
      schoolsBlocked: true,
      allSchools: true,
      allowAllSchools: true,
      allowClassSchools: false,
      visible: visibleSpells,
      selectable: selectableSpells,
      chosen: [],
      learned: [],
      schools: [],
      fixedSchools: [],
      schoolCount: 0,
      schoolChoiceCount: 0,
      initialCircle: isTavernPotion ? (Number(state.tavernPotionPurchase?.circle) || 1) : 0,
      circles,
      traditions,
      availableSchools: typeof SPELL_SCHOOLS !== 'undefined' ? Object.keys(SPELL_SCHOOLS) : ['abjuracao', 'adivinhacao', 'convocacao', 'encantamento', 'evocacao', 'ilusao', 'necromancia', 'transmutacao'],
      schoolFilter: null
    };
  }
  const plan=typeof spellPlan==='function'?spellPlan():null;
  const classId=state.identity.classId||'';
  const cls=classById(classId);
  const ability=(cls?.habilidades||[]).find(h=>(h.efeitos||[]).some(e=>e.tipo==='conjuracao'));
  const effect=ability?.efeitos?.find(e=>e.tipo==='conjuracao');
  const hasClassMagic=Boolean(ability);
  const schoolChoiceCount=Number(effect?.escolasEscolha||cls?.schoolCount||0);
  const isLimitedBySchools=hasClassMagic&&schoolChoiceCount>0;
  const classSchools=typeof classSpellSchools==='function'&&plan?classSpellSchools(classId,plan):(spellState().schools[classId]||[]);
  const traditions=effect?.tipoMagia?[effect.tipoMagia]:(hasClassMagic?['arcana']:['arcana','divina']);
  const learned=allLearnedSpellIds();
  return{
    channel:'forja-t20-grimoire-v1',type:'context',session:grimoireSession,group:'character-grimoire',
    label:spellState().view==='learned'?'Grimório do Herói':'Grimório Geral',
    view:spellState().view,section:spellCatalogUI.section,books:[...spellCatalogUI.books],
    visible:DATA.spells.map(spell=>spell.id),
    chosen:[],learned,fixedSpells:[],relearnedSpells:{},selectable:[],canChoose:false,
    classId,hasClassMagic,isLimitedBySchools,schools:classSchools,fixedSchools:effect?.escolasFixas||[],
    schoolCount:schoolChoiceCount,schoolChoiceCount,schoolChoicesComplete:true,
    availableSchools:Object.keys(SPELL_SCHOOLS),circles:[1,2,3,4,5],traditions,
    classTraditions:traditions,mode:'character-sheet'
  };
};


let sheetRenderedOwner=null,sheetRenderedRevision=-1;
function switchFinalSheetView(targetView,navigationOnly=false){
  const root=document.getElementById('stageRoot');
  if(!root)return;
  let sheetContainer=document.getElementById('sheetViewContainer');
  let arsenalContainer=document.getElementById('arsenalViewContainer');
  let grimoireContainer=document.getElementById('grimoireViewContainer');
  let tavernContainer=document.getElementById('tavernViewContainer');
  let baseAttrsContainer=document.getElementById('baseAttributesViewContainer');

  if(!sheetContainer||!arsenalContainer||!grimoireContainer||!tavernContainer||!baseAttrsContainer){
    root.innerHTML='<div id="sheetViewContainer" class="sheet-view-section"></div>'
      + '<div id="arsenalViewContainer" class="sheet-view-section" hidden style="display:none;"></div>'
      + '<div id="grimoireViewContainer" class="sheet-view-section" hidden style="display:none;"></div>'
      + '<div id="tavernViewContainer" class="sheet-view-section" hidden style="display:none;"></div>'
      + '<div id="baseAttributesViewContainer" class="sheet-view-section" hidden style="display:none;"></div>';
    sheetContainer=document.getElementById('sheetViewContainer');
    arsenalContainer=document.getElementById('arsenalViewContainer');
    grimoireContainer=document.getElementById('grimoireViewContainer');
    tavernContainer=document.getElementById('tavernViewContainer');
    baseAttrsContainer=document.getElementById('baseAttributesViewContainer');
  }

  const isSheet=targetView==='sheet'||!targetView;
  const isShop=targetView==='shop'||targetView==='workshop';
  const isGrimoire=targetView==='grimoire';
  const isTavern=targetView==='tavern';
  const isBaseAttrs=targetView==='base-attributes';

  sheetContainer.hidden=!isSheet;
  sheetContainer.style.display=isSheet?'block':'none';

  arsenalContainer.hidden=!isShop;
  arsenalContainer.style.display=isShop?'block':'none';

  grimoireContainer.hidden=!isGrimoire;
  grimoireContainer.style.display=isGrimoire?'block':'none';

  tavernContainer.hidden=!isTavern;
  tavernContainer.style.display=isTavern?'block':'none';

  baseAttrsContainer.hidden=!isBaseAttrs;
  baseAttrsContainer.style.display=isBaseAttrs?'block':'none';

  if(isSheet){
    if(!navigationOnly||sheetRenderedOwner!==state||sheetRenderedRevision!==characterDataRevision||!sheetContainer.firstChild){
      sheetContainer.innerHTML=renderCharacterDetails();
      sheetRenderedOwner=state;sheetRenderedRevision=characterDataRevision;
    }
  }else if(isBaseAttrs){
    baseAttrsContainer.innerHTML=typeof renderBaseAttributesPage==='function'?renderBaseAttributesPage():'';
  }else if(isShop){
    const isWorkshop=targetView==='workshop';
    arsenalShopOpen=!isWorkshop;
    const existingFrame=arsenalContainer.querySelector('#characterArsenal');
    if(!existingFrame){
      arsenalContainer.innerHTML=renderShopView();
      mountFinalCharacterShop();
    }else{
      const titleEl=arsenalContainer.querySelector('#arsenalPanelTitle');
      const backLabel=state.finished?'Voltar ao herói':'Voltar à criação';
      let extraBtn='';
      if(titleEl){
        if(isWorkshop){
          const secKey=state.workshopSection||'artesao';
          // @ts-ignore
          const rules=typeof RegrasManufatura!=='undefined'?RegrasManufatura:null;
          const sec=rules?.secoesOficina?.[secKey]||{title:'Oficina de Manufatura',icon: ''};
          const modeLabel=state.workshopReadOnly?'Consulta de Ofício':'Manufatura (⅓ do custo)';
          titleEl.textContent=`${sec.title} · ${modeLabel}`;
        }else if(state.isRewardShopMode){
          titleEl.textContent='Resgatar Recompensa · Arsenal de Arton';
        }else{
          titleEl.textContent='Loja · Arsenal de Arton';
        }
      }
      const actionsEl=arsenalContainer.querySelector('#arsenalPanelActions');
      if(actionsEl){
        actionsEl.innerHTML='';
      }
      let footerEl = arsenalContainer.querySelector('.sheet-shop-footer');
      if(footerEl) footerEl.remove();
      const footerDiv = document.createElement('div');
      footerDiv.className = 'sheet-shop-footer';
      footerDiv.style.cssText = 'display:flex;justify-content:flex-end;align-items:center;gap:12px;padding:10px 24px;background:#0d1117;border-top:1px solid #1a2230;box-sizing:border-box;width:100%;';
      if(isWorkshop){
        const isEngenhoqueiroWorkshop = state.workshopSection === 'engenhoqueiro' || state.workshopSection === 'engenhoca';
        if (state.contraptionAttach) {
          footerDiv.innerHTML = '<button class="button" type="button" data-sheet-action="cancel-contraption-attach" style="background:#991b1b;border-color:#b91c1c;color:#ffffff;font-weight:700;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:0.88rem;box-shadow:0 2px 6px rgba(0,0,0,0.3);height:38px;display:inline-flex;align-items:center;justify-content:center;line-height:1;">Voltar à Engenhoca</button>' +
            '<button class="button" type="button" data-sheet-action="contraption-attach-sheet">Voltar à ficha</button>' +
            '<button class="button" type="button" data-sheet-action="change-contraption-workshop" style="background:#1e293b;border-color:#475569;color:#ffffff;font-weight:700;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:0.88rem;box-shadow:0 2px 6px rgba(0,0,0,0.3);height:38px;display:inline-flex;align-items:center;justify-content:center;line-height:1;">Trocar Ofício</button>';
        } else if (isEngenhoqueiroWorkshop) {
          footerDiv.innerHTML = '<button class="button" type="button" data-sheet-action="sheet" style="background:#991b1b;border-color:#b91c1c;color:#ffffff;font-weight:700;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:0.88rem;box-shadow:0 2px 6px rgba(0,0,0,0.3);height:38px;display:inline-flex;align-items:center;justify-content:center;line-height:1;">Voltar</button>';
        } else {
          footerDiv.innerHTML = '<button class="button" type="button" data-sheet-action="sheet" style="background:#991b1b;border-color:#b91c1c;color:#ffffff;font-weight:700;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:0.88rem;box-shadow:0 2px 6px rgba(0,0,0,0.3);height:38px;display:inline-flex;align-items:center;justify-content:center;line-height:1;">Voltar</button>' +
            '<button class="button" type="button" data-sheet-action="workshop-hub" style="background:#991b1b;border-color:#b91c1c;color:#ffffff;font-weight:700;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:0.88rem;box-shadow:0 2px 6px rgba(0,0,0,0.3);height:38px;display:inline-flex;align-items:center;justify-content:center;line-height:1;">Trocar Oficina</button>';
        }
      } else if(state.isRewardShopMode){
        footerDiv.innerHTML = '<button class="button" type="button" data-sheet-action="sheet" style="background:#991b1b;border-color:#b91c1c;color:#ffffff;font-weight:700;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:0.88rem;box-shadow:0 2px 6px rgba(0,0,0,0.3);height:38px;display:inline-flex;align-items:center;justify-content:center;line-height:1;">Voltar</button>';
      } else {
        footerDiv.innerHTML = '<button class="button" type="button" data-sheet-action="sheet" style="background:#991b1b;border-color:#b91c1c;color:#ffffff;font-weight:700;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:0.88rem;box-shadow:0 2px 6px rgba(0,0,0,0.3);height:38px;display:inline-flex;align-items:center;justify-content:center;line-height:1;">Voltar</button>' +
          '<button class="button" type="button" data-sheet-shop-reward style="background:#991b1b;border-color:#b91c1c;color:#ffffff;font-weight:700;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:0.88rem;box-shadow:0 2px 6px rgba(0,0,0,0.3);height:38px;display:inline-flex;align-items:center;justify-content:center;line-height:1;">Recompensa</button>' +
          '<button class="button" type="button" data-sheet-shop-checkout style="background:#991b1b;border-color:#b91c1c;color:#ffffff;font-weight:700;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:0.88rem;box-shadow:0 2px 6px rgba(0,0,0,0.3);height:38px;display:inline-flex;align-items:center;justify-content:center;line-height:1;">Finalizar Compra</button>';
      }
      arsenalContainer.querySelector('.arsenal-choice-panel')?.appendChild(footerDiv);
    }
    mountFinalCharacterShop();
    syncFinalShopFooter();
  }else if(isGrimoire){
    const existingFrame=grimoireContainer.querySelector('#spellGrimoire');
    if(!existingFrame){
      grimoireContainer.innerHTML=renderFinalGrimoire();
      mountGrimoire();
    }else if(typeof syncGrimoire==='function'){
      syncGrimoire();
    }
  }else if(isTavern){
    const existingFrame=tavernContainer.querySelector('#characterTavern');
    if(!existingFrame){
      tavernContainer.innerHTML=renderTavernView();
    }
    mountFinalCharacterTavern();
  }
}
function mountFinalCharacterShop(){
  const target=document.getElementById('characterArsenal');
  if(!target)return;
  const isReward = Boolean(state.isRewardShopMode);
  const mode=state.sheetView==='workshop'?'workshop':(isReward?'reward':'shop');
  const context=arsenalInitialData(mode);
  context.isRewardMode = isReward;
  if(isReward) context.mode = 'reward';
  context.pv = typeof progressionStats === 'function' ? progressionStats().pv : (state.pv || 20);
  const prof = typeof inventoryProfile === 'function' ? inventoryProfile() : null;
  const stateC = Array.isArray(state.contraptions) ? state.contraptions : [];
  const profC = Array.isArray(prof?.contraptions) ? prof.contraptions : [];
  const mergedContraptions = [...stateC];
  const seenCIds = new Set(mergedContraptions.map(c => c.id));
  profC.forEach(c => {
    if (c && c.id && !seenCIds.has(c.id)) {
      seenCIds.add(c.id);
      mergedContraptions.push(c);
    }
  });
  const candidateBackpack = [...(Array.isArray(prof?.backpack) ? prof.backpack : []), ...(Array.isArray(state?.inventory) ? state.inventory : [])];
  candidateBackpack.forEach(entry => {
    if (entry && (entry.isEngenhoca || entry.contraptionId || /engenhoca_/i.test(entry.itemId || ''))) {
      const cId = entry.contraptionId || entry.itemId;
      if (cId && !seenCIds.has(cId)) {
        seenCIds.add(cId);
        mergedContraptions.push(entry.engenhocaInfo || {
          id: cId,
          nome: entry.displayName || entry.itemName || 'Engenhoca',
          spellName: entry.engenhocaInfo?.spellName || '',
          circulo: entry.engenhocaInfo?.circulo || 1,
          pm: entry.engenhocaInfo?.pm || 1,
          formaUso: entry.formaUso || 'empunhada',
          attachedItem: entry.attachedItem || null
        });
      }
    }
  });
  state.contraptions = mergedContraptions;
  context.contraptions = mergedContraptions;
  if(mode==='workshop'){
    context.mode='workshop';
    context.workshopSection=state.workshopSection||'artesao';
    context.workshopReadOnly=Boolean(state.workshopReadOnly);
    if(state.contraptionAttach){
      context.contraptionAttach=state.contraptionAttach;
    }
  }
  if(target.dataset.mountedSrc==='loja.html'&&target.contentWindow){
    context.session=arsenalSession;
    arsenalMountedOwner=state;
    sendArsenal('context',{context});
    return;
  }
  arsenalSession++;
  context.session=arsenalSession;
  arsenalMountedOwner=state;
  arsenalContextKey=JSON.stringify([context.mode,context.workshopSection,context.workshopReadOnly,context.strength,context.capacityBonus,context.characterName,context.funds,(context.contraptions||[]).length,Boolean(context.contraptionAttach),context.contraptionAttach?.spellId]);
  target.dataset.mountedSrc='loja.html';
  Forja.mount(target,'loja.html',context);
}
function mountFinalCharacterTavern(){
  const target=document.getElementById('characterTavern');
  if(!target)return;
  const funds=remainingFunds();
  const context={funds,characterName:state.identity?.characterName||'Herói',level:Number(state.identity?.plannedLevel)||Number(state.identity?.initialLevel)||((state.progression?.length||0)+1),contracts:state.tavernContracts||[]};
  if(target.dataset.mountedSrc==='taverna.html'&&target.contentWindow){
    target.contentWindow.postMessage({type:'context',context},'*');
    return;
  }
  target.dataset.mountedSrc='taverna.html';
  Forja.mount(target,'taverna.html',context);
}

function ensureImportCodeModal() {
  let modal = document.getElementById('importCodeModal');
  if (modal && typeof modal.sync === 'function') return modal;
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'importCodeModal';
    document.body?.appendChild(modal);
  }
  modal.className = 'modal-backdrop';
  modal.hidden = true;
  modal.innerHTML = `
    <section class="confirm-modal import-code-modal" role="dialog" aria-modal="true" aria-labelledby="importCodeModalTitle" style="max-width:560px;width:95%;background:#0b1017;border:1px solid #243447;border-radius:10px;box-shadow:0 12px 36px rgba(0,0,0,0.7);color:#e2e8f0;padding:20px;font-family:inherit;">
      <header style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #1a2636;padding-bottom:12px;margin-bottom:14px;">
        <h3 id="importCodeModalTitle" style="margin:0;font-size:1.1rem;color:#f1f5f9;font-family:Cinzel,serif;display:flex;align-items:center;gap:8px;">
          Importar Item por Código (T20)
        </h3>
        <button class="button small" type="button" data-import-action="close" aria-label="Fechar" style="background:#141b27;border:1px solid #263345;color:#94a3b8;font-size:1.1rem;line-height:1;padding:2px 8px;border-radius:4px;cursor:pointer;">×</button>
      </header>
      <div class="confirm-modal-body" style="padding:0;">
        <p style="font-size:0.82rem;color:#94a3b8;margin:0 0 12px 0;line-height:1.45;">
          Cole abaixo um código de item compartilhado de Tormenta 20 (mundanos, superiores, mágicos, engenhocas simples ou engenhocas acopladas).
        </p>
        <div style="margin-bottom:14px;">
          <textarea id="importCodeInput" rows="3" placeholder="Ex: T20:ARM:espada_longa:SUP:MEL.certeira:0+T20:ENG:CIR1:PM1:adaga-mental:empunhada" style="width:100%;box-sizing:border-box;background:#06090e;border:1px solid #263345;border-radius:6px;color:#38bdf8;font-family:monospace;font-size:0.8rem;padding:8px 10px;resize:vertical;outline:none;line-height:1.4;"></textarea>
        </div>
        <div id="importCodePreview" style="background:#070b12;border:1px solid #1a2538;border-radius:6px;padding:12px;margin-bottom:16px;min-height:70px;display:flex;flex-direction:column;justify-content:center;">
          <div style="color:#64748b;font-size:0.78rem;font-style:italic;text-align:center;">
            Cole ou digite um código acima para pré-visualizar as características do item.
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;border-top:1px solid #1a2636;padding-top:14px;">
          <button class="button" type="button" data-import-action="close" style="padding:6px 14px;background:#141b27;border:1px solid #263345;color:#cbd5e1;border-radius:6px;cursor:pointer;font-size:0.84rem;">Cancelar</button>
          <button class="button primary" type="button" id="confirmImportCodeBtn" disabled style="padding:6px 18px;background:#059669;border:1px solid #10b981;color:#ffffff;border-radius:6px;cursor:not-allowed;font-size:0.84rem;font-weight:700;opacity:0.5;">Adicionar à Mochila</button>
        </div>
      </div>
    </section>
  `;

  let currentParsedItem = null;
  const inputEl = modal.querySelector('#importCodeInput');
  const previewEl = modal.querySelector('#importCodePreview');
  const confirmBtn = modal.querySelector('#confirmImportCodeBtn');

  function updatePreview() {
    const raw = (inputEl.value || '').trim();
    if (!raw) {
      currentParsedItem = null;
      previewEl.innerHTML = '<div style="color:#64748b;font-size:0.78rem;font-style:italic;text-align:center;">Cole ou digite um código acima para pré-visualizar as características do item.</div>';
      confirmBtn.disabled = true;
      confirmBtn.style.opacity = '0.5';
      confirmBtn.style.cursor = 'not-allowed';
      return;
    }

    const mod = typeof CodigoCompartilhamentoItem !== 'undefined' ? CodigoCompartilhamentoItem : null;
    if (!mod || typeof mod.interpretar !== 'function') {
      previewEl.innerHTML = '<div style="color:#ef4444;font-size:0.78rem;">Módulo de decodificação não carregado.</div>';
      return;
    }

    const parsed = mod.interpretar(raw);
    if (!parsed) {
      currentParsedItem = null;
      previewEl.innerHTML = '<div style="color:#f87171;font-size:0.78rem;text-align:center;">Código inválido ou formato não reconhecido pelo padrão T20.</div>';
      confirmBtn.disabled = true;
      confirmBtn.style.opacity = '0.5';
      confirmBtn.style.cursor = 'not-allowed';
      return;
    }

    currentParsedItem = parsed;
    confirmBtn.disabled = false;
    confirmBtn.style.opacity = '1';
    confirmBtn.style.cursor = 'pointer';

    const isEng = Boolean(parsed.isEngenhoca || parsed.contraptionId);
    const attached = parsed.attachedItem;
    const imps = (parsed.improvements || []).map(i => i.nome || i.id).join(' · ');
    const encs = (parsed.enchantments || []).map(e => e.nome || e.id).join(' · ');

    previewEl.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <strong style="color:#38bdf8;font-size:0.92rem;font-family:Cinzel,serif;">${escapeHtml(parsed.nome || parsed.displayName || 'Item')}</strong>
        <span class="badge" style="background:#162438;border:1px solid #2d466b;color:#93c5fd;font-size:0.7rem;padding:2px 6px;border-radius:4px;text-transform:uppercase;">${escapeHtml(parsed.tipo || 'Geral')}</span>
      </div>
      <div style="font-size:0.78rem;color:#cbd5e1;line-height:1.45;">
        ${parsed.descricao ? `<div style="color:#94a3b8;margin-bottom:4px;">${escapeHtml(parsed.descricao)}</div>` : ''}
        ${isEng && parsed.engenhocaInfo ? `
          <div style="color:#a7f3d0;margin-top:2px;">Simula: <strong>${escapeHtml(parsed.engenhocaInfo.spellName)}</strong> (${parsed.engenhocaInfo.circulo}º Círculo) · Ativação CD ${parsed.engenhocaInfo.cdAtivacao} · ${parsed.engenhocaInfo.formaUso}</div>
        ` : ''}
        ${attached ? `
          <div style="color:#fde68a;margin-top:2px;">Acoplado em: <strong>${escapeHtml(attached.nome)}</strong> (${escapeHtml(attached.atributosTexto || 'Item mundano')})</div>
        ` : ''}
        ${imps ? `<div style="color:#60a5fa;margin-top:2px;">Melhorias: ${escapeHtml(imps)}</div>` : ''}
        ${encs ? `<div style="color:#c084fc;margin-top:2px;">Encantos: ${escapeHtml(encs)}</div>` : ''}
        <div style="color:#64748b;font-size:0.72rem;margin-top:4px;">Espaços: ${parsed.espacos || 1} · Preço base estimado: T$ ${parsed.preco?.valor ?? parsed.price ?? 0}</div>
      </div>
    `;
  }

  inputEl.addEventListener('input', updatePreview);

  modal.querySelectorAll('[data-import-action="close"]').forEach(btn => {
    btn.addEventListener('click', () => { modal.hidden = true; });
  });

  confirmBtn.addEventListener('click', () => {
    if (!currentParsedItem) return;
    try {
      const entryIdGen = 'imp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const inventoryEntry = {
        instanceId: entryIdGen,
        itemId: currentParsedItem.id || currentParsedItem.itemId || entryIdGen,
        displayName: currentParsedItem.nome || currentParsedItem.displayName,
        itemName: currentParsedItem.nome || currentParsedItem.displayName,
        quantity: 1,
        espacos: currentParsedItem.espacos || 1,
        isEngenhoca: Boolean(currentParsedItem.isEngenhoca),
        contraptionId: currentParsedItem.contraptionId || (currentParsedItem.isEngenhoca ? entryIdGen : null),
        formaUso: currentParsedItem.formaUso || currentParsedItem.engenhocaInfo?.formaUso || 'empunhada',
        improvements: Array.isArray(currentParsedItem.improvements) ? currentParsedItem.improvements : [],
        enchantments: Array.isArray(currentParsedItem.enchantments) ? currentParsedItem.enchantments : [],
        attachedItem: currentParsedItem.attachedItem || null,
        engenhocaInfo: currentParsedItem.engenhocaInfo || null,
        itemSnapshot: currentParsedItem
      };

      if (typeof saveInventory === 'function') {
        saveInventory(backpack => {
          backpack.push(inventoryEntry);
        });
      } else if (typeof arsenalState === 'function') {
        const saved = arsenalState();
        const profKey = 'arsenal-arton-character-profiles-v1';
        const updated = RegrasInventario.atualizarPerfis(saved.storage[profKey], backpack => {
          backpack.push(inventoryEntry);
        });
        if (updated) saved.storage[profKey] = updated;
        if (typeof persistNow === 'function') persistNow();
      }

      if (currentParsedItem.isEngenhoca && currentParsedItem.engenhocaInfo) {
        state.contraptions = Array.isArray(state.contraptions) ? state.contraptions : [];
        state.contraptions.push(currentParsedItem.engenhocaInfo);
        const prof = typeof inventoryProfile === 'function' ? inventoryProfile() : null;
        if (prof) {
          prof.contraptions = Array.isArray(prof.contraptions) ? prof.contraptions : [];
          prof.contraptions.push(currentParsedItem.engenhocaInfo);
        }
        if (typeof persistNow === 'function') persistNow();
      }

      modal.hidden = true;
      inputEl.value = '';
      updatePreview();
      if (typeof toast === 'function') toast('Item importado com sucesso para a mochila!');
      if (typeof renderStage === 'function') renderStage();
    } catch (err) {
      console.error('Erro ao importar item por código:', err);
      if (typeof toast === 'function') toast('Erro ao adicionar item à mochila: ' + err.message);
    }
  });

  modal.sync = function () {
    inputEl.value = '';
    updatePreview();
  };

  return modal;
}

window.ensureImportCodeModal = ensureImportCodeModal;
let finalShopCartCount=0;
function syncFinalShopFooter(){
 if(state.sheetView!=='shop')return;
 const footer=document.querySelector('#arsenalViewContainer .sheet-shop-footer');
 if(!footer)return;
 footer.querySelectorAll('button').forEach(button=>{if(!button.hasAttribute('data-sheet-shop-checkout'))button.remove()});
 footer.hidden=finalShopCartCount<=0;
 footer.style.display=finalShopCartCount>0?'flex':'none';
}
