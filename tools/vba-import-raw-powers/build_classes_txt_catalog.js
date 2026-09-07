const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "..");
const sourcePath = path.join(root, "classes.txt");
const outputPath = path.join(__dirname, "classes_txt_import.json");

const source = fs.readFileSync(sourcePath, "utf8").replace(/^\uFEFF/, "");
const lines = source.split(/\r?\n/);

const BASE_CLASSES = new Set([
  "arcanista", "barbaro", "bardo", "bucaneiro", "cacador", "cavaleiro", "clerigo",
  "druida", "guerreiro", "inventor", "ladino", "lutador", "nobre", "paladino",
]);

const DB199_CLASSES = new Set(["miragem", "mistico", "samurai"]);
const ABILITY_ALIASES = new Map([
  ["inovador:tecnica revolucionaria", "tecnica excentrica"],
  ["miragem:corpo de areia", "mestre do deserto"],
  ["santo:vaso do espirito", "vaso sagrado"],
  ["vassalo:vigilante de estradas", "vigilante das estradas"],
]);
const CONNECTORS = new Set([
  "a", "as", "ao", "aos", "da", "das", "de", "do", "dos", "e", "em", "na", "nas",
  "no", "nos", "o", "os", "para", "pela", "pelas", "pelo", "pelos", "por", "sem",
]);

const NON_POWER_TITLES = new Set([
  "abencoada", "animais totemicos", "caracteristicas", "caracteristicas de classe",
  "familiares arcanos", "forma agil", "forma feroz", "forma resistente", "forma selvagem",
  "forma sorrateira", "forma veloz",
  "linhagem", "linhagens", "novos poderes de classe", "poderes de brado", "posturas de combate",
  "sobrenaturais", "truques", "truques de capa", "truques do oficio",
]);

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[º°ᵒ]/g, "o")
    .replace(/[–—−]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .toLowerCase()
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
    .replace(/\s+/g, " ")
    .trim();
}

function cleanJoined(value) {
  return cleanLine(value)
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/Pré-\s*-requisitos?/giu, "Pré-requisitos")
    .replace(/Pré-\s*requisitos?/giu, (match) => match.toLowerCase().endsWith("s") ? "Pré-requisitos" : "Pré-requisito")
    .replace(/\s+e$/u, "")
    .trim();
}

function titleCase(value) {
  return cleanLine(value)
    .split(" ")
    .map((word, index) => {
      const n = normalizeText(word.replace(/[^\p{L}\p{N}]/gu, ""));
      if (index > 0 && CONNECTORS.has(n)) return word.toLowerCase();
      return word ? word[0].toLocaleUpperCase("pt-BR") + word.slice(1).toLocaleLowerCase("pt-BR") : word;
    })
    .join(" ");
}

function isPageArtifact(line) {
  const n = normalizeText(line);
  return /^\d+ (?:campeoes|herois) de arton$/.test(n) || n === "novos poderes de classe";
}

function usefulLine(line) {
  return line && !isPageArtifact(line);
}

function classTitleAt(index) {
  let line = cleanLine(lines[index]);
  if (!/^Tabela\s+[^:]+:/iu.test(line)) return null;
  if (/^Tabela\s+[^:]+:\s*$/iu.test(line)) {
    line = `${line} ${cleanLine(lines[index + 1])}`;
  }
  const match = line.match(/^Tabela\s+[^:]+:\s+(?:O|A)\s+(.+?)(?:\s*\(variante\s+d[oa]\s+(.+?)\))?$/iu);
  if (!match) return null;
  return {
    nome: cleanLine(match[1]),
    id: idText(match[1]),
    varianteDeNome: cleanLine(match[2]),
    varianteDeId: idText(match[2]),
    rawTitle: line,
  };
}

function findClassSections() {
  const starts = [];
  for (let index = 0; index < lines.length; index += 1) {
    const title = classTitleAt(index);
    if (title) starts.push({ ...title, start: index, sourceLine: index + 1 });
  }
  return starts.map((section, index) => ({
    ...section,
    end: index + 1 < starts.length ? starts[index + 1].start : lines.length,
  }));
}

