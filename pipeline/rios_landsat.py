"""A.R.K.O Rios · série longa (1985 → hoje) de cada rio com Landsat (NASA/USGS, Collection 2 Level-2).

PT: para cada rio e cada ano, escolhe até 3 imagens Landsat sem nuvem na estação seca e mede, numa caixa
    de ~20 km sobre o trecho do rio que abastece a cidade:
      - agua_km2     área de água (MNDWI > 0,1)
      - turbidez     reflectância no vermelho da água (%): quanto maior, mais barro/sedimento na água
                     (método usado no Tapajós por Lobo et al., Remote Sensing of Environment, 2015)
      - mata_ciliar  % da faixa de 500 m ao redor da água com vegetação densa (NDVI > 0,6)
      - solo_exposto % da mesma faixa com solo nu ou área construída (NDVI < 0,25)
      - gelo_km2     (só montanha) área de neve e gelo (NDSI > 0,4)
    Também salva uma foto em cor real a cada 5 anos, para o "antes e depois" de décadas.
EN: yearly Landsat metrics for each river (water area, turbidity, riparian forest, bare soil, ice).
Fonte dos dados: Landsat Collection 2 Level-2 lido do Microsoft Planetary Computer (acesso aberto).
Uso: python pipeline/rios_landsat.py  → grava data/rios/<id>.json e data/rios/fotos/<id>_<ano>.jpg
"""
import json, os, sys, datetime as dt
from concurrent.futures import ThreadPoolExecutor
import numpy as np, rasterio
from rasterio.warp import transform_bounds
from rasterio.windows import from_bounds
from scipy import ndimage
import pystac_client, planetary_computer as pc

RAIZ = os.path.join(os.path.dirname(__file__), "..", "data", "rios")
ANO0, ANO1 = 1985, dt.date.today().year
FOTOS = {1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025}

# Rios escolhidos: trechos que abastecem cidades e onde há pressão conhecida. bbox = (lon0, lat0, lon1, lat1)
RIOS = [
    dict(id="tapajos", nome="Rio Tapajós em Itaituba", pais="Brasil · PA", bbox=(-56.05, -4.35, -55.90, -4.20),
         meses=(7, 8, 9, 10), cidade="Itaituba", pressao="garimpo de ouro rio acima"),
    dict(id="madeira", nome="Rio Madeira em Nova Olinda do Norte", pais="Brasil · AM", bbox=(-59.20, -4.00, -59.00, -3.80),
         meses=(7, 8, 9, 10), cidade="Nova Olinda do Norte", pressao="dragas de garimpo e desmatamento"),
    dict(id="guaiba", nome="Lago Guaíba em Porto Alegre", pais="Brasil · RS", bbox=(-51.32, -30.15, -51.20, -30.00),
         meses=(11, 12, 1, 2, 3), cidade="Porto Alegre", pressao="esgoto urbano, cheias e lavouras na bacia"),
    dict(id="daca", nome="Rios Buriganga e Turag em Daca", pais="Bangladesh", bbox=(90.32, 23.68, 90.47, 23.83),
         meses=(11, 12, 1, 2, 3), cidade="Daca", pressao="cidade crescendo sobre rios e áreas alagáveis"),
    dict(id="langtang", nome="Geleiras do Langtang (nascente do Trishuli)", pais="Nepal", bbox=(85.55, 28.22, 85.72, 28.32),
         meses=(10, 11, 12), cidade="Katmandu (rio abaixo)", pressao="aquecimento: menos gelo nas nascentes", montanha=True),
    dict(id="limpopo", nome="Barragem de Massingir (rio dos Elefantes, bacia do Limpopo)", pais="Moçambique",
         bbox=(31.95, -23.95, 32.20, -23.70), meses=(5, 6, 7, 8, 9), cidade="Chókwè e Massingir",
         pressao="secas, cheias e uso para irrigação"),
]

cat = pystac_client.Client.open("https://planetarycomputer.microsoft.com/api/stac/v1", modifier=pc.sign_inplace)


def cenas(r, ano):
    meses = r["meses"]
    # meses que viram o ano (ex.: nov–mar) usam o fim do ano anterior + começo do ano
    if min(meses) < max(meses) - 6:
        dts = [f"{ano-1}-11-01/{ano-1}-12-31", f"{ano}-01-01/{ano}-04-30"]
    else:
        dts = [f"{ano}-{min(meses):02d}-01/{ano}-{max(meses):02d}-28"]
    its = []
    for d in dts:
        its += list(cat.search(collections=["landsat-c2-l2"], bbox=r["bbox"], datetime=d,
                               query={"eo:cloud_cover": {"lt": 40}}).items())
    its = [i for i in its if i.datetime.month in meses or (min(meses) < max(meses) - 6)]
    bons = [i for i in its if i.properties.get("platform") in ("landsat-5", "landsat-8", "landsat-9")]
    if not bons:   # 2012: só o Landsat 7 funcionava
        bons = [i for i in its if i.properties.get("platform") == "landsat-7"]
    return sorted(bons, key=lambda i: i.properties["eo:cloud_cover"])[:10]


def ler(item, bbox):
    out = {}
    for b in ("blue", "green", "red", "nir08", "swir16", "qa_pixel"):
        with rasterio.open(item.assets[b].href) as ds:
            w = from_bounds(*transform_bounds("EPSG:4326", ds.crs, *bbox), ds.transform)
            out[b] = ds.read(1, window=w, boundless=True, fill_value=0)
    return out


