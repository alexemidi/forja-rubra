
const cards = Array.from(document.querySelectorAll('.card'));
let filterTipo   = 'todos';
let filterCirc   = 0;
let filterEscola = 'todas';
let filterSearch = '';
let filterSelectedSchools = false;
let filterLearned = false;
let definingSchools = false;
let selectedBooks = new Set();
const LEARNED_STORAGE_KEY = 'grimorio-learned-spells-v1';
const SELECTED_SCHOOLS_STORAGE_KEY = 'grimorio-selected-schools-v1';
const filtersBar = document.getElementById('filtersBar');
const magiasView = document.getElementById('magiasView');
const condicoesView = document.getElementById('condicoesView');
const viewTabs = Array.from(document.querySelectorAll('.view-tab'));
const BOOK_LABELS = {
  basico: 'Livro Básico',
  'herois-de-arton': 'Heróis de Arton',
  'ameacas-de-arton': 'Ameaças de Arton',
  'deuses-de-arton': 'Deuses de Arton',
  dragao_brasil: 'Dragão Brasil'
};
const BOOK_ORDER = ['basico', 'herois-de-arton', 'ameacas-de-arton', 'deuses-de-arton', 'dragao_brasil'];

const loadLearnedSpells = () => {
  try {
    const raw = localStorage.getItem(LEARNED_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter(Boolean));
  } catch {
    return new Set();
  }
};

let learnedSpells = loadLearnedSpells();

const loadSelectedSchools = () => {
  try {
    const raw = localStorage.getItem(SELECTED_SCHOOLS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter(Boolean).slice(0, 3));
  } catch {
    return new Set();
  }
};

let selectedSchools = loadSelectedSchools();

const getCardBooks = (card) => {
  const raw = card.dataset.livros || card.dataset.livro || 'basico';
  return raw.split(/[\s,;|]+/).map((book) => book.trim()).filter(Boolean);
};

const syncBookFiltersUI = () => {
  document.querySelectorAll('.book-filter-chip').forEach((chip) => {
    chip.classList.toggle('active', selectedBooks.has(chip.dataset.livro));
  });
};

const setupBookFilters = () => {
  const bookFilters = document.getElementById('bookFilters');
  if (!bookFilters) return;

  const books = Array.from(new Set(cards.flatMap(getCardBooks))).sort((a, b) => {
    const aIndex = BOOK_ORDER.indexOf(a);
    const bIndex = BOOK_ORDER.indexOf(b);
    if (aIndex !== -1 || bIndex !== -1) {
      return (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) - (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex);
    }
    return (BOOK_LABELS[a] || a).localeCompare(BOOK_LABELS[b] || b, 'pt-BR');
  });
  selectedBooks = new Set(books);
  bookFilters.innerHTML = '';

  books.forEach((book) => {
    const button = document.createElement('button');
    button.className = 'filter-chip book-filter-chip active';
    button.type = 'button';
    button.dataset.livro = book;
    button.textContent = BOOK_LABELS[book] || book.replace(/_/g, ' ');
    button.addEventListener('click', () => {
      if (selectedBooks.has(book)) {
        selectedBooks.delete(book);
      } else {
        selectedBooks.add(book);
      }
      syncBookFiltersUI();
      apply();
      checkOverflow();
    });
    bookFilters.appendChild(button);
  });
};

const syncBookBadges = () => {
  cards.forEach((card) => {
    const badges = card.querySelector('.card-badges');
    if (!badges || badges.querySelector('.badge-livro')) return;

    getCardBooks(card).forEach((book) => {
      const badge = document.createElement('span');
      badge.className = 'badge badge-livro';
      badge.textContent = BOOK_LABELS[book] || book.replace(/_/g, ' ');
      badges.appendChild(badge);
    });
  });
};

