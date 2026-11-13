# Uso: npm i world-atlas @geo-maps/earth-rivers-10m @geo-maps/earth-lakes-10m @highcharts/map-collection (em /tmp/geo)
# python gerar_mapas_reais.py ../data/regioes.json ../web/src/assets/real
# Para uma regiao nova, adicione uma linha em CFG (pais/estado em destaque).
"""Gera o mapa-base no estilo 'telejornal' para cada região real (mesmos limites da imagem do radar).
Saída: mapa-<id>.jpg (fundo) e linhas-<id>.png (fronteiras/rios/rótulos por cima do radar)."""
import json, sys, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from pyproj import Transformer

G = '/tmp/geo/node_modules'
W, H = 1492, 1016
OUT = sys.argv[2] if len(sys.argv) > 2 else '/tmp/basemaps'
REG = json.load(open(sys.argv[1]))

# ---------- dados ----------
def topo(path, obj):
    t = json.load(open(path)); sc, tr = t['transform']['scale'], t['transform']['translate']
    arcs = []
    for a in t['arcs']:
        x = y = 0; pts = []
        for dx, dy in a:
            x += dx; y += dy; pts.append((x * sc[0] + tr[0], y * sc[1] + tr[1]))
        arcs.append(pts)
    arc = lambda i: arcs[i] if i >= 0 else arcs[~i][::-1]
    def ring(idx):
        pts = []
        for i in idx:
            a = arc(i); pts.extend(a if not pts else a[1:])
        return pts
    out = []
    for g in t['objects'][obj]['geometries']:
        polys = [g['arcs']] if g['type'] == 'Polygon' else g['arcs'] if g['type'] == 'MultiPolygon' else []
        out.append((g.get('properties', {}).get('name'), [[ring(r) for r in p] for p in polys]))
    return out