def medir(item, r):
    b = ler(item, r["bbox"])
    qa = b["qa_pixel"].astype(np.int64)
    if r.get("montanha"):   # no Himalaia a máscara confunde neve com nuvem e há sombra de relevo: só tira nuvem alta
        valido = (b["red"] > 0) & (((qa >> 3) & 1) == 0) & (qa != 1)
        if valido.mean() < 0.6:
            return None, b
    else:
        valido = (b["red"] > 0) & (((qa >> 1) & 1) == 0) & (((qa >> 3) & 1) == 0) & (((qa >> 4) & 1) == 0) & (qa != 1)
    if valido.mean() < (0.6 if r.get("montanha") else 0.85):
        return None, b
    s = {k: b[k].astype(float) * 0.0000275 - 0.2 for k in ("blue", "green", "red", "nir08", "swir16")}
    mndwi = (s["green"] - s["swir16"]) / (s["green"] + s["swir16"] + 1e-9)
    ndvi = (s["nir08"] - s["red"]) / (s["nir08"] + s["red"] + 1e-9)
    agua = (mndwi > 0.1) & valido
    m = {"data": item.datetime.date().isoformat(), "sat": item.properties["platform"].replace("landsat-", "L")}
    if r.get("montanha"):   # neve confunde as medidas de água: na montanha medimos só gelo e neve
        ndsi = (s["green"] - s["swir16"]) / (s["green"] + s["swir16"] + 1e-9)
        m["gelo_km2"] = round(float(((ndsi > 0.4) & (s["nir08"] > 0.11) & valido).sum()) * 0.0009, 1)
        return m, b
    m["agua_km2"] = round(float(agua.sum()) * 0.0009, 2)
    if agua.sum() > 50:
        nucleo = ndimage.binary_erosion(agua, iterations=2) & valido   # longe da margem (sem mistura com terra)
        if nucleo.sum() > 30:
            m["turbidez"] = round(float(np.median(s["red"][nucleo])) * 100, 2)
        faixa = ndimage.binary_dilation(agua, iterations=17) & ~agua & valido      # ~500 m de margem
        if faixa.sum() > 100:
            m["mata_ciliar"] = round(float((ndvi[faixa] > 0.6).mean()) * 100, 1)
            m["solo_exposto"] = round(float((ndvi[faixa] < 0.25).mean()) * 100, 1)
    if r.get("montanha"):
        ndsi = (s["green"] - s["swir16"]) / (s["green"] + s["swir16"] + 1e-9)
        m["gelo_km2"] = round(float(((ndsi > 0.4) & (s["nir08"] > 0.11) & valido).sum()) * 0.0009, 1)
    return m, b


def foto(b, caminho):
    from PIL import Image
    rgb = np.dstack([b["red"], b["green"], b["blue"]]).astype(float) * 0.0000275 - 0.2
    rgb = np.clip(rgb / 0.25, 0, 1) ** 0.8
    im = Image.fromarray((rgb * 255).astype(np.uint8))
    im.thumbnail((480, 480))
    im.save(caminho, quality=82)


def ano_rio(args):
    r, ano = args
    try:
        cs = cenas(r, ano)
    except Exception as e:
        return r["id"], ano, None, str(e)
    ms, bfoto, vistos = [], None, set()
    for c in cs:
        if c.datetime.date() in vistos:
            continue
        vistos.add(c.datetime.date())
        try:
            m, b = medir(c, r)
        except Exception as e:
            continue
        if m:
            ms.append(m)
            if bfoto is None:
                bfoto = b
        if len(ms) >= (6 if r.get("montanha") else 3):
            break
    if not ms or (r.get("montanha") and len(ms) < 3):   # montanha: 3+ imagens para não confundir nevasca com geleira
        return r["id"], ano, None, "sem imagem limpa"
    res = {"ano": ano, "imagens": [x["data"] + " " + x["sat"] for x in ms]}
    for k in ("agua_km2", "turbidez", "mata_ciliar", "solo_exposto", "gelo_km2"):
        v = [x[k] for x in ms if k in x]
        if v:   # gelo: a menor área do ano é a geleira (sem a neve que cai e derrete); o resto: mediana
            res[k] = round(float(min(v) if k == "gelo_km2" else np.median(v)), 2)
    if ano in FOTOS and bfoto is not None:
        os.makedirs(os.path.join(RAIZ, "fotos"), exist_ok=True)
        foto(bfoto, os.path.join(RAIZ, "fotos", f"{r['id']}_{ano}.jpg"))
        res["foto"] = f"fotos/{r['id']}_{ano}.jpg"
    return r["id"], ano, res, None


def main():
    so = sys.argv[1:]
    rios = [r for r in RIOS if not so or r["id"] in so]
    tarefas = [(r, a) for r in rios for a in range(ANO0, ANO1 + 1)]
    os.makedirs(RAIZ, exist_ok=True)
    res = {r["id"]: [] for r in rios}
    with ThreadPoolExecutor(12) as ex:
        for rid, ano, v, err in ex.map(ano_rio, tarefas):
            print(rid, ano, "ok" if v else err, flush=True)
            if v:
                res[rid].append(v)
    for r in rios:
        serie = sorted(res[r["id"]], key=lambda x: x["ano"])
        meta = {k: r[k] for k in ("id", "nome", "pais", "bbox", "meses", "cidade", "pressao")}
        json.dump({**meta, "montanha": bool(r.get("montanha")), "gerado": dt.date.today().isoformat(),
                   "fonte": "Landsat 4–9 Collection 2 Level-2 (NASA/USGS) via Microsoft Planetary Computer",
                   "serie": serie}, open(os.path.join(RAIZ, r["id"] + ".json"), "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
