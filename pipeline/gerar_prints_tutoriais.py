"""Tira prints reais do app para cada passo dos tutoriais e desenha destaque + seta + número."""
import json, sys, math
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFilter, ImageFont

URL = 'http://localhost:4190/index.html'
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/tut'
VW, VH = 1440, 900
OW, OH = 1120, 700  # tamanho final da imagem
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

PLACES = {
    'canoas': [{'display_name': 'Canoas, Rio Grande do Sul, Brasil', 'name': 'Canoas', 'lon': '-51.18', 'lat': '-29.92'}],
    'paris': [{'display_name': 'Paris, Île-de-France, França', 'name': 'Paris', 'lon': '2.35', 'lat': '48.85'}],
}

# Cada tutorial: preparação + lista de passos (ações antes do print, alvos a destacar)
# ação: ('src','real'|'demo') ('region',id) ('click',sel) ('fill',sel,txt) ('nav',label) ('wait',ms) ('tab') ('key',k)
T = {
    'visao': dict(prep=[], steps=[
        dict(t=['union:.kpihead, .kpis']),
        dict(t=['#mapPanel', '.card.alerts']),
        dict(t=['union:aside .nav']),
        dict(t=['aside .seg >> nth=1', 'aside .seg >> nth=2']),
    ]),
    'dados': dict(prep=[], steps=[
        dict(t=['aside .seg >> nth=1', '#srcWrap']),
        dict(t=['aside .seg >> nth=2']),
        dict(a=[('src', 'real')], t=['aside select']),
        dict(a=[('src', 'real')], t=['.status']),
    ]),
    'regioes': dict(prep=[('src', 'real')], steps=[
        dict(t=['aside select']),
        dict(t=['.search']),
        dict(a=[('fill', '.search input', 'Canoas')], t=['.search + div']),
        dict(a=[('fill', '.search input', 'Paris')], t=['.search + div']),
        dict(a=[('fill', '.search input', 'Canoas'), ('click', '.search + div button >> nth=0'), ('wait', 1200)], t=['#pinmark']),
    ]),
    'favoritos': dict(prep=[('src', 'real'), ('region', 'sul')], steps=[
        dict(t=['.kpihead button']),
        dict(a=[('click', '.kpihead button'), ('click', '#myRegions button >> nth=0')], t=['#myRegions']),
        dict(a=[('click', '.kpihead button'), ('region', 'bangladesh'), ('click', '#myRegions button >> nth=1')], t=['#myRegions']),
        dict(a=[('click', '.kpihead button'), ('click', '#myRegions button >> nth=0')], t=['#myRegions ul, #myRegions > div:last-child']),
    ]),
    'periodo': dict(prep=[], steps=[
        dict(t=['.bar .seg']),
        dict(a=[('click', '.datebtn')], t=['.datebtn', '.dp']),
        dict(t=['union:.bar .switch, .bar .pill']),
        dict(a=[('src', 'real'), ('region', 'sul'), ('click', '.bar .seg button >> nth=0')], t=['.head .answer']),
    ]),
    'linha': dict(prep=[('src', 'real'), ('region', 'sul')], steps=[
        dict(t=['.tlx div[role=group]:has(button) >> nth=0']),
        dict(t=['.tlx div:has(> [data-i])']),
        dict(t=['.tlx div.mt-2\\.5']),
        dict(t=['.tlx button >> nth=0']),
        dict(a=[('click', '.tlx div[role=group] button >> nth=0'), ('click', '.tlx [data-i="4"]'), ('wait', 400)], t=['.tlx button:has-text("Ver tudo"), .tlx button:has-text("Show all")']),
    ]),
    'mapa': dict(prep=[('src', 'real'), ('region', 'sul')], steps=[
        dict(a=[('scroll', '#map')], t=['#map button.mk >> nth=3']),
        dict(t=['.chiprow .chips']),
        dict(a=[('scroll', '#map'), ('clickmk', '#map button.mk >> nth=3'), ('wait', 400)], t=['.pop']),
        dict(a=[('scroll', '#map')], t=['.mctl', '.legend']),
        dict(t=['.cmode']),
    ]),
    'alertas': dict(prep=[('src', 'real'), ('region', 'sul')], steps=[
        dict(t=['.card.alerts .sum']),
        dict(t=['.card.alerts .al >> nth=0']),
        dict(t=['.card.alerts .al .risk >> nth=0']),
        dict(t=['.card.alerts .al a >> nth=0']),
        dict(a=[('top',)], t=['.ibtn', 'aside .nav >> nth=2']),
    ]),
    'comparar': dict(prep=[('src', 'real'), ('region', 'sul')], steps=[
        dict(t=['aside .nav >> nth=3']),
        dict(a=[('nav', 3)], t=['#v-comparar .sel >> nth=0', '#v-comparar .sel >> nth=1', '#v-comparar .sel >> nth=2']),
        dict(a=[('nav', 3)], t=['#v-comparar .sel >> nth=3', '#v-comparar .search']),
        dict(a=[('nav', 3), ('range', 30)], t=['#v-comparar input[type=range]']),
        dict(a=[('nav', 3)], t=['.card.diff']),
    ]),
    'celular': dict(prep=[], steps=[
        dict(t=['aside .nav >> nth=4']),
        dict(a=[('nav', 4)], t=['.phone .tabbar']),
        dict(a=[('nav', 4)], t=['.phone .al >> nth=0']),
        dict(a=[('nav', 4)], t=['.why-list']),
    ]),
    'fonte': dict(prep=[('src', 'real'), ('region', 'sul')], steps=[
        dict(a=[('scroll', '#map')], t=['#srcBadge']),
        dict(t=['.tlx div:has(> [data-i])']),
        dict(t=['.card.alerts']),
        dict(t=['.status']),
    ]),
    'idioma': dict(prep=[], steps=[
        dict(t=['aside .seg >> nth=0']),
        dict(a=[('focus', 'aside .nav >> nth=3')], t=['aside .nav >> nth=3']),
        dict(t=['.chiprow .chips']),
    ]),
}

