
const TAVERN_DATA = window.__FORJA_DATA__.TAVERN_DATA;

const TAVERN_CATEGORIES = {
  todos: { id: 'todos', label: 'Todos', icon: '', iconName: 'sparkles', desc: 'Todos os serviços, estadias e comodidades da taverna.' },
  estadia: { id: 'estadia', label: 'Estadias', icon: '', iconName: 'bed', desc: 'Acomodações seguras para descanso e recuperação de PV e PM.' },
  alimentacao: { id: 'alimentacao', label: 'Alimentação', icon: '', iconName: 'utensils', desc: 'Refeições nutritivas e pratos exóticos com bônus de sustentação.' },
  bebida: { id: 'bebida', label: 'Bebidas', icon: '', iconName: 'beer', desc: 'Cervejas, hidroméis, vinhos e elixires festivos de Arton.' },
  transporte: { id: 'transporte', label: 'Transporte', icon: '', iconName: 'horse', desc: 'Conduções terrestres, marítimas e aéreas para suas viagens.' },
  cuidados: { id: 'cuidados', label: 'Curandeiro & Magias', icon: '', iconName: 'sparkles', desc: 'Cuidados médicos e magias encomendadas sob demanda.' },
  especial: { id: 'especial', label: 'Serviços Especiais', icon: '', iconName: 'theater', desc: 'Banhos quentes, cuidados estéticos, apresentações e instrução marcial.' }
};

const CANONICAL_MERCENARIES = [];
const PARTNER_TYPES = {};

function assignTavernCategory(item) {
  const id = item.id || '';
  if (['estabulo_por_dia', 'estadia_comum_por_noite', 'estadia_confortavel_por_noite', 'estadia_luxuosa_por_noite'].includes(id)) return 'estadia';
  if (['conducao_terrestre', 'conducao_maritima', 'conducao_aerea'].includes(id)) return 'transporte';
  if (['curandeiro', 'magia_de_1_circulo', 'magia_de_2_circulo', 'magia_de_3_circulo', 'mensageiro'].includes(id)) return 'cuidados';
  if (['banho_quente', 'bigode_encerado', 'instrucao_marcial', 'maquiagem_profissional', 'opera', 'sarau_informativo'].includes(id)) return 'especial';
  if (['mercenario_iniciante', 'mercenario_veterano', 'capangas_iniciantes', 'capangas_veteranos'].includes(id)) return 'mercenario';
  if (item.categoriaId === 'alimentacao') return 'alimentacao';
  if (item.categoriaId === 'bebida') return 'bebida';
  return 'especial';
}

function getItemUnitLabel(item) {
  const id = item.id || '';
  if (id === 'estabulo_por_dia') return 'Dia(s)';
  if (id.startsWith('estadia_')) return 'Noite(s)';
  if (id.startsWith('conducao_')) return 'Quilômetro(s)';
  if (id.startsWith('mercenario_') || id.startsWith('capangas_')) return 'Cena(s)';
  if (id.startsWith('magia_') || id === 'curandeiro' || id === 'mensageiro') return 'Atendimento(s)';
  if (item.categoriaId === 'alimentacao') return 'Porção(ões)';
  if (item.categoriaId === 'bebida') return 'Dose(s) / Garrafa(s)';
  return 'Unidade(s)';
}

function getItemUnitPeriod(item) {
  const id = item.id || '';
  if (id === 'estabulo_por_dia') return 'por dia';
  if (id.startsWith('estadia_')) return 'por noite';
  if (id.startsWith('conducao_')) return 'por km';
  if (id.startsWith('mercenario_') || id.startsWith('capangas_')) return 'por cena';
  if (id.startsWith('magia_') || id === 'curandeiro' || id === 'mensageiro') return 'por serviço';
  return 'por unidade';
}

const TAVERN_STORAGE_CONTRACTS = 'forja-taverna-contracts-v1';
const TAVERN_STORAGE_WALLET = 'forja-taverna-wallet-v1';

let tavernState = {
  activeView: 'tavern', // 'tavern' | 'mercenaries'
  category: 'todos',
  search: '',
  sort: 'name',
  funds: 100, // em T$
  characterName: '',
  level: 1,
  contracts: [],
  activeItem: null,
  hireQty: 1,
  durationMode: 'cena',
  selectedPartnerId: null,
  customChoiceVal: null,
  trainedSkills: [],
  mercenaryChoices: {},
  tattoosCount: 0
};

const CANONICAL_PARTNER_ITEMS = [];

