
function purgarEngenhocasFantasmasDaMochila() {
  if (typeof localStorage === 'undefined') return;
  const isGhostContraption = (entry) => {
    if (!entry) return false;
    const name = String(entry.displayName || entry.itemName || entry.itemId || entry.nome || entry.name || '').toLowerCase();
    // Apenas os resíduos fantasmas de depuração com adaga psíquica sem dono são expurgados:
    if (/adaga.*emissora.*ps[íi]quica/i.test(name) || /adaga.*ps[íi]quica/i.test(name) || /emissora.*ps[íi]quica/i.test(name)) return true;
    return false;
  };

  try {
    const rawProfiles = localStorage.getItem('arsenal-arton-character-profiles-v1');
    if (rawProfiles) {
      const parsed = JSON.parse(rawProfiles);
      let changed = false;
      if (Array.isArray(parsed.profiles)) {
        parsed.profiles.forEach(p => {
          if (Array.isArray(p.backpack)) {
            const initialLen = p.backpack.length;
            p.backpack = p.backpack.filter(e => !isGhostContraption(e));
            if (p.backpack.length !== initialLen) changed = true;
          }
        });
      }
      if (changed) {
        localStorage.setItem('arsenal-arton-character-profiles-v1', JSON.stringify(parsed));
      }
    }
  } catch (e) {}

  try {
    const rawMochila = localStorage.getItem('forja-arsenal-mochila-v1');
    if (rawMochila) {
      const parsed = JSON.parse(rawMochila);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter(e => !isGhostContraption(e));
        if (filtered.length !== parsed.length) {
          localStorage.setItem('forja-arsenal-mochila-v1', JSON.stringify(filtered));
        }
      }
    }
  } catch (e) {}

  try {
    const rawHero = localStorage.getItem('forja-heroi-t20-v1');
    if (rawHero) {
      const hero = JSON.parse(rawHero);
      let heroChanged = false;
      ['backpack', 'bag', 'inventory', 'itens'].forEach(key => {
        if (Array.isArray(hero[key])) {
          const initLen = hero[key].length;
          hero[key] = hero[key].filter(e => !isGhostContraption(e));
          if (hero[key].length !== initLen) heroChanged = true;
        }
      });
      if (heroChanged) {
        localStorage.setItem('forja-heroi-t20-v1', JSON.stringify(hero));
      }
    }
  } catch (e) {}
}

purgarEngenhocasFantasmasDaMochila();

const urlParamsEarly = typeof window !== 'undefined' && window.location ? new URLSearchParams(window.location.search) : null;
const isContraptionAttachEarly = Boolean(urlParamsEarly && (
  urlParamsEarly.get('modo') === 'contraption-attach' ||
  urlParamsEarly.get('sessao') === 'contraption-attach' ||
  urlParamsEarly.has('contraption-attach')
));
const isRewardEarly = Boolean(urlParamsEarly && (
  urlParamsEarly.get('modo') === 'recompensa' ||
  urlParamsEarly.get('modo') === 'recompensas' ||
  urlParamsEarly.get('modo') === 'reward' ||
  urlParamsEarly.has('recompensa')
));

