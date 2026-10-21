
const BOOKS = (typeof window !== 'undefined' && window.BOOKS) || {
  basico: 'Livro Básico',
  jogo_do_ano: 'Jogo do Ano',
  herois_de_arton: 'Heróis de Arton',
  ameacas_de_arton: 'Ameaças de Arton',
  deuses_de_arton: 'Deuses de Arton',
  atlas_de_arton: 'Atlas de Arton',
  dragao_brasil: 'Dragão Brasil'
};
if (typeof window !== 'undefined') {
  window.BOOKS = BOOKS;
}
const DATA = window.__FORJA_DATA__.DATA;
const STORAGE_KEY='forja-heroi-t20-v1';
const characterStorage=ArmazenamentoForja.criar({getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)});
const ATTRS=[['for','Força'],['des','Destreza'],['con','Constituição'],['int','Inteligência'],['sab','Sabedoria'],['car','Carisma']];
const ATTR_LABEL=Object.fromEntries(ATTRS);
const ATTR_COST={[-1]:-1,0:0,1:1,2:2,3:4,4:7};
const SKILLS=[['acrobacia','Acrobacia','des'],['adestramento','Adestramento','car'],['atletismo','Atletismo','for'],['atuacao','Atuação','car'],['cavalgar','Cavalgar','des'],['conhecimento','Conhecimento','int'],['cura','Cura','sab'],['diplomacia','Diplomacia','car'],['enganacao','Enganação','car'],['fortitude','Fortitude','con'],['furtividade','Furtividade','des'],['guerra','Guerra','int'],['iniciativa','Iniciativa','des'],['intimidacao','Intimidação','car'],['intuicao','Intuição','sab'],['investigacao','Investigação','int'],['jogatina','Jogatina','car'],['ladinagem','Ladinagem','des'],['luta','Luta','for'],['misticismo','Misticismo','int'],['nobreza','Nobreza','int'],['oficio','Ofício','int'],['percepcao','Percepção','sab'],['pilotagem','Pilotagem','des'],['pontaria','Pontaria','des'],['reflexos','Reflexos','des'],['religiao','Religião','sab'],['sobrevivencia','Sobrevivência','sab'],['vontade','Vontade','sab']];
const SKILL_LABEL=Object.fromEntries(SKILLS.map(x=>[x[0],x[1]]));
const PHASES=[['Identidade e classe','Personagem, classe inicial e escolhas de classe.'],['Atributos e raça','Compra de atributos, modificadores raciais e habilidades.'],['Origens','Origem única ou padrão + regional.'],['Perícias','Treinos de classe, Inteligência, raça e residuais de duplicidade.'],['Divindade','Escolha o poder concedido e confira a divindade correspondente.'],['Poderes','Escolhas raciais, de origem e gerais.'],['Magias','Grimório integrado: magias de classe, raça e poderes.'],['Itens iniciais','Escolha e organize os equipamentos iniciais.'],['Parceiros','Escolha e personalize seus companheiros e aliados.'],['Progressão','Níveis, poderes de classe e multiclasse.']];
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const slug=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const raceById=id=>DATA.races.find(x=>x.id===id);
const classById=id=>DATA.classes.find(x=>x.id===id);
const STATE_SCHEMA_VERSION=1;
const validCharacterLevel=ModeloEstado.validCharacterLevel;
const migratePersistedState=ModeloEstado.migratePersistedState;
const defaultState=ModeloEstado.defaultState;
function isPhaseLockedInLevelUp(step){
  if(!state?.isLevelingUp) return false;
  if(step === 10) return false;
  if(step === 9) return true; // Parceiros bloqueado no avanço de nível
  if(step === 8){
    const choice = typeof currentItemChoice === 'function' ? currentItemChoice() : null;
    return !(choice && choice.source === 'class');
  }
  if(step === 7){
    const missing = typeof spellMissingChoices === 'function' ? spellMissingChoices() : [];
    return missing.length === 0;
  }
  if(step === 4){
    const pending = typeof skillMissingChoices === 'function' ? skillMissingChoices() : [];
    return !state.returnToProgressionAfterSkill && pending.length === 0;
  }
  return true;
}
if(typeof window!=='undefined'){window.isPhaseLockedInLevelUp=isPhaseLockedInLevelUp;}
function applyTableRulesToState(targetState, rules){
  if(!targetState || !rules) return targetState;
  targetState.tableRules = rules;
  if(rules.openRaces && targetState.identity){
    targetState.identity.openRaceBonusEnabled = true;
  }
  if(rules.openDevotion && targetState.deity){
    targetState.deity.masterPermission = true;
  }
  if(rules.dualOrigin === false && targetState.origin?.mode === 'dual'){
    targetState.origin.mode = 'single';
  }
  return targetState;
}
function loadState(){
  try{
    let urlTableRules = null;
    if(typeof URLSearchParams!=='undefined'&&typeof window!=='undefined'&&window.location?.search){
      const params=new URLSearchParams(window.location.search);
      const mesaCode = params.get('mesa');
      if(mesaCode && typeof ForjaUnificada?.decodeTableRulesCode === 'function'){
        urlTableRules = ForjaUnificada.decodeTableRulesCode(mesaCode);
        if(urlTableRules && typeof ForjaUnificada?.saveActiveTableRules === 'function'){
          ForjaUnificada.saveActiveTableRules(urlTableRules);
        }
      }
      if(params.get('novo')==='true'){
        if(window.history?.replaceState){
          const cleanUrl=window.location.pathname+(window.location.hash||'');
          window.history.replaceState(null,'',cleanUrl);
        }
        const fresh=applyTableRulesToState(defaultState(), urlTableRules);
        characterStorage.salvar(STORAGE_KEY,fresh);
        return fresh;
      }
      const charId=params.get('id');
      if(charId){
        if(window.history?.replaceState){
          const cleanUrl=window.location.pathname+(window.location.hash||'');
          window.history.replaceState(null,'',cleanUrl);
        }
        const roster=characterStorage.ler('forja-heroi-t20-personagens-v1',()=>characterStorage.ler('forja-roster-t20-v1',()=>[]));
        const found=Array.isArray(roster)?roster.find(h=>h.id===charId):null;
        if(found?.snapshot){
          const loaded=applyTableRulesToState(migratePersistedState(found.snapshot), urlTableRules);
          characterStorage.salvar(STORAGE_KEY,loaded);
          return loaded;
        }
      }
    }
    const loaded = migratePersistedState(characterStorage.ler(STORAGE_KEY,defaultState));
    if(urlTableRules){
      applyTableRulesToState(loaded, urlTableRules);
      characterStorage.salvar(STORAGE_KEY, loaded);
    }
    if (loaded && loaded.finished) {
      const urlHasView = typeof window !== 'undefined' && window.location?.search && new URLSearchParams(window.location.search).has('view');
      if (!urlHasView) {
        loaded.sheetView = 'sheet';
      }
    }
    return loaded;
  }catch(error){
    throw Error('Não foi possível abrir a ficha sem risco de perder dados. '+(error?.message||error));
  }
}
let state=loadState(),saveTimer;
let characterDataRevision=0;
function normalizeState(){state=ModeloEstado.normalizeState(state)}normalizeState();
function persistNow(){
  characterDataRevision++;
  return typeof ForjaCalculo!=='undefined'?ForjaCalculo.executar(()=>persistCharacterNow(true)):persistCharacterNow(true);
}
function persistNavigationNow(){return persistCharacterNow(false);}
function persistCharacterNow(recalculate){
  clearTimeout(saveTimer);
  try{
    if (recalculate && typeof finalAttrs === 'function') {
      try { state.finalAttrs = finalAttrs(); } catch {}
    }
    if (recalculate && typeof calculatedSkillTotal === 'function') {
      try {
        const skillsMap = {};
        const allSkills = typeof allTrainedSkills === 'function' ? allTrainedSkills() : [];
        for (const sk of allSkills) {
          try { skillsMap[sk] = calculatedSkillTotal(sk); } catch {}
        }
        if (typeof allTrainedOffices === 'function') {
          for (const off of allTrainedOffices()) {
            const k = off?.key || off;
            if (k) {
              try {
                skillsMap[`oficio:${k}`] = calculatedSkillTotal(`oficio:${k}`);
                skillsMap[`oficio_${k}`] = calculatedSkillTotal(`oficio:${k}`);
              } catch {}
            }
          }
        }
        try { skillsMap['oficio'] = calculatedSkillTotal('oficio'); } catch {}
        try { skillsMap['oficio:engenhoqueiro'] = calculatedSkillTotal('oficio:engenhoqueiro'); } catch {}
        state.calculatedSkills = skillsMap;
      } catch {}
    }
    characterStorage.salvar(STORAGE_KEY,state);
    if(typeof remainingFunds==='function'&&state.identity?.characterId){
      localStorage.setItem('forja-saldo-personagem-ativo-v1',JSON.stringify({id:state.identity.characterId,funds:remainingFunds()}));
    }
    const saveStatusEl=document.getElementById('saveStatus');
    const auth=typeof window!=='undefined'&&window.ModuloAuth?window.ModuloAuth.obterServicoAutenticacao():null;
    const sinc=typeof window!=='undefined'&&window.ModuloSincronizacao?window.ModuloSincronizacao.obterServicoSincronizacao():null;
    if(auth&&auth.estaAutenticado()&&sinc){
      if(saveStatusEl)saveStatusEl.textContent='Sincronizando com a nuvem…';
      sinc.salvarFichaNuvem(state).then(res=>{
        if(res.ok&&saveStatusEl)saveStatusEl.textContent='Salvo na nuvem';
      }).catch(()=>{
        if(saveStatusEl)saveStatusEl.textContent='Salvo neste navegador';
      });
    }else{
      if(saveStatusEl)saveStatusEl.textContent='Salvo neste navegador';
    }
    return true;
  }catch{
    const saveStatusEl=document.getElementById('saveStatus');
    if(saveStatusEl)saveStatusEl.textContent='Alterações não salvas';
    toast('Não foi possível salvar neste navegador. Mantenha esta página aberta e tente novamente.');
    return false;
  }
}
function persist(){clearTimeout(saveTimer);const el=document.getElementById('saveStatus');if(el)el.textContent='Salvando…';saveTimer=setTimeout(persistNow,180)}
window.addEventListener('pagehide',persistNow);
window.addEventListener('beforeunload',persistNow);
function toast(text){const el=document.getElementById('toast');el.textContent=text;el.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('visible'),2800)}
function forjaDecision(message,actions,title='Confirmação',input){
  return new Promise(resolve=>{let modal=document.getElementById('forjaDecisionModal');if(!modal){modal=document.createElement('div');modal.id='forjaDecisionModal';modal.className='modal-backdrop';modal.hidden=true;document.body.appendChild(modal)}
    modal.innerHTML='<section class="confirm-modal" role="dialog" aria-modal="true"><header><h3>'+esc(title)+'</h3></header><div class="confirm-modal-body"><p>'+esc(message)+'</p>'+(input!==undefined?'<input class="forja-choice-input" maxlength="80" value="'+esc(input)+'">':'')+'</div><footer>'+actions.map(action=>'<button class="button '+(action.primary?'primary ':'')+(action.danger?'danger ':'')+'" type="button" data-forja-decision="'+esc(action.value)+'">'+esc(action.label)+'</button>').join('')+'</footer></section>';
    const finish=value=>{modal.hidden=true;resolve(value)};modal.onclick=event=>{const button=event.target.closest?.('[data-forja-decision]');if(button)finish(button.dataset.forjaDecision)};modal.hidden=false;setTimeout(()=>modal.querySelector('input,button')?.focus(),20)
  })
}
async function forjaConfirm(message,confirmLabel='Confirmar'){return await forjaDecision(message,[{value:'cancel',label:'Não, manter'},{value:'confirm',label:confirmLabel,primary:true}], 'Confirmação')==='confirm'}
async function forjaPrompt(message,value=''){const result=await forjaDecision(message,[{value:'cancel',label:'Cancelar'},{value:'confirm',label:'Salvar',primary:true}],'Editar nome',value);return result==='confirm'?document.querySelector('#forjaDecisionModal input')?.value:null}
document.addEventListener('click',event=>{const button=event.target.closest?.('button');if(!button||button.disabled)return;button.classList.remove('forja-clicked');void button.offsetWidth;button.classList.add('forja-clicked');setTimeout(()=>button.classList.remove('forja-clicked'),360)},true)
function optionList(def){return def?.opcoes||def?.linhagem||def?.sexo||def?.chassi||def?.fonte||def?.tamanho||[]}
function choiceId(value){return String(value?.id||value?.nome||value||'')}
function choiceName(value){return String(value?.nome||value?.id||value||'')}
function addAttrs(target,source){Object.entries(source||{}).forEach(([id,value])=>target[id]=(target[id]||0)+Number(value||0))}
function allocationCounts(values){return (values||[]).reduce((o,id)=>(o[id]=(o[id]||0)+1,o),{})}
function addAllocation(target,values,value=1){(values||[]).forEach(id=>target[id]=(target[id]||0)+Number(value||1))}
function isRaceEligibleForOpenRaces(race){if(!race||!race.atributos?.fixos)return false;const fixed=Object.entries(race.atributos.fixos).filter(([_,v])=>Number(v)!==0);if(!fixed.length)return false;if(race.atributos?.flexiveis&&Number(race.atributos.flexiveis.quantidade||0)>0)return false;if((race.habilidades?.selecionadas||[]).some(h=>h.tipo==='atributos_flexiveis'))return false;return true;}
function raceFixedModifiers(race){if(!race||!race.atributos?.fixos)return [];return Object.values(race.atributos.fixos).map(Number).filter(v=>v!==0).sort((a,b)=>b-a);}
function remainingOpenRaceModifiers(race,allocations){const remaining=raceFixedModifiers(race);Object.values(allocations||{}).forEach(val=>{const idx=remaining.indexOf(Number(val));if(idx!==-1)remaining.splice(idx,1);});return remaining;}
function selectedRaceOption(def){const current=state.identity.raceChoices[def.id];return optionList(def).find(x=>choiceId(x)===current)}
function raceBonuses(){const race=raceById(state.identity.raceId),bonus={for:0,des:0,con:0,int:0,sab:0,car:0};if(!race)return bonus;if(state.identity.openRaceBonusEnabled&&isRaceEligibleForOpenRaces(race)){Object.entries(state.identity.openRaceAllocations||{}).forEach(([attr,val])=>{if(bonus[attr]!==undefined)bonus[attr]+=Number(val||0);});}else{addAttrs(bonus,race.atributos?.fixos);}addAllocation(bonus,state.identity.raceAttrs,race.atributos?.flexiveis?.valor||1);(race.habilidades?.selecionadas||[]).forEach(def=>{if(def.tipo==='atributos_flexiveis')addAllocation(bonus,state.identity.raceSpecialAttrs[def.id],def.valor||1);const opt=selectedRaceOption(def);if(opt){addAttrs(bonus,opt.atributos);if(race?.id!=='duende'||def.id!=='duende_natureza')addAllocation(bonus,state.identity.raceSubAttrs[def.id],opt.atributosFlexiveis?.valor||1)}});(race.habilidades?.fixas||[]).forEach(h=>{if(!h.escolha)return;const opt=(h.escolha.opcoes||[]).find(x=>choiceId(x)===state.identity.raceChoices[h.id]);if(opt)addAttrs(bonus,opt.atributos)});return bonus}
function formatConfiguredItemName(entry, item) {
  if (!entry) return item?.nome || '';
  const baseName = entry.options?.customName || entry.itemName || item?.nome || entry.itemId || '';
  const imps = Array.isArray(entry.improvements) ? entry.improvements : [];
  const encs = Array.isArray(entry.enchantments) ? entry.enchantments : [];
  const mat = entry.material || entry.options?.material;
  if (!imps.length && !encs.length && !mat) return baseName;
  const labels = [];
  if (mat) {
    const matCatalog = {
      mitral: 'Mitral',
      adamante: 'Adamante',
      aco_rubi: 'Aço-rubi',
      gelo_eterno: 'Gelo eterno',
      madeira_tollon: 'Madeira de Tollon',
      materia_vermelha: 'Matéria vermelha'
    };
    labels.push('de ' + (matCatalog[mat] || mat || 'material especial'));
  }
  imps.forEach(choice => {
    if (!choice) return;
    if (choice.id === 'material_especial' || choice.materialId) {
      const matCatalog = {
        mitral: 'Mitral',
        adamante: 'Adamante',
        aco_rubi: 'Aço-rubi',
        gelo_eterno: 'Gelo eterno',
        madeira_tollon: 'Madeira de Tollon',
        materia_vermelha: 'Matéria vermelha'
      };
      labels.push('de ' + (matCatalog[choice.materialId] || choice.materialId || 'material especial'));
    } else {
      const impNames = {
        certeira: 'Certeira', pungente: 'Pungente', cruel: 'Cruel', atroz: 'Atroz',
        equilibrada: 'Equilibrada', harmonizada: 'Harmonizada', injecao_alquimica: 'Injeção Alquímica',
        macica: 'Maciça', mira_telescopica: 'Mira Telescópica', precisa: 'Precisa',
        ajustada: 'Ajustada', sob_medida: 'Sob Medida', delicada: 'Delicada',
        espinhosa: 'Espinhosa', espinhoso: 'Espinhoso', polida: 'Polida',
        reforcada: 'Reforçada', selada: 'Selada', canalizador: 'Canalizador',
        energetico: 'Energético', poderoso: 'Poderoso', vigilante: 'Vigilante',
        aprimorado: 'Aprimorado', banhado_a_ouro: 'Banhado a Ouro', cravejado_de_gemas: 'Cravejado de Gemas',
        discreto: 'Discreto', macabro: 'Macabro', farpada: 'Farpada', fosforo: 'Fósforo',
        guarda: 'Guarda', incendiaria: 'Incendiária', pressurizada: 'Pressurizada'
      };
      labels.push(choice.nome || impNames[choice.id || choice] || choice.id || choice);
    }
  });
  encs.forEach(choice => {
    if (!choice) return;
    labels.push(choice.nome || choice.id || choice);
  });
  const qualifiers = Array.from(new Set(labels)).map(l => String(l).toLocaleLowerCase('pt-BR'));
  return baseName + (qualifiers.length ? ' ' + qualifiers.join(' ') : '');
}
if (typeof window !== 'undefined') window.configuredItemName = formatConfiguredItemName;