// Prepared items
const CANONICAL_POTION_SERVICE = {
  id: 'pocoes_magicas_arton',
  nome: 'Poções Mágicas de Arton',
  tavernCategory: 'cuidados',
  unitPeriod: 'frasco',
  unitLabel: 'Frasco',
  preco: { valor: 30 },
  textos: {
    descricao: 'Frascos de poções e óleos mágicos encomendados com boticários locais. Selecione o círculo da magia e escolha o feitiço correspondente no Grimório. O custo integral de mercado em tibares é debitado da sua carteira e o preparado é entregue imediatamente.',
    habilidade: 'Custo por círculo: 1º Círc. T$ 30 (1 PM) · 2º Círc. T$ 270 (3 PM) · 3º Círc. T$ 1.080 (6 PM) · 4º Círc. T$ 3.000 (10 PM) · 5º Círc. T$ 6.750 (15 PM).'
  },
  isPotionService: true
};

const CANONICAL_TATTOO_SERVICE = {
  id: 'servico_tatuagem_mistica',
  nome: 'Tatuagem Mística',
  tavernCategory: 'cuidados',
  unitPeriod: 'tatuagem',
  unitLabel: 'Tatuagem',
  preco: { valor: 1000 },
  textos: {
    descricao: 'Aplicação de arte corporal arcana na pele por mestres tatuadores locais. Cada tatuagem mística concede uma magia de 1º círculo à sua escolha. Tatuagens contam como item vestido, ocupando 0 espaços e com preço 0 no inventário.',
    habilidade: 'Custo progressivo em tibares: 1ª tatuagem T$ 1.000 · 2ª T$ 2.000 · 3ª T$ 3.000 e assim por diante. Ocupa 1 espaço de item vestido, peso e preço zero na mochila.'
  },
  isTattooService: true
};

const tavernItems = [
  CANONICAL_POTION_SERVICE,
  CANONICAL_TATTOO_SERVICE,
  ...(typeof TAVERN_DATA !== 'undefined' ? TAVERN_DATA : []).map(item => ({
    ...item,
    tavernCategory: assignTavernCategory(item),
    unitLabel: getItemUnitLabel(item),
    unitPeriod: getItemUnitPeriod(item)
  }))
];

function loadStorage() {
  if (typeof window !== 'undefined' && window.__INITIAL_TAVERN_STATE__) {
    const init = window.__INITIAL_TAVERN_STATE__;
    if (init.funds !== undefined) tavernState.funds = Number(init.funds) || 0;
    if (init.characterName !== undefined) tavernState.characterName = init.characterName;
    if (init.level !== undefined) tavernState.level = Number(init.level) || 1;
    if (init.tattoosCount !== undefined) tavernState.tattoosCount = Number(init.tattoosCount) || 0;
    if (Array.isArray(init.contracts)) tavernState.contracts = init.contracts;
    return;
  }
  try {
    const saved = localStorage.getItem(TAVERN_STORAGE_CONTRACTS);
    if (saved) tavernState.contracts = JSON.parse(saved);
  } catch(e) {}
  try {
    const savedW = localStorage.getItem(TAVERN_STORAGE_WALLET);
    if (savedW !== null) tavernState.funds = Number(savedW) || 0;
  } catch(e) {}
}

function saveStorage() {
  try {
    localStorage.setItem(TAVERN_STORAGE_CONTRACTS, JSON.stringify(tavernState.contracts));
    localStorage.setItem(TAVERN_STORAGE_WALLET, String(tavernState.funds));
  } catch(e) {}
}

function formatPrice(val) {
  const num = Number(val) || 0;
  if (num < 1) return 'T$ ' + num.toFixed(1).replace('.', ',');
  return 'T$ ' + num.toLocaleString('pt-BR');
}

function syncWalletUI() {
  const el = document.getElementById('walletDisplay');
  if (el) el.textContent = formatPrice(tavernState.funds);
  const countEl = document.getElementById('contractsCount');
  if (countEl) countEl.textContent = String(tavernState.contracts.length);
}

function renderChips() {
  const container = document.getElementById('categoryChips');
  if (!container) return;
  const categories = Object.values(TAVERN_CATEGORIES);
  container.innerHTML = categories.map(cat => {
    const count = cat.id === 'todos' ? tavernItems.length : tavernItems.filter(i => i.tavernCategory === cat.id).length;
    const active = tavernState.category === cat.id ? ' active' : '';
    return '<button class="chip' + active + '" type="button" data-category="' + cat.id + '">' +
      '<span aria-hidden="true">' + cat.icon + '</span> ' + cat.label +
      ' <span class="chip-count">' + count + '</span></button>';
  }).join('');
}