function obterFundosIniciaisHeroi() {
  try {
    if (typeof localStorage === 'undefined') return 0;
    const STARTING_FUNDS_TABLE = { 2: 300, 3: 600, 4: 1000, 5: 2000, 6: 3000, 7: 5000, 8: 7000, 9: 10000, 10: 13000, 11: 19000, 12: 27000, 13: 36000, 14: 49000, 15: 66000, 16: 88000, 17: 110000, 18: 150000, 19: 200000, 20: 260000 };
    
    // 1. Saldo publicado da ficha ativa
    let published = null;
    try { published = JSON.parse(localStorage.getItem('forja-saldo-personagem-ativo-v1') || 'null'); } catch(e) {}
    if (published && Number.isFinite(Number(published.funds)) && Number(published.funds) > 0) {
      return Number(published.funds);
    }

    const rawHero = localStorage.getItem('forja-heroi-t20-v1');
    if (rawHero) {
      const hero = JSON.parse(rawHero);

      if (hero?.funds != null && Number(hero.funds) > 0) return Number(hero.funds);
      if (hero?.dinheiro != null && Number(hero.dinheiro) > 0) return Number(hero.dinheiro);

      if (hero?.inventoryMoney) {
        const tibares = Number(hero.inventoryMoney.tibares ?? hero.inventoryMoney.ts ?? 0);
        const to = Number(hero.inventoryMoney.to ?? 0);
        const tc = Number(hero.inventoryMoney.tc ?? 0);
        const totalMoedas = (to * 10) + tibares + (tc * 0.1);
        if (totalMoedas > 0) return totalMoedas;
      }
      if (hero?.moedas) {
        const to = Number(hero.moedas.to ?? 0);
        const ts = Number(hero.moedas.ts ?? 0);
        const tc = Number(hero.moedas.tc ?? 0);
        const totalMoedas = (to * 10) + ts + (tc * 0.1);
        if (totalMoedas > 0) return totalMoedas;
      }

      if (hero?.finances) {
        const lvl = Number(hero.finances.startingLevel) || Number(hero.identity?.initialLevel) || Number(hero.identity?.level) || Number(hero.level) || 1;
        const starting = lvl === 1
          ? (Number(hero.finances.levelOneTibars) || (STARTING_FUNDS_TABLE[lvl] || Number(hero.finances.startingFunds || 0)))
          : (STARTING_FUNDS_TABLE[lvl] || Number(hero.finances.startingFunds || 0));
        const rewards = Number(hero.finances.rewardFunds || 0);
        const spent = Number(hero.finances.spent || 0);
        const ledgerBalance = Math.max(0, starting + rewards - spent);
        if (ledgerBalance > 0) return ledgerBalance;
      }
    }

    const rawProfiles = localStorage.getItem('arsenal-arton-character-profiles-v1');
    if (rawProfiles) {
      const prof = JSON.parse(rawProfiles);
      const active = prof.profiles?.find(p => p.id === 'ficha-ativa') || prof.profiles?.find(p => p.id === prof.activeId) || prof.profiles?.[0];
      if (active?.funds != null && Number(active.funds) > 0) return Number(active.funds);
      if (active?.money != null && Number(active.money) > 0) return Number(active.money);
    }
  } catch (e) {}
  return 0;
}

const fundosIniciaisHeroi = obterFundosIniciaisHeroi();

const isWorkshopEarly = Boolean(urlParamsEarly && (
  urlParamsEarly.has('oficina') ||
  urlParamsEarly.get('view') === 'workshop' ||
  urlParamsEarly.get('modo') === 'workshop'
));

function obterInteligenciaHeroiInicial() {
  try {
    if (typeof localStorage === 'undefined') return 5;
    const rawHero = localStorage.getItem('forja-heroi-t20-v1');
    if (rawHero) {
      const hero = JSON.parse(rawHero);
      if (hero?.finalAttrs?.int != null && Number(hero.finalAttrs.int) > 0) return Number(hero.finalAttrs.int);
      if (hero?.attributes?.int != null && Number(hero.attributes.int) > 0) return Number(hero.attributes.int);
      if (hero?.identity?.baseAttrs?.int != null) {
        let val = Number(hero.identity.baseAttrs.int);
        if (hero.identity.openRaceAllocations?.int) val += Number(hero.identity.openRaceAllocations.int);
        if (Array.isArray(hero.identity.raceAttrs)) val += hero.identity.raceAttrs.filter(a => a === 'int').length;
        if (Array.isArray(hero.progression)) {
          hero.progression.forEach(p => {
            if (p && (p.attribute === 'int' || p.chosenAttr === 'int' || p.powerId === 'aumento_de_atributo_int' || (p.powerId === 'aumento_de_atributo' && p.chosenAttr === 'int'))) {
              val += 1;
            }
          });
        }
        if (val > 0) return val;
      }
    }
    const rawProfiles = localStorage.getItem('arsenal-arton-character-profiles-v1');
    if (rawProfiles) {
      const prof = JSON.parse(rawProfiles);
      const active = prof.profiles?.find(p => p.id === 'ficha-ativa') || prof.profiles?.find(p => p.id === prof.activeId) || prof.profiles?.[0];
      if (active?.finalAttrs?.int != null && Number(active.finalAttrs.int) > 0) return Number(active.finalAttrs.int);
      if (active?.attributes?.int != null && Number(active.attributes.int) > 0) return Number(active.attributes.int);
    }
  } catch (e) {}
  return 5;
}

