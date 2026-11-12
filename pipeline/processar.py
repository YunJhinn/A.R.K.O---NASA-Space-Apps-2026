"""A.R.K.O · NASA Space Apps 2026
EN: step 2 - compare two NISAR passes point by point and write focos.json.
PT: passo 2 - compara duas passagens NISAR ponto a ponto e gera focos.json.
"""
"""Passo 3: compara duas passagens NISAR (GCOV) e gera focos.json para o A.R.K.O.

Regras (heuristicas simples de radar, banda L):
  agua   : agua nova      -> HH depois < -18 dB e HH antes > -14 dB
  solo   : agua que sumiu -> HH antes < -18 dB e HH depois > -14 dB (rio/lago recuou, seca)
  arvore : perda de vegetacao (desmatamento ou queimada) -> HV antes > -15 dB e queda de HV > 3 dB
"""
import json, numpy as np, h5py, earthaccess
from scipy import ndimage
from pyproj import Transformer

ANTES = "NISAR_L2_PR_GCOV_029_132_A_175_2005_DHDH_M_20260903T094546_20260903T094620_P05023_N_F_J_001"
DEPOIS = "NISAR_L2_PR_GCOV_033_132_A_175_2005_DHDH_M_20261021T094546_20261021T094620_P05023_N_F_J_001"
FREQ = "frequencyB"          # grade de ~80 m: leve para o piloto
MIN_PX = 40                  # menor foco aceito (~0,26 km2)
MAX_POR_TIPO = 25

CIDADES = {"Careiro": (-60.37, -3.77), "Careiro da Várzea": (-59.83, -3.20), "Autazes": (-59.13, -3.58),
           "Borba": (-59.59, -4.39), "Nova Olinda do Norte": (-59.09, -3.89), "Novo Aripuanã": (-60.38, -5.12),
           "Manicoré": (-61.30, -5.81), "Beruri": (-61.37, -3.90), "Manaquiri": (-60.46, -3.43)}

earthaccess.login(strategy="netrc")

def ler(nome):
    res = earthaccess.search_data(short_name="NISAR_L2_GCOV_PROVISIONAL_V1", granule_name=nome)
    h = h5py.File(earthaccess.open(res)[0], "r")
    g = h[f"science/LSAR/GCOV/grids/{FREQ}"]
    print("lendo", nome[17:40], "...", flush=True)
    return dict(hh=g["HHHH"][:], hv=g["HVHV"][:], x=g["xCoordinates"][:], y=g["yCoordinates"][:],
                epsg=int(g["projection"].attrs["epsg_code"]))

import os
if os.path.exists('cache.npz'):
    z = np.load('cache.npz'); a = {k[2:]: z[k] for k in z if k.startswith('a_')}; d = {k[2:]: z[k] for k in z if k.startswith('d_')}; a['epsg'] = d['epsg'] = int(z['epsg'])
else:
    a, d = ler(ANTES), ler(DEPOIS)
    np.savez('cache.npz', epsg=a['epsg'], **{'a_'+k: v for k, v in a.items() if k != 'epsg'}, **{'d_'+k: v for k, v in d.items() if k != 'epsg'})

# alinha as duas grades pela area comum
x0, x1 = max(a["x"][0], d["x"][0]), min(a["x"][-1], d["x"][-1])
y0, y1 = min(a["y"][0], d["y"][0]), max(a["y"][-1], d["y"][-1])
def corta(r):
    ix = np.where((r["x"] >= x0) & (r["x"] <= x1))[0]; iy = np.where((r["y"] <= y0) & (r["y"] >= y1))[0]
    sl = (slice(iy[0], iy[-1] + 1), slice(ix[0], ix[-1] + 1))
    return r["hh"][sl], r["hv"][sl], r["x"][sl[1]], r["y"][sl[0]]
hh1, hv1, X, Y = corta(a); hh2, hv2, _, _ = corta(d)
n = min(hh1.shape[0], hh2.shape[0]), min(hh1.shape[1], hh2.shape[1])
hh1, hv1, hh2, hv2 = (v[:n[0], :n[1]] for v in (hh1, hv1, hh2, hv2)); X, Y = X[:n[1]], Y[:n[0]]
px = abs(X[1] - X[0]); area_px = (px / 1000) ** 2

def db(v):  # media 3x3 (reduz o chuvisco do radar) e converte para dB
    m = np.isfinite(v) & (v > 0)
    s = ndimage.uniform_filter(np.where(m, v, 0), 3); c = ndimage.uniform_filter(m.astype(float), 3)
    with np.errstate(divide="ignore", invalid="ignore"):
        return np.where(c > 0.5, 10 * np.log10(s / c), np.nan)
