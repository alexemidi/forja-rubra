from __future__ import annotations

import argparse
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from pypdf.generic import (
    ArrayObject,
    DecodedStreamObject,
    DictionaryObject,
    NameObject,
    NumberObject,
    TextStringObject,
)


SKILL_SCRIPT = r'''var pericia = event.target.name;
var campoTreino = this.getField("Check" + pericia);

if (pericia == "Ladinagem" && (!campoTreino || campoTreino.value == "Off" || campoTreino.value == "")) {
    event.value = "X";
} else {
    var atrib = this.getField("Atrib" + pericia).value;
    var campoAtrib = "";

    if (atrib == "for") campoAtrib = "Força";
    if (atrib == "des") campoAtrib = "Destreza";
    if (atrib == "con") campoAtrib = "Constituição";
    if (atrib == "int") campoAtrib = "Inteligência";
    if (atrib == "sab") campoAtrib = "Sabedoria";
    if (atrib == "car") campoAtrib = "Carisma";

    var valorAtrib = Number(this.getField(campoAtrib).value) || 0;
    var bonusNivel = Number(this.getField("BônusNível").value) || 0;
    var bonusPericia = Number(this.getField(pericia + "Bon").value) || 0;
    var bonusTreino = 0;

    if (campoTreino && campoTreino.value != "Off" && campoTreino.value != "") {
        bonusTreino = Number(this.getField("BônusTreinamento").value) || 0;
    }

    var penArmadura = Number(this.getField("PenArmadura").value) || 0;
    var penEscudo = Number(this.getField("PenEscudo").value) || 0;
    var cargaUsada = Number(this.getField("CargaUsada").value) || 0;
    var limiteCarga = Number(this.getField("LimCarga").value) || 0;
    var penSobrecarga = cargaUsada > limiteCarga ? 5 : 0;

    event.value = valorAtrib + bonusTreino + bonusNivel + bonusPericia - penArmadura - penEscudo - penSobrecarga;
}'''


EFFECT_SCRIPT = r'''var cargaUsada = Number(this.getField("CargaUsada").value) || 0;
var limiteCarga = Number(this.getField("LimCarga").value) || 0;
var sobrecarregado = cargaUsada > limiteCarga;
var linhas = String(event.value || "").split(/\r?\n/);
var resultado = [];

for (var i = 0; i < linhas.length; i++) {
    var linha = linhas[i].replace(/^\s+|\s+$/g, "");
    if (linha && linha.toLowerCase() != "sobrecarregado") resultado.push(linhas[i]);
}

if (sobrecarregado) resultado.push("Sobrecarregado");
event.value = resultado.join("\r\n");
event.target.textSize = 0;'''


MOVEMENT_VALIDATE_SCRIPT = r'''var campoBase = this.getField("DeslocamentoBase");
if (campoBase) campoBase.value = event.value;'''


MOVEMENT_CALCULATE_SCRIPT = r'''var campoBase = this.getField("DeslocamentoBase");
var valorBase = campoBase ? campoBase.value : "";

if ((valorBase === "" || valorBase === null) && event.value !== "" && event.value !== null) {
    valorBase = event.value;
    if (campoBase) campoBase.value = valorBase;
}

if (valorBase === "" || valorBase === null) {
    event.value = "";
} else {
    var numeroBase = Number(String(valorBase).replace(",", "."));
    if (isNaN(numeroBase)) {
        event.value = valorBase;
    } else {
        var cargaUsada = Number(this.getField("CargaUsada").value) || 0;
        var limiteCarga = Number(this.getField("LimCarga").value) || 0;
        event.value = cargaUsada > limiteCarga ? Math.max(0, numeroBase - 3) : numeroBase;
    }
}

event.target.textSize = 0;'''


def decoded_text(value: object | None) -> str:
    if value is None:
        return ""
    text = str(value)
    raw = getattr(value, "original_bytes", None)
    if "\ufffd" in text and raw:
        for encoding in ("utf-16-be", "cp1252"):
            try:
                return raw.decode(encoding)
            except UnicodeDecodeError:
                pass
    return text


