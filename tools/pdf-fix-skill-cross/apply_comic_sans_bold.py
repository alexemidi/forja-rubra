from __future__ import annotations

import argparse
import re
import tempfile
import unicodedata
from pathlib import Path
from typing import Any

import pymupdf
from pypdf import PdfReader, PdfWriter
from pypdf.generic import (
    ArrayObject,
    BooleanObject,
    DecodedStreamObject,
    DictionaryObject,
    FloatObject,
    NameObject,
    NumberObject,
    TextStringObject,
)


TARGET_SKILLS = {
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

FONT_RESOURCE = "/ComicSansBold"
FONT_PATTERN = re.compile(r"/[^\s/]+\s+(-?(?:\d+(?:\.\d*)?|\.\d+))\s+Tf")


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


def plain_name(value: object) -> str:
    normalized = unicodedata.normalize("NFD", decoded_text(value))
    return "".join(char for char in normalized if unicodedata.category(char) != "Mn")


def replace_font(default_appearance: object | None) -> str:
    value = str(default_appearance or "/Helv 0 Tf 0 g")
    if FONT_PATTERN.search(value):
        return FONT_PATTERN.sub(rf"{FONT_RESOURCE} \1 Tf", value)
    return f"{FONT_RESOURCE} 0 Tf 0 g"


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
    javascript = DecodedStreamObject()
    javascript.set_data(b"\xfe\xff" + script.encode("utf-16-be"))
    action[NameObject("/JS")] = writer._add_object(javascript)


def insert_font(input_pdf: Path, output_pdf: Path, font_file: Path) -> None:
    document = pymupdf.open(input_pdf)
    for page in document:
        page.insert_font(fontname=FONT_RESOURCE[1:], fontfile=font_file)
    document.save(output_pdf, garbage=4, deflate=True)
    document.close()


def inherited_value(widget: DictionaryObject, key: str, default: Any = None) -> Any:
    current: DictionaryObject | None = widget
    while current is not None:
        value = current.get(key)
        if value is not None:
            return value
        parent = current.get("/Parent")
        current = parent.get_object() if parent is not None else None
    return default


def display_value(widget: DictionaryObject) -> str:
    value = inherited_value(widget, "/V")
    if value is None:
        return ""
    text = decoded_text(value)
    options = inherited_value(widget, "/Opt", [])
    for option in options:
        option = option.get_object() if hasattr(option, "get_object") else option
        if isinstance(option, (list, ArrayObject)) and option:
            export = decoded_text(option[0])
            shown = decoded_text(option[1] if len(option) > 1 else option[0])
            if text == export:
                return shown
    return text.removeprefix("/") if isinstance(value, NameObject) else text


def font_size_from_da(default_appearance: object | None) -> float:
    match = FONT_PATTERN.search(str(default_appearance or ""))
    return float(match.group(1)) if match else 0.0


def pdf_number(value: float) -> str:
    return f"{value:.4f}".rstrip("0").rstrip(".") or "0"


def encode_glyphs(font: pymupdf.Font, text: str) -> str:
    result = bytearray()
    fallback = font.has_glyph(ord("?"))
    for character in text:
        glyph = font.has_glyph(ord(character)) or fallback
        result.extend(int(glyph).to_bytes(2, byteorder="big"))
    return result.hex().upper()


def fit_single_line(
    font: pymupdf.Font,
    text: str,
    requested_size: float,
    width: float,
    height: float,
) -> float:
    vertical_limit = max(4.0, (height - 0.8) / (font.ascender - font.descender))
    width_at_one = font.text_length(text, fontsize=1) if text else 0
    horizontal_limit = (width - 1.2) / width_at_one if width_at_one else vertical_limit
    limit = min(vertical_limit, horizontal_limit)
    return max(4.0, min(requested_size or limit, limit))


def wrap_text(font: pymupdf.Font, text: str, size: float, width: float) -> list[str]:
    lines: list[str] = []
    for paragraph in text.replace("\r", "").split("\n"):
        words = paragraph.split()
        if not words:
            lines.append("")
            continue
        line = words[0]
        for word in words[1:]:
            candidate = f"{line} {word}"
            if font.text_length(candidate, fontsize=size) <= width:
                line = candidate
            else:
                lines.append(line)
                line = word
        lines.append(line)
    return lines


def create_appearance(
    writer: PdfWriter,
    widget: DictionaryObject,
    font_reference,
    font: pymupdf.Font,
) -> None:
    rectangle = widget["/Rect"]
    width = abs(float(rectangle[2]) - float(rectangle[0]))
    height = abs(float(rectangle[3]) - float(rectangle[1]))
    field_type = inherited_value(widget, "/FT")
    field_flags = int(inherited_value(widget, "/Ff", 0) or 0)
    multiline = field_type == "/Tx" and bool(field_flags & 4096)
    combo = field_type == "/Ch" and bool(field_flags & 131072)
    alignment = int(inherited_value(widget, "/Q", 0) or 0)
    text = display_value(widget)
    if not multiline:
        text = " ".join(text.replace("\r", "\n").splitlines())

    commands = ["/Tx BMC", "q"]
    mark = inherited_value(widget, "/MK", {}) or {}
    background = mark.get("/BG")
    if background:
        components = [float(item) for item in background]
        if len(components) == 1:
            commands.append(f"{pdf_number(components[0])} g")
        elif len(components) == 3:
            commands.append(" ".join(pdf_number(item) for item in components) + " rg")
        elif len(components) == 4:
            commands.append(" ".join(pdf_number(item) for item in components) + " k")
        commands.append(f"0 0 {pdf_number(width)} {pdf_number(height)} re f")

    arrow_width = min(7.0, max(4.0, height * 0.42)) if combo else 0.0
    if combo:
        arrow_left = width - arrow_width
        middle_x = arrow_left + arrow_width / 2
        middle_y = height / 2
        commands.extend(
            [
                "0.7 G 0.45 w",
                f"{pdf_number(arrow_left)} 1 m {pdf_number(arrow_left)} {pdf_number(height - 1)} l S",
                "0 g",
                (
                    f"{pdf_number(middle_x - 1.7)} {pdf_number(middle_y + 0.8)} m "
                    f"{pdf_number(middle_x + 1.7)} {pdf_number(middle_y + 0.8)} l "
                    f"{pdf_number(middle_x)} {pdf_number(middle_y - 1.2)} l h f"
                ),
            ]
        )

    inset = 0.6
    text_width = max(1.0, width - 2 * inset - arrow_width)
    text_height = max(1.0, height - 2 * inset)
    commands.append(
        f"{pdf_number(inset)} {pdf_number(inset)} {pdf_number(text_width)} {pdf_number(text_height)} re W n"
    )

    if text:
        requested_size = font_size_from_da(inherited_value(widget, "/DA"))
        if multiline:
            size = requested_size or min(10.0, max(6.0, text_height / 3))
            lines = wrap_text(font, text, size, text_width - 0.6)
            line_height = (font.ascender - font.descender) * size * 1.08
            available_lines = max(1, int(text_height / line_height))
            while (len(lines) > available_lines or any(
                font.text_length(line, fontsize=size) > text_width - 0.6 for line in lines
            )) and size > 4.0:
                size = max(4.0, size - 0.5)
                lines = wrap_text(font, text, size, text_width - 0.6)
                line_height = (font.ascender - font.descender) * size * 1.08
                available_lines = max(1, int(text_height / line_height))
            lines = lines[:available_lines]
            baseline = height - inset - font.ascender * size
        else:
            size = fit_single_line(font, text, requested_size, text_width - 0.6, text_height)
            lines = [text]
            line_height = (font.ascender - font.descender) * size
            baseline = (height - line_height) / 2 - font.descender * size

        commands.extend(["BT", f"{FONT_RESOURCE} {pdf_number(size)} Tf", "0 g"])
        for index, line in enumerate(lines):
            line_width = font.text_length(line, fontsize=size)
            if alignment == 1:
                x = inset + max(0.0, (text_width - line_width) / 2)
            elif alignment == 2:
                x = inset + max(0.0, text_width - line_width - 0.3)
            else:
                x = inset + 0.3
            y = baseline - index * line_height
            commands.append(
                f"1 0 0 1 {pdf_number(x)} {pdf_number(y)} Tm <{encode_glyphs(font, line)}> Tj"
            )
        commands.append("ET")

    commands.extend(["Q", "EMC"])
    appearance = DecodedStreamObject()
    appearance.set_data(("\n".join(commands) + "\n").encode("ascii"))
    appearance[NameObject("/Type")] = NameObject("/XObject")
    appearance[NameObject("/Subtype")] = NameObject("/Form")
    appearance[NameObject("/FormType")] = NumberObject(1)
    appearance[NameObject("/BBox")] = ArrayObject(
        [FloatObject(0), FloatObject(0), FloatObject(width), FloatObject(height)]
    )
    appearance[NameObject("/Resources")] = DictionaryObject(
        {
            NameObject("/Font"): DictionaryObject(
                {NameObject(FONT_RESOURCE): font_reference}
            ),
            NameObject("/ProcSet"): ArrayObject(
                [NameObject("/PDF"), NameObject("/Text")]
            ),
        }
    )
    widget[NameObject("/AP")] = DictionaryObject(
        {NameObject("/N"): writer._add_object(appearance)}
    )


def update_form_resources(
    input_pdf: Path, output_pdf: Path, font_file: Path
) -> tuple[int, int, int]:
    reader = PdfReader(str(input_pdf))
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)

    acroform = writer.root_object["/AcroForm"].get_object()
    resources = acroform["/DR"].get_object()
    fonts = resources["/Font"].get_object()
    page_font = writer.pages[0]["/Resources"]["/Font"][FONT_RESOURCE]
    fonts[NameObject(FONT_RESOURCE)] = page_font
    acroform[NameObject("/DA")] = TextStringObject(f"{FONT_RESOURCE} 0 Tf 0 g")
    acroform[NameObject("/NeedAppearances")] = BooleanObject(False)

    seen: set[int] = set()
    updated_objects = 0

    def update_object(reference, inherited_type=None) -> None:
        nonlocal updated_objects
        value = reference.get_object() if hasattr(reference, "get_object") else reference
        identity = id(value)
        if identity in seen:
            return
        seen.add(identity)

        field_type = value.get("/FT") or inherited_type
        if field_type in ("/Tx", "/Ch"):
            value[NameObject("/DA")] = TextStringObject(replace_font(value.get("/DA")))
            updated_objects += 1
        for child in value.get("/Kids", []):
            update_object(child, field_type)

    for field in acroform["/Fields"]:
        update_object(field)
    for page in writer.pages:
        for annotation in page.get("/Annots", []):
            widget = annotation.get_object()
            if widget.get("/Subtype") != "/Widget":
                continue
            parent = widget.get("/Parent")
            field_type = widget.get("/FT") or (parent.get_object().get("/FT") if parent else None)
            update_object(widget, field_type)
            if parent:
                update_object(parent, field_type)

    fields = writer.get_fields() or {}
    patched_scripts = 0
    patched_actions: set[tuple[int, int] | int] = set()
    for name, field in fields.items():
        if plain_name(name) not in TARGET_SKILLS:
            continue
        calculate = (field.get("/AA") or {}).get("/C")
        if calculate is None:
            raise ValueError(f"Calculation action not found: {name}")
        action = calculate.get_object()
        script = read_script(action)
        if "isBoxChecked(0)" not in script:
            raise ValueError(f"Robust checkbox check not found: {name}")
        action_key = (
            (calculate.idnum, calculate.generation)
            if hasattr(calculate, "idnum")
            else id(action)
        )
        if action_key not in patched_actions:
            updated_script = (
                script.replace("\\u00D7", "X")
                .replace("\\u2716", "X")
                .replace("\u00d7", "X")
                .replace("\u2716", "X")
            )
            if updated_script == script and 'event.value = "X";' not in script:
                raise ValueError(f"Expected untrained marker was not found: {name}")
            write_script(writer, action, updated_script)
            patched_actions.add(action_key)
        elif 'event.value = "X";' not in script:
            raise ValueError(f"Shared calculation action was not updated: {name}")
        if str(field.get("/V") or "") in ("\u2716", "\u00d7"):
            field[NameObject("/V")] = TextStringObject("X")
        patched_scripts += 1

    if patched_scripts != len(TARGET_SKILLS):
        raise ValueError(f"Expected {len(TARGET_SKILLS)} scripts, updated {patched_scripts}")

    updated_values: set[str] = set()

    def update_stored_marker(reference) -> None:
        value = reference.get_object() if hasattr(reference, "get_object") else reference
        name = plain_name(value.get("/T")) if value.get("/T") is not None else ""
        if name in TARGET_SKILLS:
            marker = decoded_text(value.get("/V"))
            if marker in ("\u2716", "\u00d7"):
                value[NameObject("/V")] = TextStringObject("X")
            updated_values.add(name)
        for child in value.get("/Kids", []):
            update_stored_marker(child)

    for field_reference in acroform["/Fields"]:
        update_stored_marker(field_reference)
    if updated_values != TARGET_SKILLS:
        missing = sorted(TARGET_SKILLS - updated_values)
        raise ValueError(f"Target skill fields not found in field tree: {missing}")

    font = pymupdf.Font(fontfile=str(font_file))
    appearances = 0
    for page in writer.pages:
        for annotation in page.get("/Annots", []):
            widget = annotation.get_object()
            if widget.get("/Subtype") != "/Widget":
                continue
            if inherited_value(widget, "/FT") not in ("/Tx", "/Ch"):
                continue
            create_appearance(writer, widget, page_font, font)
            appearances += 1

    with output_pdf.open("wb") as output:
        writer.write(output)
    return updated_objects, patched_scripts, appearances


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input_pdf", type=Path)
    parser.add_argument("output_pdf", type=Path)
    parser.add_argument("--font", type=Path, default=Path(r"C:\Windows\Fonts\comicbd.ttf"))
    args = parser.parse_args()

    if not args.font.exists():
        raise FileNotFoundError(args.font)
    args.output_pdf.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="forja-t20-font-") as temporary:
        stage_font = Path(temporary) / "font.pdf"
        insert_font(args.input_pdf, stage_font, args.font)
        objects, scripts, appearances = update_form_resources(
            stage_font, args.output_pdf, args.font
        )

    print(f"font_objects={objects}")
    print(f"patched_scripts={scripts}")
    print(f"regenerated_appearances={appearances}")


if __name__ == "__main__":
    main()
