import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const magiasPath = path.resolve('dados/magias-cards.json');
const cards = JSON.parse(fs.readFileSync(magiasPath, 'utf8'));
const cf = cards['curar-ferimentos'];

assert(cf, 'Curar ferimentos não encontrada em magias-cards.json');
assert(cf.includes('1 morto-vivo.'), 'Deve conter "1 morto-vivo." no truque');
assert(!cf.includes('morto- -vivo'), 'Não deve conter "morto- -vivo" no truque');

console.log('✔ Verificação do truque de Curar Ferimentos: "morto-vivo" corrigido com sucesso!');