function armorPassiveStats(item, entry){
  if(!item?.armadura) return { defense: 0, penalty: 0 };
  let defense = Number(item.armadura.defesa || 0);
  let penalty = Number(item.armadura.penalidade || 0);

  let imps = Array.isArray(entry?.improvements) ? entry.improvements : (Array.isArray(entry?.options?.improvements) ? entry.options.improvements : []);
  if (!imps.length && item.improvements) {
    imps = typeof item.improvements === 'string' ? item.improvements.split(',').map(s=>s.trim()) : (Array.isArray(item.melhorias) ? item.melhorias : []);
  }

  let encs = Array.isArray(entry?.enchantments) ? entry.enchantments : (Array.isArray(entry?.options?.enchantments) ? entry.options.enchantments : []);
  if (!encs.length && item.enchantments) {
    encs = typeof item.enchantments === 'string' ? item.enchantments.split(',').map(s=>s.trim()) : (Array.isArray(item.encantamentos) ? item.encantamentos : []);
  }

  for (const imp of imps) {
    const id = typeof imp === 'string' ? imp : (imp?.id || '');
    if (id === 'reforcada') {
      defense += 1;
      penalty -= 1;
    }
    if (id === 'sob_medida' || id === 'ajustada' || id === 'material_mitral' || id === 'mitral') {
      if (penalty < 0) penalty = Math.min(0, penalty + 1);
    }
  }

  let encDef = 0;
  for (const enc of encs) {
    const id = typeof enc === 'string' ? enc : (enc?.id || '');
    if (id === 'guardiao') {
      encDef = Math.max(encDef, 4);
    } else if (id === 'defensor') {
      encDef = Math.max(encDef, 2);
    }
  }
  defense += encDef;

  const isDamagedArmor = Boolean(entry?.estragado || entry?.isDamaged || entry?.damaged || /estragad/i.test(entry?.displayName || entry?.itemName || item?.nome || ''));
  if (isDamagedArmor) {
    defense -= 5;
  }

  return { defense, penalty };
}

