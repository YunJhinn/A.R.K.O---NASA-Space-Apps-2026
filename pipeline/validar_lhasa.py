"""A.R.K.O · v6.2 · validação do LHASA com desastres reais (reproduzível).
PT: lê o arquivo diário do NASA LHASA (sem login) e mede o maior valor num raio de ~10 km de cada lugar
    com desastre registrado, em todos os dias disponíveis. Saída: JSON com a série diária por lugar.
EN: reads the NASA LHASA daily archive (no login) and samples the max value within ~10 km of each place
    with a recorded disaster, for every available day.
Uso: python pipeline/validar_lhasa.py --ini 20260101 --fim 20261031 --saida lhasa.json
"""
import argparse, json, re, urllib.request
from concurrent.futures import ThreadPoolExecutor
import numpy as np, rasterio
from rasterio.windows import Window

URL = "https://portal.nccs.nasa.gov/datashare/landslides/nrt/hazard/tif/"
# desastres reais de 2026 (fontes em docs/validacao_lhasa.md); coordenadas = sede do distrito/cidade (aprox.)
LUGARES = {"Baglung": (28.27, 83.59), "Myagdi": (28.35, 83.57), "Palpa": (27.87, 83.55),
           "Rolpa": (28.30, 82.63), "Jajarkot": (28.70, 82.20),
           "Lajeado/Estrela": (-29.48, -51.96), "Cruzeiro do Sul": (-29.51, -51.99),
           "Santa Cruz do Sul": (-29.72, -52.43), "Roca Sales": (-29.28, -51.87)}
R = 0.1   # meia largura da janela, em graus (~10 km)


def amostra(arq):
    out = {}
    with rasterio.open("/vsicurl/" + URL + arq) as ds:
        for k, (la, lo) in LUGARES.items():
            r1, c1 = ds.index(lo - R, la - R); r2, c2 = ds.index(lo + R, la + R)
            a = ds.read(1, window=Window(min(c1, c2), min(r1, r2), abs(c2 - c1) + 1, abs(r2 - r1) + 1)).astype(float)
            a[(a < 0) | (a > 1)] = np.nan
            out[k] = float(np.nanmax(a)) if np.isfinite(a).any() else 0.0
    return arq[:8], out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ini", default="20260101"); ap.add_argument("--fim", default="20261031")
    ap.add_argument("--saida", default="lhasa_validacao.json")
    a = ap.parse_args()
    html = urllib.request.urlopen(URL, timeout=60).read().decode()
    arqs = sorted({m for m in re.findall(r'href="(\d{8}T\d{4}\.tif)"', html) if a.ini <= m[:8] <= a.fim})
    por_dia = {a8: arq for arq in arqs for a8 in [arq[:8]]}          # um arquivo por dia (o último)
    with ThreadPoolExecutor(16) as ex:
        res = dict(ex.map(amostra, por_dia.values()))
    json.dump(res, open(a.saida, "w"), indent=0)
    for k in LUGARES:
        v = np.array([d[k] for d in res.values()])
        print(f"{k:18} dias≥10%: {np.mean(v >= .10):5.1%}  dias≥25%: {np.mean(v >= .25):5.1%}  máx: {v.max():.2f}")


if __name__ == "__main__":
    main()
