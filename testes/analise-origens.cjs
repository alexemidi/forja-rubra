const fs = require('fs');
const path = require('path');

const regOrigins = JSON.parse(fs.readFileSync(path.join(__dirname, '../dados/criador-regionalOrigins.json'), 'utf8'));
const stdOrigins = JSON.parse(fs.readFileSync(path.join(__dirname, '../dados/criador-origins.json'), 'utf8'));
const items = JSON.parse(fs.readFileSync(path.join(__dirname, '../dados/items.json'), 'utf8'));
const itemIds = new Set(items.map(i => i.id));
const itemNames = new Set(items.map(i => i.nome.toLowerCase()));

const SKILLS = [
  ['acrobacia','Acrobacia'],['adestramento','Adestramento'],['atletismo','Atletismo'],
  ['atuacao','Atuação'],['cavalgar','Cavalgar'],['conhecimento','Conhecimento'],
  ['cura','Cura'],['diplomacia','Diplomacia'],['enganacao','Enganação'],
  ['fortitude','Fortitude'],['furtividade','Furtividade'],['guerra','Guerra'],
  ['iniciativa','Iniciativa'],['intimidacao','Intimidação'],['intuicao','Intuição'],
  ['investigacao','Investigação'],['jogatina','Jogatina'],['ladinagem','Ladinagem'],
  ['luta','Luta'],['misticismo','Misticismo'],['nobreza','Nobreza'],
  ['oficio','Ofício'],['percepcao','Percepção'],['pilotagem','Pilotagem'],
  ['pontaria','Pontaria'],['reflexos','Reflexos'],['religiao','Religião'],
  ['sobrevivencia','Sobrevivência'],['vontade','Vontade']
];

console.log('=== Análise Completa de Origens Regionais (66 origens) ===');
regOrigins.forEach((o, index) => {
  const text = o.beneficios?.descricao || '';
  const skills = [];
  for(const [id, name] of SKILLS){
    if(id === 'oficio') continue;
    if(new RegExp('treinad[oa] em[^.]*\\b' + name + '\\b', 'i').test(text)) skills.push(id);
    else if(new RegExp('e [ée] treinad[oa] em[^.]*\\b' + name + '\\b', 'i').test(text)) skills.push(id);
  }
  // checar oficio
  if(/treinad[oa] em[^.]*of[ií]cio/i.test(text)){
    const m = text.match(/of[ií]cio\s*\(([^)]+)\)/i);
    skills.push(m ? 'oficio:' + m[1] : 'oficio');
  }

  // checar bônus de perícias fixas (+X em ...)
  const bonusMatches = [...text.matchAll(/\+([0-9]+)\s+em\s+([^,.;]+)/gi)];
  const bonuses = bonusMatches.map(m => m[0]);

  console.log(`${index + 1}. [${o.regiao}] ${o.nome}`);
  if(skills.length) console.log(`   Treinos: ${skills.join(', ')}`);
  if(bonuses.length) console.log(`   Bônus texto: ${bonuses.join('; ')}`);
  console.log(`   Itens: ${o.itens.join(' | ')}`);
});
