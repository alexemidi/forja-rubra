from __future__ import annotations

import argparse
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from pypdf.generic import DecodedStreamObject, NameObject


LOAD_SCRIPT = r'''function num(nomeCampo) {
    var campo = this.getField(nomeCampo);
    if (!campo) return 0;

    var valor = campo.value;
    if (valor === "" || valor === null) return 0;

    // O Acrobat pode entregar o valor bruto como numero (0.5) ou como texto
    // formatado no padrao brasileiro ("0,5"). Preserve o ponto decimal bruto.
    if (typeof valor === "number") return valor;

    valor = String(valor).replace(/\s/g, "");
    if (valor.indexOf(",") >= 0) {
        valor = valor.replace(/\./g, "").replace(",", ".");
    }

    var numero = Number(valor);
    if (isNaN(numero)) return 0;

    return numero;
}

function texto(nomeCampo) {
    var campo = this.getField(nomeCampo);
    if (!campo) return "";

    var valor = campo.value;
    if (valor === "" || valor === null) return "";

    return String(valor).toLowerCase();
}

function nomeOuVariante(item, singular, plural) {
    return item === singular ||
        item === plural ||
        item.indexOf(singular + " ") === 0 ||
        item.indexOf(plural + " ") === 0;
}

var total = 0;

for (var i = 1; i <= 24; i++) {
    var item = texto.call(this, "Item" + i);
    var quantidade = num.call(this, "Qnt" + i);

    // Balas, dardos, flechas, pedras e virotes: 20 unidades ocupam 1 espaço.
    var ehMunicaoPadrao =
        nomeOuVariante(item, "bala", "balas") ||
        nomeOuVariante(item, "dardo", "dardos") ||
        nomeOuVariante(item, "flecha", "flechas") ||
        nomeOuVariante(item, "virote", "virotes") ||
        item === "pedra" ||
        item === "pedras" ||
        item === "pedra polida" ||
        item === "pedras polidas" ||
        item.indexOf("saco de pedra") === 0;

    // Bolas de ferro são vendidas individualmente e ocupam 0,5 espaço cada.
    var ehBolaDeFerro =
        item === "bola de ferro" ||
        item === "bolas de ferro";

    if (ehMunicaoPadrao) {
        if (quantidade > 0) {
            total += Math.ceil(quantidade / 10) * 0.5;
        }
    } else if (ehBolaDeFerro) {
        if (quantidade > 0) {
            total += quantidade * 0.5;
        }
    } else {
        var carga = num.call(this, "Carga" + i);

        if (carga != 0) {
            var campoQnt = this.getField("Qnt" + i);
            var valorQnt = campoQnt ? campoQnt.value : "";

            if (valorQnt === "" || valorQnt === null) {
                quantidade = 1;
            }

            total += quantidade * carga;
        }
    }
}

// Soma a carga das moedas.
var cargaMoedas = num.call(this, "CargaMoedas");
total += cargaMoedas;

event.value = total;'''


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


def update_pdf(input_pdf: Path, output_pdf: Path) -> None:
    reader = PdfReader(str(input_pdf))
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)

    acroform = writer.root_object["/AcroForm"].get_object()
    carga_usada = None
    for reference in acroform["/Fields"]:
        carga_usada = find_field(reference, "CargaUsada")
        if carga_usada is not None:
            break
    if carga_usada is None:
        raise ValueError("Campo CargaUsada não encontrado")

    calculate_reference = (carga_usada.get("/AA") or {}).get("/C")
    if calculate_reference is None:
        raise ValueError("Ação de cálculo de CargaUsada não encontrada")
    calculate_action = calculate_reference.get_object()

    javascript = DecodedStreamObject()
    javascript.set_data(b"\xfe\xff" + LOAD_SCRIPT.encode("utf-16-be"))
    calculate_action[NameObject("/JS")] = writer._add_object(javascript)

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