def run_actions(pg, acts, lang):
    for a in acts:
        k = a[0]
        if k == 'src':
            pg.click(f'aside button:text-is("{"NISAR real" if lang == "pt" else "Real NISAR"}")' if a[1] == 'real' else f'aside button:text-is("{"Exemplo" if lang == "pt" else "Example"}")'); pg.wait_for_timeout(700)
        elif k == 'region': pg.select_option('aside select', a[1]); pg.wait_for_timeout(1300)
        elif k == 'click': pg.click(a[1]); pg.wait_for_timeout(500)
        elif k == 'clickmk': pg.locator(a[1]).click(force=True); pg.wait_for_timeout(300)
        elif k == 'fill': pg.fill(a[1], a[2]); pg.wait_for_timeout(1300)
        elif k == 'nav': pg.locator('aside .nav').nth(a[1]).click(); pg.wait_for_timeout(1200)
        elif k == 'wait': pg.wait_for_timeout(a[1])
        elif k == 'scroll': pg.locator(a[1]).scroll_into_view_if_needed(); pg.wait_for_timeout(300)
        elif k == 'focus': pg.locator(a[1]).focus(); pg.keyboard.press('Shift+Tab'); pg.keyboard.press('Tab'); pg.wait_for_timeout(200)
        elif k == 'range': pg.locator('#v-comparar input[type=range]').fill(str(a[1])); pg.wait_for_timeout(300)
        elif k == 'top': pg.evaluate('scrollTo(0,0)'); pg.wait_for_timeout(200)

def boxes(pg, targets):
    out = []
    for tg in targets:
        union = tg.startswith('union:')
        sel = tg[6:] if union else tg
        loc = pg.locator(sel)
        n = loc.count()
        if not n: print('   ! sem alvo', sel); continue
        bbs = [loc.nth(i).bounding_box() for i in range(n if union else 1)]
        bbs = [b for b in bbs if b and b['width'] > 0]
        if not bbs: continue
        x0 = min(b['x'] for b in bbs); y0 = min(b['y'] for b in bbs)
        x1 = max(b['x'] + b['width'] for b in bbs); y1 = max(b['y'] + b['height'] for b in bbs)
        out.append((x0, y0, x1, y1))
    return out

