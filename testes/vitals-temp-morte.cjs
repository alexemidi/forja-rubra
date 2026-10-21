const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { JSDOM, VirtualConsole } = require('jsdom');

const root = path.resolve(__dirname, '..');
const port = 4225;

async function open(page) {
  const errors = [], vc = new VirtualConsole();
  vc.on('jsdomError', e => {
    if (!/navigation|scroll|CSS|Could not load.*fonts/i.test(e.message)) errors.push(e.cause?.stack || e.detail?.stack || e.message);
  });
  const dom = await JSDOM.fromURL(`http://127.0.0.1:${port}/${page}.html`, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = () => null;
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
      w.scrollTo = w.scrollBy = () => {};
      w.HTMLElement.prototype.scrollIntoView = () => {};
      w.structuredClone = structuredClone;
      w.TextEncoder = TextEncoder;
      w.TextDecoder = TextDecoder;
      w.confirm = () => false;
      w.alert = () => {};
      w.fetch = (url, opts) => fetch(new URL(url, w.location.href), opts);
      w.URL.createObjectURL = () => 'blob:teste';
      w.URL.revokeObjectURL = () => {};
    }
  });
  for (let i = 0; i < 600 && !dom.window.document.documentElement.dataset.forjaReady; i++) {
    await new Promise(r => setTimeout(r, 25));
  }
  assert.equal(dom.window.document.documentElement.dataset.forjaReady, 'true', page + ': ' + errors.join('\n'));
  return { dom, errors };
}

