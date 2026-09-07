const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "..");
const rawPath = path.join(root, "classes.txt");
const powersPath = path.join(root, "backup-jsons", "poderes_classe.json");
const originalPowersPath = path.join(root, "backups", "jsons", "backup-jsons-copia", "poderes_classe.json");
const classesPath = path.join(root, "backup-jsons", "classes_full.json");
const outputJsonPath = path.join(__dirname, "poderes_catalogo_import.json");
const referenceJsonPath = path.join(root, "backup-jsons", "referencia_poderes_classe.json");

const rawText = fs.readFileSync(rawPath, "utf8");
const lines = rawText.split(/\r?\n/);
const classes = JSON.parse(fs.readFileSync(classesPath, "utf8"));
const existing = JSON.parse(fs.readFileSync(fs.existsSync(originalPowersPath) ? originalPowersPath : powersPath, "utf8"));

const classNameById = new Map(classes.map((c) => [c.id, c.nome || c.id]));
const classBookById = new Map(classes.map((c) => [c.id, c.livroOrigemId || "fonte_nao_informada"]));

const variantBaseById = new Map([
  ["necromante", "arcanista"],
  ["machado_de_pedra", "barbaro"],
  ["magimarcialista", "bardo"],
  ["duelista", "bucaneiro"],
  ["seteiro", "cacador"],
  ["vassalo", "cavaleiro"],
  ["usurpador", "clerigo"],
  ["ermitao", "druida"],
  ["inovador", "guerreiro"],
  ["alquimista", "inventor"],
  ["ventanista", "ladino"],
  ["atleta", "lutador"],
  ["burgues", "nobre"],
  ["santo", "paladino"],
]);

const completeDirectClassSources = new Set([
  "bucaneiro",
  "cacador",
  "cavaleiro",
  "clerigo",
  "druida",
  "guerreiro",
  "ladino",
  "lutador",
  "miragem",
  "mistico",
  "nobre",
]);

const bulletSections = [
  { classId: "bucaneiro", start: 456, end: 492 },
  { classId: "cacador", start: 545, end: 589 },
  { classId: "miragem", start: 4505, end: 4541 },
  { classId: "mistico", start: 4650, end: 4696 },
  { classId: "mistico", start: 4706, end: 4752 },
];

const markdownSections = [
  { classId: "cavaleiro", start: 695, end: 887, skip: ["Posturas de Combate"] },
  { classId: "clerigo", start: 1038, end: 1180 },
  { classId: "druida", start: 1308, end: 1504 },
  { classId: "guerreiro", start: 1732, end: 1892 },
  { classId: "ladino", start: 2303, end: 2492 },
  { classId: "lutador", start: 2604, end: 2777 },
  { classId: "nobre", start: 2859, end: 2984 },
  { classId: "paladino", start: 3099, end: 3137, summarized: true },
];

