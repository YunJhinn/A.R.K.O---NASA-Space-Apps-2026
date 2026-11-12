"""A.R.K.O · NASA Space Apps 2026
EN: step 3 - draw the radar background image and focos_app.json for the prototype.
PT: passo 3 - desenha a imagem de radar de fundo e o focos_app.json para o prototipo.
"""
"""Passo 4: gera a imagem de radar (21/out) no estilo do app e o arquivo para o prototipo."""
import json, numpy as np
from pyproj import Transformer
from PIL import Image

W, E, N, S = -62.05, -58.95, -3.944, -6.056       # recorte em lon/lat (proporcao do mapa do app)
OUT_W, OUT_H = 1492, 1016

z = np.load("cache.npz"); epsg = int(z["epsg"])
hv, x, y = z["d_hv"], z["d_x"], z["d_y"]
lon = np.linspace(W, E, OUT_W); lat = np.linspace(N, S, OUT_H)
LON, LAT = np.meshgrid(lon, lat)
X, Y = Transformer.from_crs(4326, epsg, always_xy=True).transform(LON, LAT)
ix = np.round((X - x[0]) / (x[1] - x[0])).astype(int); iy = np.round((Y - y[0]) / (y[1] - y[0])).astype(int)
dentro = (ix >= 0) & (ix < len(x)) & (iy >= 0) & (iy < len(y))
v = np.full(LON.shape, np.nan, dtype="float32")
v[dentro] = hv[iy[dentro], ix[dentro]]
with np.errstate(divide="ignore", invalid="ignore"):
    dbv = 10 * np.log10(v)
t = np.clip((dbv + 26) / 18, 0, 1); t = np.nan_to_num(t, nan=0.0)
t = t ** 1.2
fundo = np.array([9, 9, 11]); claro = np.array([150, 160, 150])          # zinc escuro -> cinza esverdeado
rgb = (fundo + (claro - fundo) * t[..., None]).astype("uint8")
rgb[~dentro | ~np.isfinite(dbv)] = (12, 12, 14)
Image.fromarray(rgb).save("radar_21out.jpg", quality=78, optimize=True)

d = json.load(open("focos.json", encoding="utf-8"))
d["imagem"] = {"arquivo": "radar_21out.jpg", "oeste": W, "leste": E, "norte": N, "sul": S, "data": "2026-10-21"}
json.dump(d, open("focos_app.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("ok", Image.open("radar_21out.jpg").size)
