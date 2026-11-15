"""A.R.K.O Rios · Aquíferos: a água debaixo da terra vista do espaço (GRACE e GRACE-FO, 2002 → hoje).
PT: os satélites GRACE (NASA/DLR) e GRACE-FO (NASA/GFZ) medem a gravidade da Terra; quando uma região perde
    água (no solo, nos rios e nos aquíferos), ela fica um pouco "mais leve". Usamos a grade mensal de
    armazenamento total de água (TWS, cm de água) do GFZ GravIS (aberta, sem login) e calculamos a média
    sobre a área aproximada de cada aquífero, a tendência (cm/ano) e o volume ganho ou perdido (km³).
    Atenção: o GRACE mede a água TOTAL (solo + superfície + subterrânea) e enxerga áreas de ~300 km ou mais.
EN: GRACE/GRACE-FO terrestrial water storage averaged over approximate aquifer areas.
Uso: python pipeline/aquiferos_grace.py   → data/aquiferos/<id>.json (baixa o arquivo só se houver versão nova)
"""
import json, os, urllib.request, email.utils, datetime as dt
import numpy as np
from scipy.io import netcdf_file

URL = "https://isdc-data.gfz.de/grace/GravIS/GFZ/Level-3/TWS/GRAVIS-3_GFZOP_0600_TWS_GRID_GFZ_0006.nc"
RAIZ = os.path.join(os.path.dirname(__file__), "..", "data", "aquiferos")
CACHE = os.environ.get("GRACE_NC", os.path.join(os.path.dirname(__file__), "..", ".cache_grace_tws.nc"))

# áreas aproximadas (caixas lon0, lat0, lon1, lat1) sobre o núcleo de cada aquífero / bacia
AQUIFEROS = [
    dict(id="guarani", nome="Aquífero Guarani", onde="Brasil, Paraguai, Argentina e Uruguai", bbox=(-57, -30, -48, -18),
         sobre="Um dos maiores aquíferos do mundo; abastece cidades como Ribeirão Preto (SP)."),
    dict(id="urucuia", nome="Aquífero Urucuia", onde="Oeste da Bahia, divisa com Goiás", bbox=(-47, -16, -44, -10),
         sobre="Alimenta os rios que mantêm o São Francisco vivo na seca; muita irrigação por pivôs."),
    dict(id="goias", nome="Águas subterrâneas de Goiás", onde="Goiás e Distrito Federal", bbox=(-53, -19.5, -46, -12.5),
         sobre="Cerrado: a 'caixa d'água do Brasil', nascentes de várias bacias (Paraná, Tocantins-Araguaia, São Francisco)."),
    dict(id="amazonia", nome="Sistema Aquífero Grande Amazônia (Alter do Chão)", onde="Amazônia central, Brasil", bbox=(-60, -5, -52, -1),
         sobre="Um dos maiores volumes de água doce subterrânea do planeta; sente as secas de 2023 e 2024."),
    dict(id="bengala", nome="Aquíferos da bacia de Bengala", onde="Bangladesh (Daca) e leste da Índia", bbox=(88, 22, 92, 26),
         sobre="Daca tira a maior parte da água de poços; o nível dos poços cai há décadas."),
    dict(id="india_nw", nome="Aquíferos do noroeste da Índia", onde="Punjab, Haryana e Rajastão", bbox=(73, 27, 78, 32),
         sobre="Caso clássico do GRACE: irrigação esvaziando o aquífero mais rápido do que a chuva repõe."),
    dict(id="ogallala", nome="Aquífero Ogallala (High Plains)", onde="Estados Unidos", bbox=(-104, 32, -97, 43),
         sobre="Irriga uma das maiores regiões agrícolas do mundo e está sendo esvaziado no sul."),
]


def versao_remota():
    try:
        req = urllib.request.Request(URL, method="HEAD")
        return urllib.request.urlopen(req, timeout=60).headers.get("Last-Modified") or ""
    except Exception:
        return ""


