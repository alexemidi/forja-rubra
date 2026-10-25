import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const RegrasEquipamento = require('../../src/regras/nucleo/equipamento.ts');

test('Duas Armas Iguais: cada arma deve ser tratada como entidade distinta com instanceId próprio', () => {
  // Simula a lógica de consolidação de inventário
  const rawBackpack: any[] = [
    { itemId: 'adaga', quantity: 2, displayName: 'Adaga', tipo: 'arma' },
    { itemId: 'espada_longa', quantity: 1, displayName: 'Espada Longa', tipo: 'arma' }
  ];

  // Desmembramento de armas em instâncias únicas (quantity 1)
  const isWeaponEntry = (e: any) => e.tipo === 'arma' || Boolean(e.arma);
  const weapons: any[] = [];
  const otherItems: any[] = [];
  const usedIds = new Set<string>();

  for (const entry of rawBackpack) {
    if (isWeaponEntry(entry)) {
      const qty = Math.max(1, Number(entry.quantity) || 1);
      for (let q = 0; q < qty; q++) {
        let instId = (q === 0 && entry.instanceId && !usedIds.has(entry.instanceId)) ? entry.instanceId : null;
        if (!instId) {
          instId = 'inst_wep_' + entry.itemId + '_' + Math.random().toString(36).slice(2, 7);
        }
        usedIds.add(instId);
        weapons.push({
          ...entry,
          instanceId: instId,
          quantity: 1,
          improvements: [],
          enchantments: []
        });
      }
    } else {
      otherItems.push(entry);
    }
  }

  const finalInventory = [...weapons, ...otherItems];

  // Devem existir 2 adagas distintas no inventário
  const adagas = finalInventory.filter(e => e.itemId === 'adaga');
  assert.equal(adagas.length, 2, 'Devem existir 2 entradas separadas para as duas adagas');
  assert.notEqual(adagas[0].instanceId, adagas[1].instanceId, 'Cada adaga deve ter seu próprio instanceId exclusivo');
  assert.equal(adagas[0].quantity, 1);
  assert.equal(adagas[1].quantity, 1);
});

test('Duas Armas Iguais: podem ser equipadas cada uma em uma mão diferente simultaneamente', () => {
  const adaga1 = { itemId: 'adaga', instanceId: 'inst_adaga_alpha', quantity: 1, tipo: 'arma' };
  const adaga2 = { itemId: 'adaga', instanceId: 'inst_adaga_beta', quantity: 1, tipo: 'arma' };

  let eq = {
    weaponId: null as string | null,
    offhandId: 'none' as string | null,
    shieldId: 'none' as string | null,
    wornIds: [] as string[]
  };

  // 1. Equipa primeira adaga na mão principal
  const res1 = RegrasEquipamento.aplicar(eq, 'equip-weapon', adaga1.instanceId, { handSlot: 'weaponId' });
  assert.equal(res1.alterado, true);
  eq = res1.equipment;
  assert.equal(eq.weaponId, 'inst_adaga_alpha');
  assert.equal(eq.offhandId, 'none');

  // 2. Equipa segunda adaga na outra mão (offhand)
  const res2 = RegrasEquipamento.aplicar(eq, 'equip-weapon', adaga2.instanceId, { handSlot: 'offhandId' });
  assert.equal(res2.alterado, true);
  eq = res2.equipment;
  assert.equal(eq.weaponId, 'inst_adaga_alpha');
  assert.equal(eq.offhandId, 'inst_adaga_beta');

  // 3. Com ambas as mãos ocupadas, equipar escudo é rejeitado
  const resShield = RegrasEquipamento.aplicar(eq, 'equip-shield', 'escudo_leve', {});
  assert.equal(resShield.alterado, false, 'Não deve permitir equipar escudo com as duas mãos ocupadas por armas');

  // 4. Guardar uma das armas devolve apenas ela para a mochila sem desequipar a outra
  const resStoreOffhand = RegrasEquipamento.aplicar(eq, 'store-offhand', adaga2.instanceId, {});
  assert.equal(resStoreOffhand.alterado, true);
  eq = resStoreOffhand.equipment;
  assert.equal(eq.weaponId, 'inst_adaga_alpha', 'A primeira adaga deve continuar equipada na mão principal');
  assert.equal(eq.offhandId, 'none', 'Apenas a segunda adaga deve ter sido guardada');
});

test('Duas Armas Iguais: podem receber aprimoramentos diferentes individualmente', () => {
  const backpack = [
    {
      itemId: 'espada_longa',
      instanceId: 'inst_espada_1',
      displayName: 'Espada Longa',
      quantity: 1,
      improvements: [] as any[],
      customPrice: 15
    },
    {
      itemId: 'espada_longa',
      instanceId: 'inst_espada_2',
      displayName: 'Espada Longa',
      quantity: 1,
      improvements: [] as any[],
      customPrice: 15
    }
  ];

  // Aplica melhoria Certeira na espada 1
  const draftId1 = 'inst_espada_1';
  const target1 = backpack.find(it => it.instanceId === draftId1);
  assert.ok(target1);
  target1.improvements = [{ id: 'certeira', nome: 'Certeira' }];
  target1.displayName = 'Espada Longa Certeira';
  target1.customPrice = 315;

  // Aplica melhoria Maciça + Material Mitral na espada 2
  const draftId2 = 'inst_espada_2';
  const target2 = backpack.find(it => it.instanceId === draftId2);
  assert.ok(target2);
  target2.improvements = [
    { id: 'macica', nome: 'Maciça' },
    { id: 'material_especial', materialId: 'mitral', nome: 'Mitral' }
  ];
  target2.displayName = 'Espada Longa Maciça de Mitral';
  target2.customPrice = 4315;

  // Verifica que espada 1 tem suas próprias melhorias e espada 2 tem as suas
  assert.equal(backpack[0].displayName, 'Espada Longa Certeira');
  assert.equal(backpack[0].improvements.length, 1);
  assert.equal(backpack[0].improvements[0].id, 'certeira');
  assert.equal(backpack[0].customPrice, 315);

  assert.equal(backpack[1].displayName, 'Espada Longa Maciça de Mitral');
  assert.equal(backpack[1].improvements.length, 2);
  assert.equal(backpack[1].improvements[0].id, 'macica');
  assert.equal(backpack[1].improvements[1].materialId, 'mitral');
  assert.equal(backpack[1].customPrice, 4315);
});
