"""A.R.K.O · NASA Space Apps 2026
EN: automatic update - finds the newest NISAR pass over the pilot area, compares it with an
    earlier pass of the same orbit and rewrites the files the app reads (data/).
PT: atualização automática - acha a passagem NISAR mais nova sobre a área do piloto, compara com
    uma passagem anterior da mesma órbita e regrava os arquivos que o app lê (data/).

Uso / usage (na raiz do repositório / from the repository root):
    python pipeline/atualizar.py                 # só processa se houver passagem nova
    python pipeline/atualizar.py --forcar        # reprocessa mesmo sem passagem nova
    python pipeline/atualizar.py --antes NOME --depois NOME   # escolhe o par na mão

Linha do tempo (v2): cada passagem nova vira um ponto em data/linha_tempo.json, com os focos
encontrados desde a passagem anterior e uma imagem de radar em data/radar/AAAA-MM-DD.jpg.
O app usa isso para a linha do tempo animada; o usuário escolhe a data na barra.

Login: usa EARTHDATA_USERNAME / EARTHDATA_PASSWORD (GitHub Actions) ou o _netrc do computador.
"""
import argparse, datetime as dt, json, math, os, re, sys
import numpy as np, h5py, earthaccess
from scipy import ndimage
from pyproj import Transformer
from PIL import Image

# ---------------- configuração do piloto ----------------
COLECAO = "NISAR_L2_GCOV_PROVISIONAL_V1"
ORBITA = "_132_A_175_"                 # trilha 132, passagem ascendente, quadro 175 (rio Madeira, AM)
BBOX_BUSCA = (-61.0, -5.5, -60.0, -4.5)   # oeste, sul, leste, norte: um ponto dentro do quadro
INICIO = "2026-06-17"                  # primeiras observações públicas calibradas
DIAS_MIN = 45                          # "antes" precisa ser pelo menos 45 dias antes do "depois"
FREQ = "frequencyB"                    # grade de ~80 m
MIN_PX, MAX_POR_TIPO = 40, 25
IMG = dict(oeste=-62.05, leste=-58.95, norte=-3.944, sul=-6.056, w=1492, h=1016)   # recorte do mapa do app
CIDADES = {"Careiro": (-60.37, -3.77), "Careiro da Várzea": (-59.83, -3.20), "Autazes": (-59.13, -3.58),
           "Borba": (-59.59, -4.39), "Nova Olinda do Norte": (-59.09, -3.89), "Novo Aripuanã": (-60.38, -5.12),
           "Manicoré": (-61.30, -5.81), "Beruri": (-61.37, -3.90), "Manaquiri": (-60.46, -3.43)}

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DADOS = os.path.join(RAIZ, "data")
CACHE = os.path.join(RAIZ, "pipeline", ".cache")


def saida(chave, valor):
    """Avisa o GitHub Actions (passos seguintes) se houve dado novo."""
    arq = os.environ.get("GITHUB_OUTPUT")
    if arq:
        with open(arq, "a") as f:
            f.write(f"{chave}={valor}\n")


def login():
    if os.environ.get("EARTHDATA_USERNAME") and os.environ.get("EARTHDATA_PASSWORD"):
        auth = earthaccess.login(strategy="environment")
    else:
        auth = earthaccess.login(strategy="netrc")
    if not auth or not auth.authenticated:
        sys.exit("Login no Earthdata falhou. Confira os Secrets ou rode pipeline/login.py.")


def data_de(nome):
    m = re.search(r"_(\d{8})T\d{6}_", nome)
    return dt.datetime.strptime(m.group(1), "%Y%m%d").date()


def passagens():
    """Lista as passagens da mesma órbita, uma por data (a versão mais nova)."""
    hoje = dt.date.today().isoformat()
    res = earthaccess.search_data(short_name=COLECAO, bounding_box=BBOX_BUSCA, temporal=(INICIO, hoje))
    por_data = {}
    for g in res:
        nome = g["umm"]["GranuleUR"]
        if ORBITA not in nome:
            continue
        d = data_de(nome)
        if d not in por_data or nome > por_data[d]:
            por_data[d] = nome
    return [por_data[d] for d in sorted(por_data)]


def escolher(lista):
    depois = lista[-1]
    limite = data_de(depois) - dt.timedelta(days=DIAS_MIN)
    candidatas = [n for n in lista[:-1] if data_de(n) <= limite]
    antes = candidatas[-1] if candidatas else lista[0]
    return antes, depois