function shieldPassiveStats(item, entry){
  if(!item?.escudo && item?.defesa == null) return { defense: 0, penalty: 0, defenseBonus: 0 };
  let defense = Number(item?.escudo?.bonusDefesa ?? item?.defesa ?? 0);
  let penalty = Number(item?.escudo?.penalidade ?? item?.penalidade ?? 0);

  const std = typeof selectedStandardOrigin === 'function' ? selectedStandardOrigin() : null;
  const reg = typeof selectedRegionalOrigin === 'function' ? selectedRegionalOrigin() : null;
  const hasState = typeof state !== 'undefined';
  const isUbaneri = entry?.regionalOriginName === 'Andarilho Ubaneri' || std?.nome === 'Andarilho Ubaneri' || reg?.nome === 'Andarilho Ubaneri' || (hasState && (state?.origin?.regional === 'Andarilho Ubaneri' || state?.origin?.standard === 'Andarilho Ubaneri' || state?.origin?.regional === 'andarilho_ubaneri'));
  const nativeShieldProf = entry?.hasShieldProficiencyFromClass !== undefined
    ? Boolean(entry.hasShieldProficiencyFromClass)
    : Boolean(hasState && typeof classById === 'function' && (classById(state?.identity?.classId)?.caracteristicas?.proficiencias || []).includes('escudos'));
  let ubaneriBonus = 0;
  if(isUbaneri && nativeShieldProf){
    defense += 1;
    ubaneriBonus = 1;
  }

  let imps = Array.isArray(entry?.improvements) ? entry.improvements : (Array.isArray(entry?.options?.improvements) ? entry.options.improvements : []);
  if (!imps.length && item.improvements) {
    imps = typeof item.improvements === 'string' ? item.improvements.split(',').map(s=>s.trim()) : (Array.isArray(item.melhorias) ? item.melhorias : []);
  }

  let encs = Array.isArray(entry?.enchantments) ? entry.enchantments : (Array.isArray(entry?.options?.enchantments) ? entry.options.enchantments : []);
  if (!encs.length && item.enchantments) {
    encs = typeof item.enchantments === 'string' ? item.enchantments.split(',').map(s=>s.trim()) : (Array.isArray(item.encantamentos) ? item.encantamentos : []);
  }

  for (const imp of imps) {
    const id = typeof imp === 'string' ? imp : (imp?.id || '');
    if (id === 'reforcada') {
      defense += 1;
      penalty -= 1;
    }
    if (id === 'sob_medida' || id === 'ajustada' || id === 'material_mitral' || id === 'mitral') {
      if (penalty < 0) penalty = Math.min(0, penalty + 1);
    }
  }

  let encDef = 0;
  for (const enc of encs) {
    const id = typeof enc === 'string' ? enc : (enc?.id || '');
    if (id === 'guardiao') {
      encDef = Math.max(encDef, 4);
    } else if (id === 'defensor') {
      encDef = Math.max(encDef, 2);
    }
  }
  defense += encDef;

  const isDamagedShield = Boolean(entry?.estragado || entry?.isDamaged || entry?.damaged || /estragad/i.test(entry?.displayName || entry?.itemName || item?.nome || ''));
  if (isDamagedShield) {
    defense -= 5;
  }

  return { defense, penalty, defenseBonus: ubaneriBonus + encDef };
}
if (typeof window !== 'undefined') {
  window.armorPassiveStats = armorPassiveStats;
  window.shieldPassiveStats = shieldPassiveStats;
}

