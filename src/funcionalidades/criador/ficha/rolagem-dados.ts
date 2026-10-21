/**
 * FORJA RUBRA — Módulo de Rolagem de Dados de Perícias e Testes (Tormenta 20)
 * Permite rolar testes de perícia clicando diretamente na ficha digital.
 */

(() => {
  'use strict';

  interface RollResult {
    skillId: string;
    skillName: string;
    attr: string;
    bonus: number;
    d20: number;
    total: number;
    isCriticalSuccess: boolean;
    isCriticalFailure: boolean;
    isTrained: boolean;
    isRestricted: boolean;
  }

  // Efeito sonoro sutil sintetizado via Web Audio API (dispensa arquivos externos)
  function tocarSomDado() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      // 3 pequenos estalos de dado quicando
      [0, 0.05, 0.11].forEach((delay, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320 + idx * 80 + Math.random() * 60, now + delay);
        osc.frequency.exponentialRampToValueAtTime(80, now + delay + 0.04);
        
        gain.gain.setValueAtTime(0.15 - idx * 0.03, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.04);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.05);
      });
    } catch {}
  }

  function rolarDado(lados = 20): number {
    return Math.floor(Math.random() * lados) + 1;
  }

  function criarModalRolagem(): HTMLElement {
    let el = document.getElementById('forjaDiceRollModal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'forjaDiceRollModal';
      el.className = 'modal-backdrop forja-dice-modal-backdrop';
      el.hidden = true;
      document.body.appendChild(el);

      el.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target === el || target.closest('[data-action="close-dice-modal"]')) {
          el.hidden = true;
        }
      });
    }
    return el;
  }

  function exibirResultadoRolagem(result: RollResult) {
    const modal = criarModalRolagem();
    tocarSomDado();

    const signBonus = result.bonus >= 0 ? `+${result.bonus}` : `${result.bonus}`;
    
    let criticoBadge = '';
    let corTotal = 'var(--gold2, #f5c879)';
    if (result.isCriticalSuccess) {
      criticoBadge = '<span class="roll-badge crit-success" style="background:rgba(233,173,89,0.2);border:1px solid #e9ad59;color:#fce09b;padding:3px 8px;border-radius:4px;font-size:0.75rem;font-weight:bold;letter-spacing:0.5px;text-transform:uppercase;">20 Natural! Sucesso Crítico</span>';
      corTotal = '#fcedaa';
    } else if (result.isCriticalFailure) {
      criticoBadge = '<span class="roll-badge crit-failure" style="background:rgba(197,31,44,0.25);border:1px solid #c51f2c;color:#fca5a5;padding:3px 8px;border-radius:4px;font-size:0.75rem;font-weight:bold;letter-spacing:0.5px;text-transform:uppercase;">1 Natural! Falha Crítica</span>';
      corTotal = '#fca5a5';
    }

    let avisoTreinamento = '';
    if (result.isRestricted && !result.isTrained) {
      avisoTreinamento = '<div style="margin-top:6px;padding:6px 10px;background:rgba(197,31,44,0.15);border:1px solid #4a252a;border-radius:6px;color:#fca5a5;font-size:0.75rem;line-height:1.35;"><strong>Atenção:</strong> Esta perícia exige treinamento. Segundo as regras de Tormenta 20, o teste só pode ser realizado com autorização do mestre.</div>';
    }

    modal.innerHTML = `
      <div class="confirm-modal forja-dice-card" role="dialog" aria-labelledby="rollModalTitle" style="max-width: 380px; width: 92%; background: linear-gradient(180deg, #181114, #100b0d); border: 1px solid var(--border, #4a252a); border-radius: 12px; box-shadow: 0 16px 40px rgba(0,0,0,0.8); overflow: hidden;">
        <header style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border,#4a252a);background:#110d0f;">
          <div style="display:flex;align-items:center;gap:8px;">
            <svg class="forja-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold,#e9ad59)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2l8 4.5v9L12 22l-8-6.5v-9L12 2z"></path>
              <path d="M12 22V12"></path>
              <path d="M20 6.5l-8 5.5-8-5.5"></path>
            </svg>
            <h3 id="rollModalTitle" style="margin:0;font-family:'Tormenta',Cinzel,serif;color:var(--gold,#e9ad59);font-size:1.05rem;">Rolagem de Perícia</h3>
          </div>
          <button type="button" class="button" data-action="close-dice-modal" style="min-width:28px;padding:2px 6px;font-size:0.9rem;" title="Fechar">✕</button>
        </header>

        <div style="padding:18px 16px;text-align:center;">
          <div style="font-size:0.85rem;color:var(--muted,#c9b2aa);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">
            ${result.skillName} <strong style="color:var(--cream,#f5eee6);">(${result.attr})</strong>
          </div>

          <div style="display:flex;justify-content:center;align-items:center;gap:12px;margin:14px 0 10px;">
            <!-- Dado d20 -->
            <div style="display:flex;flex-direction:column;align-items:center;">
              <div style="width:58px;height:58px;display:flex;align-items:center;justify-content:center;background:#1b1417;border:2px solid ${result.isCriticalSuccess ? 'var(--gold)' : (result.isCriticalFailure ? 'var(--forja-red,#c51f2c)' : 'var(--border,#4a252a)')};border-radius:10px;font-size:1.65rem;font-weight:900;color:${result.isCriticalSuccess ? '#fcedaa' : (result.isCriticalFailure ? '#f87171' : '#f5eee6')};box-shadow:inset 0 2px 6px rgba(0,0,0,0.6);">
                ${result.d20}
              </div>
              <small style="color:var(--muted,#c9b2aa);font-size:0.7rem;margin-top:4px;">d20</small>
            </div>

            <span style="font-size:1.4rem;color:var(--muted,#c9b2aa);font-weight:bold;">+</span>

            <!-- Modificador -->
            <div style="display:flex;flex-direction:column;align-items:center;">
              <div style="width:58px;height:58px;display:flex;align-items:center;justify-content:center;background:#1b1417;border:1px solid var(--border,#4a252a);border-radius:10px;font-size:1.45rem;font-weight:700;color:var(--cream,#f5eee6);box-shadow:inset 0 2px 6px rgba(0,0,0,0.6);">
                ${signBonus}
              </div>
              <small style="color:var(--muted,#c9b2aa);font-size:0.7rem;margin-top:4px;">Bônus</small>
            </div>

            <span style="font-size:1.4rem;color:var(--muted,#c9b2aa);font-weight:bold;">=</span>

            <!-- Total Final -->
            <div style="display:flex;flex-direction:column;align-items:center;">
              <div style="min-width:68px;height:58px;padding:0 8px;display:flex;align-items:center;justify-content:center;background:rgba(233,173,89,0.08);border:2px solid var(--gold,#e9ad59);border-radius:10px;font-size:1.85rem;font-weight:900;color:${corTotal};box-shadow:0 0 16px rgba(233,173,89,0.2);">
                ${result.total}
              </div>
              <small style="color:var(--gold,#e9ad59);font-weight:bold;font-size:0.7rem;margin-top:4px;">TOTAL</small>
            </div>
          </div>

          ${criticoBadge ? `<div style="margin-top:10px;">${criticoBadge}</div>` : ''}
          ${avisoTreinamento}
        </div>

        <footer style="display:flex;justify-content:space-between;gap:8px;padding:12px 16px;border-top:1px solid var(--border,#4a252a);background:#110d0f;">
          <button type="button" class="button" data-action="close-dice-modal" style="flex:1;">Fechar</button>
          <button type="button" class="button primary" id="rerollDiceBtn" style="flex:1.2;background:var(--forja-red,#c51f2c);border-color:var(--border,#4a252a);">
            Rolar de Novo
          </button>
        </footer>
      </div>
    `;

    modal.hidden = false;

    const rerollBtn = modal.querySelector('#rerollDiceBtn');
    if (rerollBtn) {
      rerollBtn.addEventListener('click', () => {
        executarRolagem(result.skillId, result.skillName, result.attr, result.bonus, result.isTrained, result.isRestricted);
      });
    }
  }

  function executarRolagem(skillId: string, skillName: string, attr: string, bonus: number, isTrained: boolean, isRestricted: boolean) {
    const d20 = rolarDado(20);
    const total = d20 + bonus;
    exibirResultadoRolagem({
      skillId,
      skillName,
      attr,
      bonus,
      d20,
      total,
      isCriticalSuccess: d20 === 20,
      isCriticalFailure: d20 === 1,
      isTrained,
      isRestricted
    });
  }

  // Delegação de cliques em qualquer linha de perícia com data-action="roll-skill"
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const rollTrigger = target.closest('[data-action="roll-skill"]') as HTMLElement;
    if (!rollTrigger) return;

    e.preventDefault();
    const skillId = rollTrigger.dataset.skillId || '';
    const skillName = rollTrigger.dataset.skillName || 'Perícia';
    const attr = rollTrigger.dataset.skillAttr || 'Atributo';
    const bonus = Number(rollTrigger.dataset.skillBonus || 0);
    const isTrained = rollTrigger.dataset.skillTrained === 'true';
    const isRestricted = rollTrigger.dataset.skillRestricted === 'true';

    executarRolagem(skillId, skillName, attr, bonus, isTrained, isRestricted);
  });

  // Expor para chamada direta
  if (typeof window !== 'undefined') {
    (window as any).rolarPericia = executarRolagem;
    (window as any).ForjaDados = Object.freeze({
      rolarDado,
      rolarPericia: executarRolagem
    });
  }
})();
