from __future__ import annotations

import argparse
import importlib.util
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from pypdf.generic import (
    ArrayObject,
    DecodedStreamObject,
    NameObject,
    NumberObject,
    TextStringObject,
)


DEFENSE_SCRIPT = r'''function numeroCampo(nomeCampo) {
    var campo = this.getField(nomeCampo);
    if (!campo || campo.value === "" || campo.value === null) return 0;

    var valor = campo.value;
    if (typeof valor !== "number") {
        valor = String(valor).replace(/\s/g, "").replace(",", ".");
    }

    var numero = Number(valor);
    return isNaN(numero) ? 0 : numero;
}

var defesaBase = 10;

var campoSelecao = this.getField("ModAtributoDef");
var atributo = campoSelecao ? String(campoSelecao.value).toLowerCase() : "des";
if (atributo === "") atributo = "des";

var nomesCampos = {
    "for": "Força",
    "des": "Destreza",
    "con": "Constituição",
    "int": "Inteligência",
    "sab": "Sabedoria",
    "car": "Carisma"
};

var campoArmaduraPesada = this.getField("ArmaduraPesada");
var armaduraPesada = campoArmaduraPesada &&
    campoArmaduraPesada.value != "Off" &&
    campoArmaduraPesada.value != "";

var modAtributo = 0;

// Armadura pesada remove apenas Destreza. Outros atributos continuam válidos.
if (!(armaduraPesada && atributo == "des")) {
    var nomeCampo = nomesCampos[atributo] || "Destreza";
    modAtributo = numeroCampo.call(this, nomeCampo);
}

var defArmadura = numeroCampo.call(this, "DefArmadura");
var defEscudo = numeroCampo.call(this, "DefEscudo");
var outros = numeroCampo.call(this, "OutrosDef");

event.value = defesaBase + modAtributo + defArmadura + defEscudo + outros;
event.target.textSize = 0;'''


def load_ammunition_script() -> str:
    source = (
        Path(__file__).resolve().parents[1]
        / "pdf-fix-ammunition"
        / "update_ammunition_load.py"
    )
    spec = importlib.util.spec_from_file_location("pdf_ammunition_rules", source)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Não foi possível carregar {source}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return str(module.LOAD_SCRIPT)


def decoded_text(value: object | None) -> str:
    if value is None:
        return ""
    text = str(value)
    raw = getattr(value, "original_bytes", None)
    if "\ufffd" in text and raw:
        try:
            return raw.decode("cp1252")
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
    action_reference = (field.get("/AA") or {}).get(trigger)
    if action_reference is None:
        raise ValueError(
            f"Ação {trigger} não encontrada no campo {decoded_text(field.get('/T'))}"
        )
    action = action_reference.get_object()
    javascript = DecodedStreamObject()
    javascript.set_data(b"\xfe\xff" + script.encode("utf-16-be"))
    action[NameObject("/JS")] = writer._add_object(javascript)


def convert_attribute_field(field) -> None:
    field[NameObject("/T")] = TextStringObject("ModAtributoDef")
    field[NameObject("/TU")] = TextStringObject(
        "Atributo somado à Defesa: FOR, DES, CON, INT, SAB ou CAR."
    )
    field[NameObject("/FT")] = NameObject("/Ch")
    field[NameObject("/Ff")] = NumberObject(131072)
    field[NameObject("/Opt")] = ArrayObject(
        [
            TextStringObject("des"),
            TextStringObject("car"),
            TextStringObject("for"),
            TextStringObject("con"),
            TextStringObject("int"),
            TextStringObject("sab"),
        ]
    )
    field[NameObject("/V")] = TextStringObject("des")
    field[NameObject("/DV")] = TextStringObject("des")
    field[NameObject("/I")] = ArrayObject([NumberObject(0)])
    field.pop(NameObject("/AA"), None)
    field.pop(NameObject("/MaxLen"), None)

    for child_reference in field.get("/Kids", []):
        child = child_reference.get_object()
        child.pop(NameObject("/AA"), None)


def set_default_choice_appearance(field) -> None:
    # O PDF usa uma fonte Type0 personalizada. Reaproveitar o stream e os recursos
    # existentes evita substituir a Comic Sans ou depender da regeneração do leitor.
    kids = field.get("/Kids", [])
    if not kids:
        raise ValueError("Widget de ModAtributo não encontrado")
    widget = kids[0].get_object()
    appearance_reference = (widget.get("/AP") or {}).get("/N")
    if appearance_reference is None:
        raise ValueError("Aparência de ModAtributo não encontrada")
    appearance = appearance_reference.get_object()
    appearance.set_data(
        b"/Tx BMC\n"
        b"q\n"
        b"0.6 0.6 18.676 14.975 re W n\n"
        b"BT\n"
        b"/ComicSansBold 7 Tf\n"
        b"0 g\n"
        b"1 0 0 1 2.8 5.1 Tm <002700280036> Tj\n"
        b"ET\n"
        b"Q\n"
        b"EMC\n"
    )


def update_pdf(input_pdf: Path, output_pdf: Path) -> None:
    reader = PdfReader(str(input_pdf))
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)

    acroform = writer.root_object["/AcroForm"].get_object()
    mod_atributo = None
    converter_campo_antigo = False
    defesa = None
    carga_usada = None

    for reference in acroform["/Fields"]:
        if mod_atributo is None:
            mod_atributo = find_field(reference, "ModAtributoDef")
        if defesa is None:
            defesa = find_field(reference, "Defesa")
        if carga_usada is None:
            carga_usada = find_field(reference, "CargaUsada")

    if mod_atributo is None:
        for reference in acroform["/Fields"]:
            mod_atributo = find_field(reference, "ModDestreza")
            if mod_atributo is not None:
                converter_campo_antigo = True
                break
    if mod_atributo is None:
        raise ValueError("Campo ModAtributoDef não encontrado")
    if defesa is None:
        raise ValueError("Campo Defesa não encontrado")
    if carga_usada is None:
        raise ValueError("Campo CargaUsada não encontrado")

    if converter_campo_antigo:
        convert_attribute_field(mod_atributo)
        set_default_choice_appearance(mod_atributo)
    set_javascript(writer, defesa, "/C", DEFENSE_SCRIPT)
    set_javascript(writer, carga_usada, "/C", load_ammunition_script())

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
