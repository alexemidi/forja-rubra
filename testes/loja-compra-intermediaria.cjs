const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const operations = require('../src/regras/nucleo/operacoes-loja.js');

console.log('=== TESTES DA JANELA INTERMEDIÁRIA DE COMPRAS, TAVERNA E VELOCIDADE DE VENDA (T20) ===\n');

// 1. Validando cálculo de desconto/acréscimo no núcleo de transações da loja
console.log('1. Validando regras de transação com desconto e acréscimo...');
const baseArsenal = { operations: {}, grants: {}, storage: {}, choiceIndex: 0, complete: false };
const baseFinances = { spent: 10 };
const baseCompleted = [1, 8];

// Compra com 10% de desconto (base 100 T$, final 90 T$)
const msgComDesconto = {
  operationId: 'compra-desc-10',
  kind: 'purchase',
  total: 90,
  percent: 90,
  storage: {
    profiles: JSON.stringify({
      profiles: [{
        backpack: [{ itemId: 'espada_longa', quantity: 1, acquisition: { operationId: 'compra-desc-10' } }]
      }]
    })
  }
};

const tx1 = operations.preparar(baseArsenal, baseFinances, baseCompleted, msgComDesconto, 200, 'profiles');
assert.equal(tx1.status, 'ready', 'Transação com desconto deve ser aceita');
assert.equal(tx1.finances.spent, 100, 'Saldo gasto deve aumentar exatamente pelo total com desconto (10 + 90 = 100)');
assert.equal(tx1.result.total, 90, 'Resultado deve registrar total de 90 T$');

// Compra com 20% de acréscimo (base 100 T$, final 120 T$)
const msgComAcrescimo = {
  operationId: 'compra-acres-20',
  kind: 'purchase',
  total: 120,
  percent: 120,
  storage: {
    profiles: JSON.stringify({
      profiles: [{
        backpack: [{ itemId: 'escudo_pesado', quantity: 1, acquisition: { operationId: 'compra-acres-20' } }]
      }]
    })
  }
};

const tx2 = operations.preparar(baseArsenal, baseFinances, baseCompleted, msgComAcrescimo, 200, 'profiles');
assert.equal(tx2.status, 'ready', 'Transação com acréscimo deve ser aceita');
assert.equal(tx2.finances.spent, 130, 'Saldo gasto deve aumentar exatamente pelo total com acréscimo (10 + 120 = 130)');
assert.equal(tx2.result.total, 120, 'Resultado deve registrar total de 120 T$');

console.log('✔ Validações de transação com desconto e acréscimo aprovadas!');

// 2. Validando a lógica do modal intermediário (promptGeneralPurchaseModal) com Math.ceil
console.log('\n2. Validando modal intermediário da Loja com arredondamento canônico (Math.ceil)...');

class MockElement {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.hidden = false;
    this.innerHTML = '';
    this.textContent = '';
    this.listeners = {};
    this.dataset = {};
    this.style = {};
  }
  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
  dispatchEvent(event) {
    const list = this.listeners[event.type] || [];
    for (const fn of list) fn(event);
  }
  querySelector(sel) {
    if (sel === '[data-general-purchase-items]') return this.itemsEl || (this.itemsEl = new MockElement('div'));
    if (sel === '[data-general-purchase-base]') return this.baseEl || (this.baseEl = new MockElement('strong'));
    if (sel === '[data-general-purchase-funds]') return this.fundsEl || (this.fundsEl = new MockElement('span'));
    if (sel === '[data-general-purchase-percent]') return this.percentEl || (this.percentEl = new MockElement('strong'));
    if (sel === '[data-general-purchase-total]') return this.totalEl || (this.totalEl = new MockElement('strong'));
    return null;
  }
}

const docMock = {
  body: {
    appendChild(el) { docMock.elements.push(el); }
  },
  elements: [],
  getElementById(id) {
    return docMock.elements.find(e => e.id === id) || null;
  },
  querySelector(sel) {
    return null;
  },
  createElement(tag) {
    return new MockElement(tag);
  }
};

const contextVM = vm.createContext({
  document: docMock,
  window: {},
  formatCurrencyValue: (v, m) => `${v} ${m}`,
  escapeHtml: s => String(s),
  itemById: new Map([
    ['mascara_completa', { id: 'mascara_completa', nome: 'Máscara Completa', preco: { valor: 15, moeda: 'T$' } }]
  ]),
  effectiveItemForOptions: (it) => it,
  entryValueInfo: () => ({ unitKnown: 15 }),
  configuredItemName: (entry, it) => it.nome
});

const srcEnsure = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/loja/05-03-ensureGeneralSaleModal.js'), 'utf8');

const purchaseSnippet = srcEnsure.slice(
  srcEnsure.indexOf('let generalPurchasePercent=100'),
  srcEnsure.indexOf('if(typeof window!==')
);