function setActiveView(view) {
  const showCondicoes = view === 'condicoes';
  if (view === 'magias') filterLearned = false;
  document.body.dataset.activeView = view;
  viewTabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.view === view);
  });
  const searchInput = document.getElementById('searchInput');
  const countLabel = document.getElementById('countLabel');
  if (searchInput) searchInput.style.display = showCondicoes ? 'none' : '';
  if (countLabel) countLabel.style.display = showCondicoes ? 'none' : '';
  document.querySelectorAll('.filter-row').forEach(row => {
    row.style.display = showCondicoes ? 'none' : '';
  });
  if (magiasView) magiasView.style.display = showCondicoes ? 'none' : '';
  if (condicoesView) condicoesView.classList.toggle('active', showCondicoes);
  if (!showCondicoes) {
    syncLearnedFilterUI();
    apply();
    checkOverflow();
  }
}

const persistLearnedSpells = () => {
  localStorage.setItem(LEARNED_STORAGE_KEY, JSON.stringify(Array.from(learnedSpells)));
};

const persistSelectedSchools = () => {
  localStorage.setItem(SELECTED_SCHOOLS_STORAGE_KEY, JSON.stringify(Array.from(selectedSchools)));
};

const syncSelectedSchoolsUI = () => {
  document.querySelectorAll('.filter-chip[data-escola]').forEach((chip) => {
    const escola = chip.dataset.escola;
    const isKnown = selectedSchools.has(escola);
    const isCurrentFilter = !definingSchools && !filterSelectedSchools && filterEscola === escola;
    const isAllCurrent = !definingSchools && !filterSelectedSchools && escola === 'todas' && filterEscola === 'todas';
    const isKnownFilter = !definingSchools && filterSelectedSchools && escola !== 'todas' && (
      (filterEscola === 'todas' && isKnown) || filterEscola === escola
    );

    chip.classList.toggle('active', definingSchools ? isKnown : isCurrentFilter || isAllCurrent || isKnownFilter);
    chip.classList.toggle(
      'is-disabled',
      escola !== 'todas' && ((definingSchools && !isKnown && selectedSchools.size >= 3) || (filterSelectedSchools && !isKnown))
    );
  });

  const count = document.getElementById('schoolPickCount');
  if (count) count.textContent = `${selectedSchools.size}/3`;

  const defineBtn = document.getElementById('defineSchoolsBtn');
  if (defineBtn) {
    const canConfirm = definingSchools && selectedSchools.size === 3;
    defineBtn.textContent = canConfirm ? 'CONFIRMAR' : selectedSchools.size === 3 ? 'Redefinir escolas' : 'Definir escolas';
    defineBtn.classList.toggle('active', definingSchools);
    defineBtn.classList.toggle('confirm', canConfirm);
  }

  const allBtn = document.getElementById('allSchoolsBtn');
  if (allBtn) {
    allBtn.classList.toggle('active', !filterSelectedSchools && !definingSchools);
  }
};

const syncLearnedFilterUI = () => {
  const button = document.getElementById('learnedFilterBtn');
  if (button) {
    button.classList.toggle('active', filterLearned);
    button.setAttribute('aria-pressed', String(filterLearned));
    button.title = filterLearned ? 'Mostrar todas as magias' : 'Mostrar apenas magias aprendidas';
  }
  const filterCount = document.getElementById('learnedFilterCount');
  if (filterCount) filterCount.textContent = String(learnedSpells.size);
};

const syncLearnedUI = () => {
  cards.forEach((card) => {
    const key = card.dataset.spellKey;
    const isLearned = Boolean(key && learnedSpells.has(key));
    card.classList.toggle('learned', isLearned);
    const btn = card.querySelector('.learn-btn');
    if (btn) {
      btn.classList.toggle('active', isLearned);
      btn.textContent = isLearned ? 'Remover' : 'Aprender';
      btn.title = isLearned ? 'Remover das magias aprendidas' : 'Aprender magia';
    }
  });
  const learnedCount = document.getElementById('learnedCount');
  if (learnedCount) learnedCount.textContent = String(learnedSpells.size);
  syncLearnedFilterUI();
};

