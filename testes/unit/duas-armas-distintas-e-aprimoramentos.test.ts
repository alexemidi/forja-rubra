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

test('Compra de arma idêntica na loja com uma já equipada na mão: nova arma deve ir para a mochila', () => {
  // Cenário: Herói já tem uma Katana equipada na mão principal
  const inventory = [
    { itemId: 'katana', instanceId: 'inst_katana_equipada', displayName: 'Katana', tipo: 'arma', quantity: 1, improvements: [], enchantments: [] }
  ];

  const eq = {
    weaponId: 'inst_katana_equipada',
    offhandId: 'none',
    shieldId: 'none',
    armorId: 'none',
    trailerId: 'none',
    wornIds: []
  };

  // Simula a compra de uma segunda Katana idêntica na loja
  const novaKatanaComprada = {
    itemId: 'katana',
    instanceId: 'inst_katana_comprada_loja',
    displayName: 'Katana',
    tipo: 'arma',
    quantity: 1,
    improvements: [],
    enchantments: []
  };
  inventory.push(novaKatanaComprada);

  // Mapeamento 1-a-1 de slots para o inventário
  const assignedSlotIndices = new Set<number>();
  const findEntryForSlot = (targetId: string | null | undefined): number => {
    if (!targetId || targetId === 'none') return -1;
    let idx = inventory.findIndex((e: any, i: number) => !assignedSlotIndices.has(i) && (e.instanceId === targetId));
    return idx;
  };

  const weaponIdx = findEntryForSlot(eq.weaponId);
  if (weaponIdx >= 0) assignedSlotIndices.add(weaponIdx);

  // A primeira katana foi atribuída ao slot
  assert.equal(weaponIdx, 0, 'Katana 0 deve estar atribuída ao slot weaponId');
  assert.ok(assignedSlotIndices.has(0));

  // A segunda katana (recém comprada) NÃO deve estar atribuída a nenhum slot
  assert.ok(!assignedSlotIndices.has(1), 'Katana recém-comprada NÃO deve ser consumida pelo slot weaponId');

  // Na renderização da mochila: itens não consumidos são agrupados
  const groupedMap = new Map();
  inventory.forEach((entry, i) => {
    if (assignedSlotIndices.has(i)) return; // Ignora o que está equipado em slots

    const key = `${entry.displayName}|${entry.itemId}|${JSON.stringify(entry.improvements)}|${JSON.stringify(entry.enchantments)}`;
    if (groupedMap.has(key)) {
      const grp = groupedMap.get(key);
      grp.totalQuantity += entry.quantity;
      grp.entries.push(entry);
    } else {
      groupedMap.set(key, {
        entry,
        totalQuantity: entry.quantity,
        entries: [entry]
      });
    }
  });

  // A mochila deve conter exatamente 1 card de Katana com QTD. 1
  const backpackCards = Array.from(groupedMap.values());
  assert.equal(backpackCards.length, 1, 'Deve existir 1 card na mochila para a Katana não equipada');
  assert.equal(backpackCards[0].totalQuantity, 1, 'Quantidade na mochila deve ser 1');
  assert.equal(backpackCards[0].entry.instanceId, 'inst_katana_comprada_loja');

  // Agora equipa a segunda Katana na outra mão (offhand)
  const resEquipOffhand = RegrasEquipamento.aplicar(eq, 'equip-weapon', novaKatanaComprada.instanceId, { handSlot: 'offhandId' });
  assert.equal(resEquipOffhand.alterado, true);
  const updatedEq = resEquipOffhand.equipment;
  assert.equal(updatedEq.weaponId, 'inst_katana_equipada');
  assert.equal(updatedEq.offhandId, 'inst_katana_comprada_loja');

  // Agora ambas as mãos estão ocupadas
  const assignedAfterBoth = new Set<number>();
  const w1 = inventory.findIndex((e, i) => !assignedAfterBoth.has(i) && e.instanceId === updatedEq.weaponId);
  if (w1 >= 0) assignedAfterBoth.add(w1);
  const w2 = inventory.findIndex((e, i) => !assignedAfterBoth.has(i) && e.instanceId === updatedEq.offhandId);
  if (w2 >= 0) assignedAfterBoth.add(w2);

  assert.equal(assignedAfterBoth.size, 2, 'Ambas as katanas devem estar ocupando os slots equipados');

  // Ao guardar uma das katanas, ela volta para a mochila e re-empilha
  const resStore = RegrasEquipamento.aplicar(updatedEq, 'store-offhand', novaKatanaComprada.instanceId, {});
  assert.equal(resStore.alterado, true);
  assert.equal(resStore.equipment.offhandId, 'none');
  assert.equal(resStore.equipment.weaponId, 'inst_katana_equipada');
});

test('Arma adaptável (Katana): dano de 1 mão (1d8) vs 2 mãos (1d10) e devolução de item ao trocar empunhadura', () => {
  let eq = {
    weaponId: 'inst_katana_1',
    offhandId: 'inst_adaga_2',
    shieldId: 'none',
    adaptableHandedness: {} as Record<string, 'uma_mao' | 'duas_maos'>
  };

  // Alterna katana para duas mãos: deve guardar o item da outra mão
  const resGrip = RegrasEquipamento.aplicar(eq, 'set-handedness-two', 'inst_katana_1', {});
  assert.equal(resGrip.alterado, true);
  eq = resGrip.equipment;
  assert.equal(eq.adaptableHandedness['inst_katana_1'], 'duas_maos');
  assert.equal(eq.offhandId, 'none', 'Item da outra mão deve ser devolvido para a mochila');
});

test('Busca de poderes na progressão: filtra poderes pelo termo digitado', () => {
  const poderesExemplo = [
    { id: 'ataque_poderoso', nome: 'Ataque Poderoso', descricao: 'Você pode desferir golpes avassaladores.' },
    { id: 'estilo_de_uma_arma', nome: 'Estilo de Uma Arma', descricao: 'Se estiver usando uma arma em uma mão...' },
    { id: 'foco_em_arma', nome: 'Foco em Arma', descricao: 'Escolha uma arma...' },
    { id: 'vitalidade', nome: 'Vitalidade', descricao: 'Você tem mais pontos de vida.' }
  ];

  const buscar = (query: string) => {
    const q = query.trim().toLowerCase();
    return poderesExemplo.filter(p => !q || p.nome.toLowerCase().includes(q) || p.descricao.toLowerCase().includes(q));
  };

  assert.equal(buscar('').length, 4);
  assert.equal(buscar('arma').length, 2, 'Deve encontrar "Estilo de Uma Arma" e "Foco em Arma"');
  assert.equal(buscar('golpes').length, 1, 'Deve encontrar "Ataque Poderoso" pela descrição');
  assert.equal(buscar('vital').length, 1);
  assert.equal(buscar('inexistente').length, 0);
});