function getFilteredItems() {
  let list = tavernItems;
  if (tavernState.category !== 'todos') {
    list = list.filter(i => i.tavernCategory === tavernState.category);
  }
  if (tavernState.search.trim()) {
    const q = tavernState.search.trim().toLowerCase();
    list = list.filter(i => {
      const name = (i.nome || '').toLowerCase();
      const desc = (i.textos?.descricao || '').toLowerCase();
      const hab = (i.textos?.habilidade || '').toLowerCase();
      const varTxt = (i.textos?.variavel || '').toLowerCase();
      return name.includes(q) || desc.includes(q) || hab.includes(q) || varTxt.includes(q);
    });
  }

  list.sort((a, b) => {
    if (tavernState.sort === 'price-asc') return (a.preco?.valor || 0) - (b.preco?.valor || 0) || a.nome.localeCompare(b.nome, 'pt-BR');
    if (tavernState.sort === 'price-desc') return (b.preco?.valor || 0) - (a.preco?.valor || 0) || a.nome.localeCompare(b.nome, 'pt-BR');
    if (tavernState.sort === 'category') return a.tavernCategory.localeCompare(b.tavernCategory, 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR');
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });

  return list;
}

function renderCards() {
  const grid = document.getElementById('itemsGrid');
  const empty = document.getElementById('emptyState');
  const title = document.getElementById('categoryTitle');
  const desc = document.getElementById('categoryDescription');
  const count = document.getElementById('resultsCount');

  const currentCat = TAVERN_CATEGORIES[tavernState.category] || TAVERN_CATEGORIES.todos;
  if (title) title.textContent = currentCat.icon + ' ' + currentCat.label;
  if (desc) desc.textContent = currentCat.desc;

  const items = getFilteredItems();
  if (count) count.textContent = items.length + (items.length === 1 ? ' opção' : ' opções');

  if (!items.length) {
    if (grid) grid.innerHTML = '';
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;
  if (!grid) return;
  grid.classList.remove('partners-grid-4col');

  grid.innerHTML = items.map(item => {
    const cat = TAVERN_CATEGORIES[item.tavernCategory] || TAVERN_CATEGORIES.especial;
    const benefit = item.textos?.habilidade || item.textos?.variavel || '';
    const descText = item.textos?.descricao || '';

    if (item.isPotionService) {
      const headerLineHtml = '<div class="card-header-line">' +
        '<span class="card-category-badge">' + cat.icon + ' ' + cat.label + '</span>' +
        '<div class="card-price-tag">' +
          '<span class="card-price-value">A partir de T$ 30</span>' +
          '<span class="card-price-period">frasco</span>' +
        '</div>' +
      '</div>';

      return '<article class="tavern-card" data-item-id="' + item.id + '">' +
        '<div class="card-top">' +
          headerLineHtml +
          '<h3 class="card-title">' + escapeHtml(item.nome) + '</h3>' +
        '</div>' +
        '<div class="card-body-scroll">' +
          (descText ? '<p>' + escapeHtml(descText) + '</p>' : '') +
          (benefit ? '<div class="card-benefit-box"><strong>Regra / Custo:</strong> ' + escapeHtml(benefit) + '</div>' : '') +
          '<div class="tavern-potion-field">' +
            '<label class="tavern-potion-label" for="tavernPotionCircleSelect">Círculo da magia:</label>' +
            '<select id="tavernPotionCircleSelect" class="tavern-potion-select">' +
              '<option value="1">1º Círculo · T$ 30 (1 PM)</option>' +
              '<option value="2">2º Círculo · T$ 270 (3 PM)</option>' +
              '<option value="3">3º Círculo · T$ 1.080 (6 PM)</option>' +
              '<option value="4">4º Círculo · T$ 3.000 (10 PM)</option>' +
              '<option value="5">5º Círculo · T$ 6.750 (15 PM)</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
        '<div class="card-actions">' +
          '<button class="btn btn-primary btn-block" type="button" id="btnTavernChoosePotionSpell">Escolher no Grimório</button>' +
        '</div>' +
      '</article>';
    }

    if (item.isTattooService) {
      const count = Number(tavernState.tattoosCount || 0);
      const tattooPrice = (count + 1) * 1000;
      const priceFormatted = formatPrice(tattooPrice);
      const tattooOrd = count > 0 ? (count + 1) + 'ª tatuagem' : '1ª tatuagem';
      const headerLineHtml = '<div class="card-header-line">' +
        '<span class="card-category-badge">' + cat.icon + ' ' + cat.label + '</span>' +
        '<div class="card-price-tag">' +
          '<span class="card-price-value">' + priceFormatted + '</span>' +
          '<span class="card-price-period">' + tattooOrd + '</span>' +
        '</div>' +
      '</div>';

      return '<article class="tavern-card" data-item-id="' + item.id + '">' +
        '<div class="card-top">' +
          headerLineHtml +
          '<h3 class="card-title">' + escapeHtml(item.nome) + '</h3>' +
        '</div>' +
        '<div class="card-body-scroll">' +
          (descText ? '<p>' + escapeHtml(descText) + '</p>' : '') +
          (benefit ? '<div class="card-benefit-box"><strong>Regra / Custo:</strong> ' + escapeHtml(benefit) + '</div>' : '') +
        '</div>' +
        '<div class="card-actions">' +
          '<button class="btn btn-primary btn-block" type="button" id="btnTavernChooseTattooSpell" data-price="' + tattooPrice + '">Escolher Magia de 1º Círculo</button>' +
        '</div>' +
      '</article>';
    }

    const priceFormatted = formatPrice(item.preco?.valor || 0);
    const periodLabel = item.unitPeriod;
    const actionBtn = '<button class="btn btn-primary" type="button" data-action="open-hire" data-item-id="' + item.id + '">' +
      (item.tavernCategory === 'estadia' || item.tavernCategory === 'transporte' || item.tavernCategory === 'cuidados' ? 'Contratar' : 'Comprar') +
    '</button>';

    const headerLineHtml = '<div class="card-header-line">' +
      '<span class="card-category-badge">' + cat.icon + ' ' + cat.label + '</span>' +
      '<div class="card-price-tag">' +
        '<span class="card-price-value">' + priceFormatted + '</span>' +
        '<span class="card-price-period">' + periodLabel + '</span>' +
      '</div>' +
    '</div>';

    return '<article class="tavern-card" data-item-id="' + item.id + '">' +
      '<div class="card-top">' +
        headerLineHtml +
        '<h3 class="card-title">' + escapeHtml(item.nome) + '</h3>' +
      '</div>' +
      '<div class="card-body-scroll">' +
        (descText ? '<p>' + escapeHtml(descText) + '</p>' : '') +
        (benefit ? '<div class="card-benefit-box"><strong>Regra / Efeito:</strong> ' + escapeHtml(benefit) + '</div>' : '') +
      '</div>' +
      '<div class="card-actions">' +
        actionBtn +
      '</div>' +
    '</article>';
  }).join('');
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('visible'), 2800);
}

function hasWarTraining() {
  const skills = Array.isArray(tavernState.trainedSkills) ? tavernState.trainedSkills : [];
  return skills.some(s => {
    const norm = String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return norm === 'guerra' || norm.includes('guerra');
  });
}

function heroiTemPoderComerciante() {
  try {
    const rawHero = typeof localStorage !== 'undefined' ? localStorage.getItem('forja-heroi-t20-v1') : null;
    let hero = rawHero ? JSON.parse(rawHero) : null;
    if (!hero && typeof localStorage !== 'undefined') {
      try {
        const rawProfiles = localStorage.getItem('arsenal-arton-character-profiles-v1');
        if (rawProfiles) {
          const parsed = JSON.parse(rawProfiles);
          hero = parsed.profiles?.find((p: any) => p.id === 'ficha-ativa') || parsed.profiles?.find((p: any) => p.id === parsed.activeId) || parsed.profiles?.[0];
        }
      } catch {}
    }
    const list = [
      ...(Array.isArray(hero?.powers) ? hero.powers : []),
      ...(Array.isArray(hero?.progression) ? hero.progression : []),
      ...(Array.isArray(hero?.classPowers) ? hero.classPowers : [])
    ];
    return list.some((p: any) => {
      const id = String(p?.powerId || p?.id || p || '').toLowerCase();
      const nome = String(p?.powerName || p?.nome || p?.name || '').toLowerCase();
      return id.includes('comerciante') || nome.includes('comerciante');
    });
  } catch {
    return false;
  }
}

function switchView(view) {
  tavernState.activeView = view;
  const tavernArea = document.getElementById('tavernViewArea');
  const mercArea = document.getElementById('mercenariesViewArea');
  const mercNavBtn = document.getElementById('mercenariesNavBtn');
  const tavernNavBtn = document.getElementById('tavernNavBtn');

  if (view === 'mercenaries') {
    if (tavernArea) tavernArea.style.display = 'none';
    if (mercArea) mercArea.style.display = 'block';
    if (mercNavBtn) mercNavBtn.style.display = 'none';
    if (tavernNavBtn) tavernNavBtn.style.display = 'inline-flex';
    renderMercenariesGrid();
  } else {
    if (tavernArea) tavernArea.style.display = 'block';
    if (mercArea) mercArea.style.display = 'none';
    if (mercNavBtn) mercNavBtn.style.display = 'inline-flex';
    if (tavernNavBtn) tavernNavBtn.style.display = 'none';
    renderChips();
    renderCards();
  }
}