"""A.R.K.O Rios · nível do rio medido pelo SWOT (NASA/CNES), 2023 → hoje.
PT: lê a série de altura da água (wse) de um trecho de rio do SWOT pelo serviço aberto Hydrocron (PO.DAAC),
    descarta medições de má qualidade (reach_q > 1) e valores fora do comum, e junta em data/rios/<id>.json.
    Os trechos (reach_id) vêm do SWORD v17, o mapa de rios do SWOT (zenodo.org/records/14727521).
EN: SWOT water surface elevation per river reach via Hydrocron; merged into data/rios/<id>.json.
Uso: python pipeline/rios_swot.py
"""
import json, os, urllib.request, datetime as dt
import numpy as np

RAIZ = os.path.join(os.path.dirname(__file__), "..", "data", "rios")
HC = "https://soto.podaac.earthdatacloud.nasa.gov/hydrocron/v1/timeseries"
# trecho do SWORD v17 mais próximo da cidade (o de maior área de drenagem dentro da caixa analisada)
TRECHOS = {
    "tapajos": ("62241500061", "Rio Tapajós em Itaituba"),
    "madeira": ("62261700051", "Rio Madeira em Nova Olinda do Norte (~150 km rio abaixo do trecho do Landsat)"),
    "guaiba": ("64120100011", "Delta do Jacuí (entrada do Guaíba)"),
    "daca": ("45220200225", "Rio Dhaleshwari/Buriganga, sul de Daca"),
    "langtang": ("45243601121", "Rio Trishuli, abaixo das geleiras"),
    "limpopo": ("12440300011", "Rio dos Elefantes (Olifants), abaixo de Massingir"),
    "araguaia": ("62495300111", "Rio Araguaia em Aruanã"),
}


def serie(rid):
    hoje = dt.date.today().isoformat()
    u = (f"{HC}?feature=Reach&feature_id={rid}&start_time=2023-01-01T00:00:00Z&end_time={hoje}T23:59:59Z"
         "&fields=reach_id,time_str,wse,reach_q&output=csv")
    d = json.load(urllib.request.urlopen(u, timeout=180))
    pts = []
    for l in d["results"]["csv"].strip().split("\n")[1:]:
        c = l.split(",")
        if c[1] == "no_data" or float(c[2]) < -1000 or int(c[3]) > 1:
            continue
        pts.append((c[1][:10], float(c[2])))
    if not pts:
        return []
    v = np.array([p[1] for p in pts]); m = np.median(v); mad = np.median(np.abs(v - m)) or 0.5
    pts = [p for p in pts if abs(p[1] - m) <= 6 * mad]
    por_dia = {}
    for d0, w in pts:
        por_dia.setdefault(d0, []).append(w)
    return [{"d": k, "wse": round(float(np.median(v)), 2)} for k, v in sorted(por_dia.items())]


def main():
    for rid_rio, (reach, nome) in TRECHOS.items():
        p = os.path.join(RAIZ, rid_rio + ".json")
        if not os.path.exists(p):
            continue
        try:
            s = serie(reach)
        except Exception as e:
            print(rid_rio, "erro SWOT:", e)
            continue
        j = json.load(open(p))
        j["swot"] = {"reach_id": reach, "rio": nome, "serie": s,
                     "fonte": "SWOT L2 RiverSP (NASA/CNES) via Hydrocron, PO.DAAC"}
        json.dump(j, open(p, "w"), ensure_ascii=False, indent=1)
        print(rid_rio, len(s), "medições SWOT")


if __name__ == "__main__":
    main()