const listOnlySections = [
  { classId: "treinador", start: 3259, end: 3271, summarized: true },
];

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function idText(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function cleanLine(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .trim();
}

function cleanName(value) {
  return cleanLine(value)
    .replace(/^#+\s*/, "")
    .replace(/\s*\((?:\d+o|\d+º).*\)\s*$/i, "")
    .replace(/[.:]\s*$/, "")
    .trim();
}

function normalizeDescription(value) {
  return cleanLine(value)
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();
}

function extractPrereq(description) {
  let prereq = "";
  let text = description;
  const re = /\bPr[eé]-requisitos?:\s*([^.\n]+)\.?/giu;
  text = text.replace(re, (_match, req) => {
    prereq = normalizeDescription(req).replace(/\s+e$/i, "");
    return "";
  });
  return {
    description: normalizeDescription(text),
    prereq,
  };
}

function isRepeatable(description) {
  const n = normalizeText(description);
  return (
    n.includes("pode escolher este poder varias vezes") ||
    n.includes("pode escolher este poder outras vezes") ||
    n.includes("pode escolher este poder quantas vezes quiser") ||
    n.includes("quantas vezes quiser")
  );
}

function minLevelFromReq(req) {
  const match = normalizeText(req).match(/(\d+)\s*o?\s*nivel/);
  return match ? Number(match[1]) : "";
}

function canonicalReqForMerge(req) {
  let value = normalizeText(req);
  for (const [classId, className] of classNameById.entries()) {
    const id = normalizeText(classId).replace(/_/g, " ");
    const name = normalizeText(className);
    value = value.replace(new RegExp(`\\bde\\s+${id}\\b`, "g"), "");
    value = value.replace(new RegExp(`\\bdo\\s+${id}\\b`, "g"), "");
    if (name) {
      value = value.replace(new RegExp(`\\bde\\s+${name}\\b`, "g"), "");
      value = value.replace(new RegExp(`\\bdo\\s+${name}\\b`, "g"), "");
    }
  }
  value = value
    .replace(/\bcom a arma escolhida\b/g, "")
    .replace(/\bespecializacao em arma\s*,/g, "especializacao em arma,")
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ",")
    .replace(/,+/g, ",")
    .replace(/^,|,$/g, "")
    .trim();

  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .sort()
    .join(",");
}

function parseBulletSections() {
  const out = [];
  for (const section of bulletSections) {
    let current = null;
    const push = () => {
      if (!current) return;
      current.descricao = normalizeDescription(current.descLines.join(" "));
      delete current.descLines;
      out.push(current);
      current = null;
    };

    for (let i = section.start - 1; i <= section.end - 1 && i < lines.length; i += 1) {
      const line = cleanLine(lines[i]);
      if (!line) continue;
      const bullet = line.match(/^•\s*(.+)$/u);
      if (bullet) {
        push();
        const text = bullet[1].trim();
        const split = text.match(/^(.+?)\.\s*(.*)$/u);
        if (!split) continue;
        current = {
          classId: section.classId,
          nome: cleanName(split[1]),
          descLines: [split[2]],
          rawLine: i + 1,
          source: "classes.txt",
          summarized: Boolean(section.summarized),
        };
      } else if (current) {
        current.descLines.push(line);
      }
    }
    push();
  }
  return out;
}

function parseMarkdownSections() {
  const out = [];
  for (const section of markdownSections) {
    let current = null;
    const skip = new Set((section.skip || []).map(normalizeText));
    const push = () => {
      if (!current) return;
      current.descricao = normalizeDescription(current.descLines.join(" "));
      delete current.descLines;
      if (current.nome && !skip.has(normalizeText(current.nome))) out.push(current);
      current = null;
    };

    for (let i = section.start - 1; i <= section.end - 1 && i < lines.length; i += 1) {
      const line = cleanLine(lines[i]);
      const heading = line.match(/^###\s+(.+)$/u);
      if (heading) {
        push();
        current = {
          classId: section.classId,
          nome: cleanName(heading[1]),
          descLines: [],
          rawLine: i + 1,
          source: "classes.txt",
          summarized: Boolean(section.summarized),
        };
      } else if (current && line && line !== "---") {
        current.descLines.push(line);
      }
    }
    push();
  }
  return out;
}

function parseListOnlySections() {
  const out = [];
  for (const section of listOnlySections) {
    for (let i = section.start - 1; i <= section.end - 1 && i < lines.length; i += 1) {
      const line = cleanLine(lines[i]);
      const item = line.match(/^\*\s*(.+)$/u);
      if (!item) continue;
      const nome = cleanName(item[1]);
      out.push({
        classId: section.classId,
        nome,
        descricao: "Texto completo ainda pendente na fonte bruta. Poder listado para permitir a escolha e revisão posterior.",
        rawLine: i + 1,
        source: "classes.txt",
        summarized: Boolean(section.summarized),
      });
    }
  }
  return out;
}

function reqFromStructured(pre) {
  if (!pre || typeof pre !== "object") return "";
  const req = [];
  if (pre.atributos) {
    for (const [attr, value] of Object.entries(pre.atributos)) {
      req.push(`${attr.toUpperCase()} ${value}`);
    }
  }
  if (pre.nivelClasse) req.push(`${pre.nivelClasse}º nível`);
  if (Array.isArray(pre.poderes)) req.push(...pre.poderes.map((p) => String(p).replace(/^.*?_/, "").replace(/_/g, " ")));
  if (Array.isArray(pre.periciasTreinadas)) req.push(...pre.periciasTreinadas.map((p) => `treinado em ${p.replace(/_/g, " ")}`));
  if (Array.isArray(pre.proficiencias)) req.push(...pre.proficiencias.map((p) => `proficiência em ${p.replace(/_/g, " ")}`));
  return req.join(", ");
}

function existingStructuredPowers() {
  const out = [];
  for (const [classId, powers] of Object.entries(existing.poderesClasse || {})) {
    if (!Array.isArray(powers)) continue;
    for (const power of powers) {
      const prereq = power.preRequisitosTexto || reqFromStructured(power.preRequisitos);
      out.push({
        classId,
        id: power.id,
        nome: power.nome,
        descricao: power.descricao || "",
        preReqResumo: prereq,
        repetivel: Boolean(power.repetivel),
        escolhas: power.escolhas || [],
        efeitos: power.efeitos || [],
        livroOrigemId: power.livroOrigemId || "basico",
        source: "backup-jsons/poderes_classe.json",
        rawStructured: power,
      });
    }
  }
  return out;
}

function mergeCandidates(existingEntry, incoming) {
  if (!existingEntry || normalizeText(existingEntry.nome) !== normalizeText(incoming.nome)) return false;
  return canonicalReqForMerge(existingEntry.preReqResumo) === canonicalReqForMerge(incoming.preReqResumo);
}

function makeIncoming(rawPower) {
  const extracted = extractPrereq(rawPower.descricao || "");
  const descricao = extracted.description;
  const preReqResumo = rawPower.preReqResumo || extracted.prereq || "";
  return {
    classId: rawPower.classId,
    id: rawPower.id || `${rawPower.classId}_${idText(rawPower.nome)}`,
    nome: rawPower.nome,
    descricao,
    preReqResumo,
    repetivel: isRepeatable(`${descricao} ${preReqResumo}`),
    escolhas: [],
    efeitos: [{ tipo: "regra_manual", aplicacao: "manual", descricao }],
    livroOrigemId: classBookById.get(rawPower.classId) || "texto_bruto",
    source: rawPower.source || "classes.txt",
    rawLine: rawPower.rawLine || "",
    summarized: Boolean(rawPower.summarized),
  };
}

function addOrMerge(registry, incoming) {
  if (normalizeText(incoming.nome) === "aumento de atributo") {
    let entry = registry.find((p) => p.id === "classe_aumento_de_atributo");
    if (!entry) {
      entry = {
        id: "classe_aumento_de_atributo",
        nome: "Aumento de Atributo",
        descricao: incoming.descricao || "Você recebe +1 em um atributo. Você pode escolher este poder várias vezes, mas apenas uma vez por patamar para um mesmo atributo.",
        preReqResumo: "",
        repetivel: true,
        escolhas: [
          {
            id: "atributo",
            nome: "Atributo",
            quantidade: 1,
            opcoes: ["for", "des", "con", "int", "sab", "car"],
            limite: "1_por_patamar_por_atributo",
          },
        ],
        efeitos: [{ tipo: "bonus_atributo", valor: 1, atributo: "escolha" }],
        classeIds: ["classe"],
        livroOrigemId: "basico",
        sources: [],
      };
      registry.push(entry);
    }
    entry.repetivel = true;
    if (!entry.classeIds.includes("classe")) entry.classeIds.push("classe");
    entry.sources.push({ classId: incoming.classId, source: incoming.source, rawLine: incoming.rawLine || "" });
    return entry;
  }

  let entry = registry.find((candidate) => mergeCandidates(candidate, incoming));
  if (!entry) {
    const baseId = incoming.id || `${incoming.classId}_${idText(incoming.nome)}`;
    let id = baseId;
    let suffix = 2;
    while (registry.some((p) => p.id === id)) {
      id = `${baseId}_${suffix}`;
      suffix += 1;
    }
    entry = {
      id,
      nome: incoming.nome,
      descricao: incoming.descricao,
      preReqResumo: incoming.preReqResumo || "",
      repetivel: Boolean(incoming.repetivel),
      escolhas: incoming.escolhas || [],
      efeitos: incoming.efeitos && incoming.efeitos.length ? incoming.efeitos : [{ tipo: "regra_manual", aplicacao: "manual", descricao: incoming.descricao }],
      classeIds: [],
      livroOrigemId: incoming.livroOrigemId || "texto_bruto",
      sources: [],
      summarized: Boolean(incoming.summarized),
    };
    registry.push(entry);
  } else {
    entry.repetivel = Boolean(entry.repetivel || incoming.repetivel);
    if ((!entry.efeitos || !entry.efeitos.length) && incoming.efeitos) entry.efeitos = incoming.efeitos;
    if (!entry.descricao && incoming.descricao) entry.descricao = incoming.descricao;
    if (!entry.preReqResumo && incoming.preReqResumo) entry.preReqResumo = incoming.preReqResumo;
    entry.summarized = Boolean(entry.summarized || incoming.summarized);
  }

  if (!entry.classeIds.includes(incoming.classId)) entry.classeIds.push(incoming.classId);
  entry.sources.push({ classId: incoming.classId, source: incoming.source, rawLine: incoming.rawLine || "" });
  return entry;
}

function classRowsFromCatalog(catalog) {
  const rows = [];
  for (const p of catalog) {
    for (const classId of p.classeIds) {
      if (classId === "classe") continue;
      rows.push([
        classId,
        classNameById.get(classId) || classId,
        p.id,
        p.nome,
        p.descricao || "",
        p.repetivel ? "SIM" : "NAO",
        minLevelFromReq(p.preReqResumo),
        "",
        "",
        "",
        "",
        JSON.stringify(p.escolhas || []),
        JSON.stringify(p.efeitos || []),
        p.preReqResumo || "",
      ]);
    }
  }
  rows.sort((a, b) => a[0].localeCompare(b[0], "pt-BR") || a[3].localeCompare(b[3], "pt-BR"));
  return rows;
}

function catalogRowsFromClassPowers(catalog) {
  return catalog.map((p) => [
    p.id,
    p.nome,
    "Classe",
    "classe",
    p.classeIds.join(";"),
    p.livroOrigemId || "texto_bruto",
    p.descricao || "",
    p.repetivel ? "SIM" : "NAO",
    minLevelFromReq(p.preReqResumo),
    "",
    "",
    "",
    "",
    p.preReqResumo || "",
    JSON.stringify(p.escolhas || []),
    JSON.stringify(p.efeitos || []),
    "",
    "",
    "",
  ]);
}

function mapRowsFromCatalog(catalog) {
  const rows = [];
  const classIds = new Set();
  const allClassIds = new Set(classes.map((c) => c.id));
  for (const p of catalog) {
    for (const classId of p.classeIds) if (classId !== "classe") classIds.add(classId);
  }
  for (const p of catalog) {
    const globalPower = p.classeIds.includes("classe");
    const ids = globalPower ? [...allClassIds] : p.classeIds;
    for (const classId of ids) {
      if (classId === "classe") continue;
      rows.push([classId, classNameById.get(classId) || classId, p.id, classId]);
    }

    for (const [variantId, baseId] of variantBaseById.entries()) {
      if (globalPower) continue;
      if (p.classeIds.includes("classe") || p.classeIds.includes(baseId)) {
        rows.push([variantId, classNameById.get(variantId) || variantId, p.id, baseId]);
      }
    }
  }
  rows.sort((a, b) => a[0].localeCompare(b[0], "pt-BR") || a[2].localeCompare(b[2], "pt-BR"));
  return rows;
}

function powersAvailableForClass(catalog, classId) {
  const baseId = variantBaseById.get(classId);
  return catalog
    .filter((p) => p.classeIds.includes("classe") || p.classeIds.includes(classId) || (baseId && p.classeIds.includes(baseId)))
    .map((p) => ({
      id: p.id,
      nome: p.nome,
      livroOrigemId: p.livroOrigemId || "fonte_nao_informada",
      classesOrigem: p.classeIds,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

function classSourceStatus(classId) {
  const baseId = variantBaseById.get(classId);
  if (baseId) {
    const baseComplete = completeDirectClassSources.has(baseId);
    return {
      status: baseComplete ? "heranca_base_completa" : "heranca_base_incompleta",
      pendencia: baseComplete
        ? "Confirmar se o suplemento adiciona poderes proprios da variante."
        : `Falta a lista completa de poderes da classe-base ${classNameById.get(baseId) || baseId}.`,
    };
  }
  if (completeDirectClassSources.has(classId)) return { status: "completa", pendencia: "" };
  if (classId === "paladino" || classId === "treinador") {
    return { status: "resumida", pendencia: "A fonte atual contem nomes ou resumos, mas nao o texto integral de todos os poderes." };
  }
  return { status: "ausente", pendencia: "Falta uma fonte com a lista integral dos poderes desta classe." };
}

function buildReference(catalog) {
  const classEntries = classes.map((c) => {
    const baseId = variantBaseById.get(c.id) || "";
    const source = classSourceStatus(c.id);
    return {
      classeId: c.id,
      classe: c.nome,
      livroDaClasseId: c.livroOrigemId || "fonte_nao_informada",
      varianteDaClasseId: baseId || undefined,
      varianteDaClasse: baseId ? classNameById.get(baseId) || baseId : undefined,
      regraDePoderes: baseId
        ? `Compartilha todos os poderes de ${classNameById.get(baseId) || baseId} e pode receber poderes proprios da variante.`
        : "Usa a propria lista de poderes de classe.",
      completudeDaFonte: source.status,
      pendencia: source.pendencia || undefined,
      poderesDisponiveis: powersAvailableForClass(catalog, c.id),
    };
  });

  return {
    schemaVersion: "2026-08-26.variant-inheritance",
    generatedAt: new Date().toISOString(),
    regraGlobal: "Classes variantes compartilham integralmente os poderes da classe-base, respeitando todos os pre-requisitos, e tambem podem possuir poderes proprios.",
    classes: classEntries,
    fontesPendentes: classEntries
      .filter((c) => c.completudeDaFonte !== "completa" && c.completudeDaFonte !== "heranca_base_completa")
      .map((c) => ({ classeId: c.classeId, classe: c.classe, status: c.completudeDaFonte, pendencia: c.pendencia })),
  };
}

function compactPowerForJson(p) {
  return {
    id: p.id,
    classeIds: p.classeIds,
    livroOrigemId: p.livroOrigemId,
    nome: p.nome,
    descricao: p.descricao,
    preRequisitosTexto: p.preReqResumo || undefined,
    repetivel: p.repetivel || undefined,
    escolhas: p.escolhas && p.escolhas.length ? p.escolhas : undefined,
    efeitos: p.efeitos,
    fonte: p.sources,
    observacaoDados: p.summarized ? "Texto bruto resumido ou incompleto; detalhar quando houver fonte completa." : undefined,
  };
}

const registry = [];
for (const power of existingStructuredPowers()) addOrMerge(registry, makeIncoming(power));
for (const power of [...parseBulletSections(), ...parseMarkdownSections(), ...parseListOnlySections()]) addOrMerge(registry, makeIncoming(power));

registry.sort((a, b) => {
  const ac = a.classeIds[0] === "classe" ? "zzzz" : a.classeIds[0];
  const bc = b.classeIds[0] === "classe" ? "zzzz" : b.classeIds[0];
  return ac.localeCompare(bc, "pt-BR") || a.nome.localeCompare(b.nome, "pt-BR");
});

const generated = {};
for (const p of registry) {
  for (const classId of p.classeIds) {
    if (classId === "classe") continue;
    if (!generated[classId]) generated[classId] = [];
    generated[classId].push(compactPowerForJson(p));
  }
}
for (const arr of Object.values(generated)) arr.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

const mergedPowersFile = {
  schemaVersion: "2026-08-26.raw-merge",
  poderesClasse: generated,
  poderesClasseCatalogoGlobal: registry.map(compactPowerForJson),
  golpePessoalEfeitos: existing.golpePessoalEfeitos || [],
};

fs.writeFileSync(powersPath, `${JSON.stringify(mergedPowersFile, null, 2)}\n`, "utf8");

const reportByClass = {};
for (const p of registry) {
  for (const classId of p.classeIds) {
    if (classId === "classe") continue;
    reportByClass[classId] = (reportByClass[classId] || 0) + 1;
  }
}

const output = {
  generatedAt: new Date().toISOString(),
  source: rawPath,
  classPowerRows: catalogRowsFromClassPowers(registry),
  basePoderesClasseRows: classRowsFromCatalog(registry),
  mapRows: mapRowsFromCatalog(registry),
  summary: {
    catalogClassRows: registry.length,
    mappings: mapRowsFromCatalog(registry).length,
    byClass: Object.fromEntries(Object.entries(reportByClass).sort((a, b) => a[0].localeCompare(b[0], "pt-BR"))),
    summarized: registry.filter((p) => p.summarized).map((p) => `${p.nome} [${p.classeIds.join(";")}]`),
  },
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
fs.writeFileSync(referenceJsonPath, `${JSON.stringify(buildReference(registry), null, 2)}\n`, "utf8");
console.log(JSON.stringify(output.summary, null, 2));
