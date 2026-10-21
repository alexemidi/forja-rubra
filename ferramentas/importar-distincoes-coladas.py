"""Importa distinções de um recorte textual fornecido pelo usuário.

Uso: python ferramentas/importar-distincoes-coladas.py CAMINHO --preview
     python ferramentas/importar-distincoes-coladas.py CAMINHO --write
O modo preview não altera dados e mostra títulos de poderes inferidos.
"""

import argparse
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "dados" / "distincoes.json"
SMALL = {"a", "as", "o", "os", "de", "da", "do", "das", "dos", "e", "em", "na", "no", "nas", "nos", "um", "uma", "ao", "aos", "à", "às", "para", "por", "com"}
POWER_TITLES = {
    "Professor de Magia": ["Pedagogia Mágica", "Introdução à Magia", "Demonstrações Práticas", "Notório Saber Arcano", "Orgulho do Mestre"],
    "Senador": ["Cofres Fundos", "Apoio Popular", "Deliberação Desnorteante", "Inocência Convicta", "Um Minotauro de Bem"],
    "Vigarista": ["Aquele Papinho", "Calma Lá", "Efeito Placebo", "Na Cara Não!", "Relíquias Sagradas"],
    "Bufão de Hyninn": ["Cabriolas de Bobo", "Arremedar", "Piada Mortal", "Quem Ri Por Último…", "Rir de Tudo"],
    "Cavaleiro da Luz": ["Ataque Subjugante", "Alazão Impressionante", "Alcunha", "Armadura da Integridade", "Chamado às Armas"],
    "Cavaleiro de Khalmyr": ["Vitória da Ordem", "Campeão Abnegado", "Corcel Santificado", "Graça de Khalmyr", "Manto da Justiça"],
    "Colecionador Monstruoso": ["Forma Monstruosa", "Monstro Supremo", "Predação Monstruosa"],
    "Dançarina de Marah": ["Transe Dançante", "Contrapasso do Espírito", "Dança Hipnótica", "Êxtase da Dançarina", "No Ritmo da Magia"],
    "Detetive de Tanna-Toh": ["Traçar Perfil", "Classificar", "Elementar", "Informantes", "Sequência Dedutiva"],
    "Exegeta do Akzath": ["Círculo Externo", "Círculo Interno"],
    "Forjador Litúrgico": ["Virtude do Forjador", "Armamento Sagrado", "Armamento Trabalhado", "Forja Devocional"],
    "Guardião da Realidade": ["Destruir Anticriação", "Detectar Anticriação", "Herói de Arton", "Herói dos Reinos", "Herói da Realidade"],
    "Herói Henshin": ["Sequência de Transformação", "Forma Final", "Pose de Combate", "Montaria Especial", "Pose Complexa"],
    "Improvisador de Lena": ["Gambiarra Mestra", "Efeito Cenográfico", "Habilidade Improvisada", "Magia Improvisada", "Poder Improvisado"],
    "Inquisidor de Wynna": ["Golpe Purificador", "Magia Sagrada", "Pira da Inquisição", "Refletir Magia", "Veredito Inquisitorial"],
    "Mestre de Armearia": ["Prata da Casa", "Arma de Estimação", "Improvisar o Progresso", "Inovação Tecnológica", "Profissional Completo"],
    "Numeromante": ["Aplicar Constante M", "Correção do Desvio Padrão", "Função Metamágica de M", "Magicometria", "Matriz da Equação Final"],
    "Pacificador": ["Combate Pacífico", "Dor sem Morte", "Golpe Paralisante", "Pacificação", "Presença do Bem"],
    "Pregador": ["Sincretismo Oportuno", "Abusar da Paciência", "Está nas Escrituras", "Não Fui Eu", "Releitura Conveniente", "Vender Indulgências"],
    "Sombra de Tenebra": ["Caminhar nas Trevas", "Clone Sombrio", "Forma de Sombra", "Miragem de Sombras", "Moldar Sombra", "Sombra Espreitadora"],
    "Sortudo de Nimb": ["Sorte Visitante", "Bênção de Nimb", "Caminhada Descuidada", "50/50", "Olha Só, Quem Diria?", "Sorte é o Que Se Faz"],
    "Sumo-Sacerdote": ["Proteção Divina", "Bênção do Patrono", "Evolução Espiritual", "Presente dos Deuses", "Punição Divina"],
    "Taumaturgista": ["Amigo de Outro Mundo", "Barganha Planar", "Contrato Planar", "Invocação Corrompida", "titereiro Planar"],
    "Teurgista Hermético": ["Conjuração Unificada", "Conhecimento Adaptável", "Teurgia Aplicada", "Vontade Sobre Matéria", "Zênite Teúrgico"],
    "Tibarita": ["O Preço do Sucesso", "Faro para Tesouro", "Gostei, Vou Comprar!", "Revirar os Bolsos", "Saúde Comprada"],
    "Tirano do Terceiro": ["Aspecto de Kallyadranoch", "Apoteose do Terceiro", "Dádivas do Dragão", "Ira Dracônica", "Sopro Compartilhado"],
}


