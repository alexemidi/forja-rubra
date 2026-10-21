// Módulo do Poder de Nobre: Agente de Elite
// "Você recebe um agente especial, um parceiro veterano que fornece os benefícios de um parceiro a
// sua escolha (Tormenta20, p. 260) ou um poder de outra classe, cujos pré-requisitos você cumpra (para efeitos
// de nível na classe desse poder, considere seu nível de nobre −4). No início de cada aventura, você pode trocar
// seu agente. Pré-requisitos: Título, 11º nível de nobre."

function _agenteSlug(s) {
  if (typeof slug === 'function') return slug(s);
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}
function _agenteEsc(s) {
  if (typeof esc === 'function') return esc(s);
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const CANONICAL_AGENTE_PARTNERS = [
  {
    id: 'ajudante',
    nome: 'Ajudante',
    role: 'Especialista em Perícias',
    desc: 'Um bardo, nobre ou sábio que ajuda com conselhos rápidos e perícia técnica.',
    benefit: 'Você recebe +2 em três perícias definidas pelo parceiro (exceto Luta ou Pontaria).'
  },
  {
    id: 'assassino',
    nome: 'Assassino',
    role: 'Furtividade & Ataque Letal',
    desc: 'Um ladino ou caçador furtivo especialista em pontos fracos e emboscadas.',
    benefit: 'Ataque Furtivo (+1d6) e concede bônus por flanquear (+2 no ataque corpo a corpo) contra um inimigo por rodada.'
  },
  {
    id: 'atirador',
    nome: 'Atirador',
    role: 'Apoio de Longo Alcance',
    desc: 'Um arqueiro ou besteiro que dispara contra alvos prioritários.',
    benefit: 'Você recebe +2 em testes de ataque à distância e +1d6 no dano à distância.'
  },
  {
    id: 'combatente',
    nome: 'Combatente',
    role: 'Linha de Frente',
    desc: 'Um guerreiro experiente dedicado a engajar e quebrar a linha inimiga.',
    benefit: 'Você recebe +2 em testes de ataque corpo a corpo e +1d8 no dano corpo a corpo.'
  },
  {
    id: 'curandeiro',
    nome: 'Curandeiro / Médico',
    role: 'Cuidados Médicos & Socorro',
    desc: 'Um boticário ou eremita que cuida dos ferimentos do grupo após combates.',
    benefit: 'Cura 2d8+2 PV (gasto de 2 PM) e estabiliza automaticamente aliados caídos.'
  },
  {
    id: 'destruidor',
    nome: 'Destruidor',
    role: 'Dano Massivo & Rompimento',
    desc: 'Um guerreiro com armas pesadas especialista em devastar alvos e estruturas.',
    benefit: 'Aumenta em um passo o dano de suas armas e você causa +1d8 contra estruturas ou objetos.'
  },
  {
    id: 'fortao',
    nome: 'Fortão',
    role: 'Bloqueio & Força Bruta',
    desc: 'Um aliado corpulento que segura adversários e carrega os suprimentos da jornada.',
    benefit: 'Você recebe +4 em manobras de combate e +10 espaços de carga suportada.'
  },
  {
    id: 'guardiao',
    nome: 'Guardião',
    role: 'Defesa & Proteção',
    desc: 'Um escudeiro ou guarda veterano que intercepta golpes direcionados a você.',
    benefit: 'Você recebe +3 na Defesa e pode interceptar um ataque por rodada concedendo cobertura leve.'
  },
  {
    id: 'magivocador',
    nome: 'Magivocador',
    role: 'Poder Arcano & Feitiços',
    desc: 'Um canalizador que amplifica a potência dos seus feitiços e rituais.',
    benefit: 'O dano de suas magias aumenta em +1 dado do mesmo tipo e sua CD de resistência aumenta em +1.'
  },
  {
    id: 'perseguidor',
    nome: 'Perseguidor',
    role: 'Rastreamento & Caça',
    desc: 'Um batedor ou rastreador perito em terrenos hostis e pistas sutis.',
    benefit: 'Você recebe +2 em Percepção e Sobrevivência, e inimigos rastreados sofrem –2 na Defesa contra você.'
  },
  {
    id: 'vigilante',
    nome: 'Vigilante',
    role: 'Alerta & Prontidão',
    desc: 'Um vigia atento treinado para evitar emboscadas e ataques traiçoeiros.',
    benefit: 'Você recebe +2 em Iniciativa e Percepção, e não pode ser surpreendido em combate.'
  }
];

const CANONICAL_AGENTE_MOUNTS = [
  {
    id: 'cavalo',
    nome: 'Cavalo',
    role: 'Montaria Terrestre Ágil',
    tamanhos: ['Grande'],
    desc: 'A montaria mais comum do Reinado. Amplo fôlego e velocidade para longas viagens por Arton.',
    benefit: 'Seu deslocamento muda para 15m, ação de movimento extra por turno e +2 em testes de ataque corpo a corpo.'
  },
  {
    id: 'ponei',
    nome: 'Pônei',
    role: 'Montaria para Pequenos',
    tamanhos: ['Médio'],
    desc: 'Montaria robusta e dócil ideal para heróis de tamanho Pequeno, como anões, goblins e lefou.',
    benefit: 'Seu deslocamento muda para 15m, ação de movimento extra por turno e +2 em testes de ataque corpo a corpo.'
  },
  {
    id: 'cao_de_caca',
    nome: 'Cão de Caça',
    role: 'Faro & Derrubar',
    tamanhos: ['Pequeno', 'Médio'],
    desc: 'Cães de porte adequado adestrados para rastrear odores, farejar emboscadas e derrubar presas em combate.',
    benefit: 'Seu deslocamento muda para 12m, faro, ação de movimento extra por turno e +2 na Defesa.'
  },
  {
    id: 'trobo',
    nome: 'Trobo',
    role: 'Resistência & Carga',
    tamanhos: ['Grande'],
    desc: 'Aves corpulentas e plácidas dos campos do Reinado, conhecidas por suportar grande fadiga e cargas pesadas.',
    benefit: 'Seu deslocamento muda para 12m, ação de movimento extra e o bônus em testes de resistência passa para +2.'
  },
  {
    id: 'cavalo_de_guerra',
    nome: 'Cavalo de Guerra',
    role: 'Carga Pesada & Blindagem',
    tamanhos: ['Grande'],
    desc: 'Corcel blindado e adestrado nos rigores do campo de batalha, mantendo a serenidade sob saraivadas de flechas.',
    benefit: 'Seu deslocamento muda para 15m, ação de movimento extra por turno e +2 em testes de ataque corpo a corpo.'
  },
  {
    id: 'lobo_das_cavernas',
    nome: 'Lobo / Lobo-das-cavernas',
    role: 'Fera Predadora & Dano',
    tamanhos: ['Médio', 'Grande'],
    desc: 'Feras predadoras primitivas usadas como montaria por bárbaros, goblinoides e aventureiros de ermos selvagens.',
    benefit: 'Seu deslocamento muda para 15m, ação de movimento extra e +1d8 em uma rolagem de dano corpo a corpo por rodada.'
  },
  {
    id: 'grifo',
    nome: 'Grifo',
    role: 'Montaria Voadora Soberana',
    tamanhos: ['Grande'],
    desc: 'Fera lendária com corpo de leão e asas de águia.',
    benefit: 'Montaria de elite: muda seu deslocamento para voo 18m e concede +1d8 em uma rolagem de dano corpo a corpo por rodada.'
  },
  {
    id: 'gorlogg',
    nome: 'Gorlogg',
    role: 'Besta de Guerra Brutal',
    tamanhos: ['Grande'],
    desc: 'Réptil colossal e couraçado das savanas de Galrasia, empregado como montaria de impacto demolidor.',
    benefit: 'Seu deslocamento muda para 12m e o bônus em dano corpo a corpo passa para +1d10 por rodada.'
  }
];

function hasAgenteDeElite() {
  if (typeof state === 'undefined' || !state) return false;
  const inProgression = (state.progression || []).some(row => row.powerId === 'nobre_agente_de_elite' || row.powerId === 'agente_de_elite');
  const inGeneral = (state.powers?.general || []).includes('nobre_agente_de_elite');
  const inSelected = (state.powers?.selected || []).includes('nobre_agente_de_elite');
  return inProgression || inGeneral || inSelected || Boolean(state.agenteElite);
}

function nobreClassLevel() {
  if (typeof state === 'undefined' || !state) return 0;
  const fromProg = (state.progression || []).filter(r => r.classId === 'nobre').length;
  if (fromProg > 0) return fromProg;
  return state.identity?.classId === 'nobre' ? 1 : 0;
}

function agenteEliteEffectiveClassLevel() {
  const lvl = nobreClassLevel();
  return Math.max(1, lvl - 4);
}

function getAgenteEliteChoice() {
  if (typeof state === 'undefined' || !state) return null;
  return state.agenteElite || null;
}

function agenteElitePowerEligibility(power, effectiveLevel) {
  if (!power) return { ok: false, reasons: ['Poder não encontrado.'] };
  if ((power.classeIds || []).includes('nobre')) {
    return { ok: false, reasons: ['O Agente de Elite só pode conceder poderes de outra classe (não de Nobre).'] };
  }

  const requirements = typeof parsePowerRequirements === 'function' ? parsePowerRequirements(power) : { level: 0, attrs: [], skills: [] };
  const reasons = [];
  const attrs = typeof finalAttrs === 'function' ? finalAttrs() : {};
  const trained = new Set(typeof allTrainedSkills === 'function' ? allTrainedSkills() : []);
  const attrLabel = typeof ATTR_LABEL !== 'undefined' ? (id => ATTR_LABEL[id] || id) : (id => id);
  const skillName = typeof skillDisplayName === 'function' ? skillDisplayName : (id => id);

  // Nível de classe requerido vs nível efetivo (nível de nobre − 4)
  if (requirements.level && effectiveLevel < requirements.level) {
    reasons.push(`Requer nível ${requirements.level} na classe (nível considerado de Nobre −4: ${effectiveLevel}).`);
  }

  // Atributos mínimos
  for (const [attr, val] of requirements.attrs || []) {
    const curVal = Number(attrs[attr] || 0);
    if (curVal < val) {
      reasons.push(`Requer ${attrLabel(attr)} ${val} (atual: ${curVal}).`);
    }
  }

  // Perícias treinadas
  for (const skill of requirements.skills || []) {
    if (!trained.has(skill)) {
      reasons.push(`Requer treino em ${skillName(skill)}.`);
    }
  }

  // Poderes prévios requeridos
  const ownedNames = new Set((typeof ownedPowerNames === 'function' ? [...ownedPowerNames()] : []).map(_agenteSlug));
  const text = _agenteSlug(power.preRequisitosTexto || '');
  const classPowers = (typeof DATA !== 'undefined' && DATA.classPowers) || [];
  for (const candidate of classPowers) {
    if (candidate.id !== power.id && (candidate.classeIds || []).some(cid => (power.classeIds || []).includes(cid))) {
      const candSlug = _agenteSlug(candidate.nome || '');
      if (candSlug && text.includes(candSlug) && !ownedNames.has(candSlug)) {
        reasons.push(`Requer ${candidate.nome}.`);
      }
    }
  }

  return { ok: reasons.length === 0, reasons };
}

function syncAgenteElitePartnerInState(choice) {
  state.partners = Array.isArray(state.partners) ? state.partners : [];
  // Remove parceiros anteriores vindos do Agente de Elite
  state.partners = state.partners.filter(p => !p.isAgenteElite && !p.fromAgenteElite);

  if (choice && choice.mode === 'partner') {
    state.partners.push({
      name: choice.name,
      tipo: choice.id,
      type: choice.id,
      partnerType: choice.isMount ? 'Montaria' : (choice.role || 'Veterano'),
      mountSize: choice.mountSize || 'Médio',
      tier: 'veterano',
      grau: 'veterano',
      isAgenteElite: true,
      special: false,
      countsTowardsLimit: true,
      ignoraLimite: false,
      benefit: choice.benefit
    });
  }
}

// Decora selectedCharacterFeatures para incluir o poder recebido por Agente de Elite
if (typeof selectedCharacterFeatures === 'function') {
  const baseSelectedFeaturesAgenteElite = selectedCharacterFeatures;
  selectedCharacterFeatures = function() {
    const features = baseSelectedFeaturesAgenteElite();
    if (!hasAgenteDeElite()) return features;

    const choice = getAgenteEliteChoice();
    if (choice && choice.mode === 'power' && choice.powerId) {
      const power = (typeof DATA !== 'undefined' && DATA.classPowers) ? DATA.classPowers.find(p => p.id === choice.powerId) : null;
      if (power) {
        if (!features.some(f => f.id === ('agente_elite:' + power.id) || f.id === power.id)) {
          features.push({
            ...power,
            id: 'agente_elite:' + power.id,
            nome: 'Agente de Elite: ' + power.nome,
            source: 'class-power',
            agenteElitePower: true,
            descricao: power.descricao || ''
          });
        }
      }
    }
    return features;
  };
}

// UI do Modal de Agente de Elite
let agenteEliteModalState = {
  tab: 'partner', // 'partner' | 'power'
  partnerSubtab: 'all', // 'all' | 'humanoid' | 'mount'
  classFilter: 'all',
  statusFilter: 'available', // 'all' | 'available' | 'locked'
  search: '',
  selectedKey: ''
};

function renderAgenteEliteModalHtml() {
  const nobreLvl = nobreClassLevel();
  const effLvl = agenteEliteEffectiveClassLevel();
  const currentChoice = getAgenteEliteChoice();

  return `
    <div id="agenteEliteModal" class="forja-modal-backdrop" style="display:none;z-index:9999;">
      <div class="forja-rest-card" style="max-width:860px;width:94%;background:#0e141f;border:1px solid #263345;color:var(--text);border-radius:8px;">
        <div class="rest-card-header" style="border-bottom:1px solid #263345;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div class="rest-card-title" style="font-weight:700;color:var(--gold2);font-size:0.95rem;font-family:'Cinzel',serif;">
              AGENTE DE ELITE · ESCOLHER AGENTE ESPECIAL
            </div>
            <small style="color:var(--muted);font-size:0.72rem;">
              Nível de Nobre: ${nobreLvl} · Nível efetivo para poderes de outra classe (Nobre −4): <strong style="color:#60a5fa">${effLvl}</strong>
            </small>
          </div>
          <button type="button" class="rest-close-x" data-action="close-agente-elite-modal" style="background:transparent;border:0;color:var(--muted);font-size:1.2rem;cursor:pointer;">×</button>
        </div>

        <div class="rest-card-body" style="padding:16px 18px;">
          <!-- Seletor de Modo Principal -->
          <div style="display:flex;gap:10px;margin-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:12px;">
            <button type="button" class="button ${agenteEliteModalState.tab === 'partner' ? 'primary' : ''}" data-action="agente-elite-switch-tab" data-tab="partner" style="font-size:0.82rem;padding:6px 14px;">
              Parceiro ou Montaria Veterana
            </button>
            <button type="button" class="button ${agenteEliteModalState.tab === 'power' ? 'primary' : ''}" data-action="agente-elite-switch-tab" data-tab="power" style="font-size:0.82rem;padding:6px 14px;">
              Poder de Outra Classe
            </button>
          </div>

          <!-- Barra de Busca -->
          <div style="margin-bottom:12px;">
            <input type="text" class="input search" id="agenteEliteSearchInput" placeholder="Pesquisar por nome ou benefício…" value="${_agenteEsc(agenteEliteModalState.search)}" style="width:100%;">
          </div>

          <div id="agenteEliteTabContent">
            <!-- Conteúdo dinâmico injetado por updateAgenteEliteModalUI() -->
          </div>
        </div>

        <div class="rest-card-footer" style="border-top:1px solid #263345;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;">
          <div id="agenteEliteSelectionSummary" style="font-size:0.78rem;color:var(--muted);">
            <!-- Resumo da seleção -->
          </div>
          <div style="display:flex;gap:10px;">
            <button type="button" class="button text-button" data-action="close-agente-elite-modal">Cancelar</button>
            <button type="button" class="button primary" id="confirmAgenteEliteBtn" disabled>Confirmar Escolha</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function updateAgenteEliteModalUI() {
  const modal = document.getElementById('agenteEliteModal');
  if (!modal) return;

  const content = modal.querySelector('#agenteEliteTabContent');
  const summary = modal.querySelector('#agenteEliteSelectionSummary');
  const confirmBtn = modal.querySelector('#confirmAgenteEliteBtn');
  if (!content) return;

  const q = agenteEliteModalState.search.trim().toLowerCase();
  const current = getAgenteEliteChoice();

  if (agenteEliteModalState.tab === 'partner') {
    // Modo Parceiro / Montaria
    const sub = agenteEliteModalState.partnerSubtab;
    let partnersList = sub === 'mount' ? [] : CANONICAL_AGENTE_PARTNERS.map(p => ({ ...p, isMount: false }));
    let mountsList = sub === 'humanoid' ? [] : CANONICAL_AGENTE_MOUNTS.map(m => ({ ...m, isMount: true }));
    let combined = [...partnersList, ...mountsList];

    if (q) {
      combined = combined.filter(item =>
        (item.nome || '').toLowerCase().includes(q) ||
        (item.role || '').toLowerCase().includes(q) ||
        (item.benefit || '').toLowerCase().includes(q)
      );
    }

    const subtabHtml = `
      <div style="display:flex;gap:6px;margin-bottom:12px;">
        <button type="button" class="filter-chip ${sub === 'all' ? 'active' : ''}" data-action="agente-partner-subtab" data-sub="all">Todos</button>
        <button type="button" class="filter-chip ${sub === 'humanoid' ? 'active' : ''}" data-action="agente-partner-subtab" data-sub="humanoid">Parceiros Humanoides</button>
        <button type="button" class="filter-chip ${sub === 'mount' ? 'active' : ''}" data-action="agente-partner-subtab" data-sub="mount">Montarias</button>
      </div>
    `;

    const cardsHtml = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(240px, 1fr));gap:12px;max-height:360px;overflow-y:auto;padding-right:4px;">
        ${combined.map(item => {
          const isSelected = agenteEliteModalState.selectedKey === ('partner:' + item.id);
          const isCurrent = current?.mode === 'partner' && current?.id === item.id;
          return `
            <div class="guild-card ${isSelected ? 'active' : ''}" data-action="agente-select-partner" data-partner-id="${item.id}" data-is-mount="${item.isMount ? 'true' : 'false'}" style="cursor:pointer;border-color:${isSelected ? 'var(--gold2)' : (isCurrent ? '#38bdf8' : 'var(--border)')};background:${isSelected ? 'rgba(217,168,78,0.08)' : '#111824'};padding:12px;border-radius:6px;border-width:1px;border-style:solid;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                <span class="card-badge badge-veterano">Veterano</span>
                <span style="font-size:0.65rem;color:var(--muted)">${item.isMount ? 'Montaria' : 'Parceiro'}</span>
              </div>
              <strong style="color:var(--gold2);font-size:0.88rem;display:block;margin-bottom:2px;">${_agenteEsc(item.nome)}</strong>
              <small style="color:#94a3b8;font-size:0.72rem;display:block;margin-bottom:8px;">${_agenteEsc(item.role)}</small>
              <div class="card-benefit-box" style="font-size:0.72rem;margin-top:6px;line-height:1.4;">
                <strong>Efeito Veterano:</strong> ${_agenteEsc(item.benefit)}
              </div>
              ${isCurrent ? '<span style="display:inline-block;margin-top:6px;font-size:0.65rem;color:#38bdf8;font-weight:700;">(Agente Atual)</span>' : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    content.innerHTML = subtabHtml + cardsHtml;

  } else {
    // Modo Poder de Outra Classe
    const effLvl = agenteEliteEffectiveClassLevel();
    const classPowers = (typeof DATA !== 'undefined' && DATA.classPowers) ? DATA.classPowers : [];
    const nonNoblePowers = classPowers.filter(p => !(p.classeIds || []).includes('nobre'));
    const classes = (typeof DATA !== 'undefined' && DATA.classes) ? DATA.classes.filter(c => c.id !== 'nobre') : [];

    const evaluatedPowers = nonNoblePowers.map(p => {
      const eligibility = agenteElitePowerEligibility(p, effLvl);
      return { ...p, eligibility };
    });

    let filtered = evaluatedPowers;
    if (agenteEliteModalState.classFilter !== 'all') {
      filtered = filtered.filter(p => (p.classeIds || []).includes(agenteEliteModalState.classFilter));
    }
    if (agenteEliteModalState.statusFilter === 'available') {
      filtered = filtered.filter(p => p.eligibility.ok);
    } else if (agenteEliteModalState.statusFilter === 'locked') {
      filtered = filtered.filter(p => !p.eligibility.ok);
    }
    if (q) {
      filtered = filtered.filter(p => (p.nome || '').toLowerCase().includes(q) || (p.descricao || '').toLowerCase().includes(q));
    }

    const classChipsHtml = `
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
        <button type="button" class="filter-chip ${agenteEliteModalState.classFilter === 'all' ? 'active' : ''}" data-action="agente-class-filter" data-class="all">Todas as classes</button>
        ${classes.map(c => `
          <button type="button" class="filter-chip ${agenteEliteModalState.classFilter === c.id ? 'active' : ''}" data-action="agente-class-filter" data-class="${c.id}">${_agenteEsc(c.nome)}</button>
        `).join('')}
      </div>
      <div style="display:flex;gap:6px;margin-bottom:12px;">
        <button type="button" class="filter-chip ${agenteEliteModalState.statusFilter === 'available' ? 'active' : ''}" data-action="agente-status-filter" data-status="available">Disponíveis (${evaluatedPowers.filter(p => p.eligibility.ok).length})</button>
        <button type="button" class="filter-chip ${agenteEliteModalState.statusFilter === 'all' ? 'active' : ''}" data-action="agente-status-filter" data-status="all">Todos os poderes (${evaluatedPowers.length})</button>
        <button type="button" class="filter-chip ${agenteEliteModalState.statusFilter === 'locked' ? 'active' : ''}" data-action="agente-status-filter" data-status="locked">Requisitos pendentes</button>
      </div>
    `;

    const selectedPower = evaluatedPowers.find(p => ('power:' + p.id) === agenteEliteModalState.selectedKey) || filtered[0];

    const splitLayoutHtml = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;max-height:360px;overflow-y:auto;">
        <div style="overflow-y:auto;max-height:340px;display:flex;flex-direction:column;gap:6px;padding-right:4px;">
          ${filtered.length === 0 ? '<p style="color:var(--muted);font-size:0.8rem;padding:12px;">Nenhum poder encontrado com esses filtros.</p>' : ''}
          ${filtered.map(p => {
            const isSel = agenteEliteModalState.selectedKey === ('power:' + p.id);
            const isCur = current?.mode === 'power' && current?.id === p.id;
            const clsName = classes.find(c => (p.classeIds || []).includes(c.id))?.nome || p.classeIds[0];
            return `
              <div class="power-row" data-action="agente-select-power" data-power-id="${p.id}" style="cursor:pointer;padding:8px 10px;border-radius:6px;border:1px solid ${isSel ? 'var(--gold2)' : (isCur ? '#38bdf8' : 'var(--border)')};background:${isSel ? 'rgba(217,168,78,0.1)' : '#111824'};display:flex;align-items:center;justify-content:space-between;">
                <div>
                  <strong style="color:${p.eligibility.ok ? 'var(--text)' : '#94a3b8'};font-size:0.82rem;display:block;">${_agenteEsc(p.nome)}</strong>
                  <small style="color:var(--muted);font-size:0.68rem;">${_agenteEsc(clsName)}</small>
                </div>
                <span class="tag ${p.eligibility.ok ? 'green' : 'red'}" style="font-size:0.62rem;">${p.eligibility.ok ? 'Apto' : 'Pendente'}</span>
              </div>
            `;
          }).join('')}
        </div>

        <div style="background:#111824;border:1px solid #263345;border-radius:6px;padding:12px;overflow-y:auto;max-height:340px;">
          ${selectedPower ? `
            <div style="border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:8px;margin-bottom:8px;">
              <h4 style="margin:0;color:var(--gold2);font-size:0.95rem;font-family:'Cinzel',serif;">${_agenteEsc(selectedPower.nome)}</h4>
              <small style="color:#94a3b8;font-size:0.72rem;">Classe: ${_agenteEsc(classes.find(c => (selectedPower.classeIds || []).includes(c.id))?.nome || '')}</small>
            </div>
            ${selectedPower.preRequisitosTexto ? `
              <div style="margin-bottom:10px;padding:8px;background:rgba(0,0,0,0.25);border-radius:4px;font-size:0.72rem;">
                <strong style="color:#f59e0b">Pré-requisitos:</strong> ${_agenteEsc(selectedPower.preRequisitosTexto)}
                ${!selectedPower.eligibility.ok ? `
                  <ul style="margin:6px 0 0 16px;color:#f87171;padding:0;">
                    ${selectedPower.eligibility.reasons.map(r => `<li>${_agenteEsc(r)}</li>`).join('')}
                  </ul>
                ` : '<div style="color:#4ade80;margin-top:4px;">Todos os pré-requisitos cumpridos!</div>'}
              </div>
            ` : '<div style="color:#4ade80;font-size:0.72rem;margin-bottom:8px;">Sem pré-requisitos adicionais.</div>'}
            <p style="font-size:0.75rem;line-height:1.5;color:#e2e8f0;white-space:pre-line;">${_agenteEsc(selectedPower.descricao)}</p>
          ` : '<p style="color:var(--muted);font-size:0.8rem;">Selecione um poder ao lado para ver os detalhes.</p>'}
        </div>
      </div>
    `;

    content.innerHTML = classChipsHtml + splitLayoutHtml;
  }

  // Atualiza rodapé e botão de confirmação
  const key = agenteEliteModalState.selectedKey;
  if (!key) {
    summary.innerHTML = current ? `Agente atual: <strong>${_agenteEsc(current.name || current.nome)}</strong>` : 'Nenhum agente selecionado.';
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Confirmar Escolha';
  } else if (key.startsWith('partner:')) {
    const pId = key.replace('partner:', '');
    const p = CANONICAL_AGENTE_PARTNERS.find(item => item.id === pId) || CANONICAL_AGENTE_MOUNTS.find(item => item.id === pId);
    summary.innerHTML = p ? `Selecionado: <strong>${_agenteEsc(p.nome)}</strong> (Veterano)` : '';
    confirmBtn.disabled = !p;
    confirmBtn.textContent = p ? `Confirmar: ${p.nome}` : 'Confirmar Escolha';
  } else if (key.startsWith('power:')) {
    const powId = key.replace('power:', '');
    const pow = (typeof DATA !== 'undefined' && DATA.classPowers) ? DATA.classPowers.find(item => item.id === powId) : null;
    const effLvl = agenteEliteEffectiveClassLevel();
    const elig = pow ? agenteElitePowerEligibility(pow, effLvl) : { ok: false };
    summary.innerHTML = pow ? `Selecionado: <strong>${_agenteEsc(pow.nome)}</strong> ${elig.ok ? '<span style="color:#4ade80">(Apto)</span>' : '<span style="color:#f87171">(Requisitos pendentes)</span>'}` : '';
    confirmBtn.disabled = !pow || !elig.ok;
    confirmBtn.textContent = pow ? `Confirmar: ${pow.nome}` : 'Confirmar Escolha';
  }
}

function openAgenteEliteSwapModal() {
  let modal = document.getElementById('agenteEliteModal');
  if (!modal) {
    document.body.insertAdjacentHTML('beforeend', renderAgenteEliteModalHtml());
    modal = document.getElementById('agenteEliteModal');
  }
  const cur = getAgenteEliteChoice();
  if (cur) {
    agenteEliteModalState.tab = cur.mode === 'power' ? 'power' : 'partner';
    agenteEliteModalState.selectedKey = cur.mode === 'power' ? ('power:' + cur.id) : ('partner:' + cur.id);
  } else {
    agenteEliteModalState.tab = 'partner';
    agenteEliteModalState.selectedKey = '';
  }
  agenteEliteModalState.search = '';
  updateAgenteEliteModalUI();
  modal.style.display = 'flex';
}

function closeAgenteEliteSwapModal() {
  const modal = document.getElementById('agenteEliteModal');
  if (modal) modal.style.display = 'none';
}

// Event Listeners globais do Agente de Elite
if (typeof document !== 'undefined') {
  document.addEventListener('click', event => {
    const openBtn = event.target.closest?.('[data-action="open-agente-elite-swap"]');
    if (openBtn) {
      event.preventDefault();
      openAgenteEliteSwapModal();
      return;
    }

    const closeBtn = event.target.closest?.('[data-action="close-agente-elite-modal"]');
    if (closeBtn) {
      event.preventDefault();
      closeAgenteEliteSwapModal();
      return;
    }

    const tabBtn = event.target.closest?.('[data-action="agente-elite-switch-tab"]');
    if (tabBtn) {
      event.preventDefault();
      agenteEliteModalState.tab = tabBtn.dataset.tab;
      agenteEliteModalState.selectedKey = '';
      updateAgenteEliteModalUI();
      return;
    }

    const subtabBtn = event.target.closest?.('[data-action="agente-partner-subtab"]');
    if (subtabBtn) {
      event.preventDefault();
      agenteEliteModalState.partnerSubtab = subtabBtn.dataset.sub;
      updateAgenteEliteModalUI();
      return;
    }

    const classFilterBtn = event.target.closest?.('[data-action="agente-class-filter"]');
    if (classFilterBtn) {
      event.preventDefault();
      agenteEliteModalState.classFilter = classFilterBtn.dataset.class;
      updateAgenteEliteModalUI();
      return;
    }

    const statusFilterBtn = event.target.closest?.('[data-action="agente-status-filter"]');
    if (statusFilterBtn) {
      event.preventDefault();
      agenteEliteModalState.statusFilter = statusFilterBtn.dataset.status;
      updateAgenteEliteModalUI();
      return;
    }

    const selPartnerBtn = event.target.closest?.('[data-action="agente-select-partner"]');
    if (selPartnerBtn) {
      event.preventDefault();
      agenteEliteModalState.selectedKey = 'partner:' + selPartnerBtn.dataset.partnerId;
      updateAgenteEliteModalUI();
      return;
    }

    const selPowerBtn = event.target.closest?.('[data-action="agente-select-power"]');
    if (selPowerBtn) {
      event.preventDefault();
      agenteEliteModalState.selectedKey = 'power:' + selPowerBtn.dataset.powerId;
      updateAgenteEliteModalUI();
      return;
    }

    const confirmBtn = event.target.closest?.('#confirmAgenteEliteBtn');
    if (confirmBtn && !confirmBtn.disabled) {
      event.preventDefault();
      const key = agenteEliteModalState.selectedKey;
      if (!key) return;

      if (key.startsWith('partner:')) {
        const pId = key.replace('partner:', '');
        const p = CANONICAL_AGENTE_PARTNERS.find(item => item.id === pId);
        const m = CANONICAL_AGENTE_MOUNTS.find(item => item.id === pId);
        const chosen = p || m;
        if (!chosen) return;

        const choice = {
          mode: 'partner',
          id: chosen.id,
          name: chosen.nome,
          role: chosen.role,
          isMount: Boolean(m),
          tier: 'veterano',
          benefit: chosen.benefit
        };

        state.agenteElite = choice;
        syncAgenteElitePartnerInState(choice);
        closeAgenteEliteSwapModal();
        persistNow();
        if (typeof saveFinishedCharacter === 'function') saveFinishedCharacter();
        if (typeof renderStage === 'function') renderStage();
        const msg = `Agente de Elite definido: ${chosen.nome} (Parceiro Veterano)!`;
        if (typeof toast === 'function') toast(msg, 'success');
        else if (typeof showToast === 'function') showToast(msg);

      } else if (key.startsWith('power:')) {
        const powId = key.replace('power:', '');
        const pow = (typeof DATA !== 'undefined' && DATA.classPowers) ? DATA.classPowers.find(item => item.id === powId) : null;
        if (!pow) return;

        const effLvl = agenteEliteEffectiveClassLevel();
        const elig = agenteElitePowerEligibility(pow, effLvl);
        if (!elig.ok) return;

        const classes = (typeof DATA !== 'undefined' && DATA.classes) ? DATA.classes : [];
        const clsName = classes.find(c => (pow.classeIds || []).includes(c.id))?.nome || pow.classeIds[0];

        const choice = {
          mode: 'power',
          id: pow.id,
          powerId: pow.id,
          name: pow.nome,
          classId: pow.classeIds[0],
          className: clsName,
          descricao: pow.descricao
        };

        state.agenteElite = choice;
        syncAgenteElitePartnerInState(choice);
        closeAgenteEliteSwapModal();
        persistNow();
        if (typeof saveFinishedCharacter === 'function') saveFinishedCharacter();
        if (typeof renderStage === 'function') renderStage();
        const msg = `Agente de Elite definido: ${pow.nome} (${clsName})!`;
        if (typeof toast === 'function') toast(msg, 'success');
        else if (typeof showToast === 'function') showToast(msg);
      }
    }
  });

  document.addEventListener('input', event => {
    const searchInput = event.target.closest?.('#agenteEliteSearchInput');
    if (searchInput) {
      agenteEliteModalState.search = searchInput.value;
      updateAgenteEliteModalUI();
    }
  });
}

// Ao carregar a ficha, se houver parceiro em state.agenteElite, mantém state.partners sincronizado
if (typeof window !== 'undefined') {
  window.addEventListener('forja-ready', () => {
    if (hasAgenteDeElite() && state.agenteElite?.mode === 'partner') {
      syncAgenteElitePartnerInState(state.agenteElite);
    }
  });

  window.openAgenteEliteSwapModal = openAgenteEliteSwapModal;
  window.closeAgenteEliteSwapModal = closeAgenteEliteSwapModal;
  window.getAgenteEliteChoice = getAgenteEliteChoice;
  window.hasAgenteDeElite = hasAgenteDeElite;
  window.agenteEliteEffectiveClassLevel = agenteEliteEffectiveClassLevel;
  window.agenteElitePowerEligibility = agenteElitePowerEligibility;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CANONICAL_AGENTE_PARTNERS,
    CANONICAL_AGENTE_MOUNTS,
    hasAgenteDeElite,
    nobreClassLevel,
    agenteEliteEffectiveClassLevel,
    getAgenteEliteChoice,
    agenteElitePowerEligibility,
    syncAgenteElitePartnerInState,
    renderAgenteEliteModalHtml,
    openAgenteEliteSwapModal,
    closeAgenteEliteSwapModal
  };
}
