const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "..");
const itemSource = path.join(root, "backup-jsons", "itens.json");
const improvementSource = path.join(root, "backup-jsons", "melhorias.json");
const enchantmentSource = path.join(root, "backup-jsons", "encantamentos.json");
const weaponEnchantmentSource = path.join(root, "backup-jsons", "encantamentos_armas.json");
const outputFile = path.join(__dirname, "shop_import.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function text(value) {
  return value == null ? "" : String(value).trim();
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function yes(value) {
  return value ? "SIM" : "NAO";
}

function json(value) {
  return JSON.stringify(value == null ? [] : value);
}

function titleCaseId(value) {
  return text(value)
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("pt-BR") + part.slice(1))
    .join(" ");
}

const propertyNames = {
  adaptavel: "Adaptavel",
  agil: "Agil",
  alongada: "Alongada",
  arremesso: "Arremesso",
  desbalanceada: "Desbalanceada",
  dupla: "Dupla",
  ocultavel: "Ocultavel",
  versatil: "Versatil",
};

const reachNames = {
  "3m": "3m",
  "4_5m": "4,5m",
  cone_de_6m: "Cone de 6m",
  curto: "Curto",
  medio: "Medio",
};

const damageTypeNames = {
  acido: "Acido",
  corte: "Corte",
  impacto: "Impacto",
  perfuracao: "Perfuração",
};

const sectionDefinitions = [
  ["armas_simples", "Armas Simples", "arma", "simples", "arma"],
  ["armas_marciais", "Armas Marciais", "arma", "marcial", "arma"],
  ["armas_exoticas", "Armas Exóticas", "arma", "exotica", "arma"],
  ["armas_fogo", "Armas de Fogo", "arma", "fogo", "arma"],
  ["municoes", "Munições", "municao", "municao", "municao"],
  ["armaduras_leves", "Armaduras Leves", "armadura", "leve", "armadura"],
  ["armaduras_pesadas", "Armaduras Pesadas", "armadura", "pesada", "armadura"],
  ["escudos_leves", "Escudos Leves", "escudo", "leve", "escudo"],
  ["escudos_pesados", "Escudos Pesados", "escudo", "pesado", "escudo"],
  ["equipamento_aventura", "Equipamento de Aventura", "item_geral", "equipamento_aventura", "geral"],
  ["instrumentos", "Instrumentos", "item_geral", "instrumento", "geral"],
  ["ferramentas", "Ferramentas", "item_geral", "ferramenta", "geral"],
  ["vestuario", "Vestuário", "item_geral", "vestuario", "geral"],
  ["esotericos", "Esotéricos", "item_geral", "esoterico", "geral"],
  ["preparados", "Preparados Alquímicos", "item_geral", "alquimico_preparado", "geral"],
  ["catalisadores", "Catalisadores Alquímicos", "item_geral", "alquimico_catalisador", "geral"],
  ["venenos", "Venenos Alquímicos", "item_geral", "alquimico_venenoso", "geral"],
  ["alimentacao", "Alimentação", "item_geral", "alimentacao", "geral"],
  ["bebidas", "Bebidas", "item_geral", "bebida", "geral"],
  ["animais", "Animais", "item_geral", "animal", "geral"],
  ["veiculos", "Veículos", "item_geral", "veiculo", "geral"],
  ["aparatos", "Aparatos", "item_geral", "aparato", "geral"],
  ["servicos", "Serviços", "item_geral", "servico", "geral"],
].map(([id, title, type, category, layout]) => ({ id, title, type, category, layout }));

const itemData = readJson(itemSource);
const improvementData = readJson(improvementSource);
const enchantmentData = readJson(enchantmentSource);
const weaponEnchantmentData = readJson(weaponEnchantmentSource);