function splitTopLevel(value) {
  const out = [];
  let depth = 0;
  let current = "";
  for (const char of String(value || "")) {
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);
    if (char === "," && depth === 0) {
      if (cleanLine(current)) out.push(cleanLine(current));
      current = "";
    } else {
      current += char;
    }
  }
  if (cleanLine(current)) out.push(cleanLine(current));
  return out;
}

function canonicalAbilityName(value) {
  let text = cleanLine(value)
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+\+?\d+d\d+(?:[+−–-]\d+)?\s*$/iu, "")
    .replace(/\s+\+\s*\d+(?:\s+categoria)?\s*$/iu, "")
    .replace(/\s+[−–-]\s*\d+\s*$/iu, "")
    .replace(/\s+\d+(?:\s+encantos?)?\s*$/iu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) text = cleanLine(value);
  return titleCase(text);
}

function parseProgression(section) {
  const rows = [];
  let current = null;
  for (let index = section.start + 1; index < section.end; index += 1) {
    const line = cleanLine(lines[index]);
    if (/^(?:Características|Habilidades de Classe)/iu.test(line)) break;
    const level = line.match(/^(\d{1,2}|1\s+8)[º°ᵒ]\s+(.+)$/u);
    if (level) {
      if (current) rows.push(current);
      current = { nivel: Number(level[1].replace(/\s+/g, "")), textLines: [level[2]], sourceLine: index + 1 };
    } else if (current && usefulLine(line) && !/^Nível\s+Habilidade/iu.test(line)) {
      current.textLines.push(line);
    }
  }
  if (current) rows.push(current);

  for (const row of rows) {
    row.habilidadesTexto = cleanJoined(row.textLines.join(" "))
      .replace(/\s+(poder de [^,]+)$/iu, ", $1")
      .replace(/,\s*$/, "");
    row.itens = splitTopLevel(row.habilidadesTexto);
    delete row.textLines;
  }
  return rows;
}

function findHeader(section, pattern, from = section.start + 1) {
  for (let index = from; index < section.end; index += 1) {
    if (pattern.test(cleanLine(lines[index]))) return index;
  }
  return -1;
}

function parseCharacteristics(section) {
  const start = findHeader(section, /^Características/iu);
  const abilitiesStart = findHeader(section, /^Habilidades de Classe$/iu);
  if (start < 0 || abilitiesStart < 0 || start >= abilitiesStart) return null;

  const fields = { pontosVida: "", pontosMana: "", pericias: "", proficiencias: "" };
  const labels = [
    { key: "pontosVida", re: /^Pontos de Vida\.\s*(.*)$/iu },
    { key: "pontosMana", re: /^Pontos de Mana\.\s*(.*)$/iu },
    { key: "pericias", re: /^Perícias\.\s*(.*)$/iu },
    { key: "proficiencias", re: /^Proficiências\.\s*(.*)$/iu },
  ];
  let current = null;
  for (let index = start + 1; index < abilitiesStart; index += 1) {
    const line = cleanLine(lines[index]);
    if (!usefulLine(line) || normalizeText(line) === "de classe") continue;
    const label = labels.find((candidate) => candidate.re.test(line));
    if (label) {
      current = label.key;
      fields[current] = cleanLine(line.match(label.re)[1]);
    } else if (current) {
      fields[current] = cleanLine(`${fields[current]} ${line}`);
    }
  }

  const pv = normalizeText(fields.pontosVida);
  const pm = normalizeText(fields.pontosMana);
  const pvBaseMatch = pv.match(/com\s+(\d+)\s+pontos de vida/) || pv.match(/com\s+(\d+)\s+pv/);
  const pvNivelMatch = pv.match(/ganha\s+(\d+)\s+pv/);
  const pmNivelMatch = pm.match(/(\d+)\s+pm por nivel/);
  const escolhaMatch = normalizeText(fields.pericias).match(/mais\s+(\d+)\s+a sua escolha/);

  return {
    ...fields,
    pvBase: pvBaseMatch ? Number(pvBaseMatch[1]) : null,
    pvNivel: pvNivelMatch ? Number(pvNivelMatch[1]) : null,
    pmNivel: pmNivelMatch ? Number(pmNivelMatch[1]) : null,
    escolhasPericia: escolhaMatch ? Number(escolhaMatch[1]) : null,
    sourceLine: start + 1,
  };
}