HH1, HV1, HH2, HV2 = db(hh1), db(hv1), db(hh2), db(hv2)
ok = np.isfinite(HH1) & np.isfinite(HH2) & np.isfinite(HV1) & np.isfinite(HV2)
# ignora pixels sem sinal (<-35 dB) e uma faixa de 1,6 km nas bordas da passagem
ok &= (HH1 > -35) & (HH2 > -35) & (HV1 > -40) & (HV2 > -40)
ok = ndimage.binary_erosion(ok, iterations=20)
for nm, v in [("HH1", HH1), ("HV1", HV1), ("dHH", HH2 - HH1), ("dHV", HV2 - HV1)]:
    print(nm, np.round(np.nanpercentile(v[ok], [0.1, 1, 5, 50, 95, 99, 99.9]), 1))

regras = {
    "agua":   (ok & (HH2 < -16) & (HH2 - HH1 < -4), np.abs(HH2 - HH1)),
    "solo":   (ok & (HH1 < -16) & (HH2 - HH1 > 4), np.abs(HH2 - HH1)),
    "arvore": (ok & (HV1 > -16) & (HV2 - HV1 < -2.5), np.abs(HV2 - HV1)),
}
tr = Transformer.from_crs(a["epsg"], 4326, always_xy=True)
def lugar(lon, lat):
    import math
    km = {k: 111.32 * math.hypot((lon - v[0]) * math.cos(math.radians(lat)), lat - v[1]) for k, v in CIDADES.items()}
    nome = min(km, key=km.get)
    return f"{nome} · AM" if km[nome] < 8 else f"a {round(km[nome])} km de {nome} · AM"

focos = []
for tipo, (mask, delta) in regras.items():
    mask = ndimage.binary_opening(mask, iterations=1)
    lab, nlab = ndimage.label(mask)
    if nlab == 0: continue
    idx = np.arange(1, nlab + 1)
    cnt = ndimage.sum(mask, lab, idx); dm = ndimage.mean(delta, lab, idx)
    cy, cx = np.array(ndimage.center_of_mass(mask, lab, idx)).T
    ordem = np.argsort(-cnt)
    for i in ordem[:MAX_POR_TIPO]:
        if cnt[i] < MIN_PX: break
        lon, lat = tr.transform(X[int(cx[i])], Y[int(cy[i])])
        focos.append({"id": f"{tipo}-{len(focos)+1}", "tipo": tipo, "lon": round(lon, 4), "lat": round(lat, 4),
                      "area_km2": round(float(cnt[i] * area_px), 2), "grau": int(min(100, round(dm[i] * 11))),
                      "delta_db": round(float(dm[i]), 1), "local": lugar(lon, lat)})
    print(f"{tipo}: {nlab} manchas, {sum(f['tipo']==tipo for f in focos)} focos gravados")

lon0, lat0 = tr.transform(X[0], Y[-1]); lon1, lat1 = tr.transform(X[-1], Y[0])
out = {"fonte": "NASA-ISRO NISAR · GCOV banda L (PROVISIONAL) · ASF DAAC",
       "antes": {"data": "2026-09-03", "produto": ANTES}, "depois": {"data": "2026-10-21", "produto": DEPOIS},
       "area": {"oeste": round(lon0, 3), "sul": round(lat0, 3), "leste": round(lon1, 3), "norte": round(lat1, 3)},
       "focos": focos}
json.dump(out, open("focos.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"\n{len(focos)} focos salvos em focos.json  | area {out['area']}")

# imagem de conferencia: depois em cinza + mudancas coloridas (1 pixel a cada 4)
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
s = 4; base = np.clip((HV2[::s, ::s] + 30) / 22, 0, 1)
rgb = np.dstack([base] * 3)
cores = {"agua": (0.22, 0.74, 0.97), "solo": (0.65, 0.55, 0.98), "arvore": (0.98, 0.57, 0.24)}
for tipo, (mask, _) in regras.items():
    rgb[mask[::s, ::s]] = cores[tipo]
plt.figure(figsize=(10, 10)); plt.imshow(np.nan_to_num(rgb), extent=(lon0, lon1, lat0, lat1))
for f in focos:
    plt.plot(f["lon"], f["lat"], "o", mfc="none", mec="w", ms=8)
plt.title("NISAR 03/set -> 21/out 2026 · azul agua nova · roxo agua que sumiu · laranja perda de vegetacao")
plt.savefig("conferencia.png", dpi=110, bbox_inches="tight"); print("conferencia.png salva")