function isFiringWeapon(item) {
  const weapon = item.arma || {};
  if (weapon.combateId === "corpo_a_corpo_e_distancia") return true;
  if (weapon.combateId !== "a_distancia") return false;
  const haystack = `${item.nome} ${item.textos?.habilidade || ""} ${item.textos?.variavel || ""}`.toLocaleLowerCase("pt-BR");
  return /(recarreg|dispar|arco|besta|balestra|funda|mosquete|pistola|garrucha|canh[aã]o|bacamarte|carabina|rifle)/i.test(haystack);
}

function weaponAttribute(item, isThrowing, isFiring) {
  const variable = text(item.textos?.variavel);
  if (/destreza em vez de forca|destreza em vez de forca|destreza em vez de for[cç]a/i.test(variable.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))) {
    return "FOR ou DES";
  }
  if (list(item.efeitos).some((effect) => effect.tipo === "usar_atributo_no_dano" && effect.atributoId === "for")) return "FOR";
  if (item.arma?.combateId === "corpo_a_corpo" || item.arma?.combateId === "corpo_a_corpo_e_distancia" || isThrowing) return "FOR";
  if (isFiring) return "-";
  return "-";
}

function sectionFor(item) {
  let category = item.categoriaId;
  if (item.tipo === "escudo") category = item.escudo?.categoriaId || category;
  return sectionDefinitions.find((section) => section.type === item.tipo && section.category === category)?.id || "";
}

function improvementClass(item) {
  if (item.tipo === "arma") return "arma";
  if (item.tipo === "municao") return "municao";
  if (item.tipo === "armadura") return "armadura";
  if (item.tipo === "escudo") return "escudo";
  if (item.tipo === "item_geral" && ["esoterico", "ferramenta", "vestuario"].includes(item.categoriaId)) return item.categoriaId;
  return "";
}

function materialApplication(item) {
  if (item.tipo === "arma") return "arma";
  if (item.tipo === "armadura") return item.armadura?.categoriaId === "pesada" ? "armadura_pesada" : "armadura_leve";
  if (item.tipo === "escudo") return "escudo";
  if (item.tipo === "item_geral" && item.categoriaId === "esoterico") return "esoterico";
  return "";
}

