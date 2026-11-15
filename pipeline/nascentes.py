"""A.R.K.O · v7.10 · Nascentes: vegetação nativa num raio de 5 km da nascente, ano a ano, e fotos Landsat do antes e depois.
PT: a % de vegetação nativa vem de dois mapas de uso do solo publicados (não de um limiar nosso):
    ESA CCI Land Cover 300 m (1992–2020, série longa e consistente) e Impact Observatory/Esri 10 m (2017–2023, detalhe).
    O NDVI do Landsat oscilava demais com a chuva de cada ano para medir isso sozinho, então o Landsat fica só nas fotos.
Fontes: ESA CCI LC, Impact Observatory/Esri LULC e Landsat C2 L2 (NASA/USGS), todos via Microsoft Planetary Computer.
"""
import json, os, sys, datetime as dt
from concurrent.futures import ThreadPoolExecutor
import numpy as np, rasterio, pystac_client, planetary_computer as pc
from rasterio.warp import transform_bounds, transform
from rasterio.windows import from_bounds

RAIZ = os.environ.get("NASC_OUT", os.path.join(os.path.dirname(__file__), "..", "data", "nascentes"))
NASCENTES = [
    dict(id="araguaia", nome="Nascente do Rio Araguaia", onde="Serra do Caiapó, Mineiros (GO)", lon=-53.063, lat=-18.034,
         contexto="Área de recarga do Aquífero Guarani, cercada por lavouras de soja e milho.",
         fonte_local="Wikipedia (coordenadas da nascente) · Embrapa Doc. 17 (recarga do Guarani)"),
]
cat = pystac_client.Client.open("https://planetarycomputer.microsoft.com/api/stac/v1", modifier=pc.sign_inplace)


def ano_nasc(args):
    n, ano = args
    bbox = (n["lon"] - 0.05, n["lat"] - 0.05, n["lon"] + 0.05, n["lat"] + 0.05)
    try:
        its = list(cat.search(collections=["landsat-c2-l2"], bbox=bbox, datetime=f"{ano}-08-01/{ano}-10-31", query={"eo:cloud_cover": {"lt": 40}}).items())
    except Exception as e:
        return n["id"], ano, None, str(e)
    boas = [i for i in its if i.properties["platform"] != "landsat-7"] or its   # L7 só quando não há outro (listras desde 2003)
    nd, ref, rgb, usadas = [], None, None, []
    for it in sorted(boas, key=lambda i: i.properties["eo:cloud_cover"])[:8]:
        b = {}
        try:
            for k in ("red", "green", "blue", "nir08", "qa_pixel"):
                with rasterio.open(it.assets[k].href) as ds:
                    w = from_bounds(*transform_bounds("EPSG:4326", ds.crs, *bbox), ds.transform)
                    b[k] = ds.read(1, window=w, boundless=True, fill_value=0)
                    r0 = (ds.crs, ds.window_transform(w), b[k].shape)
        except Exception:
            continue
        if ref is None:
            ref = r0
        if b["red"].shape != ref[2]:
            continue
        qa = b["qa_pixel"].astype(np.int64)
        ok = (b["red"] > 0) & (((qa >> 1) & 1) == 0) & (((qa >> 3) & 1) == 0) & (((qa >> 4) & 1) == 0)
        if ok.mean() < 0.5:
            continue
        r = b["red"] * 0.0000275 - 0.2; nn = b["nir08"] * 0.0000275 - 0.2
        v = (nn - r) / (nn + r + 1e-9); v[~ok] = np.nan; nd.append(v)
        usadas.append(it.datetime.date().isoformat() + " " + it.properties["platform"].replace("landsat-", "L"))
        if rgb is None and ok.mean() > 0.9:
            rgb = np.dstack([b["red"], b["green"], b["blue"]]).astype(float) * 0.0000275 - 0.2
        if len(nd) >= 6:
            break
    if not nd:
        return n["id"], ano, None, "sem imagem limpa"
    res = {"ano": ano, "imagens": usadas}
    if rgb is not None:
        from PIL import Image
        im = Image.fromarray((np.clip(rgb / 0.25, 0, 1) ** 0.8 * 255).astype(np.uint8)); im.thumbnail((420, 420))
        os.makedirs(os.path.join(RAIZ, "fotos"), exist_ok=True)
        im.save(os.path.join(RAIZ, "fotos", f"{n['id']}_{ano}.jpg"), quality=78)
        res["foto"] = f"fotos/{n['id']}_{ano}.jpg"
    return n["id"], ano, res, None