function escMatch(cardEsc, filterEsc) {
  if (filterEsc === 'todas') return true;
  return cardEsc === filterEsc;
}

function apply() {
  let count = 0;
  cards.forEach(c => {
    const tipo   = c.dataset.tipo;
    const circ   = parseInt(c.dataset.circulo);
    const escola = c.dataset.escola;
    const livros = getCardBooks(c);
    const name   = c.dataset.name || '';
    const normName = c.dataset.nameClean || (c.dataset.nameClean = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''));
    const key    = c.dataset.spellKey;

    const okTipo   = filterTipo === 'todos' || tipo === filterTipo || tipo === 'universal';
    const okLivro  = livros.some((livro) => selectedBooks.has(livro));
    const okCirc   = filterCirc === 0 || circ === filterCirc;
    const okEscola = escMatch(escola, filterEscola);
    const okSelectedSchools = !filterSelectedSchools || selectedSchools.has(escola);
    const okLearned = !filterLearned || Boolean(key && learnedSpells.has(key));
    const okSearch = !filterSearch || normName.includes(filterSearch);

    const show = okTipo && okLivro && okCirc && okEscola && okSelectedSchools && okLearned && okSearch;
    c.style.display = show ? '' : 'none';
    if (show) count++;
  });
  document.getElementById('countLabel').textContent = count + ' magia' + (count !== 1 ? 's' : '');
  document.getElementById('emptyState').style.display = count === 0 ? '' : 'none';
}

// Tipo
document.querySelectorAll('.tipo-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tipo-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filterTipo = btn.dataset.tipo;
    apply();
    checkOverflow();
  });
});

// Círculo
document.querySelectorAll('.circ-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.circ-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filterCirc = parseInt(btn.dataset.circ);
    apply();
    checkOverflow();
  });
});

// Escola
document.querySelectorAll('.filter-chip[data-escola]').forEach(chip => {
  chip.addEventListener('click', () => {
    const escola = chip.dataset.escola;

    if (definingSchools) {
      if (escola === 'todas') return;
      if (selectedSchools.has(escola)) {
        selectedSchools.delete(escola);
      } else if (selectedSchools.size < 3) {
        selectedSchools.add(escola);
      }
      persistSelectedSchools();
      syncSelectedSchoolsUI();
      return;
    }

    if (filterSelectedSchools && escola !== 'todas' && !selectedSchools.has(escola)) return;

    filterEscola = escola;
    syncSelectedSchoolsUI();
    apply();
    checkOverflow();
  });
});

document.getElementById('defineSchoolsBtn')?.addEventListener('click', () => {
  if (definingSchools && selectedSchools.size === 3) {
    definingSchools = false;
    filterSelectedSchools = true;
    filterEscola = 'todas';
    persistSelectedSchools();
    syncSelectedSchoolsUI();
    apply();
    checkOverflow();
    return;
  }

  definingSchools = true;
  filterSelectedSchools = false;
  filterEscola = 'todas';
  selectedSchools.clear();
  persistSelectedSchools();
  syncSelectedSchoolsUI();
  apply();
  checkOverflow();
});

document.getElementById('allSchoolsBtn')?.addEventListener('click', () => {
  definingSchools = false;
  filterSelectedSchools = false;
  filterEscola = 'todas';
  syncSelectedSchoolsUI();
  apply();
  checkOverflow();
});