def annotate(png, bxs, path, step=1):
    im = Image.open(png).convert('RGB')
    S = im.width / VW
    bxs = [tuple(v * S for v in b) for b in bxs]
    # recorte: em volta dos alvos, proporção 16:10, mínimo 820 px de largura
    if bxs:
        x0 = min(b[0] for b in bxs); y0 = min(b[1] for b in bxs); x1 = max(b[2] for b in bxs); y1 = max(b[3] for b in bxs)
    else:
        x0, y0, x1, y1 = 0, 0, im.width, im.height
    w = max(x1 - x0 + 260 * S, 820 * S); h = max(y1 - y0 + 220 * S, w / 1.6); w = max(w, h * 1.6)
    w = min(w, im.width); h = min(h, im.height)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    L = min(max(0, cx - w / 2), im.width - w); T_ = min(max(0, cy - h / 2), im.height - h)
    crop = (int(L), int(T_), int(L + w), int(T_ + h))
    # escurece fora dos alvos
    dim = Image.new('L', im.size, 120)
    dm = ImageDraw.Draw(dim)
    for b in bxs: dm.rounded_rectangle((b[0] - 8 * S, b[1] - 8 * S, b[2] + 8 * S, b[3] + 8 * S), radius=12 * S, fill=0)
    dim = dim.filter(ImageFilter.GaussianBlur(3 * S))
    dark = Image.new('RGB', im.size, (8, 14, 28))
    im = Image.composite(dark, im, dim)
    d = ImageDraw.Draw(im)
    Y = (255, 196, 0)
    font = ImageFont.truetype(FONT, int(26 * S))
    for n, b in enumerate(bxs):
        d.rounded_rectangle((b[0] - 8 * S, b[1] - 8 * S, b[2] + 8 * S, b[3] + 8 * S), radius=12 * S, outline=Y, width=int(4 * S))
        # seta: vem do lado com mais espaço dentro do recorte
        bx, by = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
        cands = []
        for dx, dy in ((-1, -1), (1, -1), (-1, 1), (1, 1), (0, 1), (0, -1), (-1, 0), (1, 0)):
            ex = (b[2] + 10 * S) if dx > 0 else (b[0] - 10 * S) if dx < 0 else bx
            ey = (b[3] + 10 * S) if dy > 0 else (b[1] - 10 * S) if dy < 0 else by
            sx, sy = ex + dx * 120 * S, ey + dy * 95 * S
            m = 40 * S
            if crop[0] + m < sx < crop[2] - m and crop[1] + m < sy < crop[3] - m:
                cands.append((abs(dx) + abs(dy), (sx, sy), (ex, ey)))
        if not cands: continue
        cands.sort(key=lambda c: -c[0])
        (sx, sy), (ex, ey) = cands[0][1], cands[0][2]
        ang = math.atan2(ey - sy, ex - sx)
        hl = 26 * S
        tip = (ex, ey)
        base = (ex - hl * math.cos(ang), ey - hl * math.sin(ang))
        left = (base[0] + hl * .55 * math.cos(ang + math.pi / 2), base[1] + hl * .55 * math.sin(ang + math.pi / 2))
        right = (base[0] + hl * .55 * math.cos(ang - math.pi / 2), base[1] + hl * .55 * math.sin(ang - math.pi / 2))
        for col, wd in (((20, 20, 20), 13), (Y, 8)):
            d.line((sx, sy, base[0], base[1]), fill=col, width=int(wd * S))
        d.polygon([tip, left, right], fill=Y, outline=(20, 20, 20))
        r = 24 * S
        d.ellipse((sx - r, sy - r, sx + r, sy + r), fill=Y, outline=(20, 20, 20), width=int(3 * S))
        lbl = 'ABCD'[n] if len(bxs) > 1 else str(step)
        tw = d.textlength(lbl, font=font)
        d.text((sx - tw / 2, sy - 16 * S), lbl, font=font, fill=(20, 20, 20))
    im = im.crop(crop).resize((OW, OH), Image.LANCZOS)
    im.save(path, 'WEBP', quality=72, method=6)

def main():
    import os
    with sync_playwright() as p:
        b = p.chromium.launch()
        for lang in ('pt', 'en'):
            os.makedirs(f'{OUT}/{lang}', exist_ok=True)
            for tid, spec in T.items():
                for i, st in enumerate(spec['steps']):
                    ctx = b.new_context(viewport={'width': VW, 'height': VH}, device_scale_factor=1.5)
                    pg = ctx.new_page()
                    def handle(route):
                        q = route.request.url.lower()
                        rows = next((v for k, v in PLACES.items() if k in q), [])
                        route.fulfill(status=200, content_type='application/json', body=json.dumps(rows), headers={'Access-Control-Allow-Origin': '*'})
                    pg.route('https://nominatim.openstreetmap.org/**', handle)
                    pg.goto(URL + '#inicio'); pg.wait_for_timeout(900)
                    pg.evaluate('localStorage.clear()')
                    pg.add_style_tag(content='.protobar{display:none!important}')
                    if lang == 'en': pg.click('aside button:text-is("EN")'); pg.wait_for_timeout(300)
                    try:
                        run_actions(pg, spec['prep'] + st.get('a', []), lang)
                        bx = boxes(pg, st['t'])
                        if bx:  # garante o alvo visível
                            top = min(v[1] for v in bx); bot = max(v[3] for v in bx)
                            if top < 0 or bot > VH:
                                pg.evaluate(f'scrollBy(0,{(top + bot) / 2 - VH / 2})'); pg.wait_for_timeout(300); bx = boxes(pg, st['t'])
                        pg.screenshot(path='/tmp/_s.png')
                        annotate('/tmp/_s.png', bx, f'{OUT}/{lang}/{tid}-{i + 1}.webp', i + 1)
                        print(lang, tid, i + 1, 'ok', len(bx))
                    except Exception as e:
                        print(lang, tid, i + 1, 'ERRO', str(e)[:160])
                    ctx.close()
        b.close()

main()