def slug(value):
    value = unicodedata.normalize("NFKD", value)
    value = "".join(c for c in value if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")


def clean(value):
    lines = [line.strip() for line in value.replace("\r", "").split("\n")]
    return " ".join(line for line in lines if line).strip()


def title_line(value):
    line = value.strip().strip("• ")
    if not line or len(line) > 53 or ":" in line or line.endswith((".", ",", ";", "—")):
        return False
    words = re.findall(r"[A-Za-zÀ-ÿ]+", line)
    if not words or len(words) > 7:
        return False
    return all(word.lower() in SMALL or word[0].isupper() for word in words)


def extract_powers(body, name):
    lines = [line.strip() for line in body.replace("\r", "").split("\n") if line.strip()]
    if not lines:
        return []
    expected = POWER_TITLES.get(name)
    if expected is not None:
        positions = []
        for power_name in expected:
            matches = [i for i, line in enumerate(lines) if line.strip(" •") == power_name and (not positions or i > positions[-1])]
            if not matches:
                raise ValueError(f"{name}: título de poder ausente ou duplicado: {power_name}")
            positions.append(matches[0])
        heads = positions
    else:
        heads = [0]
        for pos in range(1, len(lines) - 1):
            if not title_line(lines[pos]):
                continue
            prev = " ".join(lines[heads[-1]:pos])
            if not re.search(r"Pré-requisit(?:o|os)\s*:", prev, re.I):
                continue
            if not lines[pos - 1].endswith((".", "!", ")")):
                continue
            heads.append(pos)
            if len(heads) == 5:
                break
    powers = []
    for index, pos in enumerate(heads):
        end = heads[index + 1] if index + 1 < len(heads) else len(lines)
        if index + 1 == len(heads):
            duplicate = next((i for i in range(pos + 1, end) if lines[i] == lines[pos]), None)
            if duplicate is not None:
                end = duplicate
        chunk = " ".join(lines[pos + 1:end]).strip()
        req = re.search(r"Pré-requisit(?:o|os)\s*:\s*", chunk, re.I)
        description = chunk[:req.start()].strip() if req else chunk
        prereq = chunk[req.end():].strip() if req else ""
        if name == "Exegeta do Akzath":
            description = chunk
            prereq = "treinado em Religião, devoto de Thwor" if index == 0 else "Círculo Externo"
        title = lines[pos].strip(" •")
        powers.append({"id": slug(title), "nome": title, "descricao": description, "preRequisitosTexto": prereq})
    return powers


def main():
    cli = argparse.ArgumentParser()
    cli.add_argument("path", type=Path)
    cli.add_argument("--preview", action="store_true")
    cli.add_argument("--write", action="store_true")
    args = cli.parse_args()
    source = args.path.read_text(encoding="utf-8")
    chunks = re.split(r"(?m)^\*([^*\r\n]+)\*\s*$", source)
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    known = {slug(item["nome"]) for item in catalog}
    additions = []
    for offset in range(1, len(chunks), 2):
        name = chunks[offset].strip()
        if slug(name) in known or (slug(name) == "aeronauta_globin" and "aeronauta_goblin" in known):
            continue
        body = chunks[offset + 1]
        admission_match = re.search(r"(?im)^(?:Admissão|missão)\s*$", body)
        mark_match = re.search(r"(?im)^Marca da Distinção\s*$", body)
        powers_match = re.search(r"(?im)^Poderes da distinção\s*$", body)
        if not admission_match or not mark_match:
            continue
        admission = clean(body[admission_match.end():mark_match.start()])
        mark_body = body[mark_match.end():powers_match.start() if powers_match else len(body)]
        mark_lines = [line.strip() for line in mark_body.replace("\r", "").split("\n") if line.strip()]
        mark_name = mark_lines[0] if mark_lines else "Marca da Distinção"
        mark_desc = clean("\n".join(mark_lines[1:]))
        powers = extract_powers(body[powers_match.end():], name) if powers_match else []
        if name == "Cavaleiro de Khalmyr":
            powers = extract_powers((ROOT / "dados" / "fontes" / "cavaleiro-de-khalmyr-poderes.txt").read_text(encoding="utf-8"), name)
            mark_desc = clean("\n".join(mark_lines[1:5]))
        book = "Deuses de Arton" if offset >= 73 else "Heróis de Arton"
        item = {"id": slug(name), "nome": name, "livro": book, "admissao": admission, "marca": {"nome": mark_name, "descricao": mark_desc}, "poderes": powers}
        if name == "Cavaleiro de Khalmyr":
            item["regrasExtras"] = "Código da Norma: um cavaleiro deve manter a palavra e não pode mentir, trapacear, roubar ou recusar ajuda a um inocente; também não pode possuir títulos, itens mágicos criados por não devotos de Khalmyr, bens que não possa carregar consigo ou na montaria, nem fixar residência por mais de 30 dias ou receber benefícios de bases e domínios. Se violar o código, perde todos os PM e só pode recuperá-los a partir do dia seguinte."
        additions.append(item)
        print(f"{name}: {len(powers)} poderes — {', '.join(p['nome'] for p in powers)}")
    if args.write:
        catalog.extend(additions)
        CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(additions)} distinções novas; total projetado: {len(catalog) if args.write else len(catalog)+len(additions)}")


if __name__ == "__main__":
    main()
