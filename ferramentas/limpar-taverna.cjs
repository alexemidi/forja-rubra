const fs = require('fs');

// 1. Limpar TAVERN_DATA.js
let tavernData = fs.readFileSync('src/funcionalidades/taverna/03-00-TAVERN_DATA.js', 'utf8');

// Atualizar TAVERN_CATEGORIES com nomes de ícones de IconesForja
tavernData = tavernData.replace(
  /const TAVERN_CATEGORIES = \{[\s\S]*?\};/,
  `const TAVERN_CATEGORIES = {
  todos: { id: 'todos', label: 'Todos', icon: '', iconName: 'sparkles', desc: 'Todos os serviços, estadias e comodidades da taverna.' },
  estadia: { id: 'estadia', label: 'Estadias', icon: '', iconName: 'bed', desc: 'Acomodações seguras para descanso e recuperação de PV e PM.' },
  alimentacao: { id: 'alimentacao', label: 'Alimentação', icon: '', iconName: 'utensils', desc: 'Refeições nutritivas e pratos exóticos com bônus de sustentação.' },
  bebida: { id: 'bebida', label: 'Bebidas', icon: '', iconName: 'beer', desc: 'Cervejas, hidroméis, vinhos e elixires festivos de Arton.' },
  transporte: { id: 'transporte', label: 'Transporte', icon: '', iconName: 'horse', desc: 'Conduções terrestres, marítimas e aéreas para suas viagens.' },
  cuidados: { id: 'cuidados', label: 'Curandeiro & Magias', icon: '', iconName: 'sparkles', desc: 'Cuidados médicos e magias encomendadas sob demanda.' },
  especial: { id: 'especial', label: 'Serviços Especiais', icon: '', iconName: 'theater', desc: 'Banhos quentes, cuidados estéticos, apresentações e instrução marcial.' },
  mercenario: { id: 'mercenario', label: 'Mercenários', icon: '', iconName: 'sword', desc: 'Aliados combatentes e capangas para apoiar suas missões.' },
  parceiros: { id: 'parceiros', label: 'Parceiros', icon: '', iconName: 'handshake', desc: 'Companheiros e aliados de aventura com bônus de assistência continuada.' }
};`
);

// Remover emojis de CANONICAL_MERCENARIES
const mercIconMap = {
  alquimista_de_batalha: 'potion',
  aprendiz_de_guilda: 'tools',
  aprendiz_de_mago: 'sparkles',
  arauto: 'scroll',
  arqueiro: 'bow',
  batedor: 'search',
  curandeiro: 'sparkles',
  guardiao: 'shield',
  ladino: 'tools',
  mercenario: 'sword',
  soldado: 'sword',
  veterano: 'shield'
};

tavernData = tavernData.replace(/icon:\s*['"][^'"]*['"]/g, match => {
  return "icon: ''";
});

fs.writeFileSync('src/funcionalidades/taverna/03-00-TAVERN_DATA.js', tavernData, 'utf8');
console.log('TAVERN_DATA.js atualizado!');

// 2. Limpar renderMercenariesGrid.js
let gridCode = fs.readFileSync('src/funcionalidades/taverna/03-01-renderMercenariesGrid.js', 'utf8');
gridCode = gridCode.replace(/✓ Treinado em Guerra/g, 'Treinado em Guerra');
gridCode = gridCode.replace(/⚠️ Requer treino em Guerra/g, 'Requer treino em Guerra');
gridCode = gridCode.replace(
  /'<span class="merc-icon">' \+ m\.icon \+ '<\/span>'/,
  `'<span class="merc-icon">' + (window.IconesForja ? window.IconesForja.get(m.tier === 'veterano' ? 'shield' : 'sword', 'icon-md') : '') + '</span>'`
);
fs.writeFileSync('src/funcionalidades/taverna/03-01-renderMercenariesGrid.js', gridCode, 'utf8');
console.log('renderMercenariesGrid.js atualizado!');

// 3. Limpar taverna.html
let tavHtml = fs.readFileSync('src/paginas/taverna.html', 'utf8');
tavHtml = tavHtml.replace(/<span class="tavern-logo-icon" aria-hidden="true">✦<\/span>/g, '<span class="tavern-logo-icon" aria-hidden="true"></span>');
tavHtml = tavHtml.replace(/<div class="empty-icon">✦<\/div>/g, '<div class="empty-icon"></div>');
tavHtml = tavHtml.replace(/<span class="guild-icon-large" aria-hidden="true">✦<\/span>/g, '<span class="guild-icon-large" aria-hidden="true"></span>');
fs.writeFileSync('src/paginas/taverna.html', tavHtml, 'utf8');
console.log('taverna.html atualizado!');
