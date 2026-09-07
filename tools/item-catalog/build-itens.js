const fs = require('fs');
const path = require('path');

const workspace = path.resolve(__dirname, '..', '..');
const inputPath = path.join(workspace, 'backup-jsons', 'itens.json');
const improvementsPath = path.join(workspace, 'backup-jsons', 'melhorias.json');
const enchantmentsPath = path.join(workspace, 'backup-jsons', 'encantamentos.json');
const weaponEnchantmentsPath = path.join(workspace, 'backup-jsons', 'encantamentos_armas.json');
const outputPath = process.argv[2]
  ? path.resolve(workspace, process.argv[2])
  : path.join(workspace, 'Arsenal de Arton.html');
const catalog = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const improvementsCatalog = JSON.parse(fs.readFileSync(improvementsPath, 'utf8'));
const enchantmentsCatalog = JSON.parse(fs.readFileSync(enchantmentsPath, 'utf8'));
const weaponEnchantmentsCatalog = JSON.parse(fs.readFileSync(weaponEnchantmentsPath, 'utf8'));

if (!Array.isArray(catalog.itens)) {
  throw new Error('O arquivo itens.json não contém uma lista válida em "itens".');
}

const embeddedItems = JSON.stringify(catalog.itens)
  .replace(/</g, '\\u003c')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029');

const embeddedImprovements = JSON.stringify({
  melhorias: improvementsCatalog.melhorias || [],
  materiaisEspeciais: improvementsCatalog.materiaisEspeciais || [],
  custosMateriaisBasicos: improvementsCatalog.custosMateriaisBasicos || []
})
  .replace(/</g, '\\u003c')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029');

const embeddedEnchantments = JSON.stringify(Object.assign({}, enchantmentsCatalog, {
  encantamentos: (enchantmentsCatalog.encantamentos || []).concat(weaponEnchantmentsCatalog.encantamentos || [])
}))
  .replace(/</g, '\\u003c')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029');

