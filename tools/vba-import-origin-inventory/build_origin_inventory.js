const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const generalPath = path.join(root, "backup-jsons", "origens.json");
const regionalPath = path.join(root, "backup-jsons", "origem_regional.json");
const shopPath = path.join(root, "tools", "vba-import-shop", "shop_import.json");
const outputPath = path.join(__dirname, "origin_inventory_import.json");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const join = (values) => (Array.isArray(values) ? values.filter(Boolean).join(";") : "");
const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const skillNames = [
  "Acrobacia", "Adestramento", "Atletismo", "Atuação", "Cavalgar", "Conhecimento", "Cura",
  "Diplomacia", "Enganação", "Fortitude", "Furtividade", "Guerra", "Iniciativa", "Intimidação",
  "Intuição", "Investigação", "Jogatina", "Ladinagem", "Luta", "Misticismo", "Nobreza", "Ofício",
  "Percepção", "Pilotagem", "Pontaria", "Reflexos", "Religião", "Sobrevivência", "Vontade",
];

function fixedRegionalSkills(description) {
  const text = String(description || "");
  const match = /(?:é|e)\s+treinad[oa]\s+em\s+(.+?)(?=\s+e\s+(?:possui|pode|recebe|aprende)|,\s*e\b|\.|$)/i.exec(text);
  if (!match) return [];
  const segment = normalize(match[1]);
  const result = [];
  for (const skill of skillNames) {
    if (!segment.includes(normalize(skill))) continue;
    if (skill === "Ofício") {
      const office = /of[ií]cio\s*\(([^)]+)\)/i.exec(match[1]);
      result.push(office ? `Ofício (${office[1]})` : "Ofício");
    } else {
      result.push(skill);
    }
  }
  return result;
}

const general = readJson(generalPath).origens || [];
const regional = readJson(regionalPath).origens_regionais || [];

const origins = [
  ...general.map((origin) => ({
    nome: origin.nome,
    pericias: join(origin.beneficios?.pericias),
    poderes: join(origin.beneficios?.poderes),
    poderUnico: origin.beneficios?.poder_unico?.nome || "",
    poderUnicoDescricao: origin.beneficios?.poder_unico?.descricao || "",
    itens: join(origin.itens),
    tipo: "Geral",
    regiao: "",
    beneficioFixo: "",
    periciasFixas: "",
  })),
  ...regional.map((origin) => ({
    nome: origin.nome,
    pericias: "",
    poderes: "",
    poderUnico: "",
    poderUnicoDescricao: "",
    itens: join(origin.itens),
    tipo: "Regional",
    regiao: origin.regiao || "",
    beneficioFixo: origin.beneficios?.descricao || "",
    periciasFixas: fixedRegionalSkills(origin.beneficios?.descricao).join(";"),
  })),
].sort((left, right) => left.nome.localeCompare(right.nome, "pt-BR"));

const shop = readJson(shopPath);
const nameCounts = new Map();
for (const item of shop.items) {
  const key = normalize(item.nome);
  nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
}

const typeLabels = {
  arma: "arma",
  municao: "munição",
  armadura: "armadura",
  escudo: "escudo",
  item_geral: "item",
};

const items = shop.items
  .map((item) => {
    const duplicate = nameCounts.get(normalize(item.nome)) > 1;
    const suffix = typeLabels[item.tipo] || item.categoriaId || "item";
    return {
      exibicao: duplicate ? `${item.nome} [${suffix}]` : item.nome,
      itemId: item.id,
      nome: item.nome,
      tipo: item.tipo,
      categoriaId: item.categoriaId,
      espacos: Number(item.espacos || 0),
      combateId: item.combateId || "",
      empunhaduraId: item.empunhaduraId || "",
      dano: item.dano || "",
      margemCritico: item.margemCritico === "" ? "" : item.margemCritico,
      multiplicadorCritico: item.multiplicadorCritico === "" ? "" : item.multiplicadorCritico,
      alcance: item.alcance || "-",
      tiposDano: item.tiposDano || "",
      corpoACorpo: item.corpoACorpo || "NAO",
      arremesso: item.arremesso || "NAO",
      disparo: item.disparo || "NAO",
      armaduraCategoria: item.armaduraCategoria || "",
      defesa: item.defesa === "" ? "" : item.defesa,
      penalidadeArmadura: item.penalidadeArmadura === "" ? "" : item.penalidadeArmadura,
      escudoCategoria: item.escudoCategoria || "",
      bonusDefesaEscudo: item.bonusDefesaEscudo === "" ? "" : item.bonusDefesaEscudo,
      penalidadeEscudo: item.penalidadeEscudo === "" ? "" : item.penalidadeEscudo,
      atributo: item.atributo || "",
    };
  })
  .sort((left, right) => left.exibicao.localeCompare(right.exibicao, "pt-BR"));

const duplicateOrigins = origins.filter((origin, index) => origins.findIndex((candidate) => normalize(candidate.nome) === normalize(origin.nome)) !== index);
if (duplicateOrigins.length) throw new Error(`Origens duplicadas: ${duplicateOrigins.map((origin) => origin.nome).join(", ")}`);

const output = {
  schemaVersion: "1.0.0",
  sources: {
    general: path.relative(root, generalPath).replace(/\\/g, "/"),
    regional: path.relative(root, regionalPath).replace(/\\/g, "/"),
    items: path.relative(root, shopPath).replace(/\\/g, "/"),
  },
  origins,
  items,
};

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  origins: origins.length,
  generalOrigins: general.length,
  regionalOrigins: regional.length,
  regionalOriginsWithFixedSkills: origins.filter((origin) => origin.tipo === "Regional" && origin.periciasFixas).length,
  items: items.length,
  duplicateItemNames: [...nameCounts.values()].filter((count) => count > 1).length,
}, null, 2));
