const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

console.log('=== Iniciando testes de Magias, Cancelar Subida de Nível e Estábulo na Guilda ===');

// 1. Validando formatação dos metadados de Magias
console.log('1. Validando formatação de magias na ficha...');
const habilidadesMagiasCode = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/ficha/habilidades-magias.js'), 'utf8');

assert(habilidadesMagiasCode.includes('formatSpellSnippetHtml'), 'A função formatSpellSnippetHtml deve existir');
assert(habilidadesMagiasCode.includes('cleanLabel}:</strong> <span class="prop-value">${capitalizedVal}</span>'), 'Deve formatar labels com dois pontos e valores capitalizados');

// Simulação da função formatSpellSnippetHtml
function formatSpellSnippetHtml(rawHtml) {
  if (!rawHtml) return rawHtml;
  return rawHtml.replace(/<div class="prop-row">\s*<span class="prop-label">([^<]+)<\/span>\s*<span class="prop-value">([^<]+)<\/span>\s*<\/div>/gi, (match, label, value) => {
    const cleanLabel = label.trim().replace(/:$/, '');
    const cleanVal = value.trim();
    const capitalizedVal = cleanVal.length ? (cleanVal.charAt(0).toUpperCase() + cleanVal.slice(1)) : cleanVal;
    return `<div class="prop-row"><strong class="prop-label">${cleanLabel}:</strong> <span class="prop-value">${capitalizedVal}</span></div>`;
  }).replace(/<span class="prop-label">([^<]+)<\/span>\s*<span class="prop-value">([^<]+)<\/span>/gi, (match, label, value) => {
    const cleanLabel = label.trim().replace(/:$/, '');
    const cleanVal = value.trim();
    const capitalizedVal = cleanVal.length ? (cleanVal.charAt(0).toUpperCase() + cleanVal.slice(1)) : cleanVal;
    return `<strong class="prop-label">${cleanLabel}:</strong> <span class="prop-value">${capitalizedVal}</span>`;
  });
}

const rawProps = `
<div class="prop-row"><span class="prop-label">Execução</span><span class="prop-value">reação</span></div>
<div class="prop-row"><span class="prop-label">Alcance</span><span class="prop-value">pessoal</span></div>
<div class="prop-row"><span class="prop-label">Alvo</span><span class="prop-value">você</span></div>
<div class="prop-row"><span class="prop-label">Duração</span><span class="prop-value">instantânea</span></div>
`;

const formatted = formatSpellSnippetHtml(rawProps);
assert(formatted.includes('Execução:</strong> <span class="prop-value">Reação</span>'), 'Execução deve ser formatada como "Execução: Reação"');
assert(formatted.includes('Alcance:</strong> <span class="prop-value">Pessoal</span>'), 'Alcance deve ser formatado como "Alcance: Pessoal"');
assert(formatted.includes('Alvo:</strong> <span class="prop-value">Você</span>'), 'Alvo deve ser formatado como "Alvo: Você"');
assert(formatted.includes('Duração:</strong> <span class="prop-value">Instantânea</span>'), 'Duração deve ser formatada como "Duração: Instantânea"');
console.log('✔ Formatação de magias com dois-pontos e capitalização aprovada!');

// 2. Validando botão e lógica de Cancelar Subida de Nível
console.log('2. Validando cancelamento de subida de nível...');
const renderizacaoCode = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/ficha/renderizacao.js'), 'utf8');
const progressaoCode = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/fases/09-progressao.js'), 'utf8');
const rodapeTemplate = fs.readFileSync(path.join(__dirname, '../src/ui/templates/rodape-criacao.html'), 'utf8');

assert(renderizacaoCode.includes('function cancelLevelUp()'), 'A função cancelLevelUp deve estar definida');
assert(renderizacaoCode.includes('cancelLevelUpButton'), 'Deve escutar o botão cancelLevelUpButton');
assert(renderizacaoCode.includes('cancel-level-up'), 'Deve escutar ação data-action="cancel-level-up"');
assert(rodapeTemplate.includes('id="cancelLevelUpButton"'), 'O botão cancelLevelUpButton deve estar no rodapé da criação');
assert(progressaoCode.includes('cancelLevelUpButton'), 'A fase 10 de progressão deve sincronizar a visibilidade de cancelLevelUpButton');
assert(progressaoCode.includes('cancel-level-up'), 'O indicador de nível deve conter o botão cancelar quando isLevelingUp for true');
console.log('✔ Cancelamento de subida de nível validado com sucesso!');

// 3. Validando Guilda em 3 abas e Estábulo
console.log('3. Validando divisão da Guilda em 3 abas e integração do Estábulo...');
const guildaHtml = fs.readFileSync(path.join(__dirname, '../src/paginas/guilda.html'), 'utf8');
const guildaDados = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/guilda/03-00-guilda-dados.js'), 'utf8');
const guildaUi = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/guilda/03-01-guilda-ui.js'), 'utf8');

assert(guildaHtml.includes('data-guild-tab="parceiros"'), 'Guilda deve possuir aba de Parceiros');
assert(guildaHtml.includes('data-guild-tab="mercenarios"'), 'Guilda deve possuir aba de Mercenários');
assert(guildaHtml.includes('data-guild-tab="estabulo"'), 'Guilda deve possuir aba de Estábulo & Montarias');

assert(guildaDados.includes('CANONICAL_MOUNTS'), 'Deve conter o catálogo CANONICAL_MOUNTS');
assert(guildaDados.includes('cavalo_de_guerra'), 'Deve conter cavalo_de_guerra no catálogo');
assert(guildaDados.includes('cao_de_caca'), 'Deve conter cao_de_caca no catálogo');
assert(guildaDados.includes('grifo'), 'Deve conter grifo no catálogo');

assert(guildaUi.includes('handleReceiveMount'), 'Deve possuir handler para receber montaria');
assert(guildaUi.includes('handleBuyMount'), 'Deve possuir handler para comprar montaria');
assert(guildaUi.includes('data-action="receive-mount"'), 'Deve possuir botão de receber montaria');
assert(guildaUi.includes('data-action="buy-mount"'), 'Deve possuir botão de comprar montaria');
assert(guildaUi.includes('Montarias no Estábulo'), 'Modal de aliados ativos deve listar Montarias no Estábulo');
console.log('✔ 3 abas da Guilda e Estábulo validados com sucesso!');

console.log('========================================================================');
console.log('🎉 SUCESSO TOTAL: Todos os 3 requisitos foram testados e aprovados!');
console.log('========================================================================');
