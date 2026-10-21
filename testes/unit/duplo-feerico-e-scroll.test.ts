/**
 * Suíte de Testes Unitários: Duplo Feérico e Rolagem Automática entre Escolhas
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// 1. Validar que Duplo Feérico existe em dados/criador-regionalOrigins.json
const regionalOriginsPath = resolve(process.cwd(), 'dados/criador-regionalOrigins.json');
const regionalOrigins = JSON.parse(readFileSync(regionalOriginsPath, 'utf-8'));
const duplo = regionalOrigins.find((o: any) => o.nome === 'Duplo Feérico');
assert.ok(duplo, 'Origem regional Duplo Feérico deve existir no catálogo de origens regionais');
assert.equal(duplo.regiao, 'Pondsmânia');

// 2. Validar que pericias-prerequisitos.ts contém a seção de Duplo Feérico na Fase 3
const prereqPath = resolve(process.cwd(), 'src/regras/criador/pericias-prerequisitos.ts');
const prereqCode = readFileSync(prereqPath, 'utf-8');
assert.ok(prereqCode.includes("regSlug === 'duplo_feerico'"), 'pericias-prerequisitos.ts deve tratar regSlug duplo_feerico');
assert.ok(prereqCode.includes('duploFeericoChoiceSection'), 'pericias-prerequisitos.ts deve conter duploFeericoChoiceSection');
assert.ok(prereqCode.includes('duplo-feerico-select-dropdown'), 'pericias-prerequisitos.ts deve permitir seleção direta via dropdown');

// 3. Validar que 02-raca-atributos.ts valida Duplo Feérico em originMissingChoices
const racaPath = resolve(process.cwd(), 'src/funcionalidades/criador/fases/02-raca-atributos.ts');
const racaCode = readFileSync(racaPath, 'utf-8');
assert.ok(racaCode.includes("regSlug === 'duplo_feerico'"), '02-raca-atributos.ts deve validar duplo_feerico em originMissingChoices');
assert.ok(racaCode.includes('duploFeericoChoiceSection'), '02-raca-atributos.ts deve referenciar o seletor duploFeericoChoiceSection');

// 4. Validar que expansoes-raciais.ts foi corrigido para a etapa 4 (Perícias) e possui rolagem automática
const expansoesPath = resolve(process.cwd(), 'src/regras/criador/expansoes-raciais.ts');
const expansoesCode = readFileSync(expansoesPath, 'utf-8');
assert.ok(expansoesCode.includes('if(state.step!==4)return;'), 'scrollToNextSkillGroup deve executar na Fase 4 (Perícias)');
assert.ok(!expansoesCode.includes('if(state.step!==3)return;'), 'scrollToNextSkillGroup não deve mais checar step 3');
assert.ok(expansoesCode.includes('duploFeericoChoiceSection'), 'expansoes-raciais.ts deve rolar para duploFeericoChoiceSection ao selecionar a origem');

// 5. Validar que 01-identidade-escolhas.ts invoca scrollToNextSkillGroup
const identPath = resolve(process.cwd(), 'src/funcionalidades/criador/fases/01-identidade-escolhas.ts');
const identCode = readFileSync(identPath, 'utf-8');
assert.ok(identCode.includes('scrollToNextSkillGroup(group)'), '01-identidade-escolhas.ts deve invocar scrollToNextSkillGroup após selecionar perícia');

// 6. Validar que 06-poderes.ts e poderes-sequenciais.ts contêm rolagem suave para Duplo Feérico
const poderesPath = resolve(process.cwd(), 'src/funcionalidades/criador/fases/06-poderes.ts');
const poderesCode = readFileSync(poderesPath, 'utf-8');
assert.ok(poderesCode.includes('hasDuploFeerico()&&!selectedDuploFeericoPower()'), '06-poderes.ts deve checar duplo feérico pendente');

const seqPath = resolve(process.cwd(), 'src/funcionalidades/criador/fases/poderes-sequenciais.ts');
const seqCode = readFileSync(seqPath, 'utf-8');
assert.ok(seqCode.includes('.duplo-feerico-row'), 'poderes-sequenciais.ts deve direcionar tela para .duplo-feerico-row');

console.log('✔ Todos os testes de Duplo Feérico e direcionamento de tela foram aprovados!');