def ler(nome):
    os.makedirs(CACHE, exist_ok=True)
    arq = os.path.join(CACHE, nome + ".npz")
    if os.path.exists(arq):
        z = np.load(arq)
        return {k: z[k] for k in z.files} | {"epsg": int(z["epsg"])}
    print("lendo da NASA:", nome, flush=True)
    res = earthaccess.search_data(short_name=COLECAO, granule_name=nome)
    h = h5py.File(earthaccess.open(res)[0], "r")
    g = h[f"science/LSAR/GCOV/grids/{FREQ}"]
    if "HHHH" not in g or "HVHV" not in g:
        print("  produto sem HH/HV, ignorado na comparação:", nome)
        return None
    r = dict(hh=g["HHHH"][:], hv=g["HVHV"][:], x=g["xCoordinates"][:], y=g["yCoordinates"][:],
             epsg=int(g["projection"].attrs["epsg_code"]))
    np.savez(arq, **r)
    return r


def lugar(lon, lat):
    km = {k: 111.32 * math.hypot((lon - v[0]) * math.cos(math.radians(lat)), lat - v[1]) for k, v in CIDADES.items()}
    nome = min(km, key=km.get)
    return f"{nome} · AM" if km[nome] < 8 else f"a {round(km[nome])} km de {nome} · AM"


def comparar(a, d):
    """Mesmas regras do processar.py: alinha, filtra, compara e agrupa em focos."""
    x0, x1 = max(a["x"][0], d["x"][0]), min(a["x"][-1], d["x"][-1])
    y0, y1 = min(a["y"][0], d["y"][0]), max(a["y"][-1], d["y"][-1])

    def corta(r):
        ix = np.where((r["x"] >= x0) & (r["x"] <= x1))[0]; iy = np.where((r["y"] <= y0) & (r["y"] >= y1))[0]
        sl = (slice(iy[0], iy[-1] + 1), slice(ix[0], ix[-1] + 1))
        return r["hh"][sl], r["hv"][sl], r["x"][sl[1]], r["y"][sl[0]]

    hh1, hv1, X, Y = corta(a); hh2, hv2, _, _ = corta(d)
    n = min(hh1.shape[0], hh2.shape[0]), min(hh1.shape[1], hh2.shape[1])
    hh1, hv1, hh2, hv2 = (v[:n[0], :n[1]] for v in (hh1, hv1, hh2, hv2)); X, Y = X[:n[1]], Y[:n[0]]
    area_px = (abs(X[1] - X[0]) / 1000) ** 2

    def db(v):
        m = np.isfinite(v) & (v > 0)
        s = ndimage.uniform_filter(np.where(m, v, 0), 3); c = ndimage.uniform_filter(m.astype(float), 3)
        with np.errstate(divide="ignore", invalid="ignore"):
            return np.where(c > 0.5, 10 * np.log10(s / c), np.nan)

    HH1, HV1, HH2, HV2 = db(hh1), db(hv1), db(hh2), db(hv2)
    ok = np.isfinite(HH1) & np.isfinite(HH2) & np.isfinite(HV1) & np.isfinite(HV2)
    ok &= (HH1 > -35) & (HH2 > -35) & (HV1 > -40) & (HV2 > -40)
    ok = ndimage.binary_erosion(ok, iterations=20)
    regras = {
        "agua": (ok & (HH2 < -16) & (HH2 - HH1 < -4), np.abs(HH2 - HH1)),
        "solo": (ok & (HH1 < -16) & (HH2 - HH1 > 4), np.abs(HH2 - HH1)),
        "arvore": (ok & (HV1 > -16) & (HV2 - HV1 < -2.5), np.abs(HV2 - HV1)),
    }
    tr = Transformer.from_crs(a["epsg"], 4326, always_xy=True)
    focos = []
    for tipo, (mask, delta) in regras.items():
        mask = ndimage.binary_opening(mask, iterations=1)
        lab, nlab = ndimage.label(mask)
        if nlab == 0:
            continue
        idx = np.arange(1, nlab + 1)
        cnt = ndimage.sum(mask, lab, idx); dm = ndimage.mean(delta, lab, idx)
        cy, cx = np.array(ndimage.center_of_mass(mask, lab, idx)).T
        for i in np.argsort(-cnt)[:MAX_POR_TIPO]:
            if cnt[i] < MIN_PX:
                break
            lon, lat = tr.transform(X[int(cx[i])], Y[int(cy[i])])
            focos.append({"id": f"{tipo}-{len(focos)+1}", "tipo": tipo, "lon": round(lon, 4), "lat": round(lat, 4),
                          "area_km2": round(float(cnt[i] * area_px), 2), "grau": int(min(100, round(dm[i] * 11))),
                          "delta_db": round(float(dm[i]), 1), "local": lugar(lon, lat)})
        print(f"  {tipo}: {sum(f['tipo'] == tipo for f in focos)} focos")
    lon0, lat0 = tr.transform(X[0], Y[-1]); lon1, lat1 = tr.transform(X[-1], Y[0])
    area = {"oeste": round(lon0, 3), "sul": round(lat0, 3), "leste": round(lon1, 3), "norte": round(lat1, 3)}
    return focos, area


