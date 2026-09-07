from __future__ import annotations

import argparse
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from pypdf.generic import DecodedStreamObject, NameObject


EXPECTED_FIELDS = {
    "Ladinagem",
    "Pilotagem",
    "Conhecimento",
    "Guerra",
    "Misticismo",
    "Nobreza",
    "Oficio1",
    "Oficio2",
    "Religiao",
    "Adestramento",
    "Atuacao",
    "Jogatina",
}


def plain_name(value: str) -> str:
    replacements = str.maketrans(
        {
            "í": "i",
            "Í": "I",
            "ã": "a",
            "Ã": "A",
            "ç": "c",
            "Ç": "C",
            "ó": "o",
            "Ó": "O",
        }
    )
    return value.translate(replacements)


def read_script(action) -> str:
    javascript = action.get("/JS")
    if javascript is None:
        return ""
    value = javascript.get_object()
    if hasattr(value, "get_data"):
        data = value.get_data()
        if data.startswith(b"\xfe\xff"):
            return data[2:].decode("utf-16-be")
        return data.decode("utf-8")
    return str(value)


def write_script(writer: PdfWriter, action, script: str) -> None:
    stream = DecodedStreamObject()
    stream.set_data(b"\xfe\xff" + script.encode("utf-16-be"))
    action[NameObject("/JS")] = writer._add_object(stream)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input_pdf", type=Path)
    parser.add_argument("output_pdf", type=Path)
    args = parser.parse_args()

    reader = PdfReader(str(args.input_pdf))
    source_fields = reader.get_fields() or {}
    if any(field.get("/FT") == "/Sig" for field in source_fields.values()):
        raise ValueError("The source PDF contains a signature field and was not modified.")

    writer = PdfWriter()
    writer.clone_document_from_reader(reader)
    fields = writer.get_fields() or {}

    changed = []
    for name, field in fields.items():
        if plain_name(name) not in EXPECTED_FIELDS:
            continue
        calculate = (field.get("/AA") or {}).get("/C")
        if calculate is None:
            raise ValueError(f"Calculation action not found: {name}")
        action = calculate.get_object()
        script = read_script(action)
        if "\u2716" not in script:
            raise ValueError(f"Unsupported cross was not found in: {name}")

        old_check = 'if (this.getField("Check" + pericia).value == "Off") {'
        if old_check not in script:
            raise ValueError(f"Checkbox condition was not found in: {name}")

        new_check = (
            'var campoTreino = this.getField("Check" + pericia);\r\n\r\n'
            "if (!campoTreino || !campoTreino.isBoxChecked(0)) {"
        )
        # Helvetica used by the form has U+00D7, but not U+2716.
        patched = script.replace(old_check, new_check).replace("\u2716", "\\u00D7")
        write_script(writer, action, patched)
        changed.append(name)

    if {plain_name(name) for name in changed} != EXPECTED_FIELDS:
        raise ValueError(f"Unexpected set of modified fields: {changed}")

    args.output_pdf.parent.mkdir(parents=True, exist_ok=True)
    with args.output_pdf.open("wb") as output:
        writer.write(output)

    print(f"updated_fields={len(changed)}")
    print("fields=" + ";".join(changed))


if __name__ == "__main__":
    main()