const intModHeroiInicial = obterInteligenciaHeroiInicial();

let arsenalInitialState = window.__FORJA_CONTEXT__ || (isContraptionAttachEarly ? {
  mode: 'workshop',
  workshopSection: (urlParamsEarly.get('oficina') || 'armeiro').toLowerCase().trim(),
  funds: fundosIniciaisHeroi,
  intMod: intModHeroiInicial,
  contraptionAttach: {
    spellId: urlParamsEarly.get('magia') || '',
    formaUso: (urlParamsEarly.get('forma') || 'empunhada').toLowerCase().trim(),
    forma: (urlParamsEarly.get('forma') || 'empunhada').toLowerCase().trim(),
    custoEngenhoca: 100
  },
  storage: {},
  session: Date.now()
} : (isWorkshopEarly ? {
  mode: 'workshop',
  workshopSection: (urlParamsEarly.get('oficina') || 'armeiro').toLowerCase().trim(),
  funds: fundosIniciaisHeroi,
  intMod: intModHeroiInicial,
  storage: {},
  session: Date.now()
} : (isRewardEarly ? {
  mode: 'reward',
  isRewardMode: true,
  funds: fundosIniciaisHeroi,
  intMod: intModHeroiInicial,
  storage: {},
  session: Date.now()
} : { mode: 'standalone', funds: fundosIniciaisHeroi, intMod: intModHeroiInicial, storage: {}, session: 0 })));
const arsenalStorageValues={...(arsenalInitialState?.storage || {})};
let arsenalTransaction=false;
function postArsenal(type,details={}){if(window.__FORJA_CONTEXT__&&window.parent!==window)window.parent.postMessage({channel:'forja-arsenal-v1',session:arsenalInitialState.session,type,...details},'*')}
const forjaArsenalStorage={
  getItem(key){
    if(window.__FORJA_CONTEXT__)return arsenalStorageValues[key] ?? null;
    if(isContraptionAttachEarly && key==='arsenal-arton-character-profiles-v1'){
      try{
        const hero=JSON.parse(localStorage.getItem('forja-heroi-t20-v1')||'null');
        const profiles=hero?.arsenal?.storage?.[key];
        if(profiles)return profiles;
        if(hero?.identity){
          return JSON.stringify({activeId:'ficha-ativa',profiles:[{
            id:'ficha-ativa',name:hero.identity.characterName||'Personagem ativo',
            strength:Number(hero.attributes?.for)||0,backpack:[]
          }]});
        }
      }catch(e){}
    }
    return localStorage.getItem(key);
  },
  setItem(key,value){
    arsenalStorageValues[key]=String(value);
    if(window.__FORJA_CONTEXT__){
      if(!arsenalTransaction)postArsenal('save',{storage:{...arsenalStorageValues}});
    } else {
      localStorage.setItem(key,value);
    }
  },
  removeItem(key){
    delete arsenalStorageValues[key];
    if(window.__FORJA_CONTEXT__){
      if(!arsenalTransaction)postArsenal('save',{storage:{...arsenalStorageValues}});
    } else {
      localStorage.removeItem(key);
    }
  }
};