const items = itemData.itens.map((item) => {
  const weapon = item.arma || {};
  const armor = item.armadura || {};
  const shield = item.escudo || {};
  const properties = list(weapon.propriedadesIds);
  const isMelee = weapon.combateId === "corpo_a_corpo" || weapon.combateId === "corpo_a_corpo_e_distancia";
  const isFiring = item.tipo === "arma" && isFiringWeapon(item);
  const isThrowing = item.tipo === "arma" && (properties.includes("arremesso") || (weapon.combateId === "a_distancia" && !isFiring));
  const damage = [text(weapon.dano?.principal), ...list(weapon.dano?.alternativas).map(text)].filter(Boolean).join("/");
  const threshold = Number.isFinite(weapon.critico?.margem) ? weapon.critico.margem : null;
  const damageTypes = list(weapon.tipoDanoIds);
  const groups = list(weapon.gruposArmaIds);
  const dwarfName = /(machad|martel|marret|picaret)/i.test(item.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  const itemTexts = item.textos || {};
  const allRuleText = `${itemTexts.habilidade || ""} ${itemTexts.variavel || ""} ${json(item.efeitos)}`;

  return {
    id: item.id,
    nome: item.nome,
    tipo: item.tipo,
    categoriaId: item.categoriaId || shield.categoriaId || "",
    secaoId: sectionFor(item),
    livroOrigemId: item.livroOrigemId || "",
    livrosOrigemIds: list(item.livrosOrigemIds).join(";"),
    preco: Number(item.preco?.valor || 0),
    moeda: item.preco?.moeda || itemData.moedaPadrao || "T$",
    espacos: Number(item.espacos || 0),
    habilidade: text(itemTexts.habilidade),
    variavel: text(itemTexts.variavel),
    descricao: text(itemTexts.descricao),
    efeitosJson: json(item.efeitos),
    combateId: text(weapon.combateId),
    empunhaduraId: text(weapon.empunhaduraId),
    dano: damage || "-",
    margemOriginal: threshold,
    margemCritico: threshold == null ? "" : 20 - threshold,
    multiplicadorCritico: Number.isFinite(weapon.critico?.multiplicador) ? weapon.critico.multiplicador : "",
    alcance: reachNames[weapon.alcanceId] || titleCaseId(weapon.alcanceId) || "-",
    tiposDanoIds: damageTypes.join(";"),
    tiposDano: damageTypes.map((id) => damageTypeNames[id] || titleCaseId(id)).join(" ou ") || "-",
    propriedadesIds: properties.join(";"),
    propriedades: properties.map((id) => propertyNames[id] || titleCaseId(id)).join(", "),
    gruposArmaIds: groups.join(";"),
    corpoACorpo: yes(isMelee),
    arremesso: yes(isThrowing),
    disparo: yes(isFiring),
    leve: yes(weapon.empunhaduraId === "leve"),
    umaMao: yes(weapon.empunhaduraId === "uma_mao"),
    duasMaos: yes(weapon.empunhaduraId === "duas_maos"),
    atributo: item.tipo === "arma" ? weaponAttribute(item, isThrowing, isFiring) : "",
    armaAna: yes(item.tipo === "arma" && (groups.includes("armas_anas") || dwarfName)),
    armaduraCategoria: text(armor.categoriaId),
    defesa: Number.isFinite(armor.defesa) ? armor.defesa : "",
    penalidadeArmadura: Number.isFinite(armor.penalidade) ? armor.penalidade : "",
    usaDestrezaDefesa: armor.usaDestrezaNaDefesa == null ? "" : yes(armor.usaDestrezaNaDefesa),
    escudoCategoria: text(shield.categoriaId),
    bonusDefesaEscudo: Number.isFinite(shield.bonusDefesa) ? shield.bonusDefesa : "",
    penalidadeEscudo: Number.isFinite(shield.penalidade) ? shield.penalidade : "",
    melhoriaClasse: improvementClass(item),
    materialAplicacao: materialApplication(item),
    modificaPericia: yes(/pericia|pericia|testes? de/i.test(allRuleText.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))),
    magicoTipo: text(item.magico?.tipo),
    magicoCategoria: text(item.magico?.categoriaId),
    magicoJson: json(item.magico),
  };
});

const costByMaterial = new Map(
  list(improvementData.custosMateriaisBasicos).map((entry) => [entry.materialEspecialId, entry.custos || {}])
);

function expandedApplications(material) {
  const costs = costByMaterial.get(material.id) || {};
  const applications = material.aplicacoes || {};
  const result = new Set([...Object.keys(costs), ...Object.keys(applications)]);
  if (result.has("armadura")) {
    result.delete("armadura");
    result.add("armadura_leve");
    result.add("armadura_pesada");
  }
  return [...result];
}

function applicationData(material, applicationId) {
  const applications = material.aplicacoes || {};
  return applications[applicationId] || (applicationId.startsWith("armadura_") ? applications.armadura : null) || {};
}

const materials = [];
for (const material of list(improvementData.materiaisEspeciais)) {
  const costs = costByMaterial.get(material.id) || {};
  for (const applicationId of expandedApplications(material)) {
    const app = applicationData(material, applicationId);
    const known = Number.isFinite(costs[applicationId]);
    materials.push({
      id: material.id,
      nome: material.nome,
      exibicao: known ? material.nome : `${material.nome} (custo manual)`,
      aplicacaoId: applicationId,
      custo: known ? Number(costs[applicationId]) : 0,
      custoConhecido: yes(known),
      resumo: text(app.resumo),
      restricoesJson: json(app.restricoes),
      efeitosJson: json(app.efeitos),
      livrosOrigemIds: list(material.livrosOrigemIds).join(";"),
    });
  }
}