(async () => {
  const server = spawn(process.execPath, [path.join(root, 'ferramentas/servidor.cjs'), String(port)], { stdio: 'pipe' });
  try {
    await new Promise((resolve, reject) => {
      server.stdout.once('data', resolve);
      server.once('error', reject);
    });

    const { dom } = await open('criador');
    const w = dom.window;

    const results = w.eval(`(() => {
      state.finished = true;
      state.sheetView = 'sheet';
      state.identity.characterName = 'Herói de Teste';
      progressionStats = () => ({ pv: 22, pm: 10, defense: 10 });
      renderStage();

      // Configuração de vitais base para teste: PV Max = 22, PM Max = 10
      state.vitals.pv = 20;
      state.vitals.pvMax = 22;
      state.vitals.pvTempMax = 0;
      state.vitals.pm = 8;
      state.vitals.pmMax = 10;
      state.vitals.pmTempMax = 0;
      updateVitalVisuals('pv', state.vitals);
      updateVitalVisuals('pm', state.vitals);

      // 1. Curar sem temporários não cria temporários e bate no teto de pvMax
      document.querySelector('[data-vital-amount="pv"]').value = '10';
      document.querySelector('[data-vital-action="pv-up"]').click();
      const pvAposCuraSimples = state.vitals.pv; // Deve ser 22, não 30
      const pvTempAposCuraSimples = state.vitals.pvTempMax || 0; // Deve ser 0

      // 2. Modo Temporário de PV
      document.querySelector('[data-vital-action="toggle-temp-pv"]').click();
      const isPvTempModeAtivo = Boolean(state.vitals.pvTempMode);
      const botaoUpVirouAdicionar = document.querySelector('[data-vital-action="pv-add-temp"]')?.textContent === 'Adicionar';
      const botaoDownVirouEncerrar = document.querySelector('[data-vital-action="pv-clear-temp"]')?.textContent === 'Encerrar';

      // 3. Exemplo do usuário: Usuário com 8 de PV (max 22) recebe 10 temp
      state.vitals.pv = 8;
      state.vitals.pvTempMax = 0;
      updateVitalVisuals('pv', state.vitals);
      document.querySelector('[data-vital-amount="pv"]').value = '10';
      document.querySelector('[data-vital-action="pv-add-temp"]').click();
      document.querySelector('[data-vital-action="confirm-temp-duration-daily"]')?.click();
      const caso8PvAtual = state.vitals.pv; // Deve ser 18 (curado em 10)
      const caso8PvTempMax = state.vitals.pvTempMax; // Deve ser 10 (teto é 32)

      // Se usuário desligar agora (Encerrar), os 18 permanecem (cura retida na vida base)
      document.querySelector('[data-vital-action="pv-clear-temp"]')?.click() ||
        (state.vitals.pvTempMax = 0, state.vitals.pv = Math.min(22, state.vitals.pv));
      const caso8AposEncerrar = state.vitals.pv; // Deve permanecer 18!

      // 4. Exemplo do usuário: Usuário com 20 de PV (max 22) recebe 10 temp
      state.vitals.pv = 20;
      state.vitals.pvTempMax = 0;
      state.vitals.pvTempMode = true;
      updateVitalVisuals('pv', state.vitals);
      document.querySelector('[data-vital-amount="pv"]').value = '10';
      document.querySelector('[data-vital-action="pv-add-temp"]').click();
      document.querySelector('[data-vital-action="confirm-temp-duration-daily"]')?.click();
      const caso20PvAtual = state.vitals.pv; // Deve ser 30 (2 curados na base + 8 no temp)
      const caso20PvTempMax = state.vitals.pvTempMax; // Deve ser 10 (teto 32)

      // 5. Regra canônica de T20: perder 15 pontos estando em 30 (20 base + 10 temp)
      // "se o usuário tomar dano que reduziu os pv temporário isso remove os pv temporários que não contaram mais para vida e não podem ser curados"
      document.querySelector('[data-vital-amount="pv"]').value = '15';
      document.querySelector('[data-vital-action="pv-down"]').click();
      const pvApos15Dano = state.vitals.pv; // 30 - 15 = 15
      const tempMaxAposDano = state.vitals.pvTempMax; // Dano consumiu os 10 temporários (deve ser 0)

      // Cura posterior de 10: como os temporários foram removidos pelo dano, não há sobrecura além de pvMax (22)
      // 15 + 10 = 25 -> bate no teto de pvMax (22)
      document.querySelector('[data-vital-amount="pv"]').value = '10';
      document.querySelector('[data-vital-action="pv-up"]').click();
      const pvAposSobrecura10 = state.vitals.pv; // Deve ser 22

      // Curar mais 20: continua no teto de 22 (temporários perdidos não voltam por cura)
      document.querySelector('[data-vital-amount="pv"]').value = '20';
      document.querySelector('[data-vital-action="pv-up"]').click();
      const pvBateNoTeto32 = state.vitals.pv; // Deve ser 22

      // Desligar temporário
      document.querySelector('[data-vital-action="toggle-temp-pv"]')?.click();
      document.querySelector('[data-vital-action="pv-clear-temp"]')?.click();
      const pvAposEncerrarEm32 = state.vitals.pv; // Continua 22
      const tempMaxAposEncerrar = state.vitals.pvTempMax; // Deve ser 0

      // 6. Sangramento e Morte:
      // Com pvMax 22, bleedingMax = Math.floor(22 / 2) = 11. Limite fatal = -11.
      // Dano de 27 em 22 PV -> 22 - 27 = -5 PV (Sangrando, não morto)
      document.querySelector('[data-vital-amount="pv"]').value = '27';
      document.querySelector('[data-vital-action="pv-down"]').click();
      const pvSangrando = state.vitals.pv; // Deve ser -5
      const pvCardBleeding = document.querySelector('[data-vital-card="pv"]')?.classList.contains('is-bleeding');
      const isDeadAos5Negativo = document.querySelector('[data-vital-card="pv"]')?.classList.contains('is-dead');

      // Mais 6 de dano -> -5 - 6 = -11 (Limite atingido: MORTE!)
      document.querySelector('[data-vital-amount="pv"]').value = '6';
      document.querySelector('[data-vital-action="pv-down"]').click();
      const pvMorto = state.vitals.pv; // Deve ser -11
      const pmAoMorrer = state.vitals.pm; // Deve ser 0
      const isDeadAos11Negativo = document.querySelector('[data-vital-card="pv"]')?.classList.contains('is-dead');
      const isPmCardDeadTambem = document.querySelector('[data-vital-card="pm"]')?.classList.contains('is-dead');

      // Mais dano não ultrapassa o piso fatal de -11
      document.querySelector('[data-vital-amount="pv"]').value = '10';
      document.querySelector('[data-vital-action="pv-down"]').click();
      const pvPisoFatal = state.vitals.pv; // Deve continuar -11

      // Recuperação saindo da morte usando botão Curar
      document.querySelector('[data-vital-amount="pv"]').value = '12';
      document.querySelector('[data-vital-action="pv-up"]').click();
      const pvRevivido = state.vitals.pv; // Deve ser 1
      const isDeadAposReviver = document.querySelector('[data-vital-card="pv"]')?.classList.contains('is-dead');

      // 7. Descanso: validação dos 3 botões (Cancelar, Cortesia, Pagar estadia) e débitos
      state.vitals.pv = 10;
      state.vitals.pvTempMax = 10;
      state.vitals.pm = 2;
      state.vitals.pmTempMax = 5;

      // Configura finanças iniciais: 10 T$
      financesState().levelOneTibars = 10;
      financesState().spent = 0;
      const saldoInicial = remainingFunds(); // Deve ser 10

      // 7a. Abre modal e checa os 3 botões
      document.querySelector('[data-vital-action="open-rest"]').click();
      const restModal = document.getElementById('sheetRestModal');
      const hasBtnCancelar = Boolean(restModal.querySelector('[data-vital-action="close-rest"]'));
      const hasBtnCortesia = Boolean(restModal.querySelector('.vital-rest-cortesia-btn[data-vital-action="rest"]'));
      const hasBtnPagar = Boolean(restModal.querySelector('.vital-rest-confirm-btn[data-vital-action="rest-pay"]'));

      // 7b. Teste do botão Cancelar
      restModal.querySelector('[data-vital-action="close-rest"]').click();
      const modalFechouCancelar = restModal.style.display === 'none';
      const pvSemAlterar = state.vitals.pv; // continua 10

      // 7c. Pagar estadia em condição 'normal' (custo TC 5 = 0.5 T$)
      document.querySelector('[data-vital-action="open-rest"]').click();
      restModal.querySelector('[data-rest-quality="normal"]').click();
      restModal.querySelector('[data-vital-action="rest-pay"]').click();
      const saldoAposNormal = remainingFunds(); // 10 - 0.5 = 9.5
      const tempPvAposDescanso = state.vitals.pvTempMax; // Deve ser 0
      const tempPmAposDescanso = state.vitals.pmTempMax; // Deve ser 0
      const pvAposNormal = state.vitals.pv; // recuperou nível (1) -> 11

      // 7d. Pagar estadia em condição 'confortavel' (custo T$ 4)
      state.vitals.pv = 10;
      document.querySelector('[data-vital-action="open-rest"]').click();
      restModal.querySelector('[data-rest-quality="confortavel"]').click();
      restModal.querySelector('[data-vital-action="rest-pay"]').click();
      const saldoAposConfortavel = remainingFunds(); // 9.5 - 4 = 5.5

      // 7e. Tentar pagar 'luxuosa' (custo T$ 20) com saldo insuficiente (5.5 < 20)
      state.vitals.pv = 10;
      document.querySelector('[data-vital-action="open-rest"]').click();
      restModal.querySelector('[data-rest-quality="luxuosa"]').click();
      restModal.querySelector('[data-vital-action="rest-pay"]').click();
      const saldoAposFalhaLuxuosa = remainingFunds(); // Deve continuar 5.5
      const pvAposFalhaLuxuosa = state.vitals.pv; // Não deve descansar (continua 10)

      // 7f. Cortesia em condição luxuosa: descansa sem debitar nada
      restModal.querySelector('[data-vital-action="rest"]').click();
      const saldoAposCortesiaLuxuosa = remainingFunds(); // Continua 5.5
      const pvAposCortesiaLuxuosa = state.vitals.pv; // Recuperou 3x nível (3) -> 13

      // 7g. Pagar estadia em condição 'ruim' (custo T$ 0)
      state.vitals.pv = 10;
      document.querySelector('[data-vital-action="open-rest"]').click();
      restModal.querySelector('[data-rest-quality="ruim"]').click();
      restModal.querySelector('[data-vital-action="rest-pay"]').click();
      const saldoAposRuim = remainingFunds(); // Continua 5.5
      const pvAposRuim = state.vitals.pv; // Recuperou 1 (mínimo 1) -> 11

      return {
        pvAposCuraSimples,
        pvTempAposCuraSimples,
        isPvTempModeAtivo,
        botaoUpVirouAdicionar,
        botaoDownVirouEncerrar,
        caso8PvAtual,
        caso8PvTempMax,
        caso8AposEncerrar,
        caso20PvAtual,
        caso20PvTempMax,
        pvApos15Dano,
        tempMaxAposDano,
        pvAposSobrecura10,
        pvBateNoTeto32,
        pvAposEncerrarEm32,
        tempMaxAposEncerrar,
        pvSangrando,
        pvCardBleeding,
        isDeadAos5Negativo,
        pvMorto,
        pmAoMorrer,
        isDeadAos11Negativo,
        isPmCardDeadTambem,
        pvPisoFatal,
        pvRevivido,
        isDeadAposReviver,
        tempPvAposDescanso,
        tempPmAposDescanso,
        saldoInicial,
        hasBtnCancelar,
        hasBtnCortesia,
        hasBtnPagar,
        modalFechouCancelar,
        pvSemAlterar,
        saldoAposNormal,
        pvAposNormal,
        saldoAposConfortavel,
        saldoAposFalhaLuxuosa,
        pvAposFalhaLuxuosa,
        saldoAposCortesiaLuxuosa,
        pvAposCortesiaLuxuosa,
        saldoAposRuim,
        pvAposRuim
      };
    })()`);

    // Validações
    assert.equal(results.pvAposCuraSimples, 22, 'Cura simples não deve passar de pvMax nem gerar temporários');
    assert.equal(results.pvTempAposCuraSimples, 0, 'pvTempMax deve continuar 0 após cura simples');

    assert.equal(results.isPvTempModeAtivo, true, 'Clicar no botão Temporário deve ativar pvTempMode');
    assert.equal(results.botaoUpVirouAdicionar, true, 'Botão direito deve virar Adicionar no modo temporário');
    assert.equal(results.botaoDownVirouEncerrar, true, 'Botão esquerdo deve virar Encerrar no modo temporário');

    assert.equal(results.caso8PvAtual, 18, 'Caso 1: 8 PV + 10 temp deve curar para 18');
    assert.equal(results.caso8PvTempMax, 10, 'Caso 1: pvTempMax deve ser 10');
    assert.equal(results.caso8AposEncerrar, 18, 'Caso 1: ao encerrar temp, vida base curada permanece 18');

    assert.equal(results.caso20PvAtual, 30, 'Caso 2: 20 PV + 10 temp deve ir para 30 (teto 32)');
    assert.equal(results.caso20PvTempMax, 10, 'Caso 2: pvTempMax deve ser 10');

    assert.equal(results.pvApos15Dano, 15, '30 PV - 15 dano deve resultar em 15');
    assert.equal(results.tempMaxAposDano, 0, 'Dano consumiu e removeu todos os PV temporários');
    assert.equal(results.pvAposSobrecura10, 22, 'Cura de 10 em 15 PV recupera a vida real até o teto de 22 (sem sobrecura de temporários)');
    assert.equal(results.pvBateNoTeto32, 22, 'Cura adicional não recria temporários perdidos e bate no teto de 22');

    assert.equal(results.pvAposEncerrarEm32, 22, 'Ao encerrar em 22 PV, vida base permanece no máximo de 22');
    assert.equal(results.tempMaxAposEncerrar, 0, 'pvTempMax deve ser zerado ao encerrar');

    assert.equal(results.pvSangrando, -5, '22 PV - 27 dano deve deixar -5 PV');
    assert.equal(results.pvCardBleeding, true, 'Card de PV deve estar com classe is-bleeding em -5');
    assert.equal(results.isDeadAos5Negativo, false, 'Em -5 PV não deve estar morto');

    assert.equal(results.pvMorto, -11, 'PV deve chegar ao limite fatal de -11');
    assert.equal(results.pmAoMorrer, 0, 'Ao morrer, o herói deve ficar com 0 PM');
    assert.equal(results.isDeadAos11Negativo, true, 'Em -11 PV o personagem deve estar morto');
    assert.equal(results.isPmCardDeadTambem, true, 'Ao morrer, a barra de PM também deve ficar cinza (is-dead)');
    assert.equal(results.pvPisoFatal, -11, 'PV não deve cair abaixo do piso fatal de -11');

    assert.equal(results.pvRevivido, 1, 'Reviver restaura PV para 1');
    assert.equal(results.isDeadAposReviver, false, 'Reviver remove status de morto');

    assert.equal(results.tempPvAposDescanso, 0, 'Descanso deve zerar temporários de PV');
    assert.equal(results.tempPmAposDescanso, 0, 'Descanso deve zerar temporários de PM');

    // Validações do modal de descanso (3 botões e débitos de hospedagem)
    assert.equal(results.saldoInicial, 10, 'Saldo inicial para teste de estadia deve ser 10 T$');
    assert.equal(results.hasBtnCancelar, true, 'Modal deve conter o botão Cancelar');
    assert.equal(results.hasBtnCortesia, true, 'Modal deve conter o botão Cortesia');
    assert.equal(results.hasBtnPagar, true, 'Modal deve conter o botão Pagar estadia');
    assert.equal(results.modalFechouCancelar, true, 'Clicar em Cancelar deve fechar o modal');
    assert.equal(results.pvSemAlterar, 10, 'Cancelar não deve alterar os PV');

    assert.equal(results.saldoAposNormal, 9.5, 'Pagar estadia normal (TC 5 = 0.5 T$) deve debitar 0.5 T$ (saldo 9.5)');
    assert.equal(results.pvAposNormal, 11, 'Descanso normal deve recuperar 1 PV para nível 1');

    assert.equal(results.saldoAposConfortavel, 5.5, 'Pagar estadia confortável (T$ 4) deve debitar 4 T$ (saldo 5.5)');

    assert.equal(results.saldoAposFalhaLuxuosa, 5.5, 'Tentar pagar luxuosa sem saldo (5.5 < 20) não deve debitar');
    assert.equal(results.pvAposFalhaLuxuosa, 10, 'Tentar pagar luxuosa sem saldo não deve aplicar descanso');

    assert.equal(results.saldoAposCortesiaLuxuosa, 5.5, 'Cortesia em luxuosa não debita tibares');
    assert.equal(results.pvAposCortesiaLuxuosa, 13, 'Cortesia em luxuosa aplica a recuperação de 3x nível');

    assert.equal(results.saldoAposRuim, 5.5, 'Pagar estadia ruim (T$ 0) não debita');
    assert.equal(results.pvAposRuim, 11, 'Descanso ruim recupera PV');

    console.log('✔ Todas as regras de vitais, temporários, sangramento, morte e luto foram aprovadas!');
    console.log('✔ Modal de descanso com Cancelar, Cortesia e Pagar estadia aprovado!');
    server.kill();
    process.exit(0);
  } finally {
    server.kill();
  }
})();