const template = String.raw`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="Catálogo interativo de armas, armaduras, escudos, munições e equipamentos de Tormenta 20.">
<title>Arsenal de Arton — Catálogo de Itens</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600;700&display=swap');

  :root {
    --bg: #0b0d12;
    --surface: #141821;
    --surface-2: #1a202c;
    --surface-3: #202837;
    --border: #30394b;
    --border-bright: #46536b;
    --gold: #d9a84e;
    --gold-soft: #d9a84e22;
    --steel: #91a6c3;
    --steel-soft: #91a6c31e;
    --green: #45c58b;
    --green-soft: #45c58b20;
    --red: #df6b6b;
    --text: #ecedf2;
    --text-muted: #a2a9b8;
    --text-dim: #70798b;
    --radius: 12px;
    --radius-sm: 8px;
  }

  *, *::before, *::after { box-sizing: border-box; }
  * { margin: 0; }
  html { color-scheme: dark; }
  body {
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', sans-serif;
    font-size: 14px;
  }
  button, input, select { font: inherit; }
  button { color: inherit; }

  .site-header {
    position: relative;
    overflow: hidden;
    padding: 30px 32px 26px;
    border-bottom: 1px solid var(--border-bright);
    background: linear-gradient(135deg, #0d1118 0%, #241b13 48%, #101722 100%);
  }
  .site-header::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(ellipse at 22% 0%, #d9a84e22 0%, transparent 56%),
                radial-gradient(ellipse at 85% 100%, #91a6c318 0%, transparent 58%);
  }
  .header-inner { position: relative; max-width: 1440px; margin: 0 auto; }
  .eyebrow {
    margin-bottom: 7px;
    color: var(--gold);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  h1 {
    font-family: 'Cinzel', serif;
    font-size: clamp(1.9rem, 3vw, 2.7rem);
    line-height: 1.1;
    letter-spacing: 1.6px;
    background: linear-gradient(125deg, #f3d38c 0%, #d9a84e 45%, #aabbd2 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .header-subtitle {
    max-width: 760px;
    margin-top: 8px;
    color: var(--text-muted);
    line-height: 1.55;
  }
  .books-toolbar {
    padding: 12px 32px;
    border-bottom: 1px solid var(--border);
    background: #10141c;
  }
  .books-inner {
    max-width: 1440px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
  }
  .book-group { min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .book-group[hidden], .reset-button[hidden], .filters-panel[hidden] { display: none; }
  .toolbar-actions { flex: 0 0 auto; display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-left: auto; }
  .toolbar-label, .filter-label {
    flex: 0 0 auto;
    color: var(--text-dim);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .chip {
    min-height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 5px 12px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--surface-2);
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
    transition: border-color .18s, background .18s, color .18s, transform .18s;
  }
  .chip:hover { color: var(--text); border-color: var(--border-bright); }
  .chip:active { transform: translateY(1px); }
  .chip.active { color: #f4d795; border-color: var(--gold); background: var(--gold-soft); }
  .chip-count {
    min-width: 18px;
    padding: 1px 5px;
    border-radius: 999px;
    background: #ffffff0b;
    color: currentColor;
    font-size: 0.62rem;
    text-align: center;
  }
  .reset-button {
    flex: 0 0 auto;
    min-height: 32px;
    padding: 6px 13px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-muted);
    font-size: 0.72rem;
    font-weight: 600;
    cursor: pointer;
  }
  .reset-button:hover { color: var(--text); border-color: var(--gold); background: var(--gold-soft); }
  .view-button {
    min-height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 6px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-2);
    color: var(--text-muted);
    font-size: 0.72rem;
    font-weight: 700;
    cursor: pointer;
  }
  .view-button:hover { color: var(--text); border-color: var(--border-bright); }
  .view-button.active { color: #f4d795; border-color: var(--gold); background: var(--gold-soft); }
  .view-count {
    min-width: 20px;
    padding: 1px 5px;
    border-radius: 999px;
    background: #ffffff0c;
    color: currentColor;
    font-size: 0.64rem;
    text-align: center;
  }

  .filters-panel {
    position: sticky;
    top: 0;
    z-index: 100;
    padding: 14px 32px 15px;
    border-bottom: 1px solid var(--border);
    background: rgba(20, 24, 33, 0.97);
    backdrop-filter: blur(14px);
  }
  .filters-inner { max-width: 1440px; margin: 0 auto; }
  .search-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .search-wrap { position: relative; flex: 1; }
  .search-icon {
    position: absolute;
    top: 50%;
    left: 14px;
    transform: translateY(-50%);
    color: var(--gold);
    pointer-events: none;
  }
  .search-input {
    width: 100%;
    height: 42px;
    padding: 9px 14px 9px 40px;
    border: 1px solid var(--border-bright);
    border-radius: var(--radius-sm);
    outline: none;
    background: var(--surface-2);
    color: var(--text);
  }
  .search-input::placeholder { color: var(--text-dim); }
  .search-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px var(--gold-soft); }
  .result-count { flex: 0 0 auto; color: var(--text-muted); font-size: 0.78rem; white-space: nowrap; }
  .filter-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: 8px;
    row-gap: 11px;
  }
  .filter-row + .filter-row { margin-top: 12px; }
  .filter-separator { width: 1px; height: 24px; margin: 0 3px; background: var(--border); }
  .context-filters[hidden], .weapon-filters[hidden] { display: none; }
  .type-chip.active[data-value="arma"] { color: #f1c878; border-color: #d9a84e; background: #d9a84e1d; }
  .type-chip.active[data-value="armadura"],
  .type-chip.active[data-value="escudo"] { color: #c7d8ef; border-color: var(--steel); background: var(--steel-soft); }
  .type-chip.active[data-value="item_geral"] { color: #91e4bd; border-color: var(--green); background: var(--green-soft); }
  .sort-label { color: var(--text-dim); font-size: 0.7rem; font-weight: 600; }
  .sort-select {
    min-height: 31px;
    padding: 5px 30px 5px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-2);
    color: var(--text-muted);
    outline: none;
    cursor: pointer;
  }
  .sort-select:focus { border-color: var(--gold); }

  .catalog-main { max-width: 1440px; margin: 0 auto; padding: 22px 32px 36px; }
  .catalog-heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }
  .catalog-title { font-family: 'Cinzel', serif; color: #e4c578; font-size: 1rem; letter-spacing: 0.5px; }
  .catalog-note { color: var(--text-dim); font-size: 0.72rem; }
  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    align-items: start;
    gap: 16px;
  }

  .item-card {
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    box-shadow: 0 8px 24px #00000024;
    transition: transform .18s, border-color .18s, box-shadow .18s;
  }
  .item-card:hover { transform: translateY(-2px); border-color: var(--border-bright); box-shadow: 0 12px 30px #00000042; }
  .item-card.acquired { box-shadow: inset 0 0 0 1px #45c58b32, 0 8px 24px #00000024; }
  .item-card[data-type="arma"]:hover { border-color: #d9a84e88; }
  .item-card[data-type="armadura"]:hover,
  .item-card[data-type="escudo"]:hover { border-color: #91a6c388; }
  .item-card[data-type="item_geral"]:hover { border-color: #45c58b78; }
  .card-header {
    padding: 14px 15px 11px;
    border-bottom: 1px solid var(--border);
    background: linear-gradient(180deg, var(--surface-3) 0%, var(--surface) 100%);
  }
  .title-row { display: flex; align-items: flex-start; gap: 10px; }
  .item-icon { flex: 0 0 auto; font-size: 1.25rem; line-height: 1.2; }
  .item-title { flex: 1; font-family: 'Cinzel', serif; color: #f0e4c7; font-size: 0.95rem; line-height: 1.35; }
  .badges { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 9px; }
  .badge {
    display: inline-flex;
    align-items: center;
    min-height: 20px;
    padding: 2px 7px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: #ffffff07;
    color: var(--text-muted);
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.35px;
    text-transform: uppercase;
  }
  .badge-type-arma { color: #edc36f; border-color: #d9a84e55; background: #d9a84e14; }
  .badge-type-armadura, .badge-type-escudo { color: #bfd0e6; border-color: #91a6c355; background: #91a6c314; }
  .badge-type-item_geral { color: #8be0b7; border-color: #45c58b55; background: #45c58b14; }
  .badge-book { color: #c4cad7; }

  .item-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    border-bottom: 1px solid var(--border);
  }
  .item-stat {
    min-width: 0;
    padding: 9px 10px;
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .item-stat:nth-child(4n) { border-right: 0; }
  .stat-name {
    display: block;
    margin-bottom: 3px;
    color: var(--text-dim);
    font-size: 0.57rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .stat-data { color: #cbd0dc; font-size: 0.75rem; font-weight: 600; line-height: 1.25; overflow-wrap: anywhere; }
  .properties-row { display: flex; flex-wrap: wrap; gap: 5px; padding: 9px 14px 0; }
  .property-tag {
    padding: 2px 7px;
    border-radius: 999px;
    border: 1px solid #d9a84e45;
    background: #d9a84e10;
    color: #e2bf73;
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
  }
  .card-body { display: grid; gap: 9px; padding: 12px 14px 15px; }
  .info-block { border-radius: var(--radius-sm); padding: 9px 11px; }
  .info-block-title {
    display: block;
    margin-bottom: 4px;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.65px;
    text-transform: uppercase;
  }
  .info-block p { color: #c8ccd6; font-family: 'Crimson Text', serif; font-size: 0.94rem; line-height: 1.48; }
  .info-grant { border: 1px solid #45c58b35; background: #45c58b0d; }
  .info-grant .info-block-title { color: #6ed5a5; }
  .info-rule { border: 1px solid #d9a84e35; background: #d9a84e0d; }
  .info-rule .info-block-title { color: #dfb65d; }
  .description { color: var(--text-muted); font-family: 'Crimson Text', serif; font-size: 0.92rem; line-height: 1.5; }
  .description-label { color: var(--text-dim); font-family: 'Inter', sans-serif; font-size: 0.59rem; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; }
  .no-description { color: var(--text-dim); font-size: 0.75rem; font-style: italic; }

  .card-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 11px 14px;
    border-top: 1px solid var(--border);
    background: #0e1219;
  }
  .acquire-button {
    min-height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 7px 12px;
    border: 1px solid #45c58b78;
    border-radius: var(--radius-sm);
    background: var(--green-soft);
    color: #91e4bd;
    font-weight: 700;
    cursor: pointer;
  }
  .acquire-button:hover { border-color: var(--green); background: #45c58b2e; color: #c4f2da; }
  .acquired-indicator { color: var(--text-dim); font-size: 0.69rem; text-align: right; }
  .acquired-indicator.has-items { color: #79d9ab; }

  .backpack-view { display: grid; gap: 16px; }
  .backpack-view[hidden], .catalog-view[hidden] { display: none; }
  .backpack-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
  }
  .backpack-heading p { margin-top: 5px; color: var(--text-muted); font-size: 0.78rem; line-height: 1.45; }
  .danger-button {
    min-height: 32px;
    padding: 6px 11px;
    border: 1px solid #df6b6b66;
    border-radius: var(--radius-sm);
    background: #df6b6b12;
    color: #ec9999;
    font-size: 0.72rem;
    font-weight: 700;
    cursor: pointer;
  }
  .danger-button:hover { border-color: var(--red); background: #df6b6b22; color: #ffc1c1; }
  .danger-button:disabled { opacity: .45; cursor: default; }
  .backpack-summary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
  }
  .summary-stat { min-width: 0; padding: 12px 14px; border-right: 1px solid var(--border); }
  .summary-stat:last-child { border-right: 0; }
  .summary-value { display: block; color: #f0d28c; font-size: 1rem; font-weight: 700; overflow-wrap: anywhere; }
  .summary-label { display: block; margin-top: 3px; color: var(--text-dim); font-size: 0.61rem; font-weight: 700; text-transform: uppercase; }
  .backpack-list { display: grid; gap: 12px; }
  .backpack-item {
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
  }
  .backpack-item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--border);
    background: var(--surface-2);
  }
  .backpack-item-title { min-width: 0; display: flex; align-items: center; gap: 9px; }
  .backpack-item-title h3 { color: #f0e4c7; font-family: 'Cinzel', serif; font-size: 0.88rem; line-height: 1.3; overflow-wrap: anywhere; }
  .icon-button {
    width: 32px;
    height: 32px;
    flex: 0 0 32px;
    display: inline-grid;
    place-items: center;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-muted);
    font-size: 1.1rem;
    cursor: pointer;
  }
  .icon-button:hover { color: #ffc1c1; border-color: var(--red); background: #df6b6b12; }
  .backpack-item-body { display: grid; grid-template-columns: minmax(220px, .7fr) minmax(360px, 1.3fr); }
  .inventory-column { padding: 14px; border-right: 1px solid var(--border); }
  .inventory-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border-top: 1px solid var(--border); border-left: 1px solid var(--border); }
  .inventory-metric { min-width: 0; padding: 9px 10px; border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); }
  .inventory-metric strong { display: block; margin-top: 3px; color: #d7dbe4; font-size: 0.79rem; overflow-wrap: anywhere; }
  .quantity-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 12px; }
  .quantity-label { color: var(--text-dim); font-size: 0.64rem; font-weight: 700; text-transform: uppercase; }
  .quantity-control { display: grid; grid-template-columns: 34px 58px 34px; }
  .quantity-control button,
  .quantity-control input {
    height: 34px;
    border: 1px solid var(--border-bright);
    background: var(--surface-3);
    color: var(--text);
    text-align: center;
  }
  .quantity-control button { cursor: pointer; font-size: 1rem; }
  .quantity-control button:first-child { border-radius: var(--radius-sm) 0 0 var(--radius-sm); }
  .quantity-control button:last-child { border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
  .quantity-control input { width: 58px; border-left: 0; border-right: 0; outline: none; }
  .quantity-control input::-webkit-inner-spin-button { appearance: none; }

  .customization-column { min-width: 0; display: grid; align-content: start; }
  .improvements-panel, .enchantments-panel, .specific-magic-panel { min-width: 0; }
  .customization-column > details + details { border-top: 1px solid var(--border); }
  .improvements-panel summary, .enchantments-panel summary, .specific-magic-panel summary {
    min-height: 45px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    color: #e0c174;
    font-weight: 700;
    cursor: pointer;
    list-style: none;
  }
  .improvements-panel summary::-webkit-details-marker,
  .enchantments-panel summary::-webkit-details-marker,
  .specific-magic-panel summary::-webkit-details-marker { display: none; }
  .improvements-panel summary::after,
  .enchantments-panel summary::after,
  .specific-magic-panel summary::after { content: '+'; color: var(--text-muted); font-size: 1rem; }
  .improvements-panel[open] summary,
  .enchantments-panel[open] summary,
  .specific-magic-panel[open] summary { border-bottom: 1px solid var(--border); }
  .improvements-panel[open] summary::after,
  .enchantments-panel[open] summary::after,
  .specific-magic-panel[open] summary::after { content: '−'; }
  .improvement-counter { color: var(--text-dim); font-size: 0.68rem; font-weight: 600; }
  .improvement-editor { display: grid; gap: 12px; padding: 13px 14px 15px; }
  .improvement-slots { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .improvement-field { min-width: 0; display: grid; gap: 5px; }
  .improvement-field label { color: var(--text-dim); font-size: 0.62rem; font-weight: 700; text-transform: uppercase; }
  .improvement-select {
    width: 100%;
    min-height: 36px;
    padding: 6px 30px 6px 9px;
    border: 1px solid var(--border-bright);
    border-radius: var(--radius-sm);
    outline: none;
    background: var(--surface-3);
    color: var(--text);
  }
  .improvement-select:focus { border-color: var(--gold); }
  .material-field { grid-column: 1 / -1; }
  .improvement-details { display: grid; gap: 7px; }
  .improvement-description { padding-left: 9px; border-left: 2px solid #d9a84e70; color: var(--text-muted); font-size: 0.74rem; line-height: 1.45; }
  .improvement-description strong { color: #d9c48f; }
  .improvement-cost-note { color: var(--text-dim); font-size: 0.69rem; line-height: 1.45; }
  .magic-rule-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; }
  .magic-rule-stat { padding: 8px 9px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: #ffffff06; }
  .magic-rule-stat strong { display: block; margin-top: 3px; color: #d7dbe4; font-size: 0.75rem; overflow-wrap: anywhere; }
  .magic-note { color: var(--text-muted); font-size: 0.72rem; line-height: 1.45; }
  .badge-magic { color: #d8b8f4; border-color: #a86bd055; background: #a86bd014; }
  .no-improvements { padding: 14px; color: var(--text-dim); font-size: 0.74rem; line-height: 1.45; }
  .backpack-empty { display: none; padding: 70px 20px; text-align: center; color: var(--text-dim); }
  .backpack-empty.visible { display: grid; justify-items: center; gap: 10px; }
  .backpack-empty h3 { color: var(--text-muted); font-family: 'Cinzel', serif; }
  .status-toast {
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 200;
    max-width: min(360px, calc(100vw - 40px));
    padding: 10px 13px;
    border: 1px solid #45c58b88;
    border-radius: var(--radius-sm);
    background: #17231f;
    color: #bcebd4;
    box-shadow: 0 12px 30px #00000055;
    font-size: 0.76rem;
    opacity: 0;
    transform: translateY(10px);
    pointer-events: none;
    transition: opacity .18s, transform .18s;
  }
  .status-toast.visible { opacity: 1; transform: translateY(0); }

  .empty-state { display: none; padding: 70px 20px; text-align: center; color: var(--text-dim); }
  .empty-state.visible { display: block; }
  .empty-state h3 { margin-bottom: 7px; color: var(--text-muted); font-family: 'Cinzel', serif; }

  :focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
  ::-webkit-scrollbar { width: 7px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border-bright); border-radius: 99px; }

  @media (max-width: 800px) {
    .site-header, .books-toolbar, .filters-panel, .catalog-main { padding-left: 18px; padding-right: 18px; }
    .books-inner { align-items: stretch; flex-direction: column; gap: 10px; }
    .toolbar-actions { align-self: flex-end; flex-wrap: wrap; }
    .reset-button { margin-left: auto; }
    .filter-separator { display: none; }
    .items-grid { grid-template-columns: 1fr; }
    .backpack-item-body { grid-template-columns: 1fr; }
    .inventory-column { border-right: 0; border-bottom: 1px solid var(--border); }
  }
  @media (max-width: 520px) {
    .search-row { align-items: stretch; flex-direction: column; }
    .result-count { align-self: flex-end; }
    .item-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .item-stat:nth-child(4n) { border-right: 1px solid var(--border); }
    .item-stat:nth-child(2n) { border-right: 0; }
    .catalog-heading { align-items: flex-start; flex-direction: column; }
    .toolbar-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .reset-button { grid-column: 1 / -1; width: 100%; margin-left: 0; }
    .backpack-header { align-items: stretch; flex-direction: column; }
    .danger-button { align-self: flex-start; }
    .backpack-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .summary-stat { border-bottom: 1px solid var(--border); }
    .summary-stat:nth-child(2n) { border-right: 0; }
    .summary-stat:nth-last-child(-n + 2) { border-bottom: 0; }
    .improvement-slots { grid-template-columns: 1fr; }
    .magic-rule-grid { grid-template-columns: 1fr; }
    .material-field { grid-column: auto; }
    .card-actions { align-items: stretch; flex-direction: column; }
    .acquired-indicator { text-align: left; }
  }
</style>
</head>
<body>
<header class="site-header">
  <div class="header-inner">
    <div class="eyebrow">Catálogo de equipamento</div>
    <h1>Arsenal de Arton</h1>
    <p class="header-subtitle">Armas, proteções, munições, vestuário e ferramentas reunidos em um catálogo para consulta rápida — com as estatísticas e aquilo que cada item concede.</p>
  </div>
</header>

<nav class="books-toolbar" aria-label="Catálogo e mochila">
  <div class="books-inner">
    <div class="book-group" id="bookFilters">
      <span class="toolbar-label">Livros</span>
    </div>
    <div class="toolbar-actions" aria-label="Visualização">
      <button class="view-button active" id="catalogViewBtn" type="button" aria-pressed="true">Catálogo</button>
      <button class="view-button" id="backpackViewBtn" type="button" aria-pressed="false">
        <span aria-hidden="true">🎒</span> Mochila <span class="view-count" id="backpackViewCount">0</span>
      </button>
      <button class="reset-button" id="resetFilters" type="button">Limpar filtros</button>
    </div>
  </div>
</nav>

<section class="filters-panel" id="filtersPanel" aria-label="Filtros do catálogo">
  <div class="filters-inner">
    <div class="search-row">
      <div class="search-wrap">
        <span class="search-icon" aria-hidden="true">⌕</span>
        <input class="search-input" id="searchInput" type="search" autocomplete="off" placeholder="Buscar por nome, efeito, propriedade ou descrição..." aria-label="Buscar itens">
      </div>
      <span class="result-count" id="resultCount"></span>
    </div>
    <div class="filter-row" id="typeFilters">
      <span class="filter-label">Tipo</span>
    </div>
    <div class="context-filters" id="contextFilters" hidden>
      <div class="filter-row" id="categoryFilters"></div>
    </div>
    <div class="weapon-filters" id="weaponFilters" hidden>
      <div class="filter-row" id="combatFilters"></div>
      <div class="filter-row" id="gripFilters"></div>
    </div>
    <div class="filter-row">
      <span class="sort-label">Ordenar</span>
      <select class="sort-select" id="sortSelect" aria-label="Ordenar itens">
        <option value="name">Nome: A–Z</option>
        <option value="price-asc">Menor preço</option>
        <option value="price-desc">Maior preço</option>
        <option value="space-asc">Menos espaços</option>
        <option value="type">Tipo e nome</option>
      </select>
    </div>
  </div>
</section>

<main class="catalog-main">
  <section class="catalog-view" id="catalogView">
    <div class="catalog-heading">
      <h2 class="catalog-title" id="catalogTitle">Todos os itens</h2>
      <span class="catalog-note">Clique nos livros ou filtros para combinar critérios.</span>
    </div>
    <div class="items-grid" id="itemsGrid"></div>
    <div class="empty-state" id="emptyState">
      <h3>Nenhum item encontrado</h3>
      <p>Tente remover algum filtro ou buscar por outro termo.</p>
    </div>
  </section>

  <section class="backpack-view" id="backpackView" hidden>
    <div class="backpack-header">
      <div class="backpack-heading">
        <h2 class="catalog-title">Itens adquiridos</h2>
        <p>Controle quantidades, espaços, valores, melhorias e encantos dos itens adquiridos.</p>
      </div>
      <button class="danger-button" id="clearBackpack" type="button">Esvaziar mochila</button>
    </div>
    <div class="backpack-summary" id="backpackSummary"></div>
    <div class="backpack-list" id="backpackList"></div>
    <div class="backpack-empty" id="backpackEmpty">
      <h3>A mochila está vazia</h3>
      <p>Adquira itens no catálogo para começar.</p>
      <button class="view-button" id="emptyBackpackCatalogBtn" type="button">Voltar ao catálogo</button>
    </div>
  </section>
</main>

<div class="status-toast" id="statusToast" role="status" aria-live="polite"></div>

<script>
const ITEMS = __ITEM_DATA__;
const IMPROVEMENT_DATA = __IMPROVEMENT_DATA__;
const ENCHANTMENT_DATA = __ENCHANTMENT_DATA__;

const TYPE_META = {
  todos: { label: 'Todos', icon: '✦' },
  arma: { label: 'Armas', icon: '⚔️' },
  municao: { label: 'Munições', icon: '➶' },
  armadura: { label: 'Armaduras', icon: '🛡️' },
  escudo: { label: 'Escudos', icon: '◈' },
  item_geral: { label: 'Itens gerais', icon: '🎒' }
};

const BOOK_LABELS = {
  basico: 'Livro Básico',
  herois_de_arton: 'Heróis de Arton',
  ameacas_de_arton: 'Ameaças de Arton',
  deuses_de_arton: 'Deuses de Arton',
  dragao_brasil: 'Dragão Brasil',
  sem_livro: 'Origem não informada'
};
const BOOK_ORDER = ['basico', 'herois_de_arton', 'ameacas_de_arton', 'deuses_de_arton', 'dragao_brasil', 'sem_livro'];

const CATEGORY_LABELS = {
  simples: 'Simples', marcial: 'Marciais', exotica: 'Exóticas', fogo: 'Armas de fogo', municao: 'Munições',
  leve: 'Leves', pesada: 'Pesadas', pesado: 'Pesados', sem_categoria: 'Outros',
  vestuario: 'Vestuário', equipamento_aventura: 'Equipamento de aventura',
  alquimico_catalisador: 'Alquímicos · Catalisadores', alquimico_preparado: 'Alquímicos · Preparados',
  alquimico_venenoso: 'Alquímicos · Venenos', esoterico: 'Esotéricos', animal: 'Animais',
  servico: 'Serviços', instrumento: 'Instrumentos', alimentacao: 'Alimentação', aparato: 'Aparatos',
  ferramenta: 'Ferramentas', bebida: 'Bebidas', veiculo: 'Veículos'
};

const COMBAT_LABELS = {
  todos: 'Todos', corpo_a_corpo: 'Corpo a corpo', a_distancia: 'À distância',
  corpo_a_corpo_e_distancia: 'Corpo a corpo e à distância'
};
const GRIP_LABELS = { todos: 'Todas', leve: 'Leves', uma_mao: 'Uma mão', duas_maos: 'Duas mãos' };
const RANGE_LABELS = { curto: 'Curto', medio: 'Médio', '3m': '3m', '4_5m': '4,5m', cone_de_6m: 'Cone de 6m' };
const DAMAGE_LABELS = { corte: 'Corte', impacto: 'Impacto', perfuracao: 'Perfuração', acido: 'Ácido' };
const PROPERTY_LABELS = {
  adaptavel: 'Adaptável', agil: 'Ágil', alongada: 'Alongada', arremesso: 'Arremesso',
  desbalanceada: 'Desbalanceada', dupla: 'Dupla', ocultavel: 'Ocultável', versatil: 'Versátil'
};
const SLOT_LABELS = {
  mao_direita: 'Mão', mao_esquerda: 'Mão', armadura: 'Armadura', vestuario: 'Vestuário'
};
const BACKPACK_STORAGE_KEY = 'arsenal-arton-backpack-v1';
const IMPROVEMENT_SURCHARGES = [0, 300, 3000, 9000, 18000];
const IMPROVEMENT_CRAFT_BONUSES = [0, 5, 10, 15, 20];
const MAGIC_RULES = ENCHANTMENT_DATA.regras || {};
const ENCHANTMENT_SURCHARGES = MAGIC_RULES.precosAdicionais || [0, 18000, 36000, 72000];
const ENCHANTMENT_CRAFT_BONUSES = MAGIC_RULES.modificadoresCdFabricacao || [0, 10, 15, 20];
const MAX_ENCHANTMENTS = Number(MAGIC_RULES.maximoEncantos) || 3;

function normalizeText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function humanize(value) {
  const text = String(value || '').replace(/_/g, ' ');
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : 'Outros';
}

function getBooks(item) {
  let books = Array.isArray(item.livrosOrigemIds) ? item.livrosOrigemIds.filter(Boolean) : [];
  if (!books.length && item.livroOrigemId) books = [item.livroOrigemId];
  return books.length ? Array.from(new Set(books)) : ['sem_livro'];
}

const preparedItems = ITEMS.map(function(item) {
  const searchParts = [
    item.nome, item.tipo, item.categoriaId,
    item.textos && item.textos.habilidade,
    item.textos && item.textos.variavel,
    item.textos && item.textos.descricao,
    item.arma && item.arma.combateId,
    item.arma && item.arma.empunhaduraId,
    item.arma && item.arma.propriedadesIds && item.arma.propriedadesIds.join(' '),
    item.arma && item.arma.tipoDanoIds && item.arma.tipoDanoIds.join(' '),
    item.magico && item.magico.tipo,
    item.magico && item.magico.categoriaId,
    item.magico && item.magico.encantosFixosIds && item.magico.encantosFixosIds.join(' ')
  ];
  return Object.assign({}, item, { _books: getBooks(item), _search: normalizeText(searchParts.join(' ')) });
});

const allBooks = Array.from(new Set(preparedItems.flatMap(function(item) { return item._books; }))).sort(function(a, b) {
  const ai = BOOK_ORDER.indexOf(a);
  const bi = BOOK_ORDER.indexOf(b);
  return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || String(a).localeCompare(String(b), 'pt-BR');
});

const itemById = new Map(preparedItems.map(function(item) { return [item.id, item]; }));
const improvements = (IMPROVEMENT_DATA.melhorias || []).slice().sort(function(a, b) {
  return a.nome.localeCompare(b.nome, 'pt-BR');
});
const improvementById = new Map(improvements.map(function(improvement) { return [improvement.id, improvement]; }));
const materials = (IMPROVEMENT_DATA.materiaisEspeciais || []).slice().sort(function(a, b) {
  return a.nome.localeCompare(b.nome, 'pt-BR');
});
const materialById = new Map(materials.map(function(material) { return [material.id, material]; }));
const materialCosts = new Map((IMPROVEMENT_DATA.custosMateriaisBasicos || []).map(function(entry) {
  return [entry.materialEspecialId, entry.custos || {}];
}));
const enchantments = (ENCHANTMENT_DATA.encantamentos || []).slice().sort(function(a, b) {
  return a.nome.localeCompare(b.nome, 'pt-BR');
});
const enchantmentById = new Map(enchantments.map(function(enchantment) { return [enchantment.id, enchantment]; }));
const magicCategories = new Map((MAGIC_RULES.categorias || []).map(function(category) {
  return [Number(category.quantidade), category];
}));

function createInstanceId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

function normalizeStoredImprovement(value) {
  if (typeof value === 'string') return improvementById.has(value) ? { id: value, materialId: '' } : null;
  if (!value || !improvementById.has(value.id)) return null;
  return {
    id: value.id,
    materialId: value.id === 'material_especial' && materialById.has(value.materialId) ? value.materialId : ''
  };
}

function normalizeStoredEnchantment(value) {
  const id = typeof value === 'string' ? value : value && value.id;
  return enchantmentById.has(id) ? id : null;
}

function loadBackpack() {
  try {
    const raw = localStorage.getItem(BACKPACK_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(function(entry) {
      return entry && itemById.has(entry.itemId);
    }).map(function(entry) {
      return {
        instanceId: String(entry.instanceId || createInstanceId()),
        itemId: entry.itemId,
        quantity: Math.max(1, Math.min(9999, Math.floor(Number(entry.quantity) || 1))),
        improvements: (Array.isArray(entry.improvements) ? entry.improvements : [])
          .map(normalizeStoredImprovement).filter(Boolean).slice(0, 4),
        enchantments: (Array.isArray(entry.enchantments) ? entry.enchantments : [])
          .map(normalizeStoredEnchantment).filter(Boolean).slice(0, MAX_ENCHANTMENTS)
      };
    });
  } catch (error) {
    return [];
  }
}

let backpackItems = loadBackpack();
const openImprovementPanels = new Set();
const openEnchantmentPanels = new Set();

const state = {
  books: new Set(allBooks),
  type: 'todos',
  category: 'todos',
  combat: 'todos',
  grip: 'todos',
  search: '',
  sort: 'name',
  view: 'catalog'
};

const bookFilters = document.getElementById('bookFilters');
const typeFilters = document.getElementById('typeFilters');
const contextFilters = document.getElementById('contextFilters');
const categoryFilters = document.getElementById('categoryFilters');
const weaponFilters = document.getElementById('weaponFilters');
const combatFilters = document.getElementById('combatFilters');
const gripFilters = document.getElementById('gripFilters');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const itemsGrid = document.getElementById('itemsGrid');
const resultCount = document.getElementById('resultCount');
const catalogTitle = document.getElementById('catalogTitle');
const emptyState = document.getElementById('emptyState');
const filtersPanel = document.getElementById('filtersPanel');
const catalogView = document.getElementById('catalogView');
const backpackView = document.getElementById('backpackView');
const catalogViewBtn = document.getElementById('catalogViewBtn');
const backpackViewBtn = document.getElementById('backpackViewBtn');
const backpackViewCount = document.getElementById('backpackViewCount');
const backpackSummary = document.getElementById('backpackSummary');
const backpackList = document.getElementById('backpackList');
const backpackEmpty = document.getElementById('backpackEmpty');
const clearBackpack = document.getElementById('clearBackpack');
const resetFilters = document.getElementById('resetFilters');
const statusToast = document.getElementById('statusToast');

function countType(type) {
  return preparedItems.filter(function(item) { return item.tipo === type; }).length;
}

function renderBookFilters() {
  const label = '<span class="toolbar-label">Livros</span>';
  const buttons = allBooks.map(function(book) {
    const count = preparedItems.filter(function(item) { return item._books.includes(book); }).length;
    return '<button class="chip book-chip" type="button" data-book="' + escapeHtml(book) + '">' +
      escapeHtml(BOOK_LABELS[book] || humanize(book)) + '<span class="chip-count">' + count + '</span></button>';
  }).join('');
  bookFilters.innerHTML = label + buttons;
}

function renderTypeFilters() {
  const order = ['todos', 'arma', 'municao', 'armadura', 'escudo', 'item_geral'];
  typeFilters.innerHTML = '<span class="filter-label">Tipo</span>' + order.map(function(type) {
    const count = type === 'todos' ? preparedItems.length : countType(type);
    return '<button class="chip type-chip" type="button" data-value="' + type + '">' +
      '<span aria-hidden="true">' + TYPE_META[type].icon + '</span>' + TYPE_META[type].label +
      '<span class="chip-count">' + count + '</span></button>';
  }).join('');
}

function categoryValuesForType(type) {
  return Array.from(new Set(preparedItems.filter(function(item) { return item.tipo === type; }).map(function(item) {
    return item.categoriaId || 'sem_categoria';
  }))).sort(function(a, b) {
    return (CATEGORY_LABELS[a] || humanize(a)).localeCompare(CATEGORY_LABELS[b] || humanize(b), 'pt-BR');
  });
}

function renderContextFilters() {
  const categories = state.type === 'todos' ? [] : categoryValuesForType(state.type);
  const shouldShowCategories = categories.length > 1;
  contextFilters.hidden = !shouldShowCategories;
  if (shouldShowCategories) {
    categoryFilters.innerHTML = '<span class="filter-label">Subtipo</span>' +
      '<button class="chip category-chip" type="button" data-value="todos">Todos</button>' +
      categories.map(function(category) {
        const count = preparedItems.filter(function(item) {
          return item.tipo === state.type && (item.categoriaId || 'sem_categoria') === category;
        }).length;
        return '<button class="chip category-chip" type="button" data-value="' + escapeHtml(category) + '">' +
          escapeHtml(CATEGORY_LABELS[category] || humanize(category)) + '<span class="chip-count">' + count + '</span></button>';
      }).join('');
  } else {
    categoryFilters.innerHTML = '';
  }

  const isWeapon = state.type === 'arma';
  weaponFilters.hidden = !isWeapon;
  if (isWeapon) {
    const combatOrder = ['todos', 'corpo_a_corpo', 'a_distancia', 'corpo_a_corpo_e_distancia'];
    combatFilters.innerHTML = '<span class="filter-label">Combate</span>' + combatOrder.map(function(value) {
      return '<button class="chip combat-chip" type="button" data-value="' + value + '">' + COMBAT_LABELS[value] + '</button>';
    }).join('');
    const gripOrder = ['todos', 'leve', 'uma_mao', 'duas_maos'];
    gripFilters.innerHTML = '<span class="filter-label">Empunhadura</span>' + gripOrder.map(function(value) {
      return '<button class="chip grip-chip" type="button" data-value="' + value + '">' + GRIP_LABELS[value] + '</button>';
    }).join('');
  } else {
    combatFilters.innerHTML = '';
    gripFilters.innerHTML = '';
  }
}

function syncFilterUI() {
  document.querySelectorAll('.book-chip').forEach(function(button) {
    const active = state.books.has(button.dataset.book);
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('.type-chip').forEach(function(button) {
    button.classList.toggle('active', button.dataset.value === state.type);
  });
  document.querySelectorAll('.category-chip').forEach(function(button) {
    button.classList.toggle('active', button.dataset.value === state.category);
  });
  document.querySelectorAll('.combat-chip').forEach(function(button) {
    button.classList.toggle('active', button.dataset.value === state.combat);
  });
  document.querySelectorAll('.grip-chip').forEach(function(button) {
    button.classList.toggle('active', button.dataset.value === state.grip);
  });
}

function formatSpaces(value) {
  return Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

function formatCurrencyValue(value, currency) {
  return (currency || 'T$') + ' ' + Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: Number(value || 0) % 1 ? 2 : 0,
    maximumFractionDigits: 2
  });
}

function formatPrice(item) {
  const value = Number(item.preco && item.preco.valor || 0);
  const currency = item.preco && item.preco.moeda || 'T$';
  return formatCurrencyValue(value, currency);
}

function itemImprovementCategory(item) {
  if (item.tipo === 'arma' || item.tipo === 'municao') return 'arma';
  if (item.tipo === 'armadura') return 'armadura';
  if (item.tipo === 'escudo') return 'escudo';
  if (item.tipo === 'item_geral' && ['esoterico', 'ferramenta', 'vestuario'].includes(item.categoriaId)) {
    return item.categoriaId;
  }
  return '';
}

function isSpecificMagicItem(item) {
  return Boolean(item && item.magico && item.magico.tipo === 'especifico');
}

function materialApplicationKeys(item) {
  if (item.tipo === 'arma' || item.tipo === 'municao') return ['arma'];
  if (item.tipo === 'armadura') {
    return item.categoriaId === 'pesada' ? ['armadura_pesada', 'armadura'] : ['armadura_leve', 'armadura'];
  }
  if (item.tipo === 'escudo') return ['escudo'];
  if (item.categoriaId === 'esoterico') return ['esoterico'];
  if (item.categoriaId === 'ferramenta') return ['ferramenta'];
  if (item.categoriaId === 'vestuario') return ['vestuario'];
  return [];
}

function getMaterialCostInfo(material, item) {
  const costs = materialCosts.get(material.id) || {};
  const applications = material.aplicacoes || {};
  const keys = materialApplicationKeys(item);
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(costs, key)) {
      return { applicable: true, known: true, value: Number(costs[key]) || 0, key: key };
    }
  }
  for (const key of keys) {
    const application = applications[key];
    if (application && (application.restricoes || []).every(function(restriction) {
      return restrictionMatches(restriction, item);
    })) {
      return { applicable: true, known: false, value: 0, key: key };
    }
  }
  return { applicable: false, known: false, value: 0, key: '' };
}

function materialOptionsForItem(item) {
  return materials.filter(function(material) { return getMaterialCostInfo(material, item).applicable; });
}

function restrictionMatches(restriction, item) {
  if (!restriction || !restriction.tipo) return true;
  if (restriction.tipo === 'categoria_armadura') {
    return item.tipo === 'armadura' && item.categoriaId === restriction.categoriaId;
  }
  if (restriction.tipo === 'tipo_dano') {
    const damageTypes = item.arma && item.arma.tipoDanoIds || [];
    return (restriction.tipoDanoIds || []).some(function(type) { return damageTypes.includes(type); });
  }
  if (restriction.tipo === 'municao') return item.tipo === 'municao';
  if (restriction.tipo === 'item_modifica_pericia') {
    return item.categoriaId === 'ferramenta' || item.categoriaId === 'vestuario';
  }
  return true;
}

function improvementAppliesToItem(improvement, item) {
  if (isSpecificMagicItem(item)) return false;
  const category = itemImprovementCategory(item);
  if (!category || !(improvement.categoriasIds || []).includes(category)) return false;
  if (!(improvement.restricoes || []).every(function(restriction) { return restrictionMatches(restriction, item); })) return false;
  if (improvement.id === 'material_especial' && materialOptionsForItem(item).length === 0) return false;
  return true;
}

function requirementsMet(improvement, selectedIds) {
  return (improvement.preRequisitos || []).every(function(requirement) {
    if (requirement.tipo === 'melhoria') return selectedIds.has(requirement.melhoriaId);
    if (requirement.tipo === 'uma_das_melhorias') {
      return (requirement.melhoriasIds || []).some(function(id) { return selectedIds.has(id); });
    }
    return true;
  });
}

function improvementsConflict(candidate, acceptedIds) {
  if ((candidate.incompatibilidades || []).some(function(id) { return acceptedIds.has(id); })) return true;
  return Array.from(acceptedIds).some(function(id) {
    const selected = improvementById.get(id);
    return selected && (selected.incompatibilidades || []).includes(candidate.id);
  });
}

function improvementRequirementLabel(improvement) {
  const labels = (improvement.preRequisitos || []).map(function(requirement) {
    if (requirement.tipo === 'melhoria') {
      const required = improvementById.get(requirement.melhoriaId);
      return required ? required.nome : humanize(requirement.melhoriaId);
    }
    if (requirement.tipo === 'uma_das_melhorias') {
      return (requirement.melhoriasIds || []).map(function(id) {
        const required = improvementById.get(id);
        return required ? required.nome : humanize(id);
      }).join(' ou ');
    }
    return '';
  }).filter(Boolean);
  return labels.join(', ');
}

function sanitizeInstanceImprovements(instance, item) {
  const seen = new Set();
  let clean = (instance.improvements || []).map(normalizeStoredImprovement).filter(function(choice) {
    if (!choice || seen.has(choice.id)) return false;
    const improvement = improvementById.get(choice.id);
    if (!improvement || !improvementAppliesToItem(improvement, item)) return false;
    seen.add(choice.id);
    return true;
  }).slice(0, 4);

  let previousLength = -1;
  while (clean.length !== previousLength) {
    previousLength = clean.length;
    const allIds = new Set(clean.map(function(choice) { return choice.id; }));
    clean = clean.filter(function(choice) {
      return requirementsMet(improvementById.get(choice.id), allIds);
    });
    const accepted = [];
    const acceptedIds = new Set();
    clean.forEach(function(choice) {
      const improvement = improvementById.get(choice.id);
      if (!improvementsConflict(improvement, acceptedIds)) {
        accepted.push(choice);
        acceptedIds.add(choice.id);
      }
    });
    clean = accepted;
  }

  clean.forEach(function(choice) {
    if (choice.id !== 'material_especial') return;
    const available = materialOptionsForItem(item);
    if (!available.some(function(material) { return material.id === choice.materialId; })) {
      choice.materialId = available.length ? available[0].id : '';
    }
  });
  instance.improvements = clean;
}

function selectedImprovementIds(instance) {
  return new Set((instance.improvements || []).map(function(choice) { return choice.id; }));
}

function enchantmentAppliesToItem(enchantment, item) {
  return !isSpecificMagicItem(item) &&
    (enchantment.aplicacoesIds || []).includes(item.tipo) &&
    (enchantment.restricoes || []).every(function(restriction) {
      if (restriction.tipo === 'combate') {
        return item.arma && (restriction.valores || []).includes(item.arma.combateId);
      }
      return restrictionMatches(restriction, item);
    });
}

function enchantmentRequirementsMet(enchantment, selectedIds) {
  return (enchantment.preRequisitosIds || []).every(function(id) { return selectedIds.has(id); });
}

function enchantmentRequirementLabel(enchantment) {
  return (enchantment.preRequisitosIds || []).map(function(id) {
    const required = enchantmentById.get(id);
    return required ? required.nome : humanize(id);
  }).join(', ');
}

function sanitizeInstanceEnchantments(instance, item) {
  if (isSpecificMagicItem(item)) {
    instance.enchantments = [];
    return;
  }
  const seen = new Set();
  let clean = (instance.enchantments || []).map(normalizeStoredEnchantment).filter(function(id) {
    if (!id || seen.has(id)) return false;
    const enchantment = enchantmentById.get(id);
    if (!enchantment || !enchantmentAppliesToItem(enchantment, item)) return false;
    seen.add(id);
    return true;
  }).slice(0, MAX_ENCHANTMENTS);
  let previousLength = -1;
  while (clean.length !== previousLength) {
    previousLength = clean.length;
    const selectedIds = new Set(clean);
    clean = clean.filter(function(id) {
      return enchantmentRequirementsMet(enchantmentById.get(id), selectedIds);
    });
  }
  instance.enchantments = clean;
}

function magicCategoryFor(instance, item) {
  if (isSpecificMagicItem(item)) {
    const categoryId = item.magico.categoriaId || 'maior';
    return Array.from(magicCategories.values()).find(function(category) { return category.id === categoryId; }) || null;
  }
  return magicCategories.get(Math.min(MAX_ENCHANTMENTS, (instance.enchantments || []).length)) || null;
}

function improvementSpacePerUnit(instance, item) {
  let spaces = Number(item.espacos) || 0;
  (instance.improvements || []).forEach(function(choice) {
    const improvement = improvementById.get(choice.id);
    (improvement && improvement.efeitos || []).forEach(function(effect) {
      if (effect.tipo === 'reduzir_espacos_item') {
        spaces = Math.max(Number(effect.minimo) || 0, spaces - (Number(effect.valor) || 0));
      }
    });
  });
  return spaces;
}

function entryValueInfo(instance, item) {
  const count = Math.min(4, (instance.improvements || []).length);
  const enchantmentCount = isSpecificMagicItem(item) ? 0 : Math.min(MAX_ENCHANTMENTS, (instance.enchantments || []).length);
  let materialValue = 0;
  let unknownMaterials = 0;
  (instance.improvements || []).forEach(function(choice) {
    if (choice.id !== 'material_especial' || !choice.materialId) return;
    const material = materialById.get(choice.materialId);
    if (!material) return;
    const info = getMaterialCostInfo(material, item);
    if (info.known) materialValue += info.value;
    else if (info.applicable) unknownMaterials += 1;
  });
  const currency = item.preco && item.preco.moeda || 'T$';
  const improvementSurcharge = isSpecificMagicItem(item) ? 0 : IMPROVEMENT_SURCHARGES[count];
  const enchantmentSurcharge = isSpecificMagicItem(item) ? 0 : ENCHANTMENT_SURCHARGES[enchantmentCount];
  const unitKnown = Number(item.preco && item.preco.valor || 0) + improvementSurcharge + enchantmentSurcharge + materialValue;
  const magicCategory = magicCategoryFor(instance, item);
  const specificRules = MAGIC_RULES.itensEspecificos || {};
  const specificCd = specificRules.cdPorCategoria && item.magico && specificRules.cdPorCategoria[item.magico.categoriaId];
  const craftCd = isSpecificMagicItem(item)
    ? Number(specificCd || 50)
    : enchantmentCount
      ? Number(MAGIC_RULES.cdBaseItemEncantado || 20) + IMPROVEMENT_CRAFT_BONUSES[count] + ENCHANTMENT_CRAFT_BONUSES[enchantmentCount]
      : null;
  return {
    currency: currency,
    unitKnown: unitKnown,
    totalKnown: unitKnown * instance.quantity,
    unknownMaterials: unknownMaterials * instance.quantity,
    surcharge: improvementSurcharge,
    craftBonus: IMPROVEMENT_CRAFT_BONUSES[count],
    enchantmentSurcharge: enchantmentSurcharge,
    enchantmentCraftBonus: ENCHANTMENT_CRAFT_BONUSES[enchantmentCount],
    enchantmentCount: enchantmentCount,
    magicCategory: magicCategory,
    craftCd: craftCd,
    craftCost: craftCd ? unitKnown / Number(MAGIC_RULES.divisorCustoFabricacao || 3) : null
  };
}

function formatEntryValue(info, total) {
  const value = total ? info.totalKnown : info.unitKnown;
  return formatCurrencyValue(value, info.currency) + (info.unknownMaterials ? ' + material' : '');
}

function countBackpackItem(itemId) {
  return backpackItems.reduce(function(total, entry) {
    return total + (entry.itemId === itemId ? entry.quantity : 0);
  }, 0);
}

function backpackTotals() {
  return backpackItems.reduce(function(total, instance) {
    const item = itemById.get(instance.itemId);
    if (!item) return total;
    sanitizeInstanceImprovements(instance, item);
    sanitizeInstanceEnchantments(instance, item);
    const value = entryValueInfo(instance, item);
    total.entries += 1;
    total.quantity += instance.quantity;
    total.spaces += improvementSpacePerUnit(instance, item) * instance.quantity;
    total.value += value.totalKnown;
    total.unknownMaterials += value.unknownMaterials;
    return total;
  }, { entries: 0, quantity: 0, spaces: 0, value: 0, unknownMaterials: 0 });
}

function persistBackpack() {
  try {
    localStorage.setItem(BACKPACK_STORAGE_KEY, JSON.stringify(backpackItems));
  } catch (error) {
    showToast('Não foi possível salvar a mochila neste navegador.');
  }
}

let toastTimer = 0;
function showToast(message) {
  statusToast.textContent = message;
  statusToast.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(function() { statusToast.classList.remove('visible'); }, 2200);
}

function formatCritical(critical) {
  if (!critical) return '—';
  if (critical.texto) return critical.texto;
  const margin = Number(critical.margem || 20);
  const multiplier = Number(critical.multiplicador || 2);
  return (margin < 20 ? margin + '/' : '') + 'x' + multiplier;
}

function statTile(label, value) {
  return '<div class="item-stat"><span class="stat-name">' + escapeHtml(label) + '</span><span class="stat-data">' + escapeHtml(value == null || value === '' ? '—' : value) + '</span></div>';
}

function itemStats(item) {
  const stats = [statTile('Preço', formatPrice(item)), statTile('Espaços', String(item.espacos))];
  if (item.tipo === 'arma' && item.arma) {
    const damage = item.arma.dano && item.arma.dano.principal || '—';
    const alternatives = item.arma.dano && Array.isArray(item.arma.dano.alternativas) ? item.arma.dano.alternativas.filter(Boolean) : [];
    stats.push(statTile('Dano', alternatives.length ? damage + ' / ' + alternatives.join(' / ') : damage));
    stats.push(statTile('Crítico', formatCritical(item.arma.critico)));
    stats.push(statTile('Combate', COMBAT_LABELS[item.arma.combateId] || humanize(item.arma.combateId)));
    stats.push(statTile('Empunhadura', GRIP_LABELS[item.arma.empunhaduraId] || humanize(item.arma.empunhaduraId)));
    stats.push(statTile('Alcance', RANGE_LABELS[item.arma.alcanceId] || (item.arma.alcanceId ? humanize(item.arma.alcanceId) : '—')));
    stats.push(statTile('Tipo de dano', (item.arma.tipoDanoIds || []).map(function(value) { return DAMAGE_LABELS[value] || humanize(value); }).join(' / ') || '—'));
  } else if (item.tipo === 'armadura' && item.armadura) {
    stats.push(statTile('Defesa', '+' + Number(item.armadura.defesa || 0)));
    stats.push(statTile('Penalidade', String(Number(item.armadura.penalidade || 0))));
    stats.push(statTile('Destreza', item.armadura.usaDestrezaNaDefesa ? 'Aplica na Defesa' : 'Não aplica'));
  } else if (item.tipo === 'escudo' && item.escudo) {
    stats.push(statTile('Defesa', '+' + Number(item.escudo.bonusDefesa || 0)));
    stats.push(statTile('Penalidade', String(Number(item.escudo.penalidade || 0))));
    if (item.escudo.ataque) {
      stats.push(statTile('Ataque', item.escudo.ataque.dano && (item.escudo.ataque.dano.texto || item.escudo.ataque.dano.principal) || '—'));
      stats.push(statTile('Crítico', formatCritical(item.escudo.ataque.critico)));
    }
  } else {
    const slots = item.equipamento && Array.isArray(item.equipamento.slotsPermitidos) ? Array.from(new Set(item.equipamento.slotsPermitidos.map(function(value) {
      return SLOT_LABELS[value] || humanize(value);
    }))) : [];
    if (slots.length) stats.push(statTile('Uso', slots.join(' / ')));
    if (item.equipamento && item.equipamento.itemVestido) stats.push(statTile('Equipamento', 'Item vestido'));
  }
  if (isSpecificMagicItem(item)) {
    const category = magicCategoryFor({ enchantments: [] }, item);
    const specificRules = MAGIC_RULES.itensEspecificos || {};
    const cd = specificRules.cdPorCategoria && specificRules.cdPorCategoria[item.magico.categoriaId];
    stats.push(statTile('Item mágico', 'Específico ' + (category ? category.nome.toLowerCase() : humanize(item.magico.categoriaId).toLowerCase())));
    stats.push(statTile('CD fabricação', String(cd || 50)));
  }
  return stats.join('');
}

function propertiesHtml(item) {
  if (!item.arma) return '';
  const values = [];
  (item.arma.propriedadesIds || []).forEach(function(value) { values.push(PROPERTY_LABELS[value] || humanize(value)); });
  (item.arma.gruposArmaIds || []).forEach(function(value) { values.push(humanize(value)); });
  if (!values.length) return '';
  return '<div class="properties-row">' + values.map(function(value) {
    return '<span class="property-tag">' + escapeHtml(value) + '</span>';
  }).join('') + '</div>';
}

function renderInfoBlock(title, text, className) {
  if (!text) return '';
  return '<div class="info-block ' + className + '"><span class="info-block-title">' + title + '</span><p>' + escapeHtml(text) + '</p></div>';
}

function itemCard(item) {
  const typeMeta = TYPE_META[item.tipo] || { label: humanize(item.tipo), icon: '◆' };
  const category = item.categoriaId || 'sem_categoria';
  const acquiredCount = countBackpackItem(item.id);
  const books = item._books.map(function(book) {
    return '<span class="badge badge-book">' + escapeHtml(BOOK_LABELS[book] || humanize(book)) + '</span>';
  }).join('');
  const magicBadge = isSpecificMagicItem(item)
    ? '<span class="badge badge-magic">Específico maior</span>'
    : '';
  const texts = item.textos || {};
  let body = renderInfoBlock('Concede', texts.habilidade, 'info-grant');
  body += renderInfoBlock('Regras e uso', texts.variavel, 'info-rule');
  if (texts.descricao) {
    body += '<p class="description"><span class="description-label">Descrição</span><br>' + escapeHtml(texts.descricao) + '</p>';
  }
  if (!body) body = '<p class="no-description">Sem descrição textual cadastrada; consulte as estatísticas acima.</p>';
  return '<article class="item-card' + (acquiredCount ? ' acquired' : '') + '" data-type="' + escapeHtml(item.tipo) + '" data-item-id="' + escapeHtml(item.id) + '">' +
    '<div class="card-header"><div class="title-row"><span class="item-icon" aria-hidden="true">' + typeMeta.icon + '</span>' +
    '<h3 class="item-title">' + escapeHtml(item.nome) + '</h3></div>' +
    '<div class="badges"><span class="badge badge-type-' + escapeHtml(item.tipo) + '">' + escapeHtml(typeMeta.label) + '</span>' +
    '<span class="badge">' + escapeHtml(CATEGORY_LABELS[category] || humanize(category)) + '</span>' + magicBadge + books + '</div></div>' +
    '<div class="item-stats">' + itemStats(item) + '</div>' + propertiesHtml(item) +
    '<div class="card-body">' + body + '</div>' +
    '<div class="card-actions"><button class="acquire-button" type="button" data-action="acquire" data-item-id="' + escapeHtml(item.id) + '">' +
    '<span aria-hidden="true">＋</span> Adicionar à mochila</button>' +
    '<span class="acquired-indicator' + (acquiredCount ? ' has-items' : '') + '" data-acquired-count>' +
    (acquiredCount ? acquiredCount + (acquiredCount === 1 ? ' adquirido' : ' adquiridos') : 'Ainda não adquirido') + '</span></div></article>';
}

function improvementOptionsHtml(instance, item, slotIndex) {
  const current = instance.improvements[slotIndex] && instance.improvements[slotIndex].id || '';
  const otherIds = new Set(instance.improvements.filter(function(choice, index) {
    return index !== slotIndex && choice && choice.id;
  }).map(function(choice) { return choice.id; }));
  const options = improvements.filter(function(improvement) {
    return improvementAppliesToItem(improvement, item);
  }).map(function(improvement) {
    const combinedIds = new Set(otherIds);
    combinedIds.add(improvement.id);
    let reason = '';
    if (otherIds.has(improvement.id)) reason = 'já escolhida';
    else if (!requirementsMet(improvement, combinedIds)) reason = 'requer ' + improvementRequirementLabel(improvement);
    else if (improvementsConflict(improvement, otherIds)) reason = 'incompatível';
    const disabled = reason && improvement.id !== current;
    return '<option value="' + escapeHtml(improvement.id) + '"' +
      (improvement.id === current ? ' selected' : '') + (disabled ? ' disabled' : '') + '>' +
      escapeHtml(improvement.nome + (reason && improvement.id !== current ? ' (' + reason + ')' : '')) + '</option>';
  }).join('');
  return '<select class="improvement-select" data-action="improvement" data-slot="' + slotIndex + '" aria-label="' +
    (slotIndex + 1) + 'ª melhoria"><option value="">Nenhuma</option>' + options + '</select>';
}

function materialSummary(material, item) {
  const applications = material.aplicacoes || {};
  const keys = materialApplicationKeys(item);
  for (const key of keys) {
    if (applications[key] && applications[key].resumo) return applications[key].resumo;
  }
  return '';
}

function materialFieldHtml(instance, item) {
  const choice = (instance.improvements || []).find(function(entry) { return entry.id === 'material_especial'; });
  if (!choice) return '';
  const options = materialOptionsForItem(item).map(function(material) {
    const info = getMaterialCostInfo(material, item);
    const costLabel = info.known ? ' (+' + formatCurrencyValue(info.value, 'T$') + ')' : ' (custo não cadastrado)';
    return '<option value="' + escapeHtml(material.id) + '"' + (material.id === choice.materialId ? ' selected' : '') + '>' +
      escapeHtml(material.nome + costLabel) + '</option>';
  }).join('');
  return '<div class="improvement-field material-field"><label>Material especial</label>' +
    '<select class="improvement-select" data-action="material" aria-label="Material especial">' + options + '</select></div>';
}

function improvementDetailsHtml(instance, item) {
  const value = entryValueInfo(instance, item);
  const descriptions = (instance.improvements || []).map(function(choice) {
    const improvement = improvementById.get(choice.id);
    if (!improvement) return '';
    let name = improvement.nome;
    let summary = improvement.resumo || '';
    if (choice.id === 'material_especial' && choice.materialId) {
      const material = materialById.get(choice.materialId);
      if (material) {
        name += ': ' + material.nome;
        const specificSummary = materialSummary(material, item);
        if (specificSummary) summary = specificSummary;
      }
    }
    return '<p class="improvement-description"><strong>' + escapeHtml(name) + '.</strong> ' + escapeHtml(summary) + '</p>';
  }).join('');
  const count = instance.improvements.length;
  const cost = count
    ? 'Custo de item superior: +' + formatCurrencyValue(value.surcharge, value.currency) +
      '. Modificador na CD de fabricação: +' + value.craftBonus + '.'
    : 'Escolha até quatro melhorias. O custo superior é calculado pela quantidade escolhida.';
  const unknown = value.unknownMaterials
    ? ' O preço do material escolhido não está cadastrado e aparece separado do total.'
    : '';
  return '<div class="improvement-details">' + descriptions +
    '<p class="improvement-cost-note">' + escapeHtml(cost + unknown) + '</p></div>';
}

function enchantmentOptionsHtml(instance, item, slotIndex) {
  const current = instance.enchantments[slotIndex] || '';
  const otherIds = new Set(instance.enchantments.filter(function(id, index) {
    return index !== slotIndex && id;
  }));
  const options = enchantments.filter(function(enchantment) {
    return enchantmentAppliesToItem(enchantment, item);
  }).map(function(enchantment) {
    const selectedIds = new Set(otherIds);
    selectedIds.add(enchantment.id);
    let reason = '';
    if (otherIds.has(enchantment.id)) reason = 'já escolhido';
    else if (!enchantmentRequirementsMet(enchantment, selectedIds)) {
      reason = 'requer ' + enchantmentRequirementLabel(enchantment);
    }
    const disabled = reason && enchantment.id !== current;
    return '<option value="' + escapeHtml(enchantment.id) + '"' +
      (enchantment.id === current ? ' selected' : '') + (disabled ? ' disabled' : '') + '>' +
      escapeHtml(enchantment.nome + (reason && enchantment.id !== current ? ' (' + reason + ')' : '')) + '</option>';
  }).join('');
  return '<select class="improvement-select" data-action="enchantment" data-slot="' + slotIndex + '" aria-label="' +
    (slotIndex + 1) + 'º encanto"><option value="">Nenhum</option>' + options + '</select>';
}

function magicRuleStatsHtml(category, value, office) {
  if (!category) return '';
  const stats = [
    ['Categoria', category.nome],
    ['CD de fabricação', value.craftCd],
    ['Custo para fabricar', formatCurrencyValue(value.craftCost, value.currency)],
    ['Sacrifício permanente', category.custoPm + ' PM'],
    ['PV e RD do item', '+' + category.bonusPv + ' PV / +' + category.bonusRd + ' RD'],
    ['Resistência do item', '+' + category.resistencia]
  ];
  if (office) stats.splice(1, 0, ['Perícia', office]);
  return '<div class="magic-rule-grid">' + stats.map(function(stat) {
    return '<div class="magic-rule-stat"><span class="stat-name">' + escapeHtml(stat[0]) + '</span><strong>' +
      escapeHtml(stat[1]) + '</strong></div>';
  }).join('') + '</div>';
}

function enchantmentDetailsHtml(instance, item) {
  const value = entryValueInfo(instance, item);
  const descriptions = instance.enchantments.map(function(id) {
    const enchantment = enchantmentById.get(id);
    return enchantment
      ? '<p class="improvement-description"><strong>' + escapeHtml(enchantment.nome) + '.</strong> ' + escapeHtml(enchantment.descricao) + '</p>'
      : '';
  }).join('');
  if (!value.enchantmentCount) {
    return '<div class="improvement-details"><p class="magic-note">Escolha até três encantos. Um encanto torna o item menor, dois o tornam médio e três o tornam maior.</p></div>';
  }
  const pricing = 'Encantos: +' + formatCurrencyValue(value.enchantmentSurcharge, value.currency) +
    '. O preço final já soma item base, melhorias, material e encantos. Bônus iguais fornecidos por encantos não se acumulam.';
  const permanence = 'Os PM sacrificados são perdidos permanentemente e retornam apenas se o criador destruir o item; o mestre pode permitir um ingrediente raro no lugar dos PM. Quando não está em uso, o item faz seus próprios testes de resistência com o bônus indicado. Em uso, pode usar esse valor ou o do portador.';
  return '<div class="improvement-details">' + descriptions + magicRuleStatsHtml(value.magicCategory, value, '') +
    '<p class="improvement-cost-note">' + escapeHtml(pricing) + '</p><p class="magic-note">' + escapeHtml(permanence) + '</p></div>';
}

function enchantmentEditorHtml(instance, item) {
  const available = enchantments.some(function(enchantment) { return enchantmentAppliesToItem(enchantment, item); });
  if (!available) return '';
  const shouldOpen = openEnchantmentPanels.has(instance.instanceId) || instance.enchantments.length > 0;
  const slots = Array.from({ length: MAX_ENCHANTMENTS }, function(_, slotIndex) {
    return '<div class="improvement-field"><label>' + (slotIndex + 1) + 'º encanto</label>' +
      enchantmentOptionsHtml(instance, item, slotIndex) + '</div>';
  }).join('');
  return '<details class="enchantments-panel" data-instance-id="' + escapeHtml(instance.instanceId) + '"' + (shouldOpen ? ' open' : '') + '>' +
    '<summary><span>Encantos</span><span class="improvement-counter">' + instance.enchantments.length + '/' + MAX_ENCHANTMENTS + '</span></summary>' +
    '<div class="improvement-editor"><div class="improvement-slots">' + slots + '</div>' + enchantmentDetailsHtml(instance, item) + '</div></details>';
}

function specificMagicHtml(instance, item) {
  if (!isSpecificMagicItem(item)) return '';
  const value = entryValueInfo(instance, item);
  const category = value.magicCategory;
  const fixedEnchantments = (item.magico.encantosFixosIds || []).map(function(id) {
    const enchantment = enchantmentById.get(id);
    return enchantment ? enchantment.nome : humanize(id);
  });
  const fixedImprovements = (item.magico.melhoriasFixasIds || []).map(function(id) {
    if (id === 'material_especial' && item.magico.materialEspecialId) return humanize(item.magico.materialEspecialId);
    const improvement = improvementById.get(id);
    return improvement ? improvement.nome : humanize(id);
  });
  const components = [];
  if (fixedImprovements.length) components.push('Melhorias: ' + fixedImprovements.join(', ') + '.');
  if (fixedEnchantments.length) components.push('Encantos: ' + fixedEnchantments.join(', ') + '.');
  const specificRules = MAGIC_RULES.itensEspecificos || {};
  const office = specificRules.oficioPorTipo && specificRules.oficioPorTipo[item.tipo] || 'Ofício (armeiro)';
  return '<details class="specific-magic-panel" open><summary><span>Item mágico específico</span><span class="improvement-counter">Configuração fixa</span></summary>' +
    '<div class="improvement-editor"><div class="improvement-details">' +
    (components.length ? '<p class="improvement-description"><strong>Composição.</strong> ' + escapeHtml(components.join(' ')) + '</p>' : '') +
    magicRuleStatsHtml(category, value, office) +
    '<p class="magic-note">Itens específicos não podem receber encantos adicionais. O preço indicado já corresponde ao item completo. Os PM sacrificados retornam se o criador destruir o item. Quando não está em uso, o item usa sua própria resistência; em uso, pode usar esse valor ou o do portador.</p>' +
    '</div></div></details>';
}

function backpackItemHtml(instance) {
  const item = itemById.get(instance.itemId);
  if (!item) return '';
  sanitizeInstanceImprovements(instance, item);
  sanitizeInstanceEnchantments(instance, item);
  const typeMeta = TYPE_META[item.tipo] || { label: humanize(item.tipo), icon: '◆' };
  const category = CATEGORY_LABELS[item.categoriaId] || humanize(item.categoriaId);
  const value = entryValueInfo(instance, item);
  const unitSpaces = improvementSpacePerUnit(instance, item);
  const totalSpaces = unitSpaces * instance.quantity;
  const availableImprovements = improvements.some(function(improvement) {
    return improvementAppliesToItem(improvement, item);
  });
  const shouldOpen = openImprovementPanels.has(instance.instanceId) || instance.improvements.length > 0;
  const slots = [0, 1, 2, 3].map(function(slotIndex) {
    return '<div class="improvement-field"><label>' + (slotIndex + 1) + 'ª melhoria</label>' +
      improvementOptionsHtml(instance, item, slotIndex) + '</div>';
  }).join('');

  const editor = availableImprovements
    ? '<details class="improvements-panel" data-instance-id="' + escapeHtml(instance.instanceId) + '"' + (shouldOpen ? ' open' : '') + '>' +
      '<summary><span>Melhorias</span><span class="improvement-counter">' + instance.improvements.length + '/4</span></summary>' +
      '<div class="improvement-editor"><div class="improvement-slots">' + slots + materialFieldHtml(instance, item) + '</div>' +
      improvementDetailsHtml(instance, item) + '</div></details>'
    : isSpecificMagicItem(item) ? '' : '<p class="no-improvements">Este tipo de item não possui melhorias compatíveis cadastradas.</p>';
  const customization = editor + enchantmentEditorHtml(instance, item) + specificMagicHtml(instance, item);

  return '<article class="backpack-item" data-instance-id="' + escapeHtml(instance.instanceId) + '">' +
    '<header class="backpack-item-header"><div class="backpack-item-title"><span class="item-icon" aria-hidden="true">' + typeMeta.icon + '</span>' +
    '<div><h3>' + escapeHtml(item.nome) + '</h3><div class="badges"><span class="badge badge-type-' + escapeHtml(item.tipo) + '">' +
    escapeHtml(typeMeta.label) + '</span><span class="badge">' + escapeHtml(category) + '</span></div></div></div>' +
    '<button class="icon-button" type="button" data-action="remove" title="Remover da mochila" aria-label="Remover ' + escapeHtml(item.nome) + '">×</button></header>' +
    '<div class="backpack-item-body"><div class="inventory-column"><div class="inventory-metrics">' +
    '<div class="inventory-metric"><span class="stat-name">Valor unitário</span><strong>' + escapeHtml(formatEntryValue(value, false)) + '</strong></div>' +
    '<div class="inventory-metric"><span class="stat-name">Valor total</span><strong>' + escapeHtml(formatEntryValue(value, true)) + '</strong></div>' +
    '<div class="inventory-metric"><span class="stat-name">Espaços por item</span><strong>' + formatSpaces(unitSpaces) + '</strong></div>' +
    '<div class="inventory-metric"><span class="stat-name">Espaços no total</span><strong>' + formatSpaces(totalSpaces) + '</strong></div></div>' +
    '<div class="quantity-row"><span class="quantity-label">Quantidade</span><div class="quantity-control">' +
    '<button type="button" data-action="decrease" aria-label="Diminuir quantidade">−</button>' +
    '<input type="number" min="1" max="9999" step="1" value="' + instance.quantity + '" data-action="quantity" aria-label="Quantidade de ' + escapeHtml(item.nome) + '">' +
    '<button type="button" data-action="increase" aria-label="Aumentar quantidade">+</button></div></div></div>' +
    '<div class="customization-column">' + customization + '</div></div></article>';
}

function renderBackpackSummary() {
  const totals = backpackTotals();
  const valueText = formatCurrencyValue(totals.value, 'T$') + (totals.unknownMaterials ? ' + materiais' : '');
  const stats = [
    [totals.entries, totals.entries === 1 ? 'Entrada' : 'Entradas'],
    [totals.quantity, totals.quantity === 1 ? 'Item' : 'Itens'],
    [formatSpaces(totals.spaces), 'Espaços usados'],
    [valueText, 'Valor da mochila']
  ];
  backpackSummary.innerHTML = stats.map(function(stat) {
    return '<div class="summary-stat"><span class="summary-value">' + escapeHtml(stat[0]) + '</span><span class="summary-label">' +
      escapeHtml(stat[1]) + '</span></div>';
  }).join('');
}

function syncCatalogAcquiredUI() {
  itemsGrid.querySelectorAll('.item-card').forEach(function(card) {
    const count = countBackpackItem(card.dataset.itemId);
    card.classList.toggle('acquired', count > 0);
    const indicator = card.querySelector('[data-acquired-count]');
    if (!indicator) return;
    indicator.classList.toggle('has-items', count > 0);
    indicator.textContent = count ? count + (count === 1 ? ' adquirido' : ' adquiridos') : 'Ainda não adquirido';
  });
}

function syncBackpackHeader() {
  const totals = backpackTotals();
  backpackViewCount.textContent = String(totals.quantity);
  clearBackpack.disabled = totals.entries === 0;
}

function renderBackpack() {
  backpackItems.forEach(function(instance) {
    const item = itemById.get(instance.itemId);
    if (item) {
      sanitizeInstanceImprovements(instance, item);
      sanitizeInstanceEnchantments(instance, item);
    }
  });
  backpackList.innerHTML = backpackItems.map(backpackItemHtml).join('');
  backpackEmpty.classList.toggle('visible', backpackItems.length === 0);
  renderBackpackSummary();
  syncBackpackHeader();
  backpackList.querySelectorAll('.improvements-panel').forEach(function(panel) {
    panel.addEventListener('toggle', function() {
      if (panel.open) openImprovementPanels.add(panel.dataset.instanceId);
      else openImprovementPanels.delete(panel.dataset.instanceId);
    });
  });
  backpackList.querySelectorAll('.enchantments-panel').forEach(function(panel) {
    panel.addEventListener('toggle', function() {
      if (panel.open) openEnchantmentPanels.add(panel.dataset.instanceId);
      else openEnchantmentPanels.delete(panel.dataset.instanceId);
    });
  });
}

function refreshInventoryUI() {
  persistBackpack();
  syncBackpackHeader();
  if (state.view === 'backpack') renderBackpack();
  else syncCatalogAcquiredUI();
}

function addItemToBackpack(itemId) {
  const item = itemById.get(itemId);
  if (!item) return;
  let instance = backpackItems.find(function(entry) {
    return entry.itemId === itemId && entry.improvements.length === 0 && entry.enchantments.length === 0 && entry.quantity < 9999;
  });
  if (instance) instance.quantity += 1;
  else backpackItems.push({ instanceId: createInstanceId(), itemId: itemId, quantity: 1, improvements: [], enchantments: [] });
  refreshInventoryUI();
  showToast(item.nome + ' adicionado à mochila.');
}

function setView(view) {
  state.view = view === 'backpack' ? 'backpack' : 'catalog';
  const showBackpack = state.view === 'backpack';
  catalogView.hidden = showBackpack;
  backpackView.hidden = !showBackpack;
  filtersPanel.hidden = showBackpack;
  bookFilters.hidden = showBackpack;
  resetFilters.hidden = showBackpack;
  catalogViewBtn.classList.toggle('active', !showBackpack);
  backpackViewBtn.classList.toggle('active', showBackpack);
  catalogViewBtn.setAttribute('aria-pressed', String(!showBackpack));
  backpackViewBtn.setAttribute('aria-pressed', String(showBackpack));
  if (showBackpack) renderBackpack();
  else applyFilters();
}

function filteredItems() {
  const search = normalizeText(state.search);
  const results = preparedItems.filter(function(item) {
    const bookOk = item._books.some(function(book) { return state.books.has(book); });
    const typeOk = state.type === 'todos' || item.tipo === state.type;
    const categoryOk = state.category === 'todos' || (item.categoriaId || 'sem_categoria') === state.category;
    const combatOk = state.combat === 'todos' || item.arma && item.arma.combateId === state.combat;
    const gripOk = state.grip === 'todos' || item.arma && item.arma.empunhaduraId === state.grip;
    const searchOk = !search || item._search.includes(search);
    return bookOk && typeOk && categoryOk && combatOk && gripOk && searchOk;
  });

  results.sort(function(a, b) {
    if (state.sort === 'price-asc') return Number(a.preco.valor) - Number(b.preco.valor) || a.nome.localeCompare(b.nome, 'pt-BR');
    if (state.sort === 'price-desc') return Number(b.preco.valor) - Number(a.preco.valor) || a.nome.localeCompare(b.nome, 'pt-BR');
    if (state.sort === 'space-asc') return Number(a.espacos) - Number(b.espacos) || a.nome.localeCompare(b.nome, 'pt-BR');
    if (state.sort === 'type') return (TYPE_META[a.tipo] && TYPE_META[a.tipo].label || a.tipo).localeCompare(TYPE_META[b.tipo] && TYPE_META[b.tipo].label || b.tipo, 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR');
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });
  return results;
}

function updateTitle() {
  if (state.type === 'todos') catalogTitle.textContent = 'Todos os itens';
  else if (state.category !== 'todos') catalogTitle.textContent = CATEGORY_LABELS[state.category] || humanize(state.category);
  else catalogTitle.textContent = TYPE_META[state.type] && TYPE_META[state.type].label || humanize(state.type);
}

function applyFilters() {
  syncFilterUI();
  updateTitle();
  const results = filteredItems();
  itemsGrid.innerHTML = results.map(itemCard).join('');
  resultCount.textContent = results.length + (results.length === 1 ? ' item' : ' itens');
  emptyState.classList.toggle('visible', results.length === 0);
}

function getBackpackInstance(instanceId) {
  return backpackItems.find(function(entry) { return entry.instanceId === instanceId; });
}

function setInstanceQuantity(instance, quantity) {
  instance.quantity = Math.max(1, Math.min(9999, Math.floor(Number(quantity) || 1)));
  refreshInventoryUI();
}

function setInstanceImprovement(instance, item, slotIndex, improvementId) {
  const choices = (instance.improvements || []).slice();
  if (!improvementId) {
    choices.splice(slotIndex, 1);
  } else {
    const previous = choices[slotIndex];
    choices[slotIndex] = {
      id: improvementId,
      materialId: previous && previous.id === improvementId ? previous.materialId : ''
    };
  }
  instance.improvements = choices.filter(Boolean);
  sanitizeInstanceImprovements(instance, item);
  openImprovementPanels.add(instance.instanceId);
  refreshInventoryUI();
}

function setInstanceEnchantment(instance, item, slotIndex, enchantmentId) {
  const choices = (instance.enchantments || []).slice();
  if (!enchantmentId) choices.splice(slotIndex, 1);
  else choices[slotIndex] = enchantmentId;
  instance.enchantments = choices.filter(Boolean);
  sanitizeInstanceEnchantments(instance, item);
  openEnchantmentPanels.add(instance.instanceId);
  refreshInventoryUI();
}

itemsGrid.addEventListener('click', function(event) {
  const button = event.target.closest('[data-action="acquire"]');
  if (!button) return;
  addItemToBackpack(button.dataset.itemId);
});

catalogViewBtn.addEventListener('click', function() { setView('catalog'); });
backpackViewBtn.addEventListener('click', function() { setView('backpack'); });
document.getElementById('emptyBackpackCatalogBtn').addEventListener('click', function() { setView('catalog'); });

backpackList.addEventListener('click', function(event) {
  const actionButton = event.target.closest('button[data-action]');
  if (!actionButton) return;
  const card = actionButton.closest('.backpack-item');
  const instance = card && getBackpackInstance(card.dataset.instanceId);
  if (!instance) return;
  const action = actionButton.dataset.action;
  if (action === 'remove') {
    const item = itemById.get(instance.itemId);
    backpackItems = backpackItems.filter(function(entry) { return entry.instanceId !== instance.instanceId; });
    openImprovementPanels.delete(instance.instanceId);
    openEnchantmentPanels.delete(instance.instanceId);
    refreshInventoryUI();
    showToast((item ? item.nome : 'Item') + ' removido da mochila.');
  } else if (action === 'decrease') {
    setInstanceQuantity(instance, instance.quantity - 1);
  } else if (action === 'increase') {
    setInstanceQuantity(instance, instance.quantity + 1);
  }
});

backpackList.addEventListener('change', function(event) {
  const control = event.target;
  const card = control.closest('.backpack-item');
  const instance = card && getBackpackInstance(card.dataset.instanceId);
  if (!instance) return;
  const item = itemById.get(instance.itemId);
  if (!item) return;
  if (control.dataset.action === 'quantity') {
    setInstanceQuantity(instance, control.value);
  } else if (control.dataset.action === 'improvement') {
    setInstanceImprovement(instance, item, Number(control.dataset.slot), control.value);
  } else if (control.dataset.action === 'enchantment') {
    setInstanceEnchantment(instance, item, Number(control.dataset.slot), control.value);
  } else if (control.dataset.action === 'material') {
    const choice = instance.improvements.find(function(entry) { return entry.id === 'material_especial'; });
    if (!choice || !materialById.has(control.value)) return;
    choice.materialId = control.value;
    openImprovementPanels.add(instance.instanceId);
    refreshInventoryUI();
  }
});

clearBackpack.addEventListener('click', function() {
  if (!backpackItems.length) return;
  if (!window.confirm('Remover todos os itens adquiridos da mochila?')) return;
  backpackItems = [];
  openImprovementPanels.clear();
  openEnchantmentPanels.clear();
  refreshInventoryUI();
  showToast('Mochila esvaziada.');
});

bookFilters.addEventListener('click', function(event) {
  const button = event.target.closest('.book-chip');
  if (!button) return;
  const book = button.dataset.book;
  if (state.books.has(book)) state.books.delete(book);
  else state.books.add(book);
  applyFilters();
});

typeFilters.addEventListener('click', function(event) {
  const button = event.target.closest('.type-chip');
  if (!button) return;
  state.type = button.dataset.value;
  state.category = 'todos';
  state.combat = 'todos';
  state.grip = 'todos';
  renderContextFilters();
  applyFilters();
});

categoryFilters.addEventListener('click', function(event) {
  const button = event.target.closest('.category-chip');
  if (!button) return;
  state.category = button.dataset.value;
  applyFilters();
});

combatFilters.addEventListener('click', function(event) {
  const button = event.target.closest('.combat-chip');
  if (!button) return;
  state.combat = button.dataset.value;
  applyFilters();
});

gripFilters.addEventListener('click', function(event) {
  const button = event.target.closest('.grip-chip');
  if (!button) return;
  state.grip = button.dataset.value;
  applyFilters();
});

searchInput.addEventListener('input', function(event) {
  state.search = event.target.value;
  applyFilters();
});

sortSelect.addEventListener('change', function(event) {
  state.sort = event.target.value;
  applyFilters();
});

resetFilters.addEventListener('click', function() {
  state.books = new Set(allBooks);
  state.type = 'todos';
  state.category = 'todos';
  state.combat = 'todos';
  state.grip = 'todos';
  state.search = '';
  state.sort = 'name';
  searchInput.value = '';
  sortSelect.value = 'name';
  renderContextFilters();
  applyFilters();
});

renderBookFilters();
renderTypeFilters();
renderContextFilters();
setView('catalog');
</script>
</body>
</html>`;

const html = template
  .replace('__ITEM_DATA__', embeddedItems)
  .replace('__IMPROVEMENT_DATA__', embeddedImprovements)
  .replace('__ENCHANTMENT_DATA__', embeddedEnchantments);
fs.writeFileSync(outputPath, html, 'utf8');
console.log(`Catálogo criado: ${outputPath}`);
console.log(`Itens incorporados: ${catalog.itens.length}`);