const materialApplications = new Set(materials.map((material) => material.aplicacaoId));
const improvements = list(improvementData.melhorias).map((improvement) => ({
  id: improvement.id,
  nome: improvement.nome,
  categoriasIds: list(improvement.categoriasIds).join(";"),
  livrosOrigemIds: list(improvement.livrosOrigemIds).join(";"),
  resumo: text(improvement.resumo),
  preRequisitosJson: json(improvement.preRequisitos),
  restricoesJson: json(improvement.restricoes),
  escolhasJson: json(improvement.escolhas),
  efeitosJson: json(improvement.efeitos),
  grupoAplicacaoIds: list(improvement.grupoAplicacaoIds).join(";"),
}));

const enchantments = [
  ...list(enchantmentData.encantamentos),
  ...list(weaponEnchantmentData.encantamentos),
].map((enchantment) => ({
  id: enchantment.id,
  nome: enchantment.nome,
  aplicacoesIds: list(enchantment.aplicacoesIds).join(";"),
  livrosOrigemIds: list(enchantment.livrosOrigemIds).join(";") || enchantmentData.livroOrigemId || "",
  descricao: text(enchantment.descricao),
  preRequisitosIds: list(enchantment.preRequisitosIds).join(";"),
  restricoesJson: json(enchantment.restricoes),
  efeitosJson: json(enchantment.efeitos),
}));

const enchantmentLists = Object.fromEntries(
  ["arma", "armadura", "escudo"].map((targetClass) => [
    targetClass,
    enchantments
      .filter((enchantment) => enchantment.aplicacoesIds.split(";").includes(targetClass))
      .map((enchantment) => enchantment.nome)
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
  ])
);

function improvementAllowedInList(improvement, targetClass) {
  const categories = improvement.categoriasIds.split(";").filter(Boolean);
  const restrictions = JSON.parse(improvement.restricoesJson || "[]");
  if (improvement.id === "material_especial" && targetClass === "municao") return false;
  if (targetClass === "municao") return categories.includes("arma");
  if (!categories.includes(targetClass)) return false;
  if (targetClass === "arma" && restrictions.some((restriction) => restriction.tipo === "municao")) return false;
  if (improvement.id === "material_especial") {
    if (targetClass === "armadura") return materialApplications.has("armadura_leve") || materialApplications.has("armadura_pesada");
    return materialApplications.has(targetClass);
  }
  return true;
}

const listClasses = ["arma", "municao", "armadura", "escudo", "esoterico", "ferramenta", "vestuario"];
const improvementLists = Object.fromEntries(
  listClasses.map((targetClass) => [
    targetClass,
    improvements
      .filter((improvement) => improvementAllowedInList(improvement, targetClass))
      .map((improvement) => improvement.nome)
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
  ])
);

const materialLists = Object.fromEntries(
  ["arma", "armadura_leve", "armadura_pesada", "escudo", "esoterico"].map((applicationId) => [
    applicationId,
    materials
      .filter((material) => material.aplicacaoId === applicationId)
      .map((material) => material.exibicao)
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
  ])
);

const sections = sectionDefinitions.map((section) => ({
  ...section,
  itemIds: items
    .filter((item) => item.secaoId === section.id)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    .map((item) => item.id),
}));

const uncategorized = items.filter((item) => !item.secaoId).map((item) => `${item.tipo}:${item.nome}`);
if (uncategorized.length) throw new Error(`Itens sem secao: ${uncategorized.join(", ")}`);

