import json
import subprocess
from pathlib import Path

from pypdf import PdfReader


PDF = Path("output/pdf/Ficha T20 Jogo do Ano - Otimizada v1.7.pdf")
SOURCE = Path("output/Ficha T20 Jogo do Ano - Otimizada v1.5.pdf")


def resolve(value):
    return value.get_object() if hasattr(value, "get_object") else value


def script(field, trigger: str) -> str:
    action = resolve((field.get("/AA") or {})[trigger])
    value = resolve(action["/JS"])
    raw = value.get_data() if hasattr(value, "get_data") else bytes(value)
    if raw.startswith(b"\xfe\xff"):
        return raw[2:].decode("utf-16-be")
    return raw.decode("latin-1")


def raw_javascript(value) -> bytes:
    value = resolve(value)
    if hasattr(value, "get_data"):
        return value.get_data()
    if hasattr(value, "original_bytes"):
        return value.original_bytes
    return str(value).encode("utf-8")


reader = PdfReader(str(PDF))
fields = reader.get_fields() or {}
source_reader = PdfReader(str(SOURCE))
source_fields = source_reader.get_fields() or {}
assert len(reader.pages) == 2
assert "DeslocamentoBase" in fields
assert "DeslocamentoExibido" in fields
assert fields["DeslocamentoBase"].get("/Ff", 0) & 1
assert fields["DeslocamentoExibido"].get("/Ff", 0) & 1

for name in ("Acrobacia", "Furtividade", "Ladinagem"):
    value = script(fields[name], "/C")
    assert 'cargaUsada > limiteCarga ? 5 : 0' in value
    assert "- penSobrecarga" in value

effect = script(fields["Efeitos4"], "/C")
assert 'resultado.push("Sobrecarregado")' in effect
assert "cargaUsada > limiteCarga" in effect

movement_calculation = script(fields["Deslocamento"], "/C")
movement_validation = script(fields["Deslocamento"], "/V")
assert "Math.max(0, numeroBase - 3)" in movement_calculation
assert 'this.getField("DeslocamentoBase")' in movement_validation
assert 'this.getField("DeslocamentoExibido")' in movement_validation
assert 'campoExibido.value = valorExibido' in movement_calculation

runtime_test = r'''
const scripts=JSON.parse(process.argv[1]);
const fields={Deslocamento:{value:""},DeslocamentoBase:{value:""},DeslocamentoExibido:{value:""},CargaUsada:{value:0},LimCarga:{value:10}};
const documentMock={getField(name){return fields[name]||null}};
function execute(code,event){new Function("event",code).call(documentMock,event)}
function calculate(){const event={value:fields.Deslocamento.value,target:{textSize:12}};execute(scripts.calculate,event);execute(scripts.validate,{value:event.value});fields.Deslocamento.value=event.value}
function enter(value){execute(scripts.validate,{value});fields.Deslocamento.value=value;calculate()}
enter(9);
fields.CargaUsada.value=9.5;calculate();
if(fields.Deslocamento.value!==9||fields.DeslocamentoBase.value!==9)throw Error(JSON.stringify(fields));
fields.CargaUsada.value=11;calculate();
if(fields.Deslocamento.value!==6||fields.DeslocamentoBase.value!==9)throw Error(JSON.stringify(fields));
calculate();
if(fields.Deslocamento.value!==6||fields.DeslocamentoBase.value!==9)throw Error(JSON.stringify(fields));
fields.CargaUsada.value=9;calculate();
if(fields.Deslocamento.value!==9||fields.DeslocamentoBase.value!==9)throw Error(JSON.stringify(fields));
enter(12);
fields.CargaUsada.value=11;calculate();
if(fields.Deslocamento.value!==9||fields.DeslocamentoBase.value!==12)throw Error(JSON.stringify(fields));
'''
subprocess.run(
    [
        "node",
        "-e",
        runtime_test,
        json.dumps({"validate": movement_validation, "calculate": movement_calculation}),
    ],
    check=True,
)

acroform = resolve(reader.trailer["/Root"]["/AcroForm"])
order = [str(resolve(reference).get("/T")) for reference in acroform["/CO"]]
for name in ("Acrobacia", "Furtividade", "Ladinagem", "Efeitos4", "Deslocamento"):
    assert order.index("CargaUsada") < order.index(name)

widget_names = []
for page in reader.pages:
    for annotation_reference in page.get("/Annots", []):
        annotation = resolve(annotation_reference)
        if annotation.get("/Subtype") != "/Widget":
            continue
        parent = resolve(annotation.get("/Parent")) if annotation.get("/Parent") else annotation
        widget_names.append(str(parent.get("/T", annotation.get("/T", ""))))

assert "DeslocamentoBase" not in widget_names
assert "DeslocamentoExibido" not in widget_names
assert all(name in widget_names for name in ("Efeitos4", "Deslocamento", "Acrobacia", "Furtividade", "Ladinagem"))
source_widget_count = sum(
    1
    for page in source_reader.pages
    for annotation_reference in page.get("/Annots", [])
    if resolve(annotation_reference).get("/Subtype") == "/Widget"
)
assert len(widget_names) == source_widget_count

changed = {"Acrobacia", "Furtividade", "Ladinagem", "Efeitos4", "Deslocamento"}
for name in source_fields:
    assert source_fields[name].get("/Ff") == fields[name].get("/Ff"), name
for name in source_fields.keys() - changed:
    for trigger in ("/C", "/V", "/F", "/K"):
        source_action = (source_fields[name].get("/AA") or {}).get(trigger)
        output_action = (fields[name].get("/AA") or {}).get(trigger)
        assert bool(source_action) == bool(output_action), (name, trigger)
        if source_action:
            source_data = raw_javascript(resolve(source_action).get("/JS"))
            output_data = raw_javascript(resolve(output_action).get("/JS"))
            assert source_data == output_data, (name, trigger)
print({"status": "ok", "fields": len(fields), "widgets": len(widget_names)})
