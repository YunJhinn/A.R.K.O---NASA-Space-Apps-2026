"""A.R.K.O · riscos em tempo quase real (v6)
PT: junta ao radar NISAR duas fontes públicas da NASA, atualizadas todo dia, e grava data[/regioes/<id>]/riscos.json:
    - Deslizamento: NASA LHASA 2 (Landslide Hazard Assessment for Situational Awareness). Probabilidade de
      deslizamento causado por chuva, grade de ~1 km, calculada com a chuva do GPM IMERG, umidade do solo,
      neve, declividade, falhas e rochas. Arquivo diário público (sem login):
      https://portal.nccs.nasa.gov/datashare/landslides/nrt/hazard/tif/
    - Queimadas: NASA FIRMS, focos de calor dos satélites VIIRS NOAA-20 e NOAA-21 (375 m) nas últimas 48 h.
      Arquivo público (sem chave): https://firms.modaps.eosdis.nasa.gov/active_fire/
EN: adds two public, daily NASA sources (LHASA landslide nowcast and FIRMS active fires) to each region.

Uso / usage:
    python pipeline/riscos.py              # todas as regiões
    python pipeline/atualizar.py           # o robô chama isto sozinho no fim
"""
import csv, datetime as dt, io, json, math, os, re, urllib.request
import numpy as np

LHASA_DIR = "https://portal.nccs.nasa.gov/datashare/landslides/nrt/hazard/tif/"
FIRMS = [("NOAA-20", "https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-20-viirs-c2/csv/J1_VIIRS_C2_Global_48h.csv"),
         ("NOAA-21", "https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-21-viirs-c2/csv/J2_VIIRS_C2_Global_48h.csv")]
# Limiares do A.R.K.O para a probabilidade do LHASA (a NASA deixa cada usuário escolher o seu;
# o visualizador oficial da NASA começa a colorir o mapa em 5%).
LIM_BAIXO, LIM_MEDIO, LIM_ALTO = 0.02, 0.05, 0.10   # baixo: só aparece no mapa (monitoramento), sem alerta
MAX_AREAS, MAX_GRUPOS = 8, 25
GRUPO_GRAUS = 0.03                       # focos de fogo a menos de ~3 km viram um grupo só
UA = {"User-Agent": "ARKO-NISAR/1.0 (NASA Space Apps 2026)"}


def baixar(url, timeout=120):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
        return r.read()


_GEO = {}


def geocodificar(lon, lat):
    """Nome do lugar pelo OpenStreetMap (Nominatim), só quando o ponto está longe das cidades da região."""
    k = (round(lon, 2), round(lat, 2))
    if k in _GEO:
        return _GEO[k]
    nome = None
    try:
        import time
        time.sleep(1.1)                                   # regra de uso do Nominatim: 1 pedido por segundo
        u = f"https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&accept-language=pt&lon={lon}&lat={lat}"
        a = json.loads(baixar(u, 30)).get("address", {})
        loc = a.get("city") or a.get("town") or a.get("village") or a.get("county") or a.get("state_district")
        reg = a.get("state") or ""
        if loc or reg:
            nome = " · ".join(x for x in (loc, reg, a.get("country")) if x)
    except Exception:
        pass
    _GEO[k] = nome
    return nome


def lugar(lon, lat, reg):
    cid, suf = reg["cidades"], reg["sufixo"]
    km = {n: math.hypot((lon - x) * 111.32 * math.cos(math.radians(lat)), (lat - y) * 110.57) for n, (x, y) in cid.items()}
    n = min(km, key=km.get)
    if km[n] < 8:
        return f"{n}{suf}"
    if km[n] > 30:
        g = geocodificar(lon, lat)
        if g:
            return g
    return f"a {round(km[n])} km de {n}{suf}"


def limites(reg, dados_raiz):
    """Mesma área do mapa do app: img da região ou o recorte calculado na 1ª passagem."""
    if reg.get("img"):
        return reg["img"]
    pasta = os.path.join(dados_raiz, reg["pasta"]) if reg["pasta"] else dados_raiz
    rec = os.path.join(pasta, "recorte.json")
    return json.load(open(rec, encoding="utf-8")) if os.path.exists(rec) else None


# ---------------- deslizamento (LHASA) ----------------
def lhasa_ultimo():
    html = baixar(LHASA_DIR, 60).decode("utf-8", "replace")
    nomes = sorted(set(re.findall(r'href="(\d{8}T\d{4})\.tif"', html)))
    if not nomes:
        raise RuntimeError("nenhum arquivo LHASA encontrado")
    return nomes[-1]


def lhasa_regiao(ds, b, reg):
    from scipy import ndimage
    from rasterio.windows import Window
    T = ds.transform
    c0 = max(0, int((b["oeste"] - T.c) / T.a)); c1 = min(ds.width, int(math.ceil((b["leste"] - T.c) / T.a)))
    # a grade do LHASA cresce do sul para o norte (T.e > 0); trata os dois casos
    ra, rb = (b["sul"] - T.f) / T.e, (b["norte"] - T.f) / T.e
    r0 = max(0, int(min(ra, rb))); r1 = min(ds.height, int(math.ceil(max(ra, rb))))
    if c1 <= c0 or r1 <= r0:
        return {"fora": True}
    a = ds.read(1, window=Window(c0, r0, c1 - c0, r1 - r0)).astype("float64")
    a[(a < 0) | ~np.isfinite(a)] = np.nan
    ok = ~np.isnan(a)
    if not ok.any():
        return {"max": None, "areas": []}
    lab, n = ndimage.label(np.nan_to_num(a) >= LIM_BAIXO)
    areas = []
    km2_px = (abs(T.a) * 111.32) * (abs(T.e) * 110.57)
    for i in range(1, n + 1):
        m = lab == i
        rr, cc = np.nonzero(m)
        k = np.nanargmax(np.where(m, a, -1))
        kr, kc = np.unravel_index(k, a.shape)
        lon = T.c + (c0 + kc + 0.5) * T.a
        lat = T.f + (r0 + kr + 0.5) * T.e
        p = float(a[kr, kc])
        areas.append({"lon": round(lon, 4), "lat": round(lat, 4), "p": round(p, 4),
                      "km2": round(float(m.sum()) * km2_px * math.cos(math.radians(lat)), 1),
                      "nivel": "Alto" if p >= LIM_ALTO else "Médio" if p >= LIM_MEDIO else "Baixo", "lugar": lugar(lon, lat, reg)})
    areas.sort(key=lambda x: -x["p"])
    v = a[ok]
    return {"max": round(float(v.max()), 4), "p90": round(float(np.percentile(v, 90)), 4), "areas": areas[:MAX_AREAS]}


# ---------------- queimadas (FIRMS) ----------------
def firms_linhas():
    linhas, fontes = [], []
    for sat, url in FIRMS:
        try:
            txt = baixar(url, 180).decode("utf-8", "replace")
            r = list(csv.DictReader(io.StringIO(txt)))
            linhas += [dict(x, _sat=sat) for x in r]; fontes.append(sat)
        except Exception as e:
            print(f"  FIRMS {sat}: falhou ({e})")
    if not fontes:
        raise RuntimeError("FIRMS indisponível")
    return linhas, fontes


def firms_regiao(linhas, b, reg):
    pts = []
    for x in linhas:
        try:
            lon, lat = float(x["longitude"]), float(x["latitude"])
        except (KeyError, ValueError):
            continue
        if not (b["oeste"] <= lon <= b["leste"] and b["sul"] <= lat <= b["norte"]):
            continue
        if str(x.get("confidence", "")).lower() in ("l", "low"):      # baixa confiança fica de fora
            continue
        pts.append((lon, lat, float(x.get("frp") or 0), x.get("acq_date", ""), x.get("acq_time", "").zfill(4)))
    grupos = {}
    for lon, lat, frp, d, h in pts:
        k = (round(lon / GRUPO_GRAUS), round(lat / GRUPO_GRAUS))
        g = grupos.setdefault(k, {"lons": [], "lats": [], "frp": 0.0, "ult": ""})
        g["lons"].append(lon); g["lats"].append(lat); g["frp"] += frp
        g["ult"] = max(g["ult"], f"{d}T{h[:2]}:{h[2:]}Z")
    # junta grupos vizinhos que caíram em células diferentes da grade
    gl = list(grupos.values()); unidos = True
    while unidos:
        unidos = False
        for i in range(len(gl)):
            for j in range(i + 1, len(gl)):
                a, c = gl[i], gl[j]
                if math.hypot(np.mean(a["lons"]) - np.mean(c["lons"]), np.mean(a["lats"]) - np.mean(c["lats"])) < GRUPO_GRAUS:
                    a["lons"] += c["lons"]; a["lats"] += c["lats"]; a["frp"] += c["frp"]; a["ult"] = max(a["ult"], c["ult"])
                    gl.pop(j); unidos = True; break
            if unidos:
                break
    out = []
    for g in gl:
        lon, lat, n = sum(g["lons"]) / len(g["lons"]), sum(g["lats"]) / len(g["lats"]), len(g["lons"])
        nivel = "Alto" if n >= 10 or g["frp"] >= 150 else "Médio" if n >= 3 or g["frp"] >= 30 else "Baixo"
        out.append({"lon": round(lon, 4), "lat": round(lat, 4), "n": n, "frp": round(g["frp"], 1),
                    "ultimo": g["ult"], "nivel": nivel, "lugar": lugar(lon, lat, reg)})
    out.sort(key=lambda g: (-g["n"], -g["frp"]))
    return {"focos": len(pts), "grupos": out[:MAX_GRUPOS]}