const output = {
  schemaVersion: "1.0.0",
  source: {
    itens: path.relative(root, itemSource).replace(/\\/g, "/"),
    melhorias: path.relative(root, improvementSource).replace(/\\/g, "/"),
    encantamentos: path.relative(root, enchantmentSource).replace(/\\/g, "/"),
    encantamentosArmas: path.relative(root, weaponEnchantmentSource).replace(/\\/g, "/"),
  },
  pricing: {
    improvementSurcharges: [0, 300, 3000, 9000, 18000],
    productionCdIncrease: [0, 5, 10, 15, 20],
    ammunitionMultiplier: 0.5,
    enchantmentSurcharges: enchantmentData.regras?.precosAdicionais || [0, 18000, 36000, 72000],
    enchantmentCdIncrease: enchantmentData.regras?.modificadoresCdFabricacao || [0, 10, 15, 20],
    permanentMagicItemRules: enchantmentData.regras || {},
  },
  layouts: {
    arma: {
      headers: ["Item", "Preço Base", "Dano", "Margem Crítico (0=20)", "Multiplicador Crítico", "Alcance", "Tipo", "Espaços", "Corpo a Corpo", "Ataque à Distância (Arremesso)", "Ataque à Distância (Disparo)", "Leve", "Uma Mão", "Duas Mãos", "Atributo", "Habilidades de Arma", "Efeito", "OBS", "1ª Melhoria", "2ª Melhoria", "3ª Melhoria", "4ª Melhoria", "Material Especial", "Encantamento", "Arma anã", "Preço Final", "CD Fabricação", "Descrição"],
      improvementStart: 19,
      improvementEnd: 22,
      materialColumn: 23,
      priceColumn: 26,
      cdColumn: 27,
      descriptionColumn: 28,
    },
    municao: {
      headers: ["Munição", "Preço Base", "Espaços", "Efeito", "OBS", "1ª Melhoria", "2ª Melhoria", "3ª Melhoria", "4ª Melhoria", "Material Especial", "Encantamento", "Preço Final", "CD Fabricação", "Descrição"],
      improvementStart: 6,
      improvementEnd: 9,
      materialColumn: 10,
      priceColumn: 12,
      cdColumn: 13,
      descriptionColumn: 14,
    },
    armadura: {
      headers: ["Armadura", "Preço Base", "Bônus na Defesa", "Penalidade de Armadura", "Espaços", "Leve", "Pesada", "Habilidade", "Efeito", "OBS", "1ª Melhoria", "2ª Melhoria", "3ª Melhoria", "4ª Melhoria", "Material Especial", "Encantamento", "Preço Final", "CD Fabricação", "Descrição"],
      improvementStart: 11,
      improvementEnd: 14,
      materialColumn: 15,
      priceColumn: 17,
      cdColumn: 18,
      descriptionColumn: 19,
    },
    escudo: {
      headers: ["Escudo", "Preço Base", "Bônus na Defesa", "Penalidade de Armadura", "Espaços", "Leve", "Pesado", "Habilidade", "Efeito", "OBS", "1ª Melhoria", "2ª Melhoria", "3ª Melhoria", "4ª Melhoria", "Material Especial", "Encantamento", "Preço Final", "CD Fabricação", "Descrição"],
      improvementStart: 11,
      improvementEnd: 14,
      materialColumn: 15,
      priceColumn: 17,
      cdColumn: 18,
      descriptionColumn: 19,
    },
    geral: {
      headers: ["Item", "Preço Base", "Espaços", "Efeito", "OBS", "1ª Melhoria", "2ª Melhoria", "3ª Melhoria", "4ª Melhoria", "Material Especial", "Encantamento", "Preço Final", "CD Fabricação", "Descrição"],
      improvementStart: 6,
      improvementEnd: 9,
      materialColumn: 10,
      priceColumn: 12,
      cdColumn: 13,
      descriptionColumn: 14,
    },
  },
  sections,
  items,
  improvements,
  enchantments,
  materials,
  improvementLists,
  enchantmentLists,
  materialLists,
};

fs.writeFileSync(outputFile, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(
  JSON.stringify(
    {
      items: items.length,
      sections: sections.length,
      improvements: improvements.length,
      materials: materials.length,
      sectionCounts: Object.fromEntries(sections.map((section) => [section.id, section.itemIds.length])),
      listCounts: {
      improvements: Object.fromEntries(Object.entries(improvementLists).map(([key, values]) => [key, values.length])),
        enchantments: Object.fromEntries(Object.entries(enchantmentLists).map(([key, values]) => [key, values.length])),
        materials: Object.fromEntries(Object.entries(materialLists).map(([key, values]) => [key, values.length])),
      },
    },
    null,
    2
  )
);