function progressionAbilityIndex(progression) {
  const found = new Map();
  for (const row of progression) {
    for (const item of row.itens) {
      if (/^poder de /iu.test(normalizeText(item))) continue;
      const nome = canonicalAbilityName(item);
      const key = normalizeText(nome);
      if (nome && !found.has(key)) found.set(key, { nome, nivel: row.nivel, progressaoTexto: item });
    }
  }
  return found;
}

function headingFromLine(line) {
  if (!line || line.startsWith("•")) return null;
  const match = line.match(/^([^.!?]{2,90})\.\s*(.*)$/u);
  if (!match) return null;
  return { nome: cleanLine(match[1]), inicioDescricao: cleanLine(match[2]) };
}

function matchesExpectedHeading(name, expected, classId) {
  const n = normalizeText(canonicalAbilityName(name));
  const alias = ABILITY_ALIASES.get(`${classId}:${n}`);
  if (alias && expected.has(alias)) return alias;
  if (expected.has(n)) return n;
  for (const key of expected.keys()) {
    if (n === key || n.startsWith(`${key} `) || key.startsWith(`${n} `)) return key;
  }
  return "";
}

function isBareTitle(line) {
  if (!line || line.startsWith("•") || line === "[" || line === "]") return false;
  if (/^[([]/u.test(line)) return false;
  if (line.length > 80 || /[.,]/.test(line) || /[!?;0-9]$/.test(line) || /^(?:Tabela|Nível|Poder de |Habilidades|Características)/iu.test(line)) return false;
  if ((line.match(/\(/g) || []).length !== (line.match(/\)/g) || []).length) return false;
  if (/\b(?:Pré-requisito|Pré-requisitos)\b/iu.test(line)) return false;
  const normalized = normalizeText(line);
  if (!normalized || NON_POWER_TITLES.has(normalized) || /^linhagem\b/.test(normalized)) return false;
  if (/^\d+ /.test(normalized)) return false;

  const words = line.replace(/[():]/g, " ").split(/\s+/).filter(Boolean);
  if (words.length > 9) return false;
  for (let index = 0; index < words.length; index += 1) {
    const raw = words[index].replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    const word = normalizeText(raw);
    if (!word || (index > 0 && CONNECTORS.has(word))) continue;
    if (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9]/u.test(raw) || /^[A-Z]{2,}$/u.test(raw)) continue;
    return false;
  }
  return true;
}

function findAbilityHeadings(section, expected, abilitiesStart) {
  const headings = [];
  for (let index = abilitiesStart + 1; index < section.end; index += 1) {
    const line = cleanLine(lines[index]);
    let heading = headingFromLine(line);
    let descriptionStart = index + 1;
    if (!heading && line && !/[.!?]$/u.test(line)) {
      heading = headingFromLine(`${line} ${cleanLine(lines[index + 1])}`);
      if (heading) descriptionStart = index + 2;
    }
    if (!heading) continue;
    const expectedKey = matchesExpectedHeading(heading.nome, expected, section.id);
    if (!expectedKey) continue;
    if (headings.some((candidate) => candidate.expectedKey === expectedKey)) continue;
    headings.push({ ...heading, expectedKey, index, descriptionStart, sourceLine: index + 1 });
  }
  return headings.sort((a, b) => a.index - b.index);
}

function findExtraStart(section, abilityHeadings) {
  if (!BASE_CLASSES.has(section.id) || abilityHeadings.length === 0) return -1;
  const lastAbility = abilityHeadings[abilityHeadings.length - 1];
  let searchStart = lastAbility.index + 1;
  for (let index = searchStart; index < section.end; index += 1) {
    if (/^•\s*Superior\./iu.test(cleanLine(lines[index]))) searchStart = index + 1;
  }
  for (let index = searchStart; index < section.end; index += 1) {
    const line = cleanLine(lines[index]);
    if (!isBareTitle(line)) continue;
    const n = normalizeText(line);
    if (n === "basica" || n === "aprimorada" || n === "superior" || n === "abencoada") continue;
    return index;
  }
  return -1;
}

function normalizeDescriptionLines(descriptionLines) {
  const kept = [];
  for (const raw of descriptionLines) {
    const line = cleanLine(raw);
    if (!usefulLine(line)) continue;
    kept.push(line);
  }
  return cleanJoined(kept.join(" "));
}

function parseAbilities(section, progression) {
  const expected = progressionAbilityIndex(progression);
  const abilitiesStart = findHeader(section, /^Habilidades de Classe$/iu);
  if (abilitiesStart < 0) return { abilities: [], expected, headings: [], extraStart: -1 };
  const headings = findAbilityHeadings(section, expected, abilitiesStart);
  const extraStart = findExtraStart(section, headings);
  const powerHeader = findHeader(section, /^Poder de .+\./u, abilitiesStart + 1);
  const abilities = [];

  for (let position = 0; position < headings.length; position += 1) {
    const heading = headings[position];
    let end = position + 1 < headings.length ? headings[position + 1].index : section.end;
    if (powerHeader > heading.index && powerHeader < end) end = powerHeader;
    if (extraStart > heading.index && extraStart < end) end = extraStart;

    const descriptionLines = [heading.inicioDescricao];
    for (let index = heading.descriptionStart; index < end; index += 1) {
      const line = cleanLine(lines[index]);
      if (powerHeader >= 0 && index === powerHeader) break;
      if (line.startsWith("•") && powerHeader >= 0 && index > powerHeader) continue;
      descriptionLines.push(line);
    }
    const meta = expected.get(heading.expectedKey);
    abilities.push({
      id: `${section.id}_${idText(meta.nome)}`,
      nome: meta.nome,
      nivel: meta.nivel,
      progressaoTexto: meta.progressaoTexto,
      descricao: normalizeDescriptionLines(descriptionLines),
      sourceLine: heading.sourceLine,
      descricaoHerdadaDe: "",
    });
  }

  for (const [key, meta] of expected.entries()) {
    if (!abilities.some((ability) => normalizeText(ability.nome) === key)) {
      abilities.push({
        id: `${section.id}_${idText(meta.nome)}`,
        nome: meta.nome,
        nivel: meta.nivel,
        progressaoTexto: meta.progressaoTexto,
        descricao: "",
        sourceLine: "",
        descricaoHerdadaDe: "",
      });
    }
  }
  abilities.sort((a, b) => a.nivel - b.nivel || a.nome.localeCompare(b.nome, "pt-BR"));
  return { abilities, expected, headings, extraStart };
}

function extractPrerequisite(description) {
  const text = cleanJoined(description);
  const match = text.match(/\bPré-requisitos?:\s*(.+?)\.?$/iu);
  if (!match) return { descricao: text, preReqResumo: "" };
  return {
    descricao: cleanJoined(text.slice(0, match.index)),
    preReqResumo: cleanJoined(match[1]).replace(/\.$/, ""),
  };
}

function repeatable(description) {
  const n = normalizeText(description);
  return n.includes("pode escolher este poder varias vezes") ||
    n.includes("pode escolher este poder outras vezes") ||
    n.includes("pode escolher este poder quantas vezes quiser") ||
    n.includes("pode escolher este poder uma segunda vez");
}

function minimumLevel(requirement) {
  const match = normalizeText(requirement).match(/(\d+)\s*o\s*nivel/);
  return match ? Number(match[1]) : null;
}

function parseBulletPowers(section, abilityData) {
  const abilitiesStart = findHeader(section, /^Habilidades de Classe$/iu);
  const powerHeader = abilitiesStart < 0 ? -1 : findHeader(section, /^Poder de .+\./u, abilitiesStart + 1);
  if (powerHeader < 0) return [];
  const firstAbilityAfterPower = abilityData.headings.find((heading) => heading.index > powerHeader);
  const end = firstAbilityAfterPower ? firstAbilityAfterPower.index : (abilityData.extraStart > 0 ? abilityData.extraStart : section.end);
  const powers = [];
  let current = null;
  let bracketDepth = 0;

  const push = () => {
    if (!current) return;
    const fullDescription = normalizeDescriptionLines(current.descriptionLines);
    const extracted = extractPrerequisite(fullDescription);
    powers.push({
      id: `${section.id}_${idText(current.nome)}`,
      nome: current.nome,
      descricao: extracted.descricao,
      preReqResumo: extracted.preReqResumo,
      repetivel: repeatable(fullDescription),
      nivelMinimo: minimumLevel(extracted.preReqResumo),
      sourceLine: current.sourceLine,
      livro: BASE_CLASSES.has(section.id) ? "Tormenta20 Jogo do Ano" : (DB199_CLASSES.has(section.id) ? "Dragão Brasil 199" : "classes.txt"),
      origemTrecho: "poder_marcado",
    });
    current = null;
  };

  for (let index = powerHeader + 1; index < end; index += 1) {
    const line = cleanLine(lines[index]);
    if (!line) continue;
    if (line === "[") { bracketDepth += 1; if (current) current.descriptionLines.push(line); continue; }
    if (line === "]") { if (current) current.descriptionLines.push(line); bracketDepth = Math.max(0, bracketDepth - 1); continue; }
    const bullet = bracketDepth === 0 ? line.match(/^•\s*(.+)$/u) : null;
    if (bullet) {
      push();
      const split = bullet[1].match(/^(.+?)\.\s*(.*)$/u);
      if (!split) continue;
      current = { nome: cleanLine(split[1]), descriptionLines: [split[2]], sourceLine: index + 1 };
    } else if (current) {
      current.descriptionLines.push(line);
    }
  }
  push();
  return powers;
}

function parseExtraPowers(section, extraStart) {
  if (extraStart < 0 || !BASE_CLASSES.has(section.id)) return [];
  const candidates = [];
  for (let index = extraStart; index < section.end; index += 1) {
    const line = cleanLine(lines[index]);
    const lastWord = normalizeText(line).split(" ").pop();
    if ((line.endsWith(":") || CONNECTORS.has(lastWord)) && isBareTitle(line)) {
      const next = cleanLine(lines[index + 1]);
      if (next && isBareTitle(next)) {
        candidates.push({ index, descriptionStart: index + 2, nome: `${line} ${next}`, sourceLine: index + 1 });
        index += 1;
        continue;
      }
    }
    if (isBareTitle(line)) candidates.push({ index, descriptionStart: index + 1, nome: line, sourceLine: index + 1 });
  }

  const powers = [];
  for (let position = 0; position < candidates.length; position += 1) {
    const candidate = candidates[position];
    const end = position + 1 < candidates.length ? candidates[position + 1].index : section.end;
    const description = normalizeDescriptionLines(lines.slice(candidate.descriptionStart, end));
    if (description.length < 12) continue;
    const extracted = extractPrerequisite(description);
    powers.push({
      id: `${section.id}_${idText(candidate.nome)}`,
      nome: cleanLine(candidate.nome),
      descricao: extracted.descricao,
      preReqResumo: extracted.preReqResumo,
      repetivel: repeatable(description),
      nivelMinimo: minimumLevel(extracted.preReqResumo),
      sourceLine: candidate.sourceLine,
      livro: "Heróis de Arton",
      origemTrecho: "poder_extra",
    });
  }
  return powers;
}

function parseSkillRows(classEntry) {
  const text = classEntry.caracteristicas?.pericias || "";
  if (!text) return [];
  const choiceMarker = normalizeText(text).search(/\bmais\s+\d+\s+a sua escolha\b/);
  const normalizedOriginal = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const skillRe = /([A-ZÁÉÍÓÚÂÊÔÃÕÇ][\p{L} '\-]+?)\s*\((For|Des|Con|Int|Sab|Car)\)/gu;
  const matches = [...text.matchAll(skillRe)];
  const rows = [];
  let flexGroup = 0;
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const offset = normalizeText(text.slice(0, match.index)).length;
    let tipo = choiceMarker >= 0 && offset >= choiceMarker ? "Escolha" : "Obrigatória";
    let grupo = "";
    if (tipo === "Obrigatória") {
      const before = index > 0 ? matches[index - 1].index + matches[index - 1][0].length : 0;
      const betweenBefore = normalizeText(text.slice(before, match.index));
      const nextStart = index + 1 < matches.length ? matches[index + 1].index : text.length;
      const betweenAfter = normalizeText(text.slice(match.index + match[0].length, nextStart));
      if (/\bou\b/.test(betweenBefore) || /\bou\b/.test(betweenAfter)) {
        if (!/\bou\b/.test(betweenBefore)) flexGroup += 1;
        tipo = "Flexível";
        grupo = `${classEntry.id}_flex_${Math.max(1, flexGroup)}`;
      }
    }
    rows.push({ tipo, grupo, pericia: cleanLine(match[1]), atributo: match[2].toUpperCase() });
  }
  void normalizedOriginal;
  return rows.filter((row, index) => rows.findIndex((other) => other.tipo === row.tipo && other.grupo === row.grupo && normalizeText(other.pericia) === normalizeText(row.pericia)) === index);
}

function canonicalRequirement(requirement) {
  return normalizeText(requirement)
    .replace(/\b(?:de|do|da)\s+(?:arcanista|barbaro|bardo|bucaneiro|cacador|cavaleiro|clerigo|druida|guerreiro|inventor|ladino|lutador|nobre|paladino|treinador|frade|miragem|mistico|samurai)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildPowerCatalog(classes) {
  const catalog = [];
  for (const classEntry of classes) {
    for (const power of classEntry.poderesLocais) {
      if (normalizeText(power.nome) === "aumento de atributo") {
        let global = catalog.find((entry) => entry.id === "classe_aumento_de_atributo");
        if (!global) {
          global = {
            ...power,
            id: "classe_aumento_de_atributo",
            classeIds: ["classe"],
            repetivel: true,
            escolhas: [{ id: "atributo", nome: "Atributo", quantidade: 1, opcoes: ["for", "des", "con", "int", "sab", "car"], limite: "1_por_patamar_por_atributo" }],
            efeitos: [{ tipo: "bonus_atributo", valor: 1, atributo: "escolha" }],
            fontes: [],
          };
          catalog.push(global);
        }
        global.fontes.push({ classeId: classEntry.id, sourceLine: power.sourceLine, livro: power.livro });
        continue;
      }

      const key = normalizeText(power.nome);
      const req = canonicalRequirement(power.preReqResumo);
      let entry = catalog.find((candidate) => normalizeText(candidate.nome) === key && canonicalRequirement(candidate.preReqResumo) === req);
      if (!entry) {
        entry = {
          ...power,
          classeIds: [],
          escolhas: [],
          efeitos: [{ tipo: "regra_manual", aplicacao: "manual", descricao: power.descricao }],
          fontes: [],
        };
        catalog.push(entry);
      }
      if (!entry.classeIds.includes(classEntry.id)) entry.classeIds.push(classEntry.id);
      entry.fontes.push({ classeId: classEntry.id, sourceLine: power.sourceLine, livro: power.livro });
    }
  }
  return catalog.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR") || a.id.localeCompare(b.id));
}

function resolveInheritance(classes) {
  const byId = new Map(classes.map((entry) => [entry.id, entry]));
  for (const entry of classes) {
    if (!entry.varianteDeId) continue;
    const base = byId.get(entry.varianteDeId);
    if (!base) continue;
    if (!entry.caracteristicas) entry.caracteristicas = base.caracteristicas ? { ...base.caracteristicas, herdadaDe: base.id } : null;
    if (entry.caracteristicas) entry.periciasEstruturadas = parseSkillRows(entry);
    for (const ability of entry.habilidades) {
      if (!/como o |como a /iu.test(normalizeText(ability.descricao))) continue;
      const baseAbility = base.habilidades.find((candidate) => normalizeText(candidate.nome) === normalizeText(ability.nome));
      if (!baseAbility || !baseAbility.descricao) continue;
      ability.descricao = baseAbility.descricao;
      ability.descricaoHerdadaDe = `${base.id}:${baseAbility.nome}`;
    }
    for (const ability of entry.habilidades) {
      if (ability.descricao) continue;
      const basePower = base.poderesLocais.find((candidate) => normalizeText(candidate.nome) === normalizeText(ability.nome));
      if (!basePower || !basePower.descricao) continue;
      ability.descricao = basePower.descricao;
      ability.descricaoHerdadaDe = `${base.id}:poder:${basePower.nome}`;
    }
  }
}

function inferVariantBase(section, progression) {
  for (const row of progression) {
    for (const item of row.itens) {
      const match = normalizeText(item).match(/^poder de (.+)$/);
      if (match && idText(match[1]) !== section.id && BASE_CLASSES.has(idText(match[1]))) return idText(match[1]);
    }
  }
  for (let index = section.start; index < section.end; index += 1) {
    const match = normalizeText(lines[index]).match(/como [oa] ([a-z ]+) basico/);
    if (match && idText(match[1]) !== section.id && BASE_CLASSES.has(idText(match[1]))) return idText(match[1]);
  }
  return "";
}

function buildSlotRows(classEntry) {
  const levels = [];
  for (const row of classEntry.progressao) {
    const count = row.itens.filter((item) => /^poder de /iu.test(normalizeText(item))).length;
    for (let index = 0; index < count; index += 1) levels.push(row.nivel);
  }
  if (levels.length === 0 && classEntry.id === "vassalo") {
    const rows = [];
    for (const ability of classEntry.habilidades) {
      const normalized = normalizeText(ability.descricao);
      if (!normalized.includes("poder de") || !normalized.includes("a sua escolha")) continue;
      const pools = new Set();
      for (const match of normalized.matchAll(/poder de ([a-z]+)(?: ou (?:de )?([a-z]+)| ou geral)?/g)) {
        for (const candidate of [match[1], match[2]]) if (BASE_CLASSES.has(candidate)) pools.add(candidate);
      }
      if (normalized.includes("caminho do soldado")) pools.add("guerreiro");
      if (normalized.includes("caminho do governante")) pools.add("nobre");
      if (pools.size === 0) continue;
      rows.push({
        origemClasseId: classEntry.id, origemClasse: classEntry.nome, poderClasseId: [...pools].join(";"),
        habilidadeId: `${classEntry.id}_${idText(ability.nome)}_poder`, habilidade: ability.nome,
        nivelInicial: ability.nivel, frequencia: "pontual", categoria: "Poder", quantidade: 1,
        permiteGeral: normalized.includes("ou geral") ? "SIM" : "NAO", origemRegra: "classes.txt",
        observacao: "Poder concedido pela progressão fixa do Vassalo.",
      });
    }
    return rows;
  }
  if (levels.length === 0) return [];
  const unique = [...new Set(levels)].sort((a, b) => a - b);
  let frequency = "pontual";
  if (unique.length === 19 && unique[0] === 2 && unique[18] === 20) frequency = "todo_nivel";
  else if (unique.every((level) => level % 2 === 0) && unique.length >= 8) frequency = "nivel_par";
  else if (unique.every((level) => level % 2 === 1) && unique.length >= 8) frequency = "nivel_impar";

  const pool = classEntry.varianteDeId ? `${classEntry.varianteDeId};${classEntry.id}` : classEntry.id;
  const sourcePowerName = classEntry.progressao.flatMap((row) => row.itens).find((item) => /^poder de /iu.test(normalizeText(item))) || "Poder de Classe";
  if (frequency !== "pontual") {
    return [{
      origemClasseId: classEntry.id, origemClasse: classEntry.nome, poderClasseId: pool,
      habilidadeId: `${classEntry.id}_${idText(sourcePowerName)}`, habilidade: titleCase(sourcePowerName),
      nivelInicial: unique[0], frequencia: frequency, categoria: "Poder", quantidade: 1,
      permiteGeral: "SIM", origemRegra: "classes.txt", observacao: "",
    }];
  }
  return levels.map((level, index) => ({
    origemClasseId: classEntry.id, origemClasse: classEntry.nome, poderClasseId: pool,
    habilidadeId: `${classEntry.id}_${idText(sourcePowerName)}_${level}_${index + 1}`, habilidade: titleCase(sourcePowerName),
    nivelInicial: level, frequencia: "pontual", categoria: "Poder", quantidade: 1,
    permiteGeral: "SIM", origemRegra: "classes.txt", observacao: "Slot explícito da progressão.",
  }));
}

const sections = findClassSections();
const classes = sections.map((section) => {
  const progressao = parseProgression(section);
  const inferredVariantBase = section.varianteDeId || inferVariantBase(section, progressao);
  const caracteristicas = parseCharacteristics(section);
  const abilityData = parseAbilities(section, progressao);
  const poderesMarcados = parseBulletPowers(section, abilityData);
  const poderesExtras = parseExtraPowers(section, abilityData.extraStart);
  const entry = {
    id: section.id,
    nome: section.nome,
    varianteDeId: inferredVariantBase,
    varianteDeNome: section.varianteDeNome || "",
    sourceLine: section.sourceLine,
    sourceEndLine: section.end,
    progressao,
    caracteristicas,
    periciasEstruturadas: [],
    habilidades: abilityData.abilities,
    poderesLocais: [...poderesMarcados, ...poderesExtras],
    poderMarcadoCount: poderesMarcados.length,
    poderExtraCount: poderesExtras.length,
    extraStartLine: abilityData.extraStart >= 0 ? abilityData.extraStart + 1 : null,
  };
  entry.periciasEstruturadas = parseSkillRows(entry);
  return entry;
});

resolveInheritance(classes);
for (const classEntry of classes) classEntry.slotsPoder = buildSlotRows(classEntry);
const poderesCatalogo = buildPowerCatalog(classes);

const summary = {
  classes: classes.length,
  progressionComplete: classes.filter((entry) => entry.progressao.length === 20 && entry.progressao.every((row, index) => row.nivel === index + 1)).length,
  classIds: classes.map((entry) => entry.id),
  variants: classes.filter((entry) => entry.varianteDeId).map((entry) => `${entry.id}:${entry.varianteDeId}`),
  characteristicsPresent: classes.filter((entry) => entry.caracteristicas && !entry.caracteristicas.herdadaDe).length,
  characteristicsInherited: classes.filter((entry) => entry.caracteristicas?.herdadaDe).length,
  abilities: classes.reduce((sum, entry) => sum + entry.habilidades.length, 0),
  abilitiesWithoutDescription: classes.flatMap((entry) => entry.habilidades.filter((ability) => !ability.descricao).map((ability) => `${entry.id}:${ability.nome}`)),
  localPowers: classes.reduce((sum, entry) => sum + entry.poderesLocais.length, 0),
  catalogPowers: poderesCatalogo.length,
  powersByClass: Object.fromEntries(classes.map((entry) => [entry.id, entry.poderesLocais.length])),
  suspiciousExtraPowers: classes.flatMap((entry) => entry.poderesLocais
    .filter((power) => power.origemTrecho === "poder_extra" && (power.nome.split(/\s+/).length > 8 || power.descricao.length < 40))
    .map((power) => `${entry.id}:${power.nome}@${power.sourceLine}`)),
  progressionProblems: classes.filter((entry) => entry.progressao.length !== 20 || !entry.progressao.every((row, index) => row.nivel === index + 1)).map((entry) => ({
    classeId: entry.id,
    niveis: entry.progressao.map((row) => row.nivel),
  })),
};

const output = {
  schemaVersion: "2026-08-26.classes-txt-only",
  generatedAt: new Date().toISOString(),
  source: "classes.txt",
  classes,
  poderesCatalogo,
  summary,
};

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(JSON.stringify(summary, null, 2));
