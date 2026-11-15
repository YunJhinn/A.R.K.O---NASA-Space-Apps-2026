"""A.R.K.O Rios · monitor contínuo: cada imagem nova do rio, a cada 2–5 dias (HLS, NASA).
PT: o HLS (Harmonized Landsat Sentinel-2, NASA) junta Landsat 8/9 e Sentinel-2 numa só série de 30 m.
    Para cada rio e cada imagem sem nuvem sobre a caixa do rio, mede as mesmas coisas da série de 40 anos
    (água, turbidez, mata ciliar, solo exposto; gelo na montanha) e grava data/rios/<id>_continuo.json.
    É incremental: na próxima execução só lê imagens novas. Também salva a última imagem limpa (foto).
EN: continuous per-scene river monitor with NASA HLS (L30 + S30), incremental.
Uso: python pipeline/rios_hls.py [id ...]     (lido do Microsoft Planetary Computer, sem login)
"""
import json, os, sys, datetime as dt
from concurrent.futures import ThreadPoolExecutor
import numpy as np, rasterio
from rasterio.warp import transform_bounds
from rasterio.windows import from_bounds
from scipy import ndimage
import pystac_client, planetary_computer as pc

sys.path.insert(0, os.path.dirname(__file__))
from rios_landsat import RIOS, RAIZ   # mesmos rios e mesma caixa da série de 40 anos

INICIO = "2016-01-01"
BANDAS = {"hls2-l30": dict(blue="B02", green="B03", red="B04", nir="B05", swir="B06"),
          "hls2-s30": dict(blue="B02", green="B03", red="B04", nir="B8A", swir="B11")}
cat = pystac_client.Client.open("https://planetarycomputer.microsoft.com/api/stac/v1", modifier=pc.sign_inplace)


def janela(href, bbox):
    with rasterio.open(href) as ds:
        w = from_bounds(*transform_bounds("EPSG:4326", ds.crs, *bbox), ds.transform)
        return ds.read(1, window=w, boundless=True, fill_value=255 if "Fmask" in href else -9999)


def mosaico(items, banda, bbox, vazio):
    """junta os recortes (tiles) do mesmo dia: onde um não tem dado, usa o próximo"""
    out = None
    for it in items:
        a = janela(it.assets[banda].href, bbox)
        if out is None:
            out = a.copy()
        else:
            if a.shape != out.shape:
                continue
            falta = out == vazio
            out[falta] = a[falta]
    return out


def medir(items, r):
    item = items[0]
    col = item.collection_id
    fm = mosaico(items, "Fmask", r["bbox"], 255).astype(np.int64)
    # Fmask: bit1 nuvem, bit2 vizinho de nuvem, bit3 sombra; 255 = sem dado
    ok = (fm != 255) & (((fm >> 1) & 1) == 0) & (((fm >> 2) & 1) == 0)
    if not r.get("montanha"):
        ok &= ((fm >> 3) & 1) == 0
    if ok.mean() < (0.6 if r.get("montanha") else 0.8):
        return None
    B = {k: mosaico(items, v, r["bbox"], -9999).astype(float) for k, v in BANDAS[col].items()}
    ok &= (B["red"] > -9000)
    s = {k: v * 0.0001 for k, v in B.items()}
    g, sw, red, nir = s["green"], s["swir"], s["red"], s["nir"]
    m = {"d": item.datetime.date().isoformat(),
         "sat": "S2" if col == "hls2-s30" else ("L9" if "L09" in item.id or "landsat-9" in str(item.properties.get("platform", "")).lower() else "L8"),
         "ok": round(float(ok.mean()) * 100)}
    mndwi = (g - sw) / (g + sw + 1e-9)
    if r.get("montanha"):
        m["gelo_km2"] = round(float(((mndwi > 0.4) & (nir > 0.11) & ok).sum()) * 0.0009, 1)
        return m
    ndvi = (nir - red) / (nir + red + 1e-9)
    agua = (mndwi > 0.1) & ok
    m["agua_km2"] = round(float(agua.sum()) * 0.0009, 2)
    if agua.sum() > 50:
        nucleo = ndimage.binary_erosion(agua, iterations=2) & ok
        if nucleo.sum() > 30:
            m["turbidez"] = round(float(np.median(red[nucleo])) * 100, 2)
        faixa = ndimage.binary_dilation(agua, iterations=17) & ~agua & ok
        if faixa.sum() > 100:
            m["mata_ciliar"] = round(float((ndvi[faixa] > 0.6).mean()) * 100, 1)
            m["solo_exposto"] = round(float((ndvi[faixa] < 0.25).mean()) * 100, 1)
    return m


def foto(items, r, caminho):
    from PIL import Image
    col = items[0].collection_id
    rgb = np.dstack([mosaico(items, BANDAS[col][k], r["bbox"], -9999).astype(float) * 0.0001 for k in ("red", "green", "blue")])
    rgb = np.clip(rgb / 0.25, 0, 1) ** 0.8
    im = Image.fromarray((rgb * 255).astype(np.uint8)); im.thumbnail((400, 400)); im.save(caminho, quality=76)


def rio(r):
    p = os.path.join(RAIZ, r["id"] + "_continuo.json")
    j = json.load(open(p)) if os.path.exists(p) else {"id": r["id"], "cenas": []}
    feitas = {c["d"] + c["sat"] for c in j["cenas"]}
    ini = (max(c["d"] for c in j["cenas"]) if j["cenas"] else INICIO)
    hoje = dt.date.today().isoformat()
    its = list(cat.search(collections=["hls2-l30", "hls2-s30"], bbox=r["bbox"], datetime=f"{ini}/{hoje}",
                          query={"eo:cloud_cover": {"lt": 80}}).items())
    # agrupa por dia e satélite: o mesmo dia pode vir em dois ou mais recortes (tiles), que viram um mosaico
    grupos = {}
    for i in sorted(its, key=lambda x: x.properties.get("eo:cloud_cover", 100)):
        grupos.setdefault((i.datetime.date().isoformat(), i.collection_id), []).append(i)
    fila = list(grupos.values())

    def um(i):
        try:
            return i, medir(i, r)
        except Exception:
            return i, None
    novas = []
    with ThreadPoolExecutor(12) as ex:
        for i, m in ex.map(um, fila):
            if m and (m["d"] + m["sat"]) not in feitas:
                novas.append((i, m))
    j["cenas"] = sorted(j["cenas"] + [m for _, m in novas], key=lambda c: c["d"])
    j.update(nome=r["nome"], fonte="HLS v2.0 (NASA: Landsat 8/9 + Sentinel-2) via Microsoft Planetary Computer",
             atualizado=hoje)
    if novas:   # foto da imagem mais recente
        i, m = max(novas, key=lambda x: x[1]["d"])
        os.makedirs(os.path.join(RAIZ, "fotos"), exist_ok=True)
        try:
            foto(i, r, os.path.join(RAIZ, "fotos", f"{r['id']}_ultima.jpg"))
            j["ultima"] = {"d": m["d"], "sat": m["sat"], "foto": f"fotos/{r['id']}_ultima.jpg"}
        except Exception as e:
            print("foto:", e)
    json.dump(j, open(p, "w"), ensure_ascii=False, separators=(",", ":"))
    print(r["id"], len(novas), "imagens novas; total", len(j["cenas"]), flush=True)
    return len(novas)


def main(ids=None):
    total = 0
    for r in RIOS:
        if ids and r["id"] not in ids:
            continue
        try:
            total += rio(r)
        except Exception as e:
            print(r["id"], "erro:", e)
    return total


if __name__ == "__main__":
    main(sys.argv[1:])