# ---------------- tudo junto ----------------
def atualizar_riscos(regioes, dados_raiz):
    """Grava riscos.json de cada região. Devolve True se algo mudou (para o robô salvar)."""
    print("\n== Riscos em tempo quase real (NASA LHASA + FIRMS) ==")
    agora = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%MZ")
    lh_ds = lh_nome = lh_erro = None
    try:
        import rasterio
        lh_nome = lhasa_ultimo()
        lh_ds = rasterio.open(f"/vsicurl/{LHASA_DIR}{lh_nome}.tif")
        print("  LHASA:", lh_nome)
    except Exception as e:
        lh_erro = str(e); print("  LHASA indisponível:", e)
    try:
        fi_linhas, fi_fontes = firms_linhas(); fi_erro = None
        print("  FIRMS:", len(fi_linhas), "focos no mundo,", ", ".join(fi_fontes))
    except Exception as e:
        fi_linhas, fi_fontes, fi_erro = [], [], str(e); print("  FIRMS indisponível:", e)
    mudou = False
    for reg in regioes:
        b = limites(reg, dados_raiz)
        if not b:
            continue
        pasta = os.path.join(dados_raiz, reg["pasta"]) if reg["pasta"] else dados_raiz
        arq = os.path.join(pasta, "riscos.json")
        antigo = json.load(open(arq, encoding="utf-8")) if os.path.exists(arq) else {}
        novo = {"atualizado": agora}
        if lh_ds is not None:
            try:
                novo["deslizamento"] = {"fonte": "NASA LHASA 2 (chuva GPM IMERG + solo, neve, relevo)",
                                        "url": "https://gpm.nasa.gov/landslides/projects.html",
                                        "data": f"{lh_nome[:4]}-{lh_nome[4:6]}-{lh_nome[6:8]}",
                                        "limiares": {"baixo": LIM_BAIXO, "medio": LIM_MEDIO, "alto": LIM_ALTO}} | lhasa_regiao(lh_ds, b, reg)
            except Exception as e:
                print(f"  LHASA {reg['id']}: {e}")
        if "deslizamento" not in novo and antigo.get("deslizamento"):
            novo["deslizamento"] = antigo["deslizamento"] | {"desatualizado": True}
        if fi_linhas:
            novo["fogo"] = {"fonte": "NASA FIRMS · VIIRS " + " e ".join(fi_fontes), "url": "https://firms.modaps.eosdis.nasa.gov/",
                            "janela_h": 48} | firms_regiao(fi_linhas, b, reg)
        elif antigo.get("fogo"):
            novo["fogo"] = antigo["fogo"] | {"desatualizado": True}
        if lh_erro or fi_erro:
            novo["erros"] = {k: v for k, v in (("deslizamento", lh_erro), ("fogo", fi_erro)) if v}
        sem_data = lambda o: {k: v for k, v in o.items() if k != "atualizado"}
        d, f = novo.get("deslizamento", {}), novo.get("fogo", {})
        print(f"  {reg['id']}: deslizamento máx {d.get('max')} ({len(d.get('areas', []))} áreas) · fogo {f.get('focos', '—')} focos")
        if sem_data(novo) != sem_data(antigo):
            os.makedirs(pasta, exist_ok=True)
            with open(arq, "w", encoding="utf-8") as fp:
                json.dump(novo, fp, ensure_ascii=False, indent=1)
            mudou = True
    if lh_ds is not None:
        lh_ds.close()
    return mudou


if __name__ == "__main__":
    import sys
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from atualizar import REGIOES, DADOS_RAIZ
    print("mudou:", atualizar_riscos(REGIOES, DADOS_RAIZ))