document.getElementById('learnedFilterBtn')?.addEventListener('click', () => {
  if (document.body.dataset.activeView === 'condicoes') {
    setActiveView('magias');
  }
  filterLearned = !filterLearned;
  if (filterLearned) {
    filterEscola = 'todas';
    filterTipo = 'todos';
    filterCirc = 0;
    filterSearch = '';
    filterSelectedSchools = false;
    const sInput = document.getElementById('searchInput');
    if (sInput) sInput.value = '';
    document.querySelectorAll('.tipo-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tipo === 'todos'));
    document.querySelectorAll('.circ-btn').forEach(btn => btn.classList.toggle('active', Number(btn.dataset.circ) === 0));
    document.querySelectorAll('.filter-chip[data-escola]').forEach(btn => btn.classList.toggle('active', btn.dataset.escola === 'todas'));
  }
  syncLearnedFilterUI();
  apply();
  checkOverflow();
});

function checkOverflow() {
  cards.forEach(c => {
    if (c.style.display === 'none') return;
    
    const btn = c.querySelector('.expand-btn');
    const isExpanded = c.classList.contains('expanded');
    
    // Reset para medir
    if (!isExpanded) {
        c.style.maxHeight = 'none';
        const fullHeight = c.scrollHeight;
        c.style.maxHeight = '';
        
        if (fullHeight > 450) {
          c.classList.add('is-truncated');
          btn.style.display = 'block';
          btn.textContent = 'Ler Mais';
        } else {
          c.classList.remove('is-truncated');
          btn.style.display = 'none';
        }
    } else if (btn) {
      btn.textContent = 'Recolher';
    }
  });
}

// Toggle ExpansÃ£o
document.addEventListener('click', e => {
  if (e.target.classList.contains('learn-btn')) {
    const card = e.target.closest('.card');
    if (!card) return;
    const key = card.dataset.spellKey;
    if (!key) return;
    if (learnedSpells.has(key)) {
      learnedSpells.delete(key);
    } else {
      learnedSpells.add(key);
    }
    persistLearnedSpells();
    syncLearnedUI();
    apply();
    checkOverflow();
    return;
  }

  if (e.target.classList.contains('expand-btn')) {
    const card = e.target.closest('.card');
    const isExpanded = card.classList.toggle('expanded');
    e.target.textContent = isExpanded ? 'Recolher' : 'Ler Mais';
    if (!isExpanded) {
        window.scrollTo({ top: card.offsetTop - 100, behavior: 'smooth' });
    }
  }
});

// Ajustar busca para considerar acentos
document.getElementById('searchInput').addEventListener('input', e => {
  filterSearch = e.target.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  apply();
  checkOverflow();
});

viewTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    if (tab.dataset.view === 'condicoes') {
      const abrir = (window as any).ForjaCondicoes?.abrirModal;
      if (typeof abrir === 'function') {
        abrir();
      } else {
        setTimeout(() => {
          (window as any).ForjaCondicoes?.abrirModal?.();
        }, 150);
      }
      return;
    }
    setActiveView(tab.dataset.view);
  });
});

setupBookFilters();
syncBookBadges();
syncLearnedUI();
syncSelectedSchoolsUI();
setActiveView('magias');
setTimeout(checkOverflow, 100);

// LÃ³gica de Tooltip
const tooltip = document.getElementById('tooltip');
const ttTitle = tooltip.querySelector('.tooltip-title');
const ttBody  = tooltip.querySelector('.tooltip-body');
let pinnedLink = null;

function decodeHtml(html) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

function showTooltip(target, isPinned = false) {
  ttTitle.textContent = target.dataset.title;
  // Usamos innerHTML para permitir o aninhamento vindo do atributo escapado
  ttBody.innerHTML = decodeHtml(target.dataset.desc);
  tooltip.classList.add('visible');
  if (isPinned) {
    tooltip.classList.add('pinned');
    pinnedLink = target;
  }
}

function hideTooltip() {
  if (!pinnedLink) {
    tooltip.classList.remove('visible');
    tooltip.classList.remove('pinned');
  }
}

document.addEventListener('mouseover', e => {
  if (pinnedLink) return;
  const target = e.target.closest('.cond-link');
  if (target) {
    showTooltip(target);
    updateTooltipPos(e);
  }
});

document.addEventListener('mousemove', e => {
  if (tooltip.classList.contains('visible') && !pinnedLink) {
    updateTooltipPos(e);
  }
});