def baixar(versao):
    """baixa o arquivo do GFZ (514 MB) só se a versão publicada mudou desde o último cálculo"""
    p = os.path.join(RAIZ, "guarani.json")
    antiga = json.load(open(p)).get("versao") if os.path.exists(p) else None
    if versao and antiga == versao and not os.path.exists(CACHE):
        return False
    if not os.path.exists(CACHE):
        urllib.request.urlretrieve(URL, CACHE)
    return True


def theil(x, y):
    s = [(y[j] - y[i]) / (x[j] - x[i]) for i in range(len(x)) for j in range(i + 1, len(x)) if x[j] != x[i]]
    m = float(np.median(s)); return m, float(np.median(np.array(y) - m * np.array(x)))


def main(forcar=False):
    os.makedirs(RAIZ, exist_ok=True)
    versao = versao_remota()
    if not baixar(versao) and not forcar:
        print("GRACE sem versão nova"); return False
    f = netcdf_file(CACHE, "r", mmap=False)
    t = f.variables["time"][:].astype(float); lon = f.variables["lon"][:].astype(float); lat = f.variables["lat"][:].astype(float)
    tws = f.variables["tws"][:].astype(float)
    t0 = dt.date(2002, 4, 18)
    datas = [t0 + dt.timedelta(days=float(d)) for d in t]
    lon2 = np.where(lon > 180, lon - 360, lon)
    for a in AQUIFEROS:
        x0, y0, x1, y1 = a["bbox"]
        mi = (lon2 >= x0) & (lon2 <= x1); mj = (lat >= y0) & (lat <= y1)
        w = np.cos(np.radians(lat[mj]))[:, None] * np.ones(mi.sum())[None, :]
        sub = tws[:, mj][:, :, mi].copy()
        sub[np.abs(sub) > 1e4] = np.nan      # oceano / sem dado
        val = np.array([np.nansum(s * w) / np.nansum(w * np.isfinite(s)) if np.isfinite(s).any() else np.nan for s in sub])
        val[np.abs(val) > 1e4] = np.nan
        serie = [{"d": d.isoformat()[:7], "cm": round(float(v), 2)} for d, v in zip(datas, val) if np.isfinite(v)]
        anos = np.array([d.year + (d.timetuple().tm_yday - 0.5) / 365.25 for d, v in zip(datas, val) if np.isfinite(v)])
        cm = np.array([s["cm"] for s in serie])
        m, b = theil(list(anos[::2]), list(cm[::2]))           # amostra a cada 2 meses: mais rápido e igualmente robusto
        # área da caixa (km²) e volume: 1 cm sobre 1 km² = 0,00001 km³
        area = 111.32 ** 2 * (x1 - x0) * (y1 - y0) * np.cos(np.radians((y0 + y1) / 2))
        anual = {}
        for s in serie:
            anual.setdefault(int(s["d"][:4]), []).append(s["cm"])
        out = {**{k: a[k] for k in ("id", "nome", "onde", "bbox", "sobre")},
               "area_km2": round(float(area)), "tend_cm_ano": round(m, 3), "tend_km3_ano": round(m * area * 1e-5, 2),
               "proj2030_cm": round(m * 2030.5 + b, 1), "serie": serie,
               "anual": [{"ano": y, "cm": round(float(np.mean(v)), 2), "n": len(v)} for y, v in sorted(anual.items())],
               "fonte": "GRACE (NASA/DLR) e GRACE-FO (NASA/GFZ) · grade TWS GFZ GravIS RL06 (aberta)",
               "gerado": dt.date.today().isoformat(), "versao": versao}
        json.dump(out, open(os.path.join(RAIZ, a["id"] + ".json"), "w"), ensure_ascii=False, separators=(",", ":"))
        print(a["id"], f"{m:+.2f} cm/ano  {m * area * 1e-5:+.1f} km³/ano  meses={len(serie)}")
    return True


if __name__ == "__main__":
    main(forcar=True)