function finalAttrs(includeTemp = true){
  const attrs = RegrasCriacao.atributos(ATTRS.map(([id])=>id),state.identity.baseAttrs,raceBonuses());
  if (state.origin?.mode === 'dual' || state.origin?.mode === 'regional') {
    const regSlug = typeof slug === 'function' ? slug(typeof selectedRegionalOrigin === 'function' ? selectedRegionalOrigin()?.nome || '' : state.origin?.regional || '') : '';
    if (regSlug === 'aspirante_a_heroi') {
      const chosen = state.origin?.aspiranteHeroiAttr;
      if (chosen && attrs[chosen] !== undefined) attrs[chosen] += 1;
    }
    if (regSlug === 'cria_da_favela') {
      attrs.con = (attrs.con || 0) + 1;
    }
  }
  if (state?.masterBonuses?.attrs) {
    for (const [key, val] of Object.entries(state.masterBonuses.attrs)) {
      if (attrs[key] !== undefined) {
        attrs[key] += Number(val) || 0;
      }
    }
  }
  if (includeTemp && state?.tempManualBonuses?.attrs) {
    for (const [key, val] of Object.entries(state.tempManualBonuses.attrs)) {
      if (attrs[key] !== undefined) {
        attrs[key] += Number(val) || 0;
      }
    }
  }
  return attrs;
}
function pointSpent(){return RegrasCriacao.pontos(ATTRS.map(([id])=>id),state.identity.baseAttrs,ATTR_COST)}
function bookTag(id){return '<span class="book-tag">'+esc(BOOKS[id]||id||'Sem livro')+'</span>'}
function panel(title,body,note=''){return '<section class="panel"><header class="panel-header"><h3 class="panel-title">'+esc(title)+'</h3>'+(note?'<span class="panel-note">'+esc(note)+'</span>':'')+'</header><div class="panel-body">'+body+'</div></section>'}
function abilityHtml(h){
  return '<div class="ability"><strong>'+esc(h.nome)+'</strong><p>'+esc(h.descricao||'Descrição ainda não estruturada.')+'</p></div>';
}
function renderAllocation(key,config,label){const values=key==='raceAttrs'?state.identity.raceAttrs:(state.identity.raceSpecialAttrs[key]||state.identity.raceSubAttrs[key]||[]);const counts=allocationCounts(values),qty=Number(config?.quantidade||0),allowed=config?.atributosPermitidos||ATTRS.map(x=>x[0]),repeat=Boolean(config?.permitirRepetir);return '<div class="choice-section"><h4>'+esc(label)+' <span class="tag gold">'+values.length+'/'+qty+'</span></h4><div class="allocation">'+allowed.map(id=>'<div class="allocation-item"><span>'+esc(ATTR_LABEL[id]||id)+'</span><div class="allocation-controls"><button type="button" data-action="allocation" data-key="'+esc(key)+'" data-attr="'+id+'" data-dir="-1" '+(!counts[id]?'disabled':'')+'>−</button><output>'+Number(counts[id]||0)+'</output><button type="button" data-action="allocation" data-key="'+esc(key)+'" data-attr="'+id+'" data-dir="1" '+(values.length>=qty||(!repeat&&counts[id])?'disabled':'')+'>+</button></div></div>').join('')+'</div><p>Distribua '+qty+' bônus de '+(config?.valor||1)+(repeat?' (repetições permitidas).':' em atributos diferentes.')+'</p></div>'}
function renderChoice(def,source='race'){const options=optionList(def);if(!options.length)return '';const current=source==='race'?state.identity.raceChoices[def.id]:state.identity.classChoices[def.id];return '<div class="choice-section" data-choice-section="'+esc(def.id)+'"><h4>'+esc(def.nome||'Escolha')+'</h4>'+(def.descricao?'<p>'+esc(def.descricao)+'</p>':'')+'<div class="choice-cards">'+options.map(opt=>{const id=choiceId(opt),name=choiceName(opt);return '<label class="choice-card '+(current===id?'selected':'')+'"><input type="radio" name="choice_'+esc(def.id)+'" data-action="'+source+'-choice" data-choice-id="'+esc(def.id)+'" value="'+esc(id)+'" '+(current===id?'checked':'')+'><strong>'+esc(name)+'</strong>'+(opt?.descricao?'<p>'+esc(opt.descricao)+'</p>':'')+'</label>'}).join('')+'</div></div>'}
function requiredRaceChoicesComplete(){const race=raceById(state.identity.raceId);if(!race)return false;const selected=(race.habilidades?.selecionadas||[]).filter(x=>x.obrigatoria&&x.tipo!=='escolha_multipla'&&x.tipo!=='tabu_com_penalidade');for(const def of selected){if(def.tipo==='atributos_flexiveis'){let targetQty=Number(def.quantidade||0);if(race.id==='duende'&&def.id==='duende_dons'){targetQty=state.identity.raceChoices.duende_natureza==='animal'?3:2;}if((state.identity.raceSpecialAttrs[def.id]||[]).length!==targetQty)return false;}else if(!state.identity.raceChoices[def.id])return false;const opt=selectedRaceOption(def);if(opt?.atributosFlexiveis&&(race.id!=='duende'||def.id!=='duende_natureza')){if((state.identity.raceSubAttrs[def.id]||[]).length!==Number(opt.atributosFlexiveis.quantidade||0))return false;}}for(const h of race.habilidades?.fixas||[]){if(h.escolha?.obrigatoria&&h.escolha.tipo!=='escolha_multipla'&&!state.identity.raceChoices[h.id])return false;}const flex=race.atributos?.flexiveis;if(flex&&state.identity.raceAttrs.length!==Number(flex.quantidade||0))return false;return true;}
function mandatoryClassSkills(){const cls=classById(state.identity.classId),result=[];(cls?.caracteristicas?.pericias?.fixas||[]).forEach((entry,index)=>{if(entry.tipo==='escolha'){const chosen=state.identity.classRequiredChoices[index];if(chosen)result.push(chosen)}else if(entry.id)result.push(entry.id)});return [...new Set(result)]}
function classChoiceDescriptors(cls){const out=[];(cls?.habilidades||[]).filter(h=>Number(h.nivel)===1).forEach(h=>{const choices=h.escolhas||[];if(!choices.length)return;const deferred=/magia|escola/i.test(h.nome+' '+JSON.stringify(choices))||/item|equipamento|prot[oó]tipo|esp[oó]lio/i.test(h.nome+' '+JSON.stringify(choices));if(deferred)return;if(choices.some(x=>x.tipo||x.opcoes)){choices.forEach(x=>out.push(Object.assign({id:h.id+'_'+(x.id||slug(x.nome)),descricao:h.descricao},x)))}else out.push({id:h.id,nome:h.nome,descricao:h.descricao,opcoes:choices})});return out}
function parsePowerRequirements(power){const text=power?.preRequisitosTexto||'',attrs=[],skills=[];for(const m of text.matchAll(/\b(For|Des|Con|Int|Sab|Car)\s*([0-9]+)/gi))attrs.push([m[1].toLowerCase(),Number(m[2])]);for(const [id,name] of SKILLS)if(new RegExp('treinad[oa] em '+name,'i').test(text))skills.push(id);const level=Number((text.match(/(\d+)\s*[º°]?\s*nível/i)||[])[1]||2);return{attrs,skills,level,text}}
function classFutureRequirements(){const id=state.identity.classId,result={attrs:[],skills:[]};const powers=typeof availableClassPowers==='function'?availableClassPowers(id):DATA.classPowers.filter(p=>(p.classeIds||[]).includes(id));powers.forEach(p=>{const req=parsePowerRequirements(p);req.attrs.forEach(([attr,value])=>result.attrs.push({attr,value,level:req.level,power:p.nome}));req.skills.forEach(skill=>result.skills.push({skill,level:req.level,power:p.nome}))});return result}
function renderRequirementWarnings(kind){const req=classFutureRequirements(),attrs=finalAttrs();if(kind==='attrs'){const rows=req.attrs.filter((x,i,a)=>a.findIndex(y=>y.attr===x.attr&&y.value===x.value&&y.level===x.level)===i).sort((a,b)=>a.level-b.level||a.attr.localeCompare(b.attr));if(!rows.length)return '';return '<div class="warning-box"><strong>Pré-requisitos futuros da classe.</strong><div class="tag-row" style="margin-top:7px">'+rows.slice(0,18).map(x=>'<span class="tag '+(attrs[x.attr]>=x.value?'green':'red')+'" title="'+esc(x.power)+'">'+esc(ATTR_LABEL[x.attr])+' '+x.value+' · nível '+x.level+'</span>').join('')+'</div><p style="margin-top:7px">Os marcados em vermelho ainda não são atendidos. Isso não impede a ficha: serve para planejar poderes futuros.</p></div>'}const trained=new Set(allTrainedSkills()),rows=req.skills.filter((x,i,a)=>a.findIndex(y=>y.skill===x.skill&&y.level===x.level)===i).sort((a,b)=>a.level-b.level);if(!rows.length)return '';return '<div class="warning-box"><strong>Perícias exigidas por poderes futuros.</strong><div class="tag-row" style="margin-top:7px">'+rows.map(x=>'<span class="tag '+(trained.has(x.skill)?'green':'red')+'" title="'+esc(x.power)+'">'+esc(SKILL_LABEL[x.skill])+' · nível '+x.level+'</span>').join('')+'</div></div>'}
function formatRaceSizeName(sizeId){
  const map={'minusculo':'Minúsculo','pequeno':'Pequeno','medio':'Médio','grande':'Grande','enorme':'Enorme','colossal':'Colossal'};
  return map[slug(sizeId||'medio')] || (sizeId ? String(sizeId).charAt(0).toUpperCase()+String(sizeId).slice(1) : 'Médio');
}
function raceBodyTraitsHtml(race){
  let tamanhoId = race?.corpo?.tamanhoId;
  let deslocamentoBase = race?.corpo?.deslocamentoBase;
  if(race?.id==='duende'&&state.identity.raceChoices?.duende_tamanho){
    const sizeChoice=state.identity.raceChoices.duende_tamanho;
    tamanhoId=sizeChoice;
    deslocamentoBase=(sizeChoice==='minusculo'||sizeChoice==='pequeno')?6:9;
  }
  const tamanho = formatRaceSizeName(tamanhoId);
  const deslocamento = (deslocamentoBase ?? '9') + 'm';
  return '<div class="race-traits-card" style="margin:8px 0 12px;padding:8px 12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:6px;display:flex;gap:20px;font-size:0.95rem;align-items:center">'
    + '<span class="race-trait-item"><strong>Tamanho:</strong> '+esc(tamanho)+'</span>'
    + '<span class="race-trait-item"><strong>Deslocamento:</strong> '+esc(deslocamento)+'</span>'
    + '</div>';
}
function renderIdentity(){const race=raceById(state.identity.raceId),cls=classById(state.identity.classId),bonus=raceBonuses(),spent=pointSpent();let raceChoices='';if(race?.atributos?.flexiveis)raceChoices+=renderAllocation('raceAttrs',race.atributos.flexiveis,'Atributos flexíveis da raça');(race?.habilidades?.selecionadas||[]).forEach(def=>{if(def.tipo==='escolha_multipla'){raceChoices+='<p class="race-choice-plain-text" style="margin:8px 0;font-size:0.85rem;color:var(--text-muted,#ccc);line-height:1.4;"><strong>'+esc(def.nome)+'</strong> será escolhido na fase 4 — Poderes.</p>';return}if(def.tipo==='atributos_flexiveis'){raceChoices+=renderAllocation(def.id,def,def.nome);return}if(def.tipo==='tabu_com_penalidade'){raceChoices+=renderChoice(def);return}raceChoices+=renderChoice(def);const opt=selectedRaceOption(def);if(opt?.atributosFlexiveis)raceChoices+=renderAllocation(def.id,opt.atributosFlexiveis,(def.nome||'Escolha')+' · atributo adicional')});(race?.habilidades?.fixas||[]).forEach(h=>{if(h.escolha?.tipo==='escolha_multipla'){raceChoices+='<p class="race-choice-plain-text" style="margin:8px 0;font-size:0.85rem;color:var(--text-muted,#ccc);line-height:1.4;"><strong>'+esc(h.nome)+':</strong> escolha transferida para a fase 4 — Poderes.</p>'}else if(h.escolha)raceChoices+=renderChoice({id:h.id,nome:h.nome,descricao:h.descricao,opcoes:h.escolha.opcoes})});let classRequired=(cls?.caracteristicas?.pericias?.fixas||[]).map((entry,index)=>entry.tipo==='escolha'?'<label class="field"><span>Escolha uma</span><select class="select" data-field="class-required" data-index="'+index+'"><option value="">Escolha uma</option>'+entry.opcoes.map(o=>'<option value="'+o.id+'" '+(state.identity.classRequiredChoices[index]===o.id?'selected':'')+'>'+esc(SKILL_LABEL[o.id]||o.id)+'</option>').join('')+'</select></label>':'').join('');let classChoices=classChoiceDescriptors(cls).map(def=>renderChoice(def,'class')).join('');const classAbilities=(cls?.habilidades||[]).filter(h=>Number(h.nivel)===1).map(abilityHtml).join('');return panel('Identidade','<div class="grid two"><label class="field"><span>Nome do personagem</span><input class="input" data-field="characterName" maxlength="80" value="'+esc(state.identity.characterName)+'" placeholder="Ex. Lisandra de Valkaria"></label><label class="field"><span>Nome do jogador</span><input class="input" data-field="playerName" maxlength="80" value="'+esc(state.identity.playerName)+'" placeholder="Quem vai jogar"></label><label class="field"><span>Raça</span><select class="select" data-field="raceId">'+DATA.races.map(r=>'<option value="'+r.id+'" '+(r.id===race?.id?'selected':'')+'>'+esc(r.nome)+' · '+esc(BOOKS[r.livroOrigemId]||r.livroOrigemId)+'</option>').join('')+'</select></label><label class="field"><span>Classe inicial</span><select class="select" data-field="classId">'+DATA.classes.map(c=>'<option value="'+c.id+'" '+(c.id===cls?.id?'selected':'')+'>'+esc(c.nome)+' · '+esc(BOOKS[c.livroOrigemId]||c.livroOrigemId)+'</option>').join('')+'</select></label><label class="field"><span>Nível planejado</span><input class="input" data-field="plannedLevel" type="number" min="1" max="20" value="'+state.identity.plannedLevel+'"></label></div>')+panel('Compra de atributos','<div class="point-banner '+(spent===10?'ok':spent>10?'over':'')+'"><span>Você começa com todos em 0 e possui <strong>10 pontos</strong>.</span><strong>'+spent+'/10 gastos · '+(10-spent)+' restantes</strong></div><div class="attributes">'+ATTRS.map(([id,name])=>{const base=state.identity.baseAttrs[id],total=base+bonus[id];return '<div class="attribute-card"><span class="attribute-name">'+esc(name)+'</span><div class="attribute-values"><div class="attribute-value"><small>Comprado</small><strong>'+base+'</strong></div><div class="attribute-value"><small>Final</small><strong>'+total+'</strong></div></div><div class="attribute-controls"><button data-action="attr" data-attr="'+id+'" data-dir="-1" '+(base<=-1?'disabled':'')+'>−</button><output>Custo '+ATTR_COST[base]+'</output><button data-action="attr" data-attr="'+id+'" data-dir="1" '+(base>=4?'disabled':'')+'>+</button></div></div>'}).join('')+'</div>')+panel('Raça · '+race.nome,'<div class="tag-row">'+bookTag(race.livroOrigemId)+'</div>'+raceBodyTraitsHtml(race)+(raceChoices||'')+'<div class="choice-section"><h4>Habilidades raciais</h4><div class="ability-list">'+(race.habilidades?.fixas||[]).map(abilityHtml).join('')+'</div></div>')+panel('Classe · '+cls.nome,'<div class="tag-row"><span class="tag">PV '+cls.caracteristicas?.pv?.inicial+' + Con</span><span class="tag">PM '+cls.caracteristicas?.pm?.porNivel+'/nível</span></div>'+(classRequired?'<div class="grid two" style="margin-top:12px">'+classRequired+'</div>':'')+classChoices+'<div class="choice-section"><h4>Habilidades do 1º nível</h4><div class="ability-list">'+classAbilities+'</div></div>')+renderRequirementWarnings('attrs')}
function selectedStandardOrigin(){return DATA.origins.find(o=>o.nome===state.origin.standard||slug(o.nome)===slug(state.origin.standard))}function selectedRegionalOrigin(){return DATA.regionalOrigins.find(o=>o.nome===state.origin.regional||slug(o.nome)===slug(state.origin.regional))}
const WYNLLA_ORIGIN_SLUGS=['acolito','aristocrata','artesao','artista','assistente_de_laboratorio','curandeiro','estudioso','guarda','marujo','membro_de_guilda','mercador','minerador','soldado','trabalhador'];
function isWynllaOrigin(origin){return WYNLLA_ORIGIN_SLUGS.includes(slug(origin?.nome))}
function isWynllaRegional(regional){return regional?.regiao==='Wynlla'||['plebeu_arcano','recruta_arcano'].includes(slug(regional?.nome))}
function hasWynllaOriginPower(){return (state.origin?.benefits||[]).includes('power:presente_de_wynlla')}
function originBenefitsCount(benefits = state.origin.benefits){return (benefits||[]).reduce((sum, id) => sum + (id === 'unique:heranca_2000' || id === 'unique:criacao_dos_deuses' ? 2 : 1), 0)}
function originBenefitOptions(origin){if(!origin)return[];const b=origin.beneficios||{},items=[];(b.pericias||[]).forEach(name=>items.push({id:'skill:'+slug(name),type:'skill',name,description:'Torna-se treinado em '+name+'.'}));(b.poderes||[]).forEach(name=>{const sName=slug(name);let category='';if(/combate/i.test(name))category='combate';else if(/tormenta/i.test(name))category='tormenta';items.push({id:'power:'+sName,type:'power',name,description:category?'Escolha um poder de '+category+' na fase 6 (Poderes).':'Você recebe este poder geral.',category})});if(b.poder_unico){if(slug(origin.nome)==='herdeiro'){items.push({id:'unique:heranca',type:'unique',name:'Herança (até T$ 1.000)',description:'Você herdou um item de preço de até T$ 1.000 (ocupa 1 benefício).'});items.push({id:'unique:heranca_2000',type:'unique',name:'Herança (até T$ 2.000)',description:'Você herdou um item de preço de até T$ 2.000 (ocupa os 2 benefícios da origem).'})}else if(slug(origin.nome)==='criacao_dos_deuses'){items.push({id:'unique:criacao_dos_deuses',type:'unique',name:'Criação dos Deuses',description:'Você se torna um espírito, recebe RD 5 (luz ou trevas) e o poder Escolhido dos Deuses na fase de poderes.'})}else{items.push({id:'unique:'+slug(b.poder_unico.nome),type:'unique',name:b.poder_unico.nome,description:b.poder_unico.descricao})}}return items}
function originGeneralPowerOptions(){
  const origin=selectedStandardOrigin();
  const list = origin ? originBenefitOptions(origin).filter(opt=>state.origin.benefits.includes(opt.id)&&opt.type==='power'&&opt.category) : [];
  if (state.origin?.mode === 'dual' || state.origin?.regional) {
    const reg = typeof selectedRegionalOrigin === 'function' ? selectedRegionalOrigin() : null;
    const regSlug = slug(reg?.nome || state.origin?.regional || '');
    if (regSlug === 'estandarte_vivo') {
      list.push({
        id: 'regional:estandarte_vivo_poder',
        type: 'power',
        name: 'Poder de Combate ou Tormenta',
        category: 'combate_ou_tormenta',
        originName: reg?.nome || 'Estandarte Vivo'
      });
    }
  }
  return list;
}
function originSkillIds(){return originBenefitOptions(selectedStandardOrigin()).filter(x=>state.origin.benefits.includes(x.id)&&x.type==='skill').map(x=>slug(x.name))}

