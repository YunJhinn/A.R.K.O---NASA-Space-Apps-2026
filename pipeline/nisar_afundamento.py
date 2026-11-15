"""A.R.K.O Rios · v7.3 · NISAR: o chão afundando sobre aquíferos esvaziados (BETA).
PT: quando se bombeia mais água do que a chuva repõe, as camadas de argila do aquífero se compactam e o chão
    afunda, para sempre. O radar NISAR (NASA–ISRO, banda L) compara duas passagens e mede quanto a distância
    até o chão mudou (interferometria). O produto GUNW traz pares de 12 dias; somando uma corrente de pares
    seguidos (a passagem final de um par é a inicial do próximo) obtemos o afundamento acumulado em meses.
    É uma "imagem" sem câmera: um mapa reconstruído só com a fase do radar.
EN: NISAR GUNW chain stacking → cumulative line-of-sight displacement over pumped aquifers.

Cuidados (honestos, escritos também no JSON):
  * a especificação do GUNW não documenta o sinal da fase. Primeiro procuramos a convenção nos atributos do
    próprio arquivo; se não houver, orientamos o sinal para que o centro de afundamento já publicado desça e
    registramos isso em "sinal_fonte". A checagem independente é a MAGNITUDE (cm/ano) contra a literatura.
  * a fase é corrigida pela ionosfera quando a camada vem no arquivo; troposfera não é corrigida (ruído de
    alguns cm, pequeno perto de dezenas de cm por ano).
  * deslocamento na linha de visada do radar; o vertical aproximado divide por cos(incidência ≈ 37°).
Uso: chamado pelo atualizar.py (precisa do login Earthdata); python pipeline/nisar_afundamento.py [id]
"""
import json, math, os, re, sys, time, datetime as dt
import numpy as np

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "aquiferos")
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".cache_gunw")
COLECOES = ["NISAR_L2_GUNW_V1", "NISAR_L2_GUNW_PROVISIONAL_V1"]     # validado primeiro
INICIO = "2026-01-01"
MAX_PARES = 18            # ~7 meses de pares de 12 dias
PASSO_GRAUS = 0.005       # grade do app: ~500 m
COH_MIN = 0.35
INCID = 37.0              # incidência média aproximada do NISAR (graus)
LIMITE_S = 25 * 60        # o robô tem 60 min no total: o NISAR usa no máximo 25
_T0 = time.time()

ALVOS = [
    dict(id="mexico", aquifero="mexico", nome="Cidade do México · aquífero do Vale do México",
         nome_en="Mexico City · Valley of Mexico aquifer",
         caixa=(-99.30, 19.20, -98.85, 19.62),
         estavel=(-99.19, 19.32),   # Pedregal / Ciudade Universitária: rocha vulcânica, quase não se move
         quente=(-99.03, 19.42),    # Nezahualcóyotl / aeroporto: centro de afundamento publicado
         literatura=dict(max_cm_ano=40, texto="até ~30–40 cm/ano no leste da cidade",
                         ref="Chaussard et al. 2014 (Remote Sens. Environ.) · Cigna & Tapete 2021 (Remote Sens. Environ.)",
                         url="https://doi.org/10.1016/j.rse.2020.112254"),
         cidades={"Centro": (-99.133, 19.433), "Aeroporto": (-99.072, 19.436), "Nezahualcóyotl": (-99.015, 19.40),
                  "Chalco": (-98.90, 19.26), "Iztapalapa": (-99.06, 19.355), "Ecatepec": (-99.05, 19.60),
                  "Ciudad Universitaria": (-99.187, 19.332)}),
    dict(id="delhi", aquifero="india_nw", nome="Nova Délhi e Haryana · aquífero do noroeste da Índia",
         nome_en="New Delhi and Haryana · northwest India aquifer",
         caixa=(76.85, 28.30, 77.45, 28.80),
         estavel=(77.17, 28.60),    # cordilheira de Délhi (Ridge): rocha quartzítica
         quente=(77.07, 28.54),     # Kapashera / perto do aeroporto: afundamento publicado
         literatura=dict(max_cm_ano=11, texto="até ~11 cm/ano perto do aeroporto (Kapashera)",
                         ref="Garg et al. 2022 (Scientific Reports)", url="https://doi.org/10.1038/s41598-022-12207-y"),
         cidades={"Nova Délhi": (77.21, 28.61), "Aeroporto": (77.10, 28.556), "Kapashera": (77.08, 28.53),
                  "Gurugram": (77.03, 28.46), "Faridabad": (77.32, 28.41)}),
]


