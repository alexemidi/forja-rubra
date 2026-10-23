import os
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import Glyph, GlyphComponent

font_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fonts', 'Tormenta20x.ttf')
font = TTFont(font_path)

glyf = font['glyf']
hmtx = font['hmtx']

# Configuração da cedilha discreta e bem posicionada sob o C
# c tem largura 578, menor ponto próximo a x=337, y=1
# cedilla tem topo entre x=64 e x=132 (centro ~98)
# com dx=238 e dy=-8, o topo da cedilha se alinha a x=336, y=9, conectando perfeitamente à curva inferior do C
comp_c = GlyphComponent()
comp_c.glyphName = 'C'
comp_c.x = 0
comp_c.y = 0
comp_c.flags = 0x0204 # ARGS_ARE_XY_VALUES | ROUND_XY_TO_GRID

comp_ced = GlyphComponent()
comp_ced.glyphName = 'cedilla'
comp_ced.x = 238
comp_ced.y = -8
comp_ced.flags = 0x0204

# Configura Ccedilla
g_ccedilla = Glyph()
g_ccedilla.numberOfContours = -1
g_ccedilla.components = [comp_c, comp_ced]

glyf['ccedilla'] = g_ccedilla
glyf['Ccedilla'] = g_ccedilla

hmtx['ccedilla'] = (578, 18)
hmtx['Ccedilla'] = (578, 18)

# Atualiza glyphOrder se necessário
glyph_order = font.getGlyphOrder()
if 'Ccedilla' not in glyph_order:
    glyph_order.append('Ccedilla')
    font.setGlyphOrder(glyph_order)

# Atualiza todos os mapas de caracteres (cmap)
for table in font['cmap'].tables:
    table.cmap[0x00E7] = 'ccedilla' # ç minúsculo
    table.cmap[0x00C7] = 'Ccedilla' # Ç maiúsculo

font.save(font_path)
print("Fonte Tormenta20x.ttf atualizada com sucesso com glifos ç (0x00E7) e Ç (0x00C7)!")