function renderStandaloneWorkshopChrome() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.parent !== window) return; // Embutido em iframe já possui controle pelo container pai

  if (window.ForjaTopBar && typeof window.ForjaTopBar.renderTopbar === 'function') {
    window.ForjaTopBar.renderTopbar();
  } else {
    let heroName = 'Yrkoom';
    let clsName = 'Inventor';
    let level = 1;
    let funds = 0;
    try {
      const rawHero = localStorage.getItem('forja-heroi-t20-v1');
      if (rawHero) {
        const hero = JSON.parse(rawHero);
        if (hero?.identity?.characterName) heroName = hero.identity.characterName;
        const clsId = hero?.identity?.classId || 'Aventureiro';
        clsName = clsId.charAt(0).toUpperCase() + clsId.slice(1);
        level = Number(hero?.progression?.level || hero?.identity?.plannedLevel || hero?.identity?.initialLevel || 1);
      }
      funds = obterFundosIniciaisHeroi();
    } catch (e) {}

    const formattedFunds = `T$ ${funds.toLocaleString('pt-BR')}`;

    let topbar = document.getElementById('standaloneWorkshopTopbar') || document.getElementById('forjaUnifiedTopbar');
    if (!topbar) {
      topbar = document.createElement('header');
      topbar.id = 'forjaUnifiedTopbar';
      topbar.className = 'forja-unified-topbar';
      topbar.style.cssText = 'position:sticky;top:0;z-index:9999;display:flex;justify-content:space-between;align-items:center;padding:10px 20px;background:#0d1117;border-bottom:1px solid #1a2230;box-sizing:border-box;width:100%;box-shadow:0 4px 16px rgba(0,0,0,0.4);';
      topbar.innerHTML = `
        <div style="flex:1;display:flex;align-items:center;"></div>
        <div style="display:flex;align-items:center;justify-content:center;position:absolute;left:50%;transform:translateX(-50%);">
          <a href="index.html" class="topbar-unified-brand" title="Voltar ao Menu Principal" style="text-decoration:none;display:inline-flex;align-items:center;">
            <h1 style="margin:0;color:#d4af37;font-family:'Cinzel',serif;font-size:1.18rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;line-height:1;">Forja Rubra</h1>
          </a>
        </div>
        <div style="flex:1;display:flex;align-items:center;justify-content:flex-end;">
          <button type="button" class="forja-drawer-trigger-btn" id="drawerMenuBtn" title="Abrir Menu Lateral" aria-label="Abrir Menu" style="background:transparent;border:none;color:#dc2626;cursor:pointer;padding:6px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </div>
      `;
      document.body.prepend(topbar);

      const dBtn = topbar.querySelector('#drawerMenuBtn');
      if (dBtn) {
        dBtn.onclick = () => {
          if (typeof window.abrirForjaDrawer === 'function') {
            window.abrirForjaDrawer();
          } else {
            const drawer = document.getElementById('forjaDrawer') || document.querySelector('.forja-drawer');
            const backdrop = document.getElementById('forjaDrawerBackdrop');
            if (drawer && backdrop) {
              backdrop.hidden = false;
              drawer.classList.add('is-open');
            } else {
              window.location.href = 'ficha.html';
            }
          }
        };
      }
    }
  }

  // Barra inferior com único botão [Voltar] para oficinas e catálogos em tela cheia
  let footer = document.getElementById('standaloneWorkshopFooter');
  if (!footer && isWorkshopEarly) {
    footer = document.createElement('div');
    footer.id = 'standaloneWorkshopFooter';
    footer.className = 'forja-autohide-footer';
    footer.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9998;display:flex;justify-content:flex-end;align-items:center;gap:12px;padding:10px 24px;background:#0d1117;border-top:1px solid #1a2230;box-sizing:border-box;width:100%;box-shadow:0 -4px 16px rgba(0,0,0,0.6);';
    footer.innerHTML = `
      <a href="ficha.html" class="button" style="background:#991b1b;border:1px solid #b91c1c;color:#ffffff;font-weight:700;padding:8px 24px;border-radius:6px;cursor:pointer;font-size:0.88rem;box-shadow:0 2px 6px rgba(0,0,0,0.3);height:38px;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;">
        Voltar
      </a>
    `;
    document.body.appendChild(footer);
    document.body.style.paddingBottom = '60px';
  }

  if (window.ForjaTopBar && typeof window.ForjaTopBar.aplicarAutohideScroll === 'function') {
    window.ForjaTopBar.aplicarAutohideScroll();
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderStandaloneWorkshopChrome);
  } else {
    renderStandaloneWorkshopChrome();
  }
}

