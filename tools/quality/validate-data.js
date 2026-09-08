const fs=require('fs');
const path=require('path');
const vm=require('vm');
const crypto=require('crypto');
const root=path.resolve(__dirname,'../..');
const readJson=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
const errors=[];
function unique(label,entries,keyOf=entry=>entry?.id){const seen=new Set();for(const entry of entries){const key=keyOf(entry);if(!key)errors.push(label+' sem identificador');else if(seen.has(key))errors.push(label+' com identificador duplicado: '+key);else seen.add(key)}return seen}
const classes=readJson('backup-jsons/classes_full.json'),races=readJson('backup-jsons/races_update.json'),origins=readJson('backup-jsons/origens.json').origens,regional=readJson('backup-jsons/origem_regional.json').origens_regionais,deities=readJson('backup-jsons/deuses.json').deuses,classPowers=readJson('backup-jsons/poderes_classe.json').poderesClasseCatalogoGlobal||[],workbookPowers=readJson('tools/vba-import-raw-powers/classes_txt_import.json').poderesCatalogo||[],generalData=readJson('backup-jsons/poderes_gerais.json');
const byName=entry=>entry?.nome;
const classIds=unique('Classe',classes),raceIds=unique('Raça',races);unique('Origem',origins,byName);unique('Origem regional',regional,byName);unique('Poder de classe',classPowers);unique('Poder importado',workbookPowers);unique('Divindade',deities,byName);
const referenceCharacters=readJson('tools/character-builder/reference-characters.json');
unique('Personagem de referência',referenceCharacters.characters);
for(const character of referenceCharacters.characters){
  if(!raceIds.has(character.raceId))errors.push('Personagem de referência '+character.id+' usa raça inexistente: '+character.raceId);
  if(!classIds.has(character.classId))errors.push('Personagem de referência '+character.id+' usa classe inexistente: '+character.classId);
  if(!Number.isInteger(character.level)||character.level<1||character.level>20)errors.push('Nível inválido no personagem de referência '+character.id);
  if(!Array.isArray(character.protects)||!character.protects.length)errors.push('Personagem de referência sem comportamentos protegidos: '+character.id);
}
for(const power of [...classPowers,...workbookPowers]){if(!Array.isArray(power.classeIds)||!power.classeIds.length)errors.push('Poder sem classe: '+(power.id||power.nome));else for(const id of power.classeIds)if(id!=='classe'&&!classIds.has(id))errors.push('Poder '+power.id+' referencia classe inexistente: '+id)}
const catalogContext={};vm.createContext(catalogContext);vm.runInContext(fs.readFileSync(path.join(root,'tools/item-catalog/src/catalog-data.js'),'utf8')+';this.validationData={ITEMS,IMPROVEMENT_DATA,ENCHANTMENT_DATA}',catalogContext);
const {ITEMS,IMPROVEMENT_DATA,ENCHANTMENT_DATA}=catalogContext.validationData,itemIds=unique('Item',ITEMS),improvements=IMPROVEMENT_DATA.melhorias||[],enchantments=ENCHANTMENT_DATA.encantos||[];
const improvementIds=unique('Melhoria',improvements),enchantmentIds=unique('Encanto',enchantments);
for(const item of ITEMS){if(!item.nome||!item.tipo)errors.push('Item incompleto: '+item.id);if(!Number.isFinite(Number(item.espacos))||Number(item.espacos)<0)errors.push('Espaços inválidos no item '+item.id);if(item.preco&&(!Number.isFinite(Number(item.preco.valor))||Number(item.preco.valor)<0))errors.push('Preço inválido no item '+item.id)}
for(const improvement of improvements)for(const requirement of improvement.preRequisitos||[])if(requirement.melhoriaId&&!improvementIds.has(requirement.melhoriaId))errors.push('Melhoria '+improvement.id+' referencia '+requirement.melhoriaId);
for(const enchantment of enchantments)for(const id of enchantment.preRequisitosIds||[])if(!enchantmentIds.has(id))errors.push('Encanto '+enchantment.id+' referencia '+id);
const grimoire=fs.readFileSync(path.join(root,'grimorio.html'),'utf8'),spells=[...grimoire.matchAll(/<div class="card"\s+([\s\S]*?)>\s*<div class="card-header">/g)].map(match=>{const attr=name=>(match[1].match(new RegExp('data-'+name+'="([^"]*)"'))||[])[1]||'';return{id:attr('spell-key'),school:attr('escola'),circle:Number(attr('circulo'))}}),spellIds=unique('Magia',spells);
for(const spell of spells){if(!spell.school)errors.push('Magia sem escola: '+spell.id);if(!Number.isInteger(spell.circle)||spell.circle<1||spell.circle>5)errors.push('Círculo inválido na magia '+spell.id)}
const roots=[ITEMS,IMPROVEMENT_DATA,ENCHANTMENT_DATA,races,classes,origins,regional,deities,classPowers,workbookPowers,generalData],effectTypes=new Set();
function walk(value){
  if(!value||typeof value!=='object')return;
  if(Array.isArray(value)){value.forEach(walk);return}
  const hasType=typeof value.tipo==='string'&&value.tipo.trim();
  if(Array.isArray(value.efeitos))for(const effect of value.efeitos){
    if(!effect||typeof effect!=='object'){
      if(!hasType)errors.push('Efeito inválido');
    }else if(typeof effect.tipo==='string'&&effect.tipo.trim())effectTypes.add(effect.tipo);
    else if(!Array.isArray(effect.efeitos))errors.push('Efeito sem tipo reconhecível');
  }
  Object.values(value).forEach(walk)
}
roots.forEach(walk);
const effectHash=crypto.createHash('sha256').update([...effectTypes].sort().join('\n')).digest('hex'),expectedEffectHash='d65ce9a8c012b778141974e58b022e91bb5297a361747314e7ed46ec0da1d004';
if(effectHash!==expectedEffectHash)errors.push('O catálogo de tipos de efeito mudou. Revise os tipos novos ou removidos e atualize conscientemente a linha de base. Hash atual: '+effectHash);
if(errors.length)throw new Error('Dados inválidos:\n- '+errors.join('\n- '));
console.log(JSON.stringify({status:'ok',counts:{items:itemIds.size,spells:spellIds.size,races:races.length,classes:classes.length,classPowers:classPowers.length+workbookPowers.length,effectTypes:effectTypes.size,referenceCharacters:referenceCharacters.characters.length}}));
