import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawn, ChildProcess } from 'node:child_process';
import { JSDOM, VirtualConsole } from 'jsdom';

const root = process.cwd();
const port = 4229;

async function openPage(page: string) {
  const errors: string[] = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e: any) => {
    if (!/navigation|scroll|CSS|Could not load.*fonts/i.test(e.message)) {
      errors.push(e.cause?.stack || e.detail?.stack || e.message);
    }
  });

  const dom = await JSDOM.fromURL(`http://127.0.0.1:${port}/${page}.html`, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w: any) {
      w.HTMLCanvasElement.prototype.getContext = () => null;
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
      w.scrollTo = w.scrollBy = () => {};
      w.HTMLElement.prototype.scrollIntoView = () => {};
      w.structuredClone = structuredClone;
      w.TextEncoder = TextEncoder;
      w.TextDecoder = TextDecoder;
      w.confirm = () => false;
      w.alert = () => {};
      w.fetch = (url: string, opts: any) => fetch(new URL(url, w.location.href), opts);
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

test('Visibilidade de #phaseNav e .stage-footer no modo criacao, edicao e ficha finalizada', async () => {
  const server: ChildProcess = spawn(process.execPath, [path.join(root, 'ferramentas/servidor.cjs'), String(port)], { stdio: 'pipe' });
  try {
    await new Promise((resolve, reject) => {
      server.stdout?.once('data', resolve);
      server.once('error', reject);
    });

    const { dom } = await openPage('criador');
    const w = dom.window as any;

    // 1. Modo Criação Inicial: As duas barras DEVEM estar visíveis
    const pNavInit = w.document.getElementById('phaseNav');
    const footerInit = w.document.querySelector('.stage-footer');
    assert.ok(pNavInit, 'Elemento #phaseNav deve existir no criador');
    assert.ok(footerInit, 'Elemento .stage-footer deve existir no criador');
    assert.equal(pNavInit.hidden, false, '#phaseNav deve estar visível (hidden=false) na criação');
    assert.notEqual(pNavInit.style.display, 'none', '#phaseNav não deve ter display: none na criação');
    assert.equal(footerInit.hidden, false, '.stage-footer deve estar visível (hidden=false) na criação');
    assert.notEqual(footerInit.style.display, 'none', '.stage-footer não deve ter display: none na criação');

    // 2. Finalizar a ficha e renderizar modo de ficha pronta
    w.eval(`(() => {
      state.finished = true;
      state.isEditingFinishedSheet = false;
      state.sheetView = 'sheet';
      persistNow();
      renderStage();
    })()`);

    const pNavFinished = w.document.getElementById('phaseNav');
    const footerFinished = w.document.querySelector('.stage-footer');
    assert.equal(pNavFinished.hidden, true, '#phaseNav deve estar oculto na ficha finalizada');
    assert.equal(pNavFinished.style.display, 'none', '#phaseNav deve ter display: none na ficha finalizada');
    assert.equal(footerFinished.hidden, true, '.stage-footer deve estar oculto na ficha finalizada');
    assert.equal(footerFinished.style.display, 'none', '.stage-footer deve ter display: none na ficha finalizada');
    assert.ok(w.document.body.classList.contains('character-sheet-ready'), 'Body deve ter classe character-sheet-ready quando finalizada');

    // 3. Entrar no Modo Edição (clique em "Editar ficha")
    w.eval(`(() => {
      document.getElementById('editCharacterButton')?.click();
    })()`);

    assert.equal(w.eval('state.isEditingFinishedSheet'), true, 'isEditingFinishedSheet deve ser true no modo edição');
    assert.equal(w.eval('state.finished'), false, 'finished deve ser false no modo edição');
    assert.equal(w.eval('state.step'), 1, 'Modo edição deve abrir na fase 1');

    const pNavEdit = w.document.getElementById('phaseNav');
    const footerEdit = w.document.querySelector('.stage-footer');
    assert.equal(pNavEdit.hidden, false, '#phaseNav DEVE estar visível (hidden=false) no modo edição');
    assert.notEqual(pNavEdit.style.display, 'none', '#phaseNav NÃO deve ter display: none no modo edição');
    assert.equal(footerEdit.hidden, false, '.stage-footer DEVE estar visível (hidden=false) no modo edição');
    assert.notEqual(footerEdit.style.display, 'none', '.stage-footer NÃO deve ter display: none no modo edição');
    assert.equal(w.document.body.classList.contains('character-sheet-ready'), false, 'Body NÃO deve ter character-sheet-ready no modo edição');
    assert.equal(w.document.body.classList.contains('is-editing-mode'), true, 'Body deve ter is-editing-mode no modo edição');

    // 4. Modo secundário (ex: Grimório): As duas barras devem ficar ocultas
    w.eval(`(() => {
      state.sheetView = 'grimoire';
      persistNavigationNow();
      renderStage({ navigationOnly: true });
    })()`);

    const pNavGrimoire = w.document.getElementById('phaseNav');
    const footerGrimoire = w.document.querySelector('.stage-footer');
    assert.equal(pNavGrimoire.hidden, true, '#phaseNav deve estar oculto no grimório');
    assert.equal(footerGrimoire.hidden, true, '.stage-footer deve estar oculto no grimório');

    // 5. Retornar à criação/edição: As duas barras devem reaparecer
    w.eval(`(() => {
      state.sheetView = '';
      persistNavigationNow();
      renderStage({ navigationOnly: true });
    })()`);

    const pNavReturned = w.document.getElementById('phaseNav');
    const footerReturned = w.document.querySelector('.stage-footer');
    assert.equal(pNavReturned.hidden, false, '#phaseNav deve reaparecer ao voltar do grimório');
    assert.notEqual(pNavReturned.style.display, 'none', '#phaseNav deve ter display limpo ao voltar do grimório');
    assert.equal(footerReturned.hidden, false, '.stage-footer deve reaparecer ao voltar do grimório');
    assert.notEqual(footerReturned.style.display, 'none', '.stage-footer deve ter display limpo ao voltar do grimório');

    console.log('✔ Testes de visibilidade de #phaseNav e .stage-footer no modo de criação e edição aprovados!');
  } catch (err) {
    console.error('ERRO NO TESTE:', err);
    throw err;
  } finally {
    server.kill();
  }
});