vm.runInContext(purchaseSnippet, contextVM);

const modal = vm.runInContext('ensureGeneralPurchaseModal()', contextVM);
assert.ok(modal, 'Modal deve ser criado');
assert.equal(modal.id, 'generalPurchaseModal');

// Preço base 15 T$ - 10% desconto = 13.5 -> Math.ceil = 14 T$
const mockItems = [{ itemId: 'mascara_completa', quantity: 1, price: 15 }];
const pPromise = vm.runInContext('promptGeneralPurchaseModal(15, ' + JSON.stringify(mockItems) + ', 100)', contextVM);

assert.equal(modal.hidden, false, 'Modal deve ficar visível ao ser aberto');
assert.equal(modal.querySelector('[data-general-purchase-percent]').textContent, '100%');
assert.equal(modal.querySelector('[data-general-purchase-total]').textContent, '15 T$');

// Clica em -10%: 15 T$ * 0.9 = 13.5 -> Math.ceil dá 14 T$!
modal.dispatchEvent({
  type: 'click',
  target: {
    closest: (sel) => sel === '[data-general-purchase]' ? { dataset: { generalPurchase: 'down' } } : null
  }
});
assert.equal(modal.querySelector('[data-general-purchase-percent]').textContent, '90%');
assert.equal(modal.querySelector('[data-general-purchase-total]').textContent, '14 T$');

// Clica em confirm
modal.dispatchEvent({
  type: 'click',
  target: {
    closest: (sel) => sel === '[data-general-purchase]' ? { dataset: { generalPurchase: 'confirm' } } : null
  }
});

pPromise.then(res => {
  assert.equal(res.confirmed, true);
  assert.equal(res.total, 14, 'Arredondamento para cima deve resultar em 14 T$');
  assert.equal(res.percent, 90);
  console.log('✔ Arredondamento para cima canônico (Math.ceil) na Loja validado com sucesso!');

  // 3. Validando velocidade de confirmação de venda em inventario/venda.js
  console.log('\n3. Validando rapidez e resposta visual instantânea na confirmação de venda...');
  const srcVenda = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/inventario/venda.js'), 'utf8');
  assert.ok(srcVenda.includes('modal.hidden=true'), 'Deve fechar o modal');
  assert.ok(srcVenda.indexOf('modal.hidden=true') < srcVenda.indexOf('persistNow()'), 'Deve fechar o modal ANTES de persistNow() para resposta visual instantânea');
  assert.ok(srcVenda.indexOf('toast(') < srcVenda.indexOf('persistNow()'), 'Deve emitir toast imediatamente antes de persistNow()');
  console.log('✔ Resposta visual imediata da venda (fechamento e feedback antes de persistência/save) validada!');

  // 4. Validando cálculo de percentual na Taverna com Math.ceil
  console.log('\n4. Validando modificadores e Math.ceil na Taverna...');
  const srcTaverna = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/taverna/03-01-renderMercenariesGrid.js'), 'utf8');
  assert.ok(srcTaverna.includes('Math.ceil(baseTotal * (percent / 100))'), 'Taverna deve usar Math.ceil para arredondar para cima conforme regras do livro');
  assert.ok(srcTaverna.includes('tavernState.hirePercent'), 'Taverna deve suportar hirePercent');

  const srcTavernaHtml = fs.readFileSync(path.join(__dirname, '../src/paginas/taverna.html'), 'utf8');
  assert.ok(srcTavernaHtml.includes('hire-percent-dec'), 'HTML da taverna deve conter botão −10%');
  assert.ok(srcTavernaHtml.includes('hire-percent-inc'), 'HTML da taverna deve conter botão +10%');
  assert.ok(srcTavernaHtml.includes('hire-percent-reset'), 'HTML da taverna deve conter botão Restaurar');
  console.log('✔ Controles de percentual e Math.ceil na Taverna validados com sucesso!');

  // 5. Validando compra de poções da Taverna com Math.ceil
  console.log('\n5. Validando compra de poções da Taverna com modal intermediário e Math.ceil...');
  const srcEventos = fs.readFileSync(path.join(__dirname, '../src/integracoes/criador/eventos-e-servicos.js'), 'utf8');
  assert.ok(srcEventos.includes('abrirModalCompraPocaoTaverna'), 'Deve chamar abrirModalCompraPocaoTaverna');
  assert.ok(srcEventos.includes('Math.ceil(activePotionPurchaseBase*(activePotionPurchasePercent/100))'), 'Deve arredondar compra de poções para cima com Math.ceil');
  console.log('✔ Modal intermediário e Math.ceil na compra de poções validados com sucesso!');

  console.log('\n======================================================');
  console.log('🎉 SUCESSO TOTAL: Todas as validações de compras, taverna, poções e rapidez de venda passaram!');
  console.log('======================================================');
}).catch(err => {
  console.error('Erro na validação:', err);
  process.exit(1);
});