function hasCriacaoDosDeuses(){
  const origin = typeof selectedStandardOrigin === 'function' ? selectedStandardOrigin() : null;
  const isCriacao = origin && slug(origin.nome) === 'criacao_dos_deuses';
  return Boolean(isCriacao && (state.origin?.benefits || []).includes('unique:criacao_dos_deuses'));
}
function selectedCriacaoDosDeusesDeity(){
  const deity = state.origin?.godCreationDeity || state.powers?.godCreationDeity;
  if(!deity && hasCriacaoDosDeuses()){
    return 'aharadak';
  }
  return deity || '';
}
function setSelectedCriacaoDosDeusesDeity(deityId, energyChoice = ''){
  state.origin = state.origin || {};
  state.powers = state.powers || {};
  state.origin.godCreationDeity = deityId;
  state.powers.godCreationDeity = deityId;
  if(energyChoice){
    state.origin.godCreationEnergyChoice = energyChoice;
    state.powers.godCreationEnergyChoice = energyChoice;
  }
}
function getCriacaoDosDeusesPowerOption(){
  const deityId = selectedCriacaoDosDeusesDeity();
  if(!deityId) return null;
  let opt = null;
  if(typeof ForjaUnificada !== 'undefined' && typeof ForjaUnificada.getCriacaoDeusOption === 'function'){
    opt = ForjaUnificada.getCriacaoDeusOption(deityId);
  }
  if(!opt) return null;
  const userChoice = state.origin?.godCreationEnergyChoice || state.powers?.godCreationEnergyChoice;
  let rdType = opt.rdDefault;
  if(rdType === 'escolha'){
    rdType = (userChoice === 'luz' || userChoice === 'trevas') ? userChoice : 'trevas';
  }
  return {
    ...opt,
    rdType
  };
}