def imagem(d, arq):
    """Imagem de radar (HV) no recorte do app, no estilo do mapa v2:
    terra em grafite com o relevo do próprio radar, água em azul vivo,
    fora da passagem em azul-aço e uma borda branca marcando a área coberta."""
    lon = np.linspace(IMG["oeste"], IMG["leste"], IMG["w"]); lat = np.linspace(IMG["norte"], IMG["sul"], IMG["h"])
    LON, LAT = np.meshgrid(lon, lat)
    X, Y = Transformer.from_crs(4326, d["epsg"], always_xy=True).transform(LON, LAT)
    x, y = d["x"], d["y"]
    ix = np.round((X - x[0]) / (x[1] - x[0])).astype(int); iy = np.round((Y - y[0]) / (y[1] - y[0])).astype(int)
    dentro = (ix >= 0) & (ix < len(x)) & (iy >= 0) & (iy < len(y))
    v = np.full(LON.shape, np.nan, dtype="float32"); v[dentro] = d["hv"][iy[dentro], ix[dentro]]
    with np.errstate(divide="ignore", invalid="ignore"):
        dbv = 10 * np.log10(v)
    vazio = ~dentro | ~np.isfinite(dbv) | (dbv < -32)
    P = 8   # margem para a limpeza não criar linhas na borda da imagem
    vp = np.pad(vazio, P, mode="edge")
    vazio = ndimage.binary_closing(ndimage.binary_opening(vp, iterations=2), iterations=3)[P:-P, P:-P]
    vazio |= ~dentro
    b = np.nan_to_num(np.clip((dbv + 26) / 18, 0, 1), nan=0.0)
    terra = np.clip((b - 0.30) / 0.40, 0, 1); terra = terra * terra * (3 - 2 * terra)     # 0 = água, 1 = terra
    suave = ndimage.gaussian_filter(b, 1.0)
    relevo = np.clip(0.45 + (suave - ndimage.gaussian_filter(suave, 8)) * 4.5, 0, 1)   # textura do próprio radar
    brilho = relevo[..., None]
    escuro, claro = np.array([20, 30, 42.]), np.array([62, 82, 104.])
    cor_terra = escuro + (claro - escuro) * brilho
    agua = np.array([79, 169, 232.])
    rgb = agua + (cor_terra - agua) * terra[..., None]
    rng = np.random.default_rng(1)
    aco = np.array([52, 100, 140.]) + ndimage.gaussian_filter(rng.standard_normal(LON.shape), 6)[..., None] * 40
    m = ndimage.gaussian_filter(vazio.astype(float), 1.0)[..., None]
    rgb = rgb * (1 - m) + aco * m
    borda = (vazio ^ ndimage.binary_erosion(np.pad(vazio, P, mode="edge"), iterations=2)[P:-P, P:-P])
    rgb[borda] = (245, 248, 252)
    if os.path.dirname(arq):
        os.makedirs(os.path.dirname(arq), exist_ok=True)
    Image.fromarray(np.clip(rgb, 0, 255).astype("uint8")).save(arq, quality=82, optimize=True)


def resumo(focos):
    return {"focos": len(focos),
            "por_tipo": {t: sum(f["tipo"] == t for f in focos) for t in ("agua", "solo", "arvore")},
            "area_km2": {t: round(sum(f["area_km2"] for f in focos if f["tipo"] == t), 2) for t in ("agua", "solo", "arvore")}}


