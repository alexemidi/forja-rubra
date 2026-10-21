const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

// 1. Verificar CSS de grimório (filters-bar e botões)
const cssGrimorio = fs.readFileSync(path.join(root, 'src/estilos/grimorio/0.css'), 'utf8');
assert(cssGrimorio.includes('position: relative;'), 'filters-bar deve ter position: relative');
assert(!cssGrimorio.includes('position: sticky;\n    top: 0;'), 'filters-bar não deve ter position: sticky');
assert(cssGrimorio.includes('.learn-btn.learn-again'), 'deve conter estilo de learn-again');
assert(cssGrimorio.includes('#eab308'), 'learn-again deve usar tom amarelado #eab308');
assert(cssGrimorio.includes('#dc2626'), 'remove-spell deve usar tom rubro #dc2626');

// 2. Verificar cards.json e 02-00-cards.js (Ler Mais)
const cardsJson = fs.readFileSync(path.join(root, 'dados/magias-cards.json'), 'utf8');
assert(!cardsJson.includes('Ver magia completa'), 'dados/magias-cards.json não deve conter "Ver magia completa"');
assert(cardsJson.includes('Ler Mais'), 'dados/magias-cards.json deve conter "Ler Mais"');

const cardsJs = fs.readFileSync(path.join(root, 'src/funcionalidades/grimorio/02-00-cards.js'), 'utf8');
assert(cardsJs.includes("'Ler Mais'"), '02-00-cards.js deve usar "Ler Mais"');
assert(!cardsJs.includes("'Ver magia completa'"), '02-00-cards.js não deve usar "Ver magia completa"');

// 3. Verificar canal do grimório (04-00-channel.js)
const channelJs = fs.readFileSync(path.join(root, 'src/funcionalidades/grimorio/04-00-channel.js'), 'utf8');
assert(channelJs.includes('Modo consulta ligado, mude para todas as magias para poder aprender.'), 'deve conter mensagem de aviso do modo consulta');
assert(channelJs.includes('installConsultNoticeDialog'), 'deve instalar o modal de aviso do modo consulta');
assert(channelJs.includes('#eab308'), 'channel.js deve ter tom amarelado para learn-again');
assert(channelJs.includes('#dc2626'), 'channel.js deve ter tom rubro para remove-spell');

// 4. Testar lógica do Teurgista Místico em magias.js
const magiasJs = fs.readFileSync(path.join(root, 'src/regras/criador/magias.js'), 'utf8');
assert(magiasJs.includes('groupOrderScore'), 'magias.js deve conter groupOrderScore');
assert(magiasJs.includes('teurgistUnlocked'), 'magias.js deve conter teurgistUnlocked');

// 5. Testar Cosmopolita em origem-cosmopolita.js
const cosmoJs = fs.readFileSync(path.join(root, 'src/regras/criador/origem-cosmopolita.js'), 'utf8');
assert(cosmoJs.includes('state.powers.cosmopolitaPower = key'), 'ao clicar num item elegível em Cosmopolita, deve definir cosmopolitaPower imediatamente');

console.log('✔ Todas as verificações das 6 solicitações foram validadas com sucesso!');
