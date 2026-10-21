const fs = require('fs');
const data = JSON.parse(fs.readFileSync('dados/criador-regionalOrigins.json', 'utf8'));
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

function slug(s){
  return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function getRegionalSkills(origin) {
  const text = origin?.beneficios?.descricao || '';
  const ids = [];
  const normText = slug(text).replace(/_/g, ' ');
  // Busca sentença ou trecho "treinado a em ..."
  const m = normText.match(/treinad[oa] em ([^.;]+)/i);
  if (m) {
    const snippet = m[1];
    for (const [id, name] of SKILLS) {
      const normName = slug(name);
      if (new RegExp('\\b' + normName + '\\b', 'i').test(snippet)) {
        ids.push(id);
      }
    }
  }
  const regSlug = slug(origin?.nome || '');
  if (regSlug === 'estudante_da_academia' && !ids.includes('misticismo')) ids.push('misticismo');
  if (regSlug === 'escudeiro_solitario') {
    if (!ids.includes('enganacao')) ids.push('enganacao');
    if (!ids.includes('ladinagem')) ids.push('ladinagem');
  }
  return ids;
}

data.forEach(o => {
  const skills = getRegionalSkills(o);
  if (skills.length) console.log(o.nome, '->', skills);
});
