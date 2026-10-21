const fs = require('fs');

const path = 'src/funcionalidades/criador/inventario/mochila-heroi-moedas-consumo.js';
let content = fs.readFileSync(path, 'utf8');

// 1. TYPE_META
content = content.replace(
  /const TYPE_META = \{[\s\S]*?\};/,
  `const TYPE_META = {
    arma: { label: 'ARMAS', icon: '<span class="forja-icon-host">' + (window.IconesForja ? window.IconesForja.get('sword', 'icon-sm') : '') + '</span>' },
    armadura: { label: 'ARMADURAS', icon: '<span class="forja-icon-host">' + (window.IconesForja ? window.IconesForja.get('shield', 'icon-sm') : '') + '</span>' },
    escudo: { label: 'ESCUDOS', icon: '<span class="forja-icon-host">' + (window.IconesForja ? window.IconesForja.get('shield', 'icon-sm') : '') + '</span>' },
    item_geral: { label: 'ITENS GERAIS', icon: '<span class="forja-icon-host">' + (window.IconesForja ? window.IconesForja.get('backpack', 'icon-sm') : '') + '</span>' },
    acessorio: { label: 'ACESSÓRIOS', icon: '<span class="forja-icon-host">' + (window.IconesForja ? window.IconesForja.get('crown', 'icon-sm') : '') + '</span>' },
    municao: { label: 'MUNIÇÕES', icon: '<span class="forja-icon-host">' + (window.IconesForja ? window.IconesForja.get('bow', 'icon-sm') : '') + '</span>' },
    esoterico: { label: 'ESOTÉRICOS', icon: '<span class="forja-icon-host">' + (window.IconesForja ? window.IconesForja.get('sparkles', 'icon-sm') : '') + '</span>' },
    engenhoca: { label: 'ENGENHOCAS', icon: '<span class="forja-icon-host">' + (window.IconesForja ? window.IconesForja.get('gear', 'icon-sm') : '') + '</span>' }
  };`
);

// 2. Fallback de meta
content = content.replace(
  `icon: isEngenhoca ? '⚙️' : '🎒'`,
  `icon: isEngenhoca ? (window.IconesForja ? window.IconesForja.get('gear', 'icon-sm') : '') : (window.IconesForja ? window.IconesForja.get('backpack', 'icon-sm') : '')`
);

// 3. Emojis em upgrades
content = content.replace(`🔨 <strong>Melhorias`, `<span class="icon-host" style="display:inline-flex;vertical-align:middle;margin-right:3px;">\${window.IconesForja ? window.IconesForja.get('tools', 'icon-xs') : ''}</span> <strong>Melhorias`);
content = content.replace(`✨ <strong>Encantos:`, `<span class="icon-host" style="display:inline-flex;vertical-align:middle;margin-right:3px;">\${window.IconesForja ? window.IconesForja.get('sparkles', 'icon-xs') : ''}</span> <strong>Encantos:`);

// 4. Botões secundários
content = content.replace(`>⚔ Empunhar<`, `>\${window.IconesForja ? window.IconesForja.get('sword', 'icon-xs') : ''} Empunhar<`);
content = content.replace(`>💍 Vestir<`, `>\${window.IconesForja ? window.IconesForja.get('crown', 'icon-xs') : ''} Vestir<`);
content = content.replace(`>⚙️ Desmanchar<`, `>\${window.IconesForja ? window.IconesForja.get('gear', 'icon-xs') : ''} Desmanchar<`);
content = content.replace(`>🔄 Trocar<`, `>\${window.IconesForja ? window.IconesForja.get('sync', 'icon-xs') : ''} Trocar<`);
content = content.replace(`>🛡 Vestir<`, `>\${window.IconesForja ? window.IconesForja.get('shield', 'icon-xs') : ''} Vestir<`);
content = content.replace(`>🛡 Equipar<`, `>\${window.IconesForja ? window.IconesForja.get('shield', 'icon-xs') : ''} Equipar<`);

// 5. Botão Vender da mochila
content = content.replace(
  `bottomSecondaryActions += \`<button type="button" data-backpack-action="sell" data-entry-id="\${esc(expandedSheetItemId)}" style="\${secBtnStyle};font-size:0.65rem;padding:2px 8px;min-height:22px;height:22px;line-height:1">Vender</button>\`;`,
  `bottomSecondaryActions += \`<button type="button" data-backpack-action="sell" data-entry-id="\${esc(expandedSheetItemId)}" style="\${secBtnStyle};font-size:0.65rem;padding:2px 8px;min-height:22px;height:22px;line-height:1">\${window.IconesForja ? window.IconesForja.get('coin', 'icon-xs') : ''} Vender</button>\`;`
);

// 6. Botões de ação rápida 🔨 e ✨
content = content.replace(
  `title="Adicionar melhorias">🔨</button>`,
  `title="Adicionar melhorias">\${window.IconesForja ? window.IconesForja.get('tools', 'icon-sm') : 'M'}</button>`
);
content = content.replace(
  `title="Adicionar encantos mágicos" style="color:#f59e0b;">✨</button>`,
  `title="Adicionar encantos mágicos" style="color:#f59e0b;">\${window.IconesForja ? window.IconesForja.get('sparkles', 'icon-sm') : 'E'}</button>`
);

// 7. Modais de Encantos e Melhorias (substituir títulos e botões)
content = content.replace(`\${isEnchant ? '✨' : '🔨'} \${titleAction}`, `\${titleAction}`);
content = content.replace(/🛒 Comprar no Mercado/g, `Comprar no Mercado`);
content = content.replace(/⚒️ Manufaturar com Ofício/g, `Manufaturar com Ofício`);
content = content.replace(/⚒️ Fabricar com Ofício/g, `Fabricar com Ofício`);
content = content.replace(/✨ \${esc\(encObj\.nome\)\}/g, `\${esc(encObj.nome)}`);
content = content.replace(/✨ \${esc\(enc\.nome\)\}/g, `\${esc(enc.nome)}`);
content = content.replace(/✨ Encantar na Oficina/g, `Encantar na Oficina`);
content = content.replace(/🛒 Comprar Encantos/g, `Comprar Encantos`);
content = content.replace(/🛒 Confirmar Encantos/g, `Confirmar Encantos`);
content = content.replace(/✨ Encantos ·/g, `Encantos ·`);
content = content.replace(/Modo: ⚒️ Manufatura/g, `Modo: Manufatura`);
content = content.replace(/✨ <strong>Regras de Encantamento:<\/strong>/g, `<strong>Regras de Encantamento:</strong>`);
content = content.replace(/⚠️ Saldo insuficiente/g, `Saldo insuficiente`);
content = content.replace(/🔨 Forjar com Ofício/g, `Forjar com Ofício`);
content = content.replace(/🛒 Comprar Melhorias/g, `Comprar Melhorias`);
content = content.replace(/⚠️ Escolha um Material Especial/g, `Escolha um Material Especial`);
content = content.replace(/🔨 Melhorias ·/g, `Melhorias ·`);
content = content.replace(/✨ Material Especial/g, `Material Especial`);
content = content.replace(/⚠️ Selecione um material/g, `Selecione um material`);

fs.writeFileSync(path, content, 'utf8');
console.log('mochila-heroi-moedas-consumo.js limpo!');