def find_field(reference, target_name: str):
    field = reference.get_object() if hasattr(reference, "get_object") else reference
    if decoded_text(field.get("/T")) == target_name:
        return field
    for child in field.get("/Kids", []):
        match = find_field(child, target_name)
        if match is not None:
            return match
    return None


def set_javascript(writer: PdfWriter, field, trigger: str, script: str) -> None:
    previous_actions = field.get("/AA") or {}
    actions = DictionaryObject()
    for key, value in previous_actions.items():
        actions[NameObject(str(key))] = value
    field[NameObject("/AA")] = actions
    action = DictionaryObject({NameObject("/S"): NameObject("/JavaScript")})
    javascript = DecodedStreamObject()
    javascript.set_data(b"\xfe\xff" + script.encode("utf-16-be"))
    action[NameObject("/JS")] = writer._add_object(javascript)
    actions[NameObject(trigger)] = writer._add_object(action)


def ensure_base_field(writer: PdfWriter, acroform):
    for reference in acroform["/Fields"]:
        field = find_field(reference, "DeslocamentoBase")
        if field is not None:
            return field
    field = DictionaryObject(
        {
            NameObject("/FT"): NameObject("/Tx"),
            NameObject("/T"): TextStringObject("DeslocamentoBase"),
            NameObject("/TU"): TextStringObject("Valor-base do deslocamento."),
            NameObject("/Ff"): NumberObject(1),
            NameObject("/V"): TextStringObject(""),
            NameObject("/DV"): TextStringObject(""),
        }
    )
    acroform["/Fields"].append(writer._add_object(field))
    return field


def reorder_calculations(acroform, priority_names: list[str]) -> None:
    order = list(acroform.get("/CO", []))
    priority = []
    remaining = []
    wanted = set(priority_names)
    for reference in order:
        field = reference.get_object()
        if decoded_text(field.get("/T")) in wanted:
            priority.append(reference)
        else:
            remaining.append(reference)
    priority.sort(key=lambda reference: priority_names.index(decoded_text(reference.get_object().get("/T"))))
    acroform[NameObject("/CO")] = ArrayObject(priority + remaining)


def update_pdf(input_pdf: Path, output_pdf: Path) -> None:
    reader = PdfReader(str(input_pdf))
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)
    acroform = writer.root_object["/AcroForm"].get_object()
    fields = {}
    wanted = {
        "Acrobacia",
        "Furtividade",
        "Ladinagem",
        "Efeitos4",
        "Deslocamento",
    }
    for reference in acroform["/Fields"]:
        for name in wanted - fields.keys():
            field = find_field(reference, name)
            if field is not None:
                fields[name] = field
    missing = wanted - fields.keys()
    if missing:
        raise ValueError(f"Campos não encontrados: {sorted(missing)}")

    ensure_base_field(writer, acroform)
    for name in ("Acrobacia", "Furtividade", "Ladinagem"):
        set_javascript(writer, fields[name], "/C", SKILL_SCRIPT)
    set_javascript(writer, fields["Efeitos4"], "/C", EFFECT_SCRIPT)
    set_javascript(writer, fields["Deslocamento"], "/V", MOVEMENT_VALIDATE_SCRIPT)
    set_javascript(writer, fields["Deslocamento"], "/C", MOVEMENT_CALCULATE_SCRIPT)
    reorder_calculations(
        acroform,
        ["LimCarga", "CargaMax", "QntMoedas", "CargaMoedas", "CargaUsada"],
    )

    output_pdf.parent.mkdir(parents=True, exist_ok=True)
    with output_pdf.open("wb") as output:
        writer.write(output)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input_pdf", type=Path)
    parser.add_argument("output_pdf", type=Path)
    args = parser.parse_args()
    if not args.input_pdf.exists():
        raise FileNotFoundError(args.input_pdf)
    update_pdf(args.input_pdf, args.output_pdf)
    print(f"updated={args.output_pdf}")


if __name__ == "__main__":
    main()