document.addEventListener('mouseout', e => {
  if (pinnedLink) return;
  if (e.target.closest('.cond-link')) {
    hideTooltip();
  }
});

document.addEventListener('click', e => {
  const target = e.target.closest('.cond-link');
  
  if (target) {
    e.preventDefault();
    if (pinnedLink === target) {
      pinnedLink = null;
      hideTooltip();
    } else {
      pinnedLink = null; // Unpin anterior
      showTooltip(target, true);
      updateTooltipPos(e);
    }
  } else if (!e.target.closest('#tooltip')) {
    pinnedLink = null;
    hideTooltip();
  }
});

function updateTooltipPos(e) {
  const x = e.clientX + 15;
  const y = e.clientY + 15;
  
  // ForÃ§ar visibilidade para medir
  const wasHidden = !tooltip.classList.contains('visible');
  if (wasHidden) tooltip.style.display = 'block';
  
  const ttRect = tooltip.getBoundingClientRect();
  
  if (wasHidden) tooltip.style.display = '';

  let finalX = x;
  let finalY = y;
  
  if (x + ttRect.width > window.innerWidth) {
    finalX = e.clientX - ttRect.width - 15;
  }
  if (y + ttRect.height > window.innerHeight) {
    finalY = e.clientY - ttRect.height - 15;
  }
  
  // Garantir que nÃ£o saia pelo topo/esquerda tambÃ©m
  finalX = Math.max(10, finalX);
  finalY = Math.max(10, finalY);

  tooltip.style.left = finalX + 'px';
  tooltip.style.top  = finalY + 'px';
}

// Quando aberto diretamente, o Grimório funciona como catálogo independente.
// O modo embutido continua recebendo seus filtros e escolhas do criador de ficha.
if (window.self === window.top) {
  const standaloneBooks = new Set(cards.flatMap(getCardBooks));
  selectedBooks = standaloneBooks;
  filterTipo = 'todos';
  filterCirc = 0;
  filterEscola = 'todas';
  filterSearch = '';
  filterSelectedSchools = false;
  filterLearned = false;
  document.getElementById('searchInput').value = '';
  setActiveView('magias');
  syncBookFiltersUI();

  const urlParams = new URLSearchParams(window.location.search);
  const circParam = urlParams.get('circulo');
  if (circParam) {
    const targetCirc = parseInt(circParam);
    if (targetCirc) {
      filterCirc = targetCirc;
      document.querySelectorAll('.circ-btn').forEach(btn => {
        btn.classList.toggle('active', Number(btn.dataset.circ) === targetCirc);
      });
    }
  }
  const modoParam = urlParams.get('modo');
  if (modoParam === 'engenhoca') {
    const notice = document.createElement('div');
    notice.style.cssText = 'background:rgba(217,119,6,0.15);border:1px solid #d97706;color:#fef08a;padding:8px 16px;border-radius:8px;margin:8px auto;text-align:center;font-weight:600;font-size:0.9rem;max-width:800px;font-family:Cinzel,serif;';
    notice.textContent = 'Oficina do Engenhoqueiro · Engenhocas Mundanas Simulando Magias Arcanas ou Divinas';
    document.querySelector('.filters-bar')?.prepend(notice);
  } else if (modoParam === 'pergaminho') {
    const notice = document.createElement('div');
    notice.style.cssText = 'background:rgba(124,58,237,0.15);border:1px solid #7c3aed;color:#e9d5ff;padding:8px 16px;border-radius:8px;margin:8px auto;text-align:center;font-weight:600;font-size:0.9rem;max-width:800px;font-family:Cinzel,serif;';
    notice.textContent = 'Gabinete do Escriba · Pergaminhos de Magias de Arton';
    document.querySelector('.filters-bar')?.prepend(notice);
  }

  apply();
  const loader = document.getElementById('forja-loader');
  if (loader) loader.hidden = true;

  const backToTopBtn = document.getElementById('grimorioBackToTopBtn');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 280) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }, { passive: true });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}