def linha_tempo(lista):
    """Acrescenta à linha do tempo as passagens que ainda não estão lá.
    Cada ponto compara a passagem com a anterior válida (mesma órbita, ~12 dias)."""
    arq = os.path.join(DADOS, "linha_tempo.json")
    lt = json.load(open(arq, encoding="utf-8")) if os.path.exists(arq) else {"passagens": []}
    feitas = {p["produto"] for p in lt["passagens"]}
    novas = [n for n in lista if n not in feitas]
    if not novas:
        return False
    anterior, mudou = None, False
    for nome in lista:
        dado = None
        if nome in novas:
            dado = ler(nome)
            ponto = {"data": str(data_de(nome)), "produto": nome, "imagem": None, "comparado_com": None,
                     "focos": [], "resumo": resumo([])}
            if dado is not None:
                rel = f"radar/{data_de(nome)}.jpg"
                imagem(dado, os.path.join(DADOS, rel)); ponto["imagem"] = rel
                ant = ler(anterior) if anterior else None
                if ant is not None:
                    print("Linha do tempo:", data_de(anterior), "→", data_de(nome))
                    focos, _ = comparar(ant, dado)
                    for f in focos:
                        f["id"] = f"{data_de(nome)}-{f['id']}"; f["data"] = ponto["data"]
                    ponto.update(comparado_com=str(data_de(anterior)), focos=focos, resumo=resumo(focos))
            lt["passagens"].append(ponto); mudou = True
            ok = dado is not None
        else:
            ok = any(p["produto"] == nome and p["imagem"] for p in lt["passagens"])
        if ok:
            anterior = nome
    lt["passagens"].sort(key=lambda p: p["data"])
    lt.update(fonte="NASA-ISRO NISAR · GCOV banda L (PROVISIONAL) · ASF DAAC", orbita=ORBITA.strip("_"),
              recorte={k: IMG[k] for k in ("oeste", "leste", "norte", "sul")},
              atualizado_em=dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"))
    gravar("linha_tempo.json", lt)
    return mudou


def gravar(nome, obj):
    with open(os.path.join(DADOS, nome), "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--forcar", action="store_true")
    ap.add_argument("--antes"); ap.add_argument("--depois")
    args = ap.parse_args()
    forcar = args.forcar or os.environ.get("FORCAR", "").lower() == "true"

    login()
    if args.antes and args.depois:
        antes, depois = args.antes, args.depois
    else:
        lista = passagens()
        print(f"{len(lista)} passagens da órbita {ORBITA.strip('_')}:", ", ".join(str(data_de(n)) for n in lista))
        gravar("passagens.json", [{"data": str(data_de(n)), "produto": n} for n in lista])
        lt_novo = linha_tempo(lista)
        if lt_novo:
            print("Linha do tempo atualizada:", len(lista), "passagens")
        if len(lista) < 2:
            print("Ainda não há duas passagens para comparar."); saida("novo", str(lt_novo).lower()); return
        antes, depois = escolher(lista)

    estado_arq = os.path.join(DADOS, "estado.json")
    estado = json.load(open(estado_arq, encoding="utf-8")) if os.path.exists(estado_arq) else {}
    lt_novo = locals().get("lt_novo", False)
    if not forcar and estado.get("antes") == antes and estado.get("depois") == depois:
        print("Nada novo no par principal:", data_de(antes), "→", data_de(depois))
        saida("novo", str(lt_novo).lower())
        if lt_novo:
            saida("periodo", "linha do tempo")
        return

    print("Comparando", data_de(antes), "→", data_de(depois))
    a, d = ler(antes), ler(depois)
    focos, area = comparar(a, d)
    da, dd = str(data_de(antes)), str(data_de(depois))

    out = {"fonte": "NASA-ISRO NISAR · GCOV banda L (PROVISIONAL) · ASF DAAC",
           "antes": {"data": da, "produto": antes}, "depois": {"data": dd, "produto": depois},
           "area": area, "focos": focos}
    gravar("focos.json", out)
    imagem(d, os.path.join(DADOS, "radar.jpg"))
    gravar("focos_app.json", out | {"imagem": {"arquivo": "radar.jpg", "oeste": IMG["oeste"], "leste": IMG["leste"],
                                               "norte": IMG["norte"], "sul": IMG["sul"], "data": dd}})
    gravar("focos.geojson", {"type": "FeatureCollection", "features": [
        {"type": "Feature", "geometry": {"type": "Point", "coordinates": [f["lon"], f["lat"]]},
         "properties": {k: v for k, v in f.items() if k not in ("lon", "lat")} | {"antes": da, "depois": dd}}
        for f in focos]})

    # forçar: refaz as imagens da linha do tempo no estilo atual
    if forcar and not (args.antes and args.depois):
        lt_arq = os.path.join(DADOS, "linha_tempo.json")
        if os.path.exists(lt_arq):
            lt = json.load(open(lt_arq, encoding="utf-8"))
            for p in lt["passagens"]:
                if p["imagem"]:
                    r = ler(p["produto"])
                    if r is not None:
                        imagem(r, os.path.join(DADOS, p["imagem"]))

    hist_arq = os.path.join(DADOS, "historico.json")
    hist = json.load(open(hist_arq, encoding="utf-8")) if os.path.exists(hist_arq) else []
    hist = [h for h in hist if not (h["antes"] == da and h["depois"] == dd)]
    hist.append({"antes": da, "depois": dd, "focos": len(focos),
                 "por_tipo": {t: sum(f["tipo"] == t for f in focos) for t in ("agua", "solo", "arvore")},
                 "area_km2": {t: round(sum(f["area_km2"] for f in focos if f["tipo"] == t), 2) for t in ("agua", "solo", "arvore")}})
    gravar("historico.json", hist)
    gravar("estado.json", {"antes": antes, "depois": depois,
                           "processado_em": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")})
    print(f"{len(focos)} focos gravados em data/ ({da} → {dd})")
    saida("novo", "true"); saida("periodo", f"{da} → {dd}")


if __name__ == "__main__":
    main()