def datas_de(nome):
    """4 carimbos de tempo no nome: início/fim da referência e início/fim da secundária"""
    d = re.findall(r"_(\d{8})T\d{6}", nome)
    return dt.date.fromisoformat(f"{d[0][:4]}-{d[0][4:6]}-{d[0][6:]}"), dt.date.fromisoformat(f"{d[2][:4]}-{d[2][4:6]}-{d[2][6:]}")


def chave_quadro(nome):
    """trilha + direção + quadro: só pares do mesmo quadro podem ser somados"""
    m = re.search(r"GUNW_\d{3}_(\d{3})_([AD])_(\d{3})_", nome)
    return "_".join(m.groups()) if m else None


def corrente(nomes):
    """maior sequência de pares encadeados (secundária de um = referência do próximo), terminando no mais recente"""
    por = {}
    for n in nomes:
        k = chave_quadro(n)
        if not k: continue
        r, s = datas_de(n)
        atual = por.setdefault(k, {}).get(r)
        if atual is None or n > atual:           # versão de processamento mais nova
            por[k][r] = n
    melhor = []
    for k, d in por.items():
        refs = sorted(d)
        for i0 in range(len(refs)):              # tenta cada começo e segue o encadeamento
            cad, r = [], refs[i0]
            while r in d:
                cad.append(d[r]); r = datas_de(d[r])[1]
            if len(cad) > len(melhor) or (len(cad) == len(melhor) and cad and melhor and datas_de(cad[-1])[1] > datas_de(melhor[-1])[1]):
                melhor = cad
    return melhor[-MAX_PARES:]


def achar(h, sufixo):
    """caminho de um dataset pelo final do nome (o GUNW teve pequenas mudanças de caminho entre versões)"""
    achados = []
    h.visititems(lambda n, o: achados.append(n) if n.endswith(sufixo) and hasattr(o, "shape") else None)
    achados.sort(key=lambda n: (("frequencyA" not in n), ("/HH/" not in n), len(n)))
    return achados[0] if achados else None


def ler_par(h5, caixa):
    """recorta fase, coerência, componentes e ionosfera dentro da caixa (em coordenadas do mapa do produto)"""
    from pyproj import Transformer
    pf = achar(h5, "unwrappedInterferogram/HH/unwrappedPhase") or achar(h5, "unwrappedPhase")
    base = pf.rsplit("/", 1)[0]
    g = h5[base]
    xs = g["xCoordinates"][:] if "xCoordinates" in g else h5[base.rsplit("/", 1)[0]]["xCoordinates"][:]
    ys = g["yCoordinates"][:] if "yCoordinates" in g else h5[base.rsplit("/", 1)[0]]["yCoordinates"][:]
    proj = g["projection"] if "projection" in g else h5[base.rsplit("/", 1)[0]]["projection"]
    epsg = int(proj.attrs.get("epsg_code", proj[()] if proj.shape == () else 4326))
    tr = Transformer.from_crs(4326, epsg, always_xy=True)
    x0, y0, x1, y1 = caixa
    cx, cy = tr.transform([x0, x1, x0, x1], [y0, y0, y1, y1])
    ix = np.where((xs >= min(cx) - 500) & (xs <= max(cx) + 500))[0]
    iy = np.where((ys >= min(cy) - 500) & (ys <= max(cy) + 500))[0]
    if len(ix) < 10 or len(iy) < 10:
        return None
    sl = (slice(iy[0], iy[-1] + 1), slice(ix[0], ix[-1] + 1))
    fase = g["unwrappedPhase"][sl].astype("float32")
    coh = g["coherenceMagnitude"][sl] if "coherenceMagnitude" in g else np.ones_like(fase)
    cc = g["connectedComponents"][sl] if "connectedComponents" in g else np.ones_like(fase)
    iono_ok = "ionospherePhaseScreen" in g and g["ionospherePhaseScreen"].shape == g["unwrappedPhase"].shape
    if iono_ok:
        io = g["ionospherePhaseScreen"][sl].astype("float32")
        fase = np.where(np.isfinite(io), fase - io, fase)
    fq = achar(h5, "frequencyA/centerFrequency") or achar(h5, "centerFrequency")
    lam = 299792458.0 / float(h5[fq][()]) if fq else 0.2384
    desc = " ".join(str(v) for k, v in g["unwrappedPhase"].attrs.items() if k.lower() in ("description", "long_name", "comment"))
    fase[(coh < COH_MIN) | (cc == 0) | ~np.isfinite(fase)] = np.nan
    return dict(fase=fase, x=xs[sl[1]], y=ys[sl[0]], epsg=epsg, lam=lam, iono=iono_ok, desc=desc)


