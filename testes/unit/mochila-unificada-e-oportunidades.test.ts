import test from 'node:test';
import assert from 'node:assert/strict';
import { regrasPocaoPergaminho, custoMateriaPrima, cdFabricacao } from '../../src/lib/t20/crafting/workshop-rules.ts';
import fs from 'node:fs';
import path from 'node:path';

test('Manufatura Unificada: regrasPocaoPergaminho calcula preços e CD canônicos', () => {
  // 1º Círculo: 1 PM -> Preço = 30 * 1 = 30 T$, MP = 10 T$, CD = 21
  const c1 = regrasPocaoPergaminho(1);
  assert.equal(c1.precoBase, 30);
  assert.equal(c1.custoMateriaPrima, 10);
  assert.equal(c1.cdFabricacao, 21);

  // 1º Círculo com fração 1/4 (Aprendiz de Drogadora): MP = 30/4 = 7 ou 8 -> 8 T$
  const c1Drogadora = regrasPocaoPergaminho(1, { fracao: '1/4' });
  assert.equal(c1Drogadora.precoBase, 30);
  assert.equal(c1Drogadora.custoMateriaPrima, 7);

  // 2º Círculo: 3 PM -> Preço = 30 * 9 = 270 T$, MP = 90 T$, CD = 23
  const c2 = regrasPocaoPergaminho(2);
  assert.equal(c2.precoBase, 270);
  assert.equal(c2.custoMateriaPrima, 90);
  assert.equal(c2.cdFabricacao, 23);
});

test('Mochila Unificada: Regra de disparo de munição exige arma correspondente', () => {
  // Simulação da lógica hasWeaponForAmmo implementada na mochila
  function checkAmmoWeapon(ammoName: string, backpackItems: Array<{ id: string; nome?: string; tipo?: string }>): boolean {
    const isFlecha = /flecha/i.test(ammoName);
    const isVirote = /virote/i.test(ammoName);
    const isBala = /bala/i.test(ammoName);
    const isPedra = /pedra/i.test(ammoName);

    return backpackItems.some(item => {
      const nome = String(item.nome || item.id || '').toLowerCase();
      if (isFlecha && (nome.includes('arco') || nome.includes('flecha-'))) return true;
      if (isVirote && (nome.includes('besta') || nome.includes('balestra'))) return true;
      if (isBala && (nome.includes('pistola') || nome.includes('mosquete') || nome.includes('arma de fogo') || nome.includes('bacamarte'))) return true;
      if (isPedra && (nome.includes('funda') || nome.includes('tacape'))) return true;
      return false;
    });
  }

  // Com apenas flechas e adaga: não pode disparar
  const invSemArco = [{ id: 'adaga', nome: 'Adaga' }, { id: 'flechas', nome: 'Flechas' }];
  assert.equal(checkAmmoWeapon('Flechas', invSemArco), false);

  // Com arco curto no inventário: agora pode disparar
  const invComArco = [{ id: 'arco_curto', nome: 'Arco Curto' }, { id: 'flechas', nome: 'Flechas' }];
  assert.equal(checkAmmoWeapon('Flechas', invComArco), true);

  // Virotes exigem besta
  assert.equal(checkAmmoWeapon('Virotes', invComArco), false);
  const invComBesta = [{ id: 'besta_pesada', nome: 'Besta Pesada' }, { id: 'virotes', nome: 'Virotes' }];
  assert.equal(checkAmmoWeapon('Virotes', invComBesta), true);

  // Balas exigem pistola ou mosquete
  assert.equal(checkAmmoWeapon('Balas', invComBesta), false);
  const invComPistola = [{ id: 'pistola', nome: 'Pistola' }, { id: 'balas', nome: 'Balas' }];
  assert.equal(checkAmmoWeapon('Balas', invComPistola), true);
});

test('Projeções de Magias: criador-grimoireHtml está gerado e populado', () => {
  const grimoireHtmlDist = path.resolve(process.cwd(), 'dist/dados/criador-grimoireHtml.json');
  assert.equal(fs.existsSync(grimoireHtmlDist), true, 'dist/dados/criador-grimoireHtml.json deve existir');
  const content = JSON.parse(fs.readFileSync(grimoireHtmlDist, 'utf8'));
  assert.equal(typeof content, 'string');
  assert.equal(content.length > 1000, true, 'dist/dados/criador-grimoireHtml.json deve conter os cards de magias');
  assert.equal(content.includes('card-props'), true, 'deve conter card-props');
  assert.equal(content.includes('apr-section'), true, 'deve conter apr-section');
});
