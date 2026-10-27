const ModeloEstado = (()=>{
const STATE_SCHEMA_VERSION=1;
const validCharacterLevel=value=>Number.isFinite(Number(value))?Math.max(1,Math.min(20,Math.trunc(Number(value))||1)):1;
function migratePersistedState(value){
  if(value&&typeof ForjaUnificada!=='undefined')value=ForjaUnificada.restaurarEstadoInterface(value);
  if(!value?.identity)return defaultState();
  const migrated={...value,identity:{...value.identity},finances:value.finances&&typeof value.finances==='object'?{...value.finances}:null};
  if(!migrated.layoutVersion){migrated.step=migrated.step===1?1:Math.min(9,migrated.step+1);migrated.completed=(migrated.completed||[]).map(step=>step===1?1:Math.min(9,step+1));migrated.layoutVersion=2}
  const planned=validCharacterLevel(migrated.identity.plannedLevel);
  const initial=validCharacterLevel(migrated.identity.initialLevel??migrated.finances?.startingLevel??planned);
  migrated.identity.initialLevel=initial;
  migrated.identity.plannedLevel=planned;
  migrated.identity.editingLevel=Math.min(migrated.identity.plannedLevel,validCharacterLevel(migrated.identity.editingLevel));
  migrated.finances=Object.assign({startingLevel:initial,levelOneTibars:0,spent:0},migrated.finances||{}, {startingLevel:initial});
  migrated.stateSchemaVersion=STATE_SCHEMA_VERSION;
  return migrated;
}
const defaultState=()=>({stateSchemaVersion:STATE_SCHEMA_VERSION,layoutVersion:5,step:1,completed:[],regrasCampanha:{idade:'desativada',faixaBasico:'adulto',anos:20,racasAbertas:false,complicacoes:false,devocoesAbertas:true,origemModo:'single'},generalComplications:[],identity:{characterName:'',playerName:'',raceId:'humano',classId:'arcanista',initialLevel:1,plannedLevel:1,editingLevel:1,openRaceBonusEnabled:false,openRaceAllocations:{},baseAttrs:{for:0,des:0,con:0,int:0,sab:0,car:0},raceAttrs:[],raceSpecialAttrs:{},raceSubAttrs:{},raceChoices:{},classChoices:{},classRequiredChoices:{},classRequiredOffices:{}},finances:{startingLevel:1,levelOneTibars:0,spent:0},origin:{mode:'single',standard:'',regional:'',benefits:[],officeSpecialties:{},previewBenefit:''},skills:{class:[],int:[],race:[],duplicate:[]},powers:{general:[],originGeneral:{},raceGroups:{},categoryFilter:'all',statusFilter:'available',sidebarCollapsed:false,previewId:'',activeSlot:0},deity:{mode:'',name:'',power:'',previewPower:'',previewDeity:'',activePowerIndex:0,strictAcceptedOnly:false,masterPermission:true,fundamentalist:false,pantheonBonusPower:''},distinctions:{activeIds:[],selectedId:''},partners:[],partnerChoices:{},progression:[],prereqConfirm:{attributes:'',skills:''},equipment:{armorId:null,shieldId:null,weaponId:null,trailerId:null,backpackId:null,wornIds:[],adaptableHandedness:{}},customAttacks:[],attackOverrides:{},temporaryAttackMods:{luta:0,pontaria:0,damage:0,steps:0,threat:0,mult:0,scope:'all'},plannings:[]});
function normalizeState(state){state=migratePersistedState(state);const d=defaultState();state.regrasCampanha=Object.assign(d.regrasCampanha,state.regrasCampanha||{});if(state.regrasCampanha.devocoesAbertas){if(state.deity)state.deity.masterPermission=true;}state.identity=Object.assign(d.identity,state.identity||{});state.generalComplications=Array.isArray(state.generalComplications)?state.generalComplications:[];state.identity.openRaceBonusEnabled=Boolean(state.identity.openRaceBonusEnabled&&state.regrasCampanha.racasAbertas);state.identity.openRaceAllocations=state.identity.openRaceAllocations&&typeof state.identity.openRaceAllocations==='object'?state.identity.openRaceAllocations:{};state.identity.baseAttrs=Object.assign(d.identity.baseAttrs,state.identity.baseAttrs||{});['raceAttrs'].forEach(k=>state.identity[k]=Array.isArray(state.identity[k])?state.identity[k]:[]);['raceSpecialAttrs','raceSubAttrs','raceChoices','classChoices','classRequiredChoices'].forEach(k=>state.identity[k]=state.identity[k]&&typeof state.identity[k]==='object'?state.identity[k]:{});state.origin=Object.assign(d.origin,state.origin||{});if(state.regrasCampanha.origemModo)state.origin.mode=state.regrasCampanha.origemModo;state.skills=Object.assign(d.skills,state.skills||{});state.skills.duplicate=Array.isArray(state.skills.duplicate)?state.skills.duplicate:[];state.powers=Object.assign(d.powers,state.powers||{});state.powers.originGeneral=state.powers.originGeneral&&typeof state.powers.originGeneral==='object'?state.powers.originGeneral:{};state.deity=Object.assign(d.deity,state.deity||{});if(state.deity?.power){const pParts=String(state.deity.power).split('|').map(p=>(p==='Troças Duyshidakk'||p==='trocas_duyshidakk')?'Tropas Duyshidakk':p);state.deity.power=Array.from(new Set(pParts.filter(Boolean))).join('|');}state.distinctions=(state.distinctions&&typeof state.distinctions==='object')?state.distinctions:{activeIds:[],selectedId:''};state.distinctions.activeIds=Array.isArray(state.distinctions.activeIds)?state.distinctions.activeIds:[];state.partners=Array.isArray(state.partners)?state.partners:[];state.partnerChoices=(state.partnerChoices&&typeof state.partnerChoices==='object')?state.partnerChoices:{};state.prereqConfirm=Object.assign(d.prereqConfirm,state.prereqConfirm||{});state.completed=Array.isArray(state.completed)?state.completed:[];state.progression=Array.isArray(state.progression)?state.progression:[];state.customAttacks=Array.isArray(state.customAttacks)?state.customAttacks:[];state.attackOverrides=(state.attackOverrides&&typeof state.attackOverrides==='object')?state.attackOverrides:{};state.temporaryAttackMods=(state.temporaryAttackMods&&typeof state.temporaryAttackMods==='object')?state.temporaryAttackMods:{luta:0,pontaria:0,damage:0,steps:0,threat:0,mult:0,scope:'all'};state.plannings=Array.isArray(state.plannings)?state.plannings:[];state.step=Math.max(1,Math.min(10,Number(state.step)||1));if(state.finished||(state.finished!==false&&Array.isArray(state.completed)&&state.completed.includes(10)&&Number(state.step)===10)){state.finished=true;state.step=10;state.sheetView=state.sheetView||'sheet'}state.identity.initialLevel=validCharacterLevel(state.identity.initialLevel);state.identity.plannedLevel=validCharacterLevel(state.identity.plannedLevel);state.identity.editingLevel=Math.min(state.identity.plannedLevel,validCharacterLevel(state.identity.editingLevel));state.finances=Object.assign(d.finances,state.finances||{}, {startingLevel:state.identity.initialLevel});state.stateSchemaVersion=STATE_SCHEMA_VERSION;return state;}


function limparSnapshotParaCompartilhamento(snapshot: any): any {
  if(!snapshot || typeof snapshot!=='object') return snapshot;
  try{
    const clone = JSON.parse(JSON.stringify(snapshot));
    delete clone.sharedSnapshot;
    delete clone.isViewingSharedCharacter;
    delete clone.levelUpBefore;
    delete clone.editingCharacter;
    return clone;
  }catch{
    return snapshot;
  }
}

function codificarFicha(snapshot: any): string {
  try{
    if(!snapshot) return '';
    const clean = limparSnapshotParaCompartilhamento(snapshot);
    const json = JSON.stringify(clean);
    const pako = typeof window!=='undefined' ? (window as any).pako : (typeof require!=='undefined' ? (()=>{ try{return require('./assets/vendor/pako.min.js')}catch{return null} })() : null);
    if(pako && typeof pako.deflate==='function'){
      const deflated = pako.deflate(json, { to: 'string' });
      return 'z_' + btoa(deflated).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    return 'b_' + btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }catch(e){
    console.error('Erro ao codificar ficha:', e);
    return '';
  }
}

function decodificarFicha(codigo: string): any {
  try{
    if(!codigo || typeof codigo!=='string') return null;
    const cleanCode = codigo.trim();
    const pako = typeof window!=='undefined' ? (window as any).pako : (typeof require!=='undefined' ? (()=>{ try{return require('./assets/vendor/pako.min.js')}catch{return null} })() : null);
    if(cleanCode.startsWith('z_')){
      const base64 = cleanCode.slice(2).replace(/-/g, '+').replace(/_/g, '/');
      const binary = atob(base64);
      if(pako && typeof pako.inflate==='function'){
        const inflated = pako.inflate(binary, { to: 'string' });
        return JSON.parse(inflated);
      }
    }else if(cleanCode.startsWith('b_')){
      const base64 = cleanCode.slice(2).replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(escape(atob(base64)));
      return JSON.parse(json);
    }
    const base64 = cleanCode.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(base64)));
    return JSON.parse(json);
  }catch(e){
    console.error('Erro ao decodificar ficha compartilhada:', e);
    return null;
  }
}

return Object.freeze({defaultState,migratePersistedState,normalizeState,validCharacterLevel,codificarFicha,decodificarFicha});
})();
if(typeof window!=="undefined"){(window as any).ModeloEstado=ModeloEstado;}
if(typeof module!=="undefined"&&module.exports)module.exports=ModeloEstado;