def sinal_pelo_arquivo(desc):
    """+1: fase positiva = afastando do radar (afundar soma positivo); -1: o contrário; 0: não diz"""
    d = desc.lower()
    if re.search(r"positive[^.]*(away from|range increase|increase in range)", d): return +1
    if re.search(r"positive[^.]*(toward|towards|range decrease|decrease in range)", d): return -1
    return 0


def regrade(los, X, Y, epsg, caixa):
    """leva o mapa (metros, coordenadas do produto) para uma grade lon/lat de ~500 m para o app"""
    from pyproj import Transformer
    tr = Transformer.from_crs(4326, epsg, always_xy=True)
    x0, y0, x1, y1 = caixa
    lons = np.arange(x0 + PASSO_GRAUS / 2, x1, PASSO_GRAUS); lats = np.arange(y1 - PASSO_GRAUS / 2, y0, -PASSO_GRAUS)
    LO, LA = np.meshgrid(lons, lats)
    px, py = tr.transform(LO, LA)
    dx = X[1] - X[0]; dy = Y[1] - Y[0]
    ii = np.round((px - X[0]) / dx).astype(int); jj = np.round((py - Y[0]) / dy).astype(int)
    meio = max(1, int(round(250 / abs(dx))))      # média num quadrado de ~500 m em volta do ponto
    out = np.full(LO.shape, np.nan)
    for a in range(LO.shape[0]):
        for b in range(LO.shape[1]):
            i, j = ii[a, b], jj[a, b]
            if 0 <= j < los.shape[0] and 0 <= i < los.shape[1]:
                bloco = los[max(0, j - meio):j + meio + 1, max(0, i - meio):i + meio + 1]
                if np.isfinite(bloco).sum() >= max(3, bloco.size // 3):
                    out[a, b] = np.nanmedian(bloco)
    return lons, lats, out


def valor_em(grade, lons, lats, lon, lat, r=2):
    i = int(np.argmin(np.abs(lons - lon))); j = int(np.argmin(np.abs(lats - lat)))
    v = grade[max(0, j - r):j + r + 1, max(0, i - r):i + r + 1]
    return float(np.nanmedian(v)) if np.isfinite(v).any() else float("nan")


CONTORNO = {}   # nome do granulo -> pontos (lon, lat) do contorno, vindos da busca no catálogo


def dentro(pts, p):
    """ponto dentro do polígono (ray casting); sem contorno conhecido = não filtra"""
    if not pts:
        return True
    x, y = p; c = False
    for i in range(len(pts)):
        x1, y1 = pts[i]; x2, y2 = pts[i - 1]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / ((y2 - y1) or 1e-12) + x1:
            c = not c
    return c


def processar(alvo, buscar, abrir):
    """buscar(colecao, caixa) -> lista de nomes; abrir(colecao, nome) -> h5py.File. Separado para poder testar."""
    nomes, colecao = [], None
    for c in COLECOES:
        nomes = buscar(c, alvo["caixa"])
        # v7.6: em Délhi a 1ª rodada pegou um quadro que cobria só 26% da área e não tinha o ponto de referência
        cobre = [n for n in nomes if dentro(CONTORNO.get(n), alvo["estavel"]) and dentro(CONTORNO.get(n), alvo["quente"])]
        if cobre:
            nomes = cobre
        cad = corrente(nomes)
        if len(cad) >= 3:
            colecao = c; break
    else:
        print(f"  {alvo['id']}: sem corrente de pares suficiente"); return None
    cad = corrente(nomes)
    arq = os.path.join(RAIZ, f"afundamento_{alvo['id']}.json")
    if os.path.exists(arq):
        antigo = json.load(open(arq))
        if antigo.get("pares") and antigo["pares"][-1]["n"] == cad[-1] and len(antigo["pares"]) == len(cad) and antigo.get("cobertura", 0) >= 0.6:
            print(f"  {alvo['id']}: sem par novo"); return False
    soma = cont = None; X = Y = epsg = None; lam = 0.2384; iono = []; sinal_arq = 0; usados = []
    for n in cad:
        if time.time() - _T0 > LIMITE_S:
            print("   tempo do robô acabando: seguindo com os pares já lidos"); break
        try:
            h = abrir(colecao, n)
            p = ler_par(h, alvo["caixa"])
        except Exception as e:                    # um par ruim não derruba a corrente inteira
            print("   par ignorado:", n, e); continue
        if p is None: continue
        if soma is None:
            soma = np.zeros_like(p["fase"], dtype="float64"); cont = np.zeros_like(soma)
            X, Y, epsg = p["x"], p["y"], p["epsg"]
        if p["fase"].shape != soma.shape:
            print("   grade diferente, par ignorado:", n); continue
        f = p["fase"]
        # referência: zera a fase no ponto estável (rocha), assim cada par mede movimento relativo a ele
        from pyproj import Transformer
        sx, sy = Transformer.from_crs(4326, epsg, always_xy=True).transform(*alvo["estavel"])
        i = int(np.argmin(np.abs(X - sx))); j = int(np.argmin(np.abs(Y - sy))); r = max(3, int(1000 / abs(X[1] - X[0])))
        ref = f[max(0, j - r):j + r, max(0, i - r):i + r]
        f = f - (np.nanmedian(ref) if np.isfinite(ref).sum() > 10 else np.nanmedian(f))
        ok = np.isfinite(f)
        soma[ok] += f[ok]; cont[ok] += 1
        lam = p["lam"]; iono.append(p["iono"]); sinal_arq = sinal_arq or sinal_pelo_arquivo(p["desc"])
        r_, s_ = datas_de(n); usados.append({"n": n, "ref": r_.isoformat(), "sec": s_.isoformat()})
        print(f"   {r_} → {s_}  válidos {ok.mean():.0%}", flush=True)
    if soma is None or len(usados) < 3:
        return None
    falta = cont < 0.8 * len(usados)               # ponto que ficou sem dado em mais de 20% dos pares: fora
    fase_tot = np.where(falta, np.nan, soma * len(usados) / np.maximum(cont, 1))
    los_cm = fase_tot * lam / (4 * math.pi) * 100   # magnitude; o sinal é decidido abaixo
    lons, lats, g = regrade(los_cm, X, Y, epsg, alvo["caixa"])
    # sinal: arquivo se disser; senão o centro de afundamento publicado tem que descer
    if sinal_arq:
        sinal, sinal_fonte = (-sinal_arq), "convenção descrita no próprio arquivo do NISAR"
        sinal_en = "convention described in the NISAR file itself"
    else:
        vq = valor_em(g, lons, lats, *alvo["quente"])
        sinal = -1 if vq > 0 else 1
        sinal_fonte = ("a especificação do NISAR não documenta o sinal da fase; orientamos para que o centro de "
                       "afundamento já publicado desça. A magnitude (cm/ano) é a checagem independente.")
        sinal_en = ("the NISAR specification does not document the phase sign; we oriented it so the published "
                    "sinking centre goes down. The magnitude (cm/year) is the independent check.")
    vert = g * sinal / math.cos(math.radians(INCID))     # negativo = afundou
    d0 = dt.date.fromisoformat(usados[0]["ref"]); d1 = dt.date.fromisoformat(usados[-1]["sec"]); dias = (d1 - d0).days
    taxa = vert * 365.25 / dias
    fin = np.isfinite(vert)
    p01 = float(np.nanpercentile(vert[fin], 1)) if fin.any() else float("nan")
    cel_km2 = (PASSO_GRAUS * 111.32) ** 2 * math.cos(math.radians(sum(alvo["caixa"][1::2]) / 2))
    out = {
        "id": alvo["id"], "aquifero": alvo["aquifero"], "nome": alvo["nome"], "nome_en": alvo["nome_en"], "caixa": alvo["caixa"],
        "inicio": d0.isoformat(), "fim": d1.isoformat(), "dias": dias, "pares": usados, "colecao": colecao,
        "lons": [round(float(v), 4) for v in lons], "lats": [round(float(v), 4) for v in lats],
        "cm": [[None if not np.isfinite(v) else round(float(v), 1) for v in row] for row in vert],
        "max_cm": round(p01, 1), "taxa_max_cm_ano": round(p01 * 365.25 / dias, 1),
        "area_5cm_km2": round(float((vert[fin] <= -5).sum() * cel_km2), 1),
        "quente_cm": round(valor_em(vert, lons, lats, *alvo["quente"]), 1),
        "cidades": alvo["cidades"], "estavel": alvo["estavel"], "quente": alvo["quente"], "literatura": alvo["literatura"],
        "sinal_fonte": sinal_fonte, "sinal_fonte_en": sinal_en, "ionosfera_corrigida": bool(iono) and all(iono), "comprimento_onda_m": round(lam, 4),
        "cobertura": round(float(fin.mean()), 3),
        "fonte": f"NISAR (NASA–ISRO) · {colecao} · ASF DAAC · soma de {len(usados)} pares de 12 dias",
        "gerado": dt.date.today().isoformat(),
    }
    os.makedirs(RAIZ, exist_ok=True)
    json.dump(out, open(arq, "w"), ensure_ascii=False, separators=(",", ":"))
    print(f"  {alvo['id']}: {d0} → {d1} ({dias} d) · máx {p01:.1f} cm · {p01 * 365.25 / dias:.1f} cm/ano · "
          f"literatura {alvo['literatura']['texto']}")
    return True


def main(ids=None):
    import earthaccess, h5py
    os.makedirs(CACHE, exist_ok=True)

    def buscar(colecao, caixa):
        try:
            res = earthaccess.search_data(short_name=colecao, bounding_box=caixa, temporal=(INICIO, dt.date.today().isoformat()))
        except Exception as e:
            print("  busca falhou:", colecao, e); return []
        out = []
        for g in res:
            try:
                pol = g["umm"]["SpatialExtent"]["HorizontalSpatialDomain"]["Geometry"]["GPolygons"][0]["Boundary"]["Points"]
                pts = [(float(q["Longitude"]), float(q["Latitude"])) for q in pol]
            except Exception:
                pts = None
            CONTORNO[g["umm"]["GranuleUR"]] = pts
            out.append(g["umm"]["GranuleUR"])
        return out

    def abrir(colecao, nome):
        res = earthaccess.search_data(short_name=colecao, granule_name=nome)
        return h5py.File(earthaccess.open(res)[0], "r")

    global _T0
    _T0 = time.time()
    novos = 0
    for a in ALVOS:
        if ids and a["id"] not in ids: continue
        print("NISAR afundamento:", a["nome"], flush=True)
        try:
            if processar(a, buscar, abrir): novos += 1
        except Exception as e:
            print("  erro (seguindo):", e)
    return novos


if __name__ == "__main__":
    if os.environ.get("EARTHDATA_USERNAME"):
        import earthaccess; earthaccess.login(strategy="environment")
    else:
        import earthaccess; earthaccess.login(strategy="netrc")
    main(sys.argv[1:] or None)