CCI_NAT = [50, 60, 61, 62, 70, 71, 72, 80, 81, 82, 90, 100, 110, 120, 121, 122, 130, 140, 150, 151, 152, 153, 160, 170, 180]
IO_NAT = [2, 4, 11]   # árvores, vegetação alagada, campo/cerrado aberto (rangeland)


def frac(href, n, nat, raio=5.0):
    bbox = (n["lon"] - 0.06, n["lat"] - 0.06, n["lon"] + 0.06, n["lat"] + 0.06)
    with rasterio.open(href) as ds:
        w = from_bounds(*transform_bounds("EPSG:4326", ds.crs, *bbox), ds.transform)
        a = ds.read(1, window=w, boundless=True, fill_value=0); tr = ds.window_transform(w)
        r, c = np.mgrid[0:a.shape[0], 0:a.shape[1]]; xs, ys = rasterio.transform.xy(tr, r.ravel(), c.ravel())
        lon, lat = transform(ds.crs, "EPSG:4326", xs, ys)
    d = 111.32 * np.hypot((np.array(lon) - n["lon"]) * np.cos(np.radians(n["lat"])), np.array(lat) - n["lat"]).reshape(a.shape)
    m = d <= raio
    return round(float(np.isin(a, nat)[m].mean()) * 100, 1)


def mapas(n):
    bbox = (n["lon"] - 0.06, n["lat"] - 0.06, n["lon"] + 0.06, n["lat"] + 0.06)
    cci = [{"ano": int(i.id.split("P1Y-")[1][:4]), "nativo": frac(i.assets["lccs_class"].href, n, CCI_NAT)}
           for i in cat.search(collections=["esa-cci-lc"], bbox=bbox).items()]
    io = [{"ano": int(i.properties["start_datetime"][:4]), "nativo": frac(i.assets["data"].href, n, IO_NAT)}
          for i in cat.search(collections=["io-lulc-annual-v02"], bbox=bbox).items()]
    return sorted(cci, key=lambda x: x["ano"]), sorted(io, key=lambda x: x["ano"])


def main():
    so = sys.argv[1:]
    ns = [n for n in NASCENTES if not so or n["id"] in so]
    tarefas = [(n, a) for n in ns for a in range(1985, dt.date.today().year + 1)]
    out = {n["id"]: [] for n in ns}
    with ThreadPoolExecutor(10) as ex:
        for nid, ano, v, err in ex.map(ano_nasc, tarefas):
            print(nid, ano, "ok" if v else err, flush=True)
            if v:
                out[nid].append(v)
    os.makedirs(RAIZ, exist_ok=True)
    for n in ns:
        cci, io = mapas(n)
        fotos = [{"ano": v["ano"], "foto": v["foto"], "imagens": v["imagens"]} for v in sorted(out[n["id"]], key=lambda x: x["ano"]) if v.get("foto")]
        json.dump({**n, "raio_km": 5, "gerado": dt.date.today().isoformat(),
                   "critico": 20, "critico_fonte": "Referência A.R.K.O: mínimo de 20% de vegetação nativa, o mesmo percentual da Reserva Legal no Cerrado fora da Amazônia Legal (Lei 12.651/2012, art. 12). A lei vale por propriedade; aqui é usado como régua para a área de 5 km.",
                   "cci": cci, "io": io, "fotos": fotos,
                   "fontes": ["ESA CCI Land Cover 300 m v2.0.7 / C3S v2.1.1 (1992–2020)", "Impact Observatory/Esri LULC 10 m v02 (2017–2023)", "Landsat 5/7/8/9 Collection 2 Level-2, NASA/USGS (fotos, ago–out)", "via Microsoft Planetary Computer"]},
                  open(os.path.join(RAIZ, n["id"] + ".json"), "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