COUNTRIES = topo(f'{G}/world-atlas/countries-10m.json', 'countries')
def gj_polys(g):
    return [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
RIVERS = gj_polys(json.load(open(f'{G}/@geo-maps/earth-rivers-10m/map.geo.json'))['geometries'][0])
LAKES = gj_polys(json.load(open(f'{G}/@geo-maps/earth-lakes-10m/map.geo.json'))['geometries'][0])

def hc_admin(path):
    d = json.load(open(path)); hc = d['hc-transform']['default']
    inv = Transformer.from_crs(hc['crs'], 'EPSG:4326', always_xy=True)
    def ll(px, py):
        X = (px - hc['jsonmarginX']) / hc['jsonres'] / hc['scale'] + hc['xoffset']
        Y = (py - hc['jsonmarginY']) / hc['jsonres'] / hc['scale'] + hc['yoffset']
        return inv.transform(X, Y)
    out = []
    for f in d['features']:
        if not f.get('geometry'): continue
        polys = [[[ll(*q) for q in r] for r in p] for p in gj_polys(f['geometry'])]
        out.append((f['properties'].get('hc-a2') or f['properties'].get('name'), f['properties'].get('name'), polys))
    return out

ADMIN = {'br': hc_admin(f'{G}/@highcharts/map-collection/countries/br/br-all.geo.json'),
         'bd': hc_admin(f'{G}/@highcharts/map-collection/countries/bd/bd-all.geo.json')}

# Configuração de cada região: país/estado em destaque e rótulos
CFG = {
    'amazonia': dict(adm='br', foco=('state', 'Amazonas'), pais='Brazil', label='abbr'),
    'sul': dict(adm='br', foco=('state', 'Rio Grande do Sul'), pais='Brazil', label='abbr'),
    'bangladesh': dict(adm='bd', foco=('country', 'Bangladesh'), pais='Bangladesh', label='name'),
}

PAL = dict(ocean=(8, 37, 82), coast=(25, 118, 210), out=(60, 112, 156), focus=(27, 36, 50), land=(47, 92, 132),
           border=(235, 242, 250), river=(79, 163, 232), lake=(66, 150, 225))

def noise(seed):
    rng = np.random.default_rng(seed)
    n = np.zeros((H, W))
    for k, amp in ((6, 1.0), (20, .55), (70, .35), (260, .25)):
        small = rng.random((max(2, k * H // W), k))
        n += amp * (np.asarray(Image.fromarray((small * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)) / 255 - .5)
    n += .2 * (rng.random((H, W)) - .5)
    return n / 2.2

def run(r):
    rid = r['id']; cfg = CFG.get(rid)
    if not cfg: print('sem config', rid); return
    b = r['imagem']; o, e, no, so = b['oeste'], b['leste'], b['norte'], b['sul']
    P = lambda lon, lat: ((lon - o) / (e - o) * W, (no - lat) / (no - so) * H)
    def near(pts):
        xs = [q[0] for q in pts]; ys = [q[1] for q in pts]
        return max(xs) > o - 1 and min(xs) < e + 1 and max(ys) > so - 1 and min(ys) < no + 1
    def big(pts, px=7):
        xs = [P(*q)[0] for q in pts]; ys = [P(*q)[1] for q in pts]
        return (max(xs) - min(xs)) > px or (max(ys) - min(ys)) > px

    def mask(polys_list):
        m = Image.new('L', (W, H), 0); d = ImageDraw.Draw(m)
        for polys in polys_list:
            for p in polys:
                if not p or not near(p[0]): continue
                d.polygon([P(*q) for q in p[0]], fill=255)
                for hole in p[1:]:
                    if len(hole) > 2: d.polygon([P(*q) for q in hole], fill=0)
        return m

    land = mask([polys for _, polys in COUNTRIES])
    country = mask([polys for n, polys in COUNTRIES if n == cfg['pais']])
    adm = ADMIN[cfg['adm']]
    if cfg['foco'][0] == 'state':
        focus = mask([polys for _, n, polys in adm if n == cfg['foco'][1]])
    else:
        focus = country
    lakes = mask([[p for p in LAKES if p and near(p[0]) and big(p[0], 10)]])
    rivers = mask([[p for p in RIVERS if p and near(p[0]) and big(p[0], 12)]])

    A = lambda m: np.asarray(m, dtype=np.float32) / 255
    L, F, LK, RV = A(land), A(focus), A(lakes), A(rivers)
    # brilho do litoral (oceano clareia perto da costa)
    glow = A(land.filter(ImageFilter.GaussianBlur(60))) ; glow = np.clip(glow * 2.2, 0, 1)
    nz = noise(hash(rid) % 1000)
    col = lambda c: np.array(c, dtype=np.float32)[None, None, :]
    ocean = col(PAL['ocean']) * (1 - glow[..., None]) + col(PAL['coast']) * glow[..., None]
    out_land = col(PAL['out']) * (1 + .22 * nz[..., None])
    foc = col(PAL['focus']) * (1 + .35 * nz[..., None])
    img = ocean * (1 - L[..., None]) + out_land * L[..., None]
    img = img * (1 - F[..., None]) + foc * F[..., None]
    wat = np.clip(LK + RV, 0, 1)[..., None]
    img = img * (1 - wat) + col(PAL['lake']) * (1 + .1 * nz[..., None]) * wat
    base = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))

    # camada de linhas (transparente) — fronteiras, litoral e rótulos, para ficar por cima do radar
    lines = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lines)
    def outline(polys, fill, width):
        for p in polys:
            if not p or not near(p[0]): continue
            pts = [P(*q) for q in p[0]]; d.line(pts + [pts[0]], fill=fill, width=width, joint='curve')
    for n, polys in COUNTRIES: outline(polys, PAL['border'] + (235,), 3)
    for _, n, polys in adm: outline(polys, PAL['border'] + (150,), 2)
    for p in LAKES:
        if p and near(p[0]) and big(p[0], 10): pts = [P(*q) for q in p[0]]; d.line(pts + [pts[0]], fill=(170, 215, 250, 200), width=2)
    # rótulos (estado/divisão) no centro de cada área visível
    try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 44 if cfg['label'] == 'abbr' else 30)
    except Exception: font = ImageFont.load_default()
    for a2, n, polys in adm:
        m = np.asarray(mask([polys]))
        ys, xs = np.nonzero(m)
        if len(xs) < 4000: continue
        cx, cy = float(np.median(xs)), float(np.median(ys))
        txt = a2 if cfg['label'] == 'abbr' else n.upper()
        tw = d.textlength(txt, font=font)
        for dx, dy in ((2, 2), (0, 3)): d.text((cx - tw / 2 + dx, cy - 22 + dy), txt, font=font, fill=(0, 0, 0, 120))
        d.text((cx - tw / 2, cy - 22), txt, font=font, fill=(255, 255, 255, 235))
    base = Image.alpha_composite(base.convert('RGBA'), lines).convert('RGB')
    base.save(f'{OUT}/mapa-{rid}.jpg', quality=88)
    lines.save(f'{OUT}/linhas-{rid}.png', optimize=True)
    print(rid, 'ok')

import os; os.makedirs(OUT, exist_ok=True)
for r in REG: run(r)