function isChildCharacter(){
  return Boolean(state.age?.enabled && state.age?.band === 'crianca');
}
function isTeenCharacter(){
  return Boolean(state.age?.enabled && state.age?.band === 'adolescente');
}
function isGolemRace(){
  return ['golem','golem_desperto'].includes(state.identity?.raceId);
}
function characterHasPowerChoices(){
  const genSlots = typeof generalPowerSlots === 'function' ? generalPowerSlots() : 0;
  const raceGroups = typeof racePowerGroups === 'function' ? racePowerGroups() : [];
  const originChoices = typeof originGeneralPowerOptions === 'function' ? originGeneralPowerOptions() : [];
  const duplo = typeof hasDuploFeerico === 'function' && hasDuploFeerico();
  const cosmo = typeof hasCosmopolita === 'function' && hasCosmopolita();
  const futura = typeof hasFuturaLenda === 'function' && hasFuturaLenda();
  const criacao = typeof hasCriacaoDosDeuses === 'function' && hasCriacaoDosDeuses();
  return genSlots > 0 || raceGroups.some(g => Number(g.quantity || 0) > 0) || originChoices.length > 0 || Boolean(duplo) || Boolean(cosmo) || Boolean(futura) || Boolean(criacao);
}
function characterHasSpellChoices(){
  if (typeof spellPlan !== 'function') return false;
  const plan = spellPlan();
  return Boolean((plan?.groups?.length > 0) || (plan?.notes?.some(note => note.blocking)));
}
function shouldSkipOriginPhase(){
  if (isGolemRace()) return true;
  if (isChildCharacter() && (state.origin?.mode === 'single' || !state.origin?.mode)) return true;
  return false;
}
function hasFamiliarElementalPower(){
  if (state.deity?.mode === 'devout' && String(state.deity?.power || '').split('|').some(p => slug(p) === 'familiar_elemental')) return true;
  if ((state.powers?.general || []).some(id => slug(id) === 'familiar_elemental')) return true;
  if (Object.values(state.powers?.originGeneral || {}).some(id => slug(id) === 'familiar_elemental')) return true;
  if (slug(state.powers?.cosmopolita || '') === 'familiar_elemental') return true;
  if ((state.progression || []).some(r => r && (slug(r.powerId || '') === 'familiar_elemental' || slug(r.previewPowerId || '') === 'familiar_elemental'))) return true;
  if (state.levelTraining?.power && slug(state.levelTraining?.nextPowerId || '') === 'familiar_elemental') return true;
  return false;
}
function getElementalFamiliarOptionsList(){
  if (typeof ForjaUnificada !== 'undefined' && Array.isArray(ForjaUnificada.ELEMENTAL_FAMILIAR_OPTIONS)) {
    return ForjaUnificada.ELEMENTAL_FAMILIAR_OPTIONS;
  }
  return [
    { id: 'adepto', name: 'Parceiro Adepto (Iniciante)', shortName: 'Adepto Iniciante', elementLabel: 'Espírito Arcano', partnerType: 'Adepto', tier: 'iniciante', description: 'Um conjurador capaz de ajudá-lo a lançar suas magias. Iniciante: O custo para lançar suas magias de 1º círculo diminui em –1 PM.', benefit: 'O custo para lançar suas magias de 1º círculo diminui em –1 PM.' },
    { id: 'aquinne', name: "Aquin'ne", shortName: "Aquin'ne", elementLabel: 'Elemental da Água', partnerType: 'Familiar Elemental', tier: 'iniciante', description: 'Um aquin’ne familiar concede deslocamento de natação 9m e permite lançar magias e respirar debaixo d’água.', benefit: 'Concede deslocamento de natação 9m e permite lançar magias e respirar debaixo d’água.', swimSpeedMeters: 9 },
    { id: 'tpeel', name: "T'peel", shortName: "T'peel", elementLabel: 'Elemental do Ar', partnerType: 'Familiar Elemental', tier: 'iniciante', description: 'Um t’peel familiar pode carregar 2 espaços de itens e permite que você lance Queda Suave.', benefit: 'Pode carregar 2 espaços de itens e permite que você lance Queda Suave.', carrySpacesBonus: 2, grantedSpell: 'Queda Suave' },
    { id: 'pakk', name: 'Pakk', shortName: 'Pakk', elementLabel: 'Elemental do Fogo', partnerType: 'Familiar Elemental', tier: 'iniciante', description: 'Um pakk familiar permite que você lance Explosão de Chamas. Caso aprenda novamente essa magia, seu custo diminui em –1 PM.', benefit: 'Permite que você lance Explosão de Chamas. Caso aprenda novamente essa magia, seu custo diminui em –1 PM.', grantedSpell: 'Explosão de Chamas' },
    { id: 'terrier', name: 'Terrier', shortName: 'Terrier', elementLabel: 'Elemental da Terra', partnerType: 'Familiar Elemental', tier: 'iniciante', description: 'Um terrier familiar concede redução de dano 2/impacto.', benefit: 'Concede redução de dano 2/impacto.', damageReduction: '2/impacto' }
  ];
}
function getSelectedElementalFamiliarId(){
  const raw = state.partnerChoices?.familiarElementalType
    || state.deity?.familiarElementalChoice
    || (state.progression || []).find(r => r && (slug(r.powerId || '') === 'familiar_elemental' || slug(r.previewPowerId || '') === 'familiar_elemental'))?.powerChoice
    || (state.progression || []).find(r => r && (slug(r.powerId || '') === 'familiar_elemental' || slug(r.previewPowerId || '') === 'familiar_elemental'))?.previewPowerChoice
    || '';
  if (typeof ForjaUnificada !== 'undefined' && typeof ForjaUnificada.normalizeElementalFamiliarId === 'function') {
    return ForjaUnificada.normalizeElementalFamiliarId(raw);
  }
  const clean = String(raw || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  if (['adepto', 'aquinne', 'tpeel', 'pakk', 'terrier'].includes(clean)) return clean;
  return '';
}
function getSelectedElementalFamiliarOption(){
  const id = getSelectedElementalFamiliarId();
  if (!id) return null;
  return getElementalFamiliarOptionsList().find(o => o.id === id) || null;
}
function setSelectedElementalFamiliarId(rawChoice){
  const norm = (typeof ForjaUnificada !== 'undefined' && typeof ForjaUnificada.normalizeElementalFamiliarId === 'function')
    ? ForjaUnificada.normalizeElementalFamiliarId(rawChoice)
    : String(rawChoice || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  state.partnerChoices = (state.partnerChoices && typeof state.partnerChoices === 'object') ? state.partnerChoices : {};
  state.partnerChoices.familiarElementalType = norm;
  state.deity = (state.deity && typeof state.deity === 'object') ? state.deity : {};
  state.deity.familiarElementalChoice = norm;
  if (Array.isArray(state.progression)) {
    state.progression.forEach(row => {
      if (row && (slug(row.powerId || '') === 'familiar_elemental' || slug(row.previewPowerId || '') === 'familiar_elemental')) {
        row.powerChoice = norm;
        row.previewPowerChoice = norm;
      }
    });
  }
  if (typeof syncPartnersFromChoices === 'function') {
    syncPartnersFromChoices();
  }
  return norm;
}
function characterHasPartnerChoices(){
  const std = typeof selectedStandardOrigin === 'function' ? selectedStandardOrigin() : null;
  const reg = typeof selectedRegionalOrigin === 'function' ? selectedRegionalOrigin() : null;
  const stdSlug = slug(std?.nome || state.origin?.standard || '');
  const regSlug = slug(reg?.nome || state.origin?.regional || '');
  if (stdSlug.includes('ubaneri') || regSlug.includes('ubaneri')) return true;
  if (stdSlug.includes('kami') || regSlug.includes('kami')) return true;
  if (stdSlug.includes('tumarkhan') || regSlug.includes('tumarkhan')) return true;
  if (stdSlug.includes('irmao_sem_esporas') || regSlug.includes('irmao_sem_esporas')) return true;
  if (stdSlug.includes('recruta_da_fenix') || regSlug.includes('recruta_da_fenix')) return true;
  if ((state.origin?.benefits || []).includes('unique:antigo_mestre')) return true;
  if ((state.origin?.benefits || []).includes('unique:amigo_especial')) return true;
  if (hasFamiliarElementalPower()) return true;
  if (Array.isArray(state.partners) && state.partners.length > 0) return true;
  return false;
}
function shouldSkipPhase(step){
  if (step === 3) return shouldSkipOriginPhase();
  if (step === 6) return !characterHasPowerChoices();
  if (step === 7) return !characterHasSpellChoices();
  if (step === 9) return !characterHasPartnerChoices();
  if (step === 10) {
    const plannedLevel = Number(state.identity?.plannedLevel || 1);
    return plannedLevel <= 1;
  }
  return false;
}
function originMaxBenefits(){
  if (isChildCharacter()) {
    return state.origin?.mode === 'dual' ? 1 : 0;
  }
  if (isTeenCharacter()) {
    if (state.origin?.mode === 'single') return 1;
    if (state.origin?.mode === 'dual') {
      return state.origin?.regional ? 0 : 2;
    }
  }
  return 2;
}
