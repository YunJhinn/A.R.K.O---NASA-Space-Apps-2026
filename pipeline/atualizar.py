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

Várias regiões (v2.1): a lista REGIOES abaixo define cada área monitorada. A Amazônia fica em data/
(como antes) e as outras em data/regioes/<id>/. O índice data/regioes.json diz ao app quais existem.
Para rodar só uma região: python pipeline/atualizar.py --regiao sul
Par fixo (v4): uma região pode ter par=("AAAA-MM-DD", "AAAA-MM-DD") para o mapa principal mostrar sempre
um antes/depois escolhido (ex.: o desastre do Nepal); max_lt muda quantas passagens a linha do tempo começa.

Login: usa EARTHDATA_USERNAME / EARTHDATA_PASSWORD (GitHub Actions) ou o _netrc do computador.
"""
import argparse, datetime as dt, json, math, os, re, sys
import numpy as np, h5py, earthaccess
from scipy import ndimage
from pyproj import Transformer
from PIL import Image

# ---------------- configuração ----------------
COLECAO_PADRAO = "NISAR_L2_GCOV_PROVISIONAL_V1"
INICIO_PADRAO = "2026-06-17"           # primeiras observações públicas calibradas
COLECAO, INICIO, FIM = COLECAO_PADRAO, INICIO_PADRAO, None   # trocados por usar_regiao (v6.2: região com dados BETA)
DIAS_MIN = 45                          # "antes" precisa ser pelo menos 45 dias antes do "depois"
FREQ = "frequencyB"                    # grade de ~80 m
MIN_PX = 40                            # menor foco: 40 pixels (~0,26 km²)
MAX_FOCOS = 25                         # no máximo 25 focos por passagem, sempre os de maior risco
MAX_LT = 8                             # linha do tempo de uma região nova começa pelas 8 passagens mais recentes
W_IMG, H_IMG = 1492, 1016              # tamanho da imagem de radar do app (proporção do mapa 746 × 508)

# Regiões monitoradas com dados reais. Para adicionar uma:
#  1) rode pipeline/buscar.py (ou o exemplo da documentação) para achar trilha e quadro com passagens DHDH
#  2) copie um bloco abaixo: id, nome, órbita "_TRILHA_A/D_QUADRO_", um ponto dentro do quadro e cidades próximas
#  3) img=None calcula o recorte do mapa sozinho na primeira passagem
REGIOES = [
    dict(id="amazonia", nome="Rio Madeira · Amazonas", pais="Brasil", pasta="",
         orbita="_132_A_175_", bbox=(-61.0, -5.5, -60.0, -4.5), sufixo=" · AM",
         img=dict(oeste=-62.05, leste=-58.95, norte=-3.944, sul=-6.056),
         cidades={"Careiro": (-60.37, -3.77), "Careiro da Várzea": (-59.83, -3.20), "Autazes": (-59.13, -3.58),
                  "Borba": (-59.59, -4.39), "Nova Olinda do Norte": (-59.09, -3.89), "Novo Aripuanã": (-60.38, -5.12),
                  "Manicoré": (-61.30, -5.81), "Beruri": (-61.37, -3.90), "Manaquiri": (-60.46, -3.43)}),
    dict(id="sul", nome="Porto Alegre e vale do Taquari · RS", pais="Brasil", pasta="regioes/sul/",
         orbita="_053_D_103_", bbox=(-51.25, -30.05, -51.15, -29.95), sufixo=" · RS", img=None,
         cidades={"Porto Alegre": (-51.23, -30.03), "Canoas": (-51.18, -29.92), "São Leopoldo": (-51.15, -29.76),
                  "Novo Hamburgo": (-51.13, -29.68), "Guaíba": (-51.33, -30.11), "Eldorado do Sul": (-51.62, -30.08),
                  "Gravataí": (-50.99, -29.94), "Viamão": (-51.02, -30.08), "Montenegro": (-51.46, -29.69),
                  "Lajeado": (-51.96, -29.47), "Estrela": (-51.95, -29.50), "Santa Cruz do Sul": (-52.43, -29.72),
                  "Camaquã": (-51.81, -30.85), "Taquara": (-50.78, -29.65), "Caxias do Sul": (-51.18, -29.17),
                  "Venâncio Aires": (-52.19, -29.61), "Triunfo": (-51.72, -29.94), "Barra do Ribeiro": (-51.30, -30.29)}),
    dict(id="bangladesh", nome="Daca e rio Jamuna · Bangladesh", pais="Bangladesh", pasta="regioes/bangladesh/",
         orbita="_069_A_014_", bbox=(90.35, 23.75, 90.45, 23.85), sufixo=" · Bangladesh", img=None,
         cidades={"Daca": (90.41, 23.81), "Narayanganj": (90.50, 23.62), "Gazipur": (90.42, 24.00),
                  "Tangail": (89.92, 24.25), "Manikganj": (90.00, 23.86), "Faridpur": (89.84, 23.61),
                  "Mymensingh": (90.41, 24.75), "Sirajganj": (89.70, 24.45), "Jamalpur": (89.94, 24.92),
                  "Kishoreganj": (90.78, 24.43), "Chandpur": (90.67, 23.23), "Munshiganj": (90.53, 23.54),
                  "Narsingdi": (90.72, 23.92), "Bhairab": (90.98, 24.05), "Rajbari": (89.64, 23.76), "Bogra": (89.37, 24.85)}),
    # Nepal (v4): estudo de caso do colapso de rocha e gelo do Langtang Lirung (26 ago 2026).
    # par: o mapa principal compara a passagem de 19 ago (uma semana antes) com a de 31 ago (cinco dias depois).
    # max_lt: a linha do tempo começa em junho, para mostrar o antes, o desastre e o depois.
    dict(id="nepal", nome="Langtang e rio Trishuli · Nepal", pais="Nepal", pasta="regioes/nepal/",
         orbita="_098_A_016_", bbox=(85.47, 28.23, 85.57, 28.33), sufixo=" · Nepal",
         img=dict(oeste=84.8, leste=86.0, norte=28.478, sul=27.661),
         par=("2026-08-19", "2026-08-31"), max_lt=12,
         evento=dict(data="2026-08-26", lon=85.527, lat=28.287,
                     nome="Colapso de rocha e gelo do Langtang Lirung"),
         # v7: montanha = encostas de Rasuwa/Langtang/Helambu (procura material novo na encosta);
         # zona_gelo = Himalaia alto do vale do Langtang, onde ficam as geleiras (procura gelo/neve mudando)
         montanha=dict(oeste=85.1, leste=86.0, sul=27.9, norte=28.478),
         zona_gelo=dict(oeste=85.3, leste=86.0, sul=28.12, norte=28.478), refazer_lt=True,
         cidades={"Katmandu": (85.32, 27.71), "Syabrubesi": (85.35, 28.16), "Dhunche": (85.30, 28.11),
                  "Rasuwagadhi": (85.38, 28.28), "Timure": (85.37, 28.25), "Langtang": (85.51, 28.22),
                  "Kyanjin Gompa": (85.57, 28.21), "Thulo Bharkhu": (85.31, 28.13), "Chilime": (85.30, 28.18),
                  "Betrawati": (85.19, 27.97), "Trishuli (Bidur)": (85.15, 27.90), "Devighat": (85.11, 27.86),
                  "Dhading Besi": (84.89, 27.91), "Melamchi": (85.58, 27.83), "Gyirong (China)": (85.33, 28.39)}),
    # Moçambique (v6.2): estudo de caso da enchente do rio Limpopo em Chókwè (meados de jan 2026), usada para
    # validar o A.R.K.O com um desastre real que a própria NASA mostrou com o NISAR (svs.gsfc.nasa.gov/5661).
    # Dados BETA (antes da calibração final): coleção, início e fim próprios; a janela é fechada, então o robô
    # processa uma vez e depois não muda mais.
    # Tapajós (v7.0, A.R.K.O Rios): rio que abastece Itaituba, rio abaixo do garimpo de ouro do médio Tapajós.
    dict(id="tapajos", nome="Rio Tapajós · Itaituba (PA)", pais="Brasil", pasta="regioes/tapajos/",
         orbita="_103_A_175_", bbox=(-56.00, -4.30, -55.95, -4.25), sufixo=" · PA", img=None,
         cidades={"Itaituba": (-55.98, -4.28), "Miritituba": (-55.96, -4.29), "Trairão": (-55.94, -4.70),
                  "Rurópolis": (-54.91, -4.09), "Aveiro": (-55.32, -3.61), "Jacareacanga": (-57.75, -6.22),
                  "Santarém": (-54.71, -2.44), "Belterra": (-54.94, -2.64), "Novo Progresso": (-55.38, -7.05)}),
    dict(id="mocambique", nome="Rio Limpopo e Chókwè · Moçambique", pais="Moçambique", pasta="regioes/mocambique/",
         orbita="_114_A_165_", bbox=(32.93, -24.58, 33.03, -24.48), sufixo=" · Moçambique", img=None,
         colecao="NISAR_L2_GCOV_BETA_V1", inicio="2025-12-01", fim="2026-01-31", beta=True,
         par=("2026-01-05", "2026-01-17"),
         evento=dict(data="2026-01-17", lon=32.98, lat=-24.53, tipo="enchente",
                     nome="Enchente do rio Limpopo em Chókwè", nome_en="Limpopo River flood in Chókwè"),
         cidades={"Chókwè": (32.98, -24.53), "Chibuto": (33.53, -24.69), "Macia": (33.10, -25.03),
                  "Xai-Xai": (33.64, -25.05), "Magude": (32.65, -25.02), "Mabalane": (32.63, -23.85),
                  "Massingir": (32.16, -23.89), "Manhiça": (32.81, -25.40), "Bilene": (33.24, -25.30),
                  "Maputo": (32.57, -25.97), "Mapai": (32.06, -22.85)}),
]
# valores da região em uso (trocados por usar_regiao)
ORBITA = BBOX_BUSCA = IMG = CIDADES = SUFIXO = MONTANHA = ZONA_GELO = None
MAX_MONTANHA = 10                      # no máximo 10 focos de gelo e 10 de material na encosta por passagem

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DADOS_RAIZ = os.path.join(RAIZ, "data")
DADOS = DADOS_RAIZ
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
    res = earthaccess.search_data(short_name=COLECAO, bounding_box=BBOX_BUSCA, temporal=(INICIO, FIM or hoje))
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
    grids = h["science/LSAR/GCOV/grids"]
    # v6.2: produtos BETA podem vir só com frequencyA (grade fina); nesse caso tira a média em blocos até ~80 m
    freq = FREQ if FREQ in grids and "HHHH" in grids[FREQ] else "frequencyA"
    g = grids[freq] if freq in grids else None
    if g is None or "HHHH" not in g or "HVHV" not in g:
        print("  produto sem HH/HV, ignorado na comparação:", nome)
        return None
    x, y = g["xCoordinates"][:], g["yCoordinates"][:]
    hh, hv = g["HHHH"][:], g["HVHV"][:]
    k = max(1, int(round(80 / abs(x[1] - x[0])))) if freq != FREQ else 1
    if k > 1:
        print(f"  sem {FREQ}: usando {freq} em blocos de {k}x{k}")
        ny, nx = (hh.shape[0] // k) * k, (hh.shape[1] // k) * k
        bloco = lambda v: np.nanmean(v[:ny, :nx].reshape(ny // k, k, nx // k, k), axis=(1, 3))
        with np.errstate(invalid="ignore"):
            hh, hv = bloco(hh), bloco(hv)
        x, y = x[:nx].reshape(-1, k).mean(1), y[:ny].reshape(-1, k).mean(1)
    r = dict(hh=hh, hv=hv, x=x, y=y, epsg=int(g["projection"].attrs["epsg_code"]))
    np.savez(arq, **r)
    return r


def lugar(lon, lat):
    km = {k: 111.32 * math.hypot((lon - v[0]) * math.cos(math.radians(lat)), lat - v[1]) for k, v in CIDADES.items()}
    nome = min(km, key=km.get)
    return f"{nome}{SUFIXO}" if km[nome] < 8 else f"a {round(km[nome])} km de {nome}{SUFIXO}"


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
    tr = Transformer.from_crs(a["epsg"], 4326, always_xy=True)
    # v7: só procura mudanças dentro da área do mapa do app (antes o quadro inteiro do satélite entrava e,
    # no Nepal, quase todos os focos caíam no Tibete, fora do mapa)
    LON, LAT = tr.transform(*np.meshgrid(X, Y))
    dentro = lambda b: (LON >= b["oeste"]) & (LON <= b["leste"]) & (LAT >= b["sul"]) & (LAT <= b["norte"])
    if IMG:
        ok &= dentro(IMG)
    regras = {
        "agua": (ok & (HH2 < -16) & (HH2 - HH1 < -4), np.abs(HH2 - HH1)),
        "solo": (ok & (HH1 < -16) & (HH2 - HH1 > 4), np.abs(HH2 - HH1)),
        "arvore": (ok & (HV1 > -16) & (HV2 - HV1 < -2.5), np.abs(HV2 - HV1)),
    }
    # v7 · montanha (hipóteses, só nas áreas configuradas da região):
    #  gelo: HH e HV caem juntos 3 dB ou mais onde a superfície era clara -> neve/gelo molhado, derretendo ou removido
    #  detritos: HH sobe 4 dB e HV sobe 2 dB -> superfície ficou mais áspera: material novo (avalanche, deslizamento)
    if ZONA_GELO:
        regras["gelo"] = (ok & dentro(ZONA_GELO) & (HH1 > -18) & (HH2 - HH1 < -3) & (HV2 - HV1 < -3) & ~regras["agua"][0], np.abs(HH2 - HH1))
    if MONTANHA:
        regras["detritos"] = (ok & dentro(MONTANHA) & (HH2 - HH1 > 4) & (HV2 - HV1 > 2), np.abs(HH2 - HH1))
    # v7.1: junta os candidatos de todos os tipos e fica com os de MAIOR RISCO (no máximo MAX_FOCOS no total).
    # risco = força da mudança (grau, 0-100, vem do Δ em dB) × tamanho (cresce com o log da área):
    # uma mudança forte e grande vem antes de uma fraca ou pequena.
    cand = []
    for tipo, (mask, delta) in regras.items():
        mask = ndimage.binary_opening(mask, iterations=1)
        lab, nlab = ndimage.label(mask)
        if nlab == 0:
            continue
        idx = np.arange(1, nlab + 1)
        cnt = ndimage.sum(mask, lab, idx); dm = ndimage.mean(delta, lab, idx)
        # médias de HH e HV (dB) antes e depois em cada foco: o app usa para explicar a polarização
        med = {n: ndimage.mean(np.nan_to_num(v), lab, idx) for n, v in
               (("hh_antes", HH1), ("hh_depois", HH2), ("hv_antes", HV1), ("hv_depois", HV2))}
        cy, cx = np.array(ndimage.center_of_mass(mask, lab, idx)).T
        for i in np.nonzero(cnt >= MIN_PX)[0]:
            area_km2 = float(cnt[i] * area_px)
            grau = int(min(100, round(dm[i] * 11)))
            cand.append(dict(tipo=tipo, i=i, cx=cx[i], cy=cy[i], area=area_km2, grau=grau, dm=float(dm[i]),
                             med={n: float(v[i]) for n, v in med.items()},
                             score=grau * (1 + math.log2(1 + area_km2))))
    cand.sort(key=lambda c: -c["score"])
    smax = cand[0]["score"] if cand else 1
    normais = [c for c in cand if c["tipo"] not in ("gelo", "detritos")][:MAX_FOCOS]
    montanha = [c for c in cand if c["tipo"] in ("gelo", "detritos")][:MAX_MONTANHA * 2]
    focos = []
    for c in normais + montanha:
        lon, lat = tr.transform(X[int(c["cx"])], Y[int(c["cy"])])
        focos.append({"id": f"{c['tipo']}-{len(focos)+1}", "tipo": c["tipo"], "lon": round(lon, 4), "lat": round(lat, 4),
                      "area_km2": round(c["area"], 2), "grau": c["grau"], "delta_db": round(c["dm"], 1),
                      "risco": int(round(100 * c["score"] / smax)), "local": lugar(lon, lat),
                      **{n: round(v, 1) for n, v in c["med"].items()}})
    for tipo in regras:
        print(f"  {tipo}: {sum(f['tipo'] == tipo for f in focos)} focos (de {sum(c['tipo'] == tipo for c in cand)} candidatos)")
    lon0, lat0 = tr.transform(X[0], Y[-1]); lon1, lat1 = tr.transform(X[-1], Y[0])
    area = {"oeste": round(lon0, 3), "sul": round(lat0, 3), "leste": round(lon1, 3), "norte": round(lat1, 3)}
    return focos, area


def imagem(d, arq):
    """Imagem de radar (HV) no recorte do app, no estilo do mapa v2:
    terra em grafite com o relevo do próprio radar, água em azul vivo,
    fora da passagem em azul-aço e uma borda branca marcando a área coberta."""
    lon = np.linspace(IMG["oeste"], IMG["leste"], W_IMG); lat = np.linspace(IMG["norte"], IMG["sul"], H_IMG)
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
    Cada ponto compara a passagem com a anterior válida da mesma órbita (~12 dias antes).
    Numa região nova, começa pelas MAX_LT passagens mais recentes."""
    arq = os.path.join(DADOS, "linha_tempo.json")
    lt = json.load(open(arq, encoding="utf-8")) if os.path.exists(arq) else {"passagens": []}
    feitas = {p["produto"] for p in lt["passagens"]}
    janela = lista if feitas else lista[-MAX_LT:]
    novas = [n for n in janela if n not in feitas]
    if not novas:
        return False
    for nome in novas:
        dado = ler(nome)
        ponto = {"data": str(data_de(nome)), "produto": nome, "imagem": None, "comparado_com": None,
                 "focos": [], "resumo": resumo([])}
        if dado is not None:
            rel = f"radar/{data_de(nome)}.jpg"
            imagem(dado, os.path.join(DADOS, rel)); ponto["imagem"] = rel
            # passagem anterior válida (com HH e HV), mesmo que esteja fora da janela
            ant, nome_ant = None, None
            for cand in reversed(lista[:lista.index(nome)]):
                ant = ler(cand)
                if ant is not None:
                    nome_ant = cand; break
            if ant is not None:
                print("Linha do tempo:", data_de(nome_ant), "→", data_de(nome))
                focos, _ = comparar(ant, dado)
                for f in focos:
                    f["id"] = f"{data_de(nome)}-{f['id']}"; f["data"] = ponto["data"]
                mont = [f for f in focos if f["tipo"] in ("gelo", "detritos")]
                focos = [f for f in focos if f["tipo"] not in ("gelo", "detritos")]
                ponto.update(comparado_com=str(data_de(nome_ant)), focos=focos, resumo=resumo(focos))
                if mont:
                    ponto["montanha"] = mont
        lt["passagens"].append(ponto)
    lt["passagens"].sort(key=lambda p: p["data"])
    lt.update(fonte="NASA-ISRO NISAR · GCOV banda L (PROVISIONAL) · ASF DAAC", orbita=ORBITA.strip("_"),
              recorte={k: IMG[k] for k in ("oeste", "leste", "norte", "sul")},
              atualizado_em=dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"))
    gravar("linha_tempo.json", lt)
    return True


def recorte_auto(d):
    """Recorte do mapa (lon/lat) que mostra o quadro inteiro, na proporção 746 × 508."""
    tr = Transformer.from_crs(d["epsg"], 4326, always_xy=True)
    xs, ys = [d["x"][0], d["x"][-1]], [d["y"][0], d["y"][-1]]
    pts = [tr.transform(x, y) for x in xs for y in ys]
    lo0, lo1 = min(p[0] for p in pts), max(p[0] for p in pts)
    la0, la1 = min(p[1] for p in pts), max(p[1] for p in pts)
    cx, cy = (lo0 + lo1) / 2, (la0 + la1) / 2
    w = max((lo1 - lo0) * 1.08, (la1 - la0) * 1.08 * (746 / 508))
    h = w * 508 / 746
    return {"oeste": round(cx - w / 2, 3), "leste": round(cx + w / 2, 3), "norte": round(cy + h / 2, 3), "sul": round(cy - h / 2, 3)}


def usar_regiao(reg):
    """Troca a configuração em uso para a região reg."""
    global ORBITA, BBOX_BUSCA, IMG, CIDADES, SUFIXO, DADOS, MAX_LT, MONTANHA, ZONA_GELO, COLECAO, INICIO, FIM
    ORBITA, BBOX_BUSCA, CIDADES, SUFIXO = reg["orbita"], reg["bbox"], reg["cidades"], reg["sufixo"]
    COLECAO, INICIO, FIM = reg.get("colecao", COLECAO_PADRAO), reg.get("inicio", INICIO_PADRAO), reg.get("fim")
    MONTANHA, ZONA_GELO = reg.get("montanha"), reg.get("zona_gelo")
    MAX_LT = reg.get("max_lt", 8)
    DADOS = os.path.join(DADOS_RAIZ, reg["pasta"]) if reg["pasta"] else DADOS_RAIZ
    os.makedirs(DADOS, exist_ok=True)
    IMG = reg["img"]
    rec = os.path.join(DADOS, "recorte.json")
    if IMG is None and os.path.exists(rec):
        IMG = json.load(open(rec, encoding="utf-8"))


def gravar(nome, obj):
    with open(os.path.join(DADOS, nome), "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)


def processar_regiao(reg, args, forcar):
    """Faz tudo para uma região. Devolve (houve_novidade, periodo)."""
    global IMG
    usar_regiao(reg)
    print(f"\n===== {reg['nome']} ({reg['id']}) =====")
    lt_novo = False
    if args.antes and args.depois:
        antes, depois = args.antes, args.depois
    else:
        lista = passagens()
        print(f"{len(lista)} passagens da órbita {ORBITA.strip('_')}:", ", ".join(str(data_de(n)) for n in lista))
        if not lista:
            return False, ""
        gravar("passagens.json", [{"data": str(data_de(n)), "produto": n} for n in lista])
        if IMG is None:   # região nova: recorte calculado pela passagem mais nova com HH/HV
            for n in reversed(lista):
                d0 = ler(n)
                if d0 is not None:
                    IMG = recorte_auto(d0); gravar("recorte.json", IMG); print("recorte do mapa:", IMG); break
        if forcar and reg.get("refazer_lt"):   # v7: refaz a linha do tempo com o recorte do mapa e as regras de montanha
            arq_lt = os.path.join(DADOS, "linha_tempo.json")
            if os.path.exists(arq_lt):
                os.remove(arq_lt); print("Linha do tempo será refeita do zero")
        lt_novo = linha_tempo(lista)
        if lt_novo:
            print("Linha do tempo atualizada:", len(lista), "passagens")
        if len(lista) < 2:
            print("Ainda não há duas passagens para comparar."); return lt_novo, ""
        antes, depois = escolher(lista)
        if reg.get("par"):   # par fixo (ex.: antes e depois de um desastre conhecido)
            por_data = {str(data_de(n)): n for n in lista}
            if reg["par"][0] in por_data and reg["par"][1] in por_data:
                antes, depois = por_data[reg["par"][0]], por_data[reg["par"][1]]

    estado_arq = os.path.join(DADOS, "estado.json")
    estado = json.load(open(estado_arq, encoding="utf-8")) if os.path.exists(estado_arq) else {}
    if not forcar and estado.get("antes") == antes and estado.get("depois") == depois:
        print("Nada novo no par principal:", data_de(antes), "→", data_de(depois))
        return lt_novo, "linha do tempo" if lt_novo else ""

    print("Comparando", data_de(antes), "→", data_de(depois))
    a, d = ler(antes), ler(depois)
    if a is None or d is None:
        print("Par sem HH/HV, pulando."); return lt_novo, ""
    focos, area = comparar(a, d)
    montanha = [f for f in focos if f["tipo"] in ("gelo", "detritos")]
    focos = [f for f in focos if f["tipo"] not in ("gelo", "detritos")]
    da, dd = str(data_de(antes)), str(data_de(depois))
    out = {"fonte": "NASA-ISRO NISAR · GCOV banda L (" + ("BETA, antes da calibração final" if reg.get("beta") else "PROVISIONAL") + ") · ASF DAAC",
           "antes": {"data": da, "produto": antes}, "depois": {"data": dd, "produto": depois},
           "area": area, "focos": focos} | ({"montanha": montanha} if MONTANHA or ZONA_GELO else {})
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
    hist.append({"antes": da, "depois": dd} | resumo(focos))
    gravar("historico.json", hist)
    gravar("estado.json", {"antes": antes, "depois": depois,
                           "processado_em": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")})
    print(f"{len(focos)} focos gravados em {DADOS} ({da} → {dd})")
    return True, f"{da} → {dd}"


def gravar_indice():
    """data/regioes.json: lista das regiões com dados reais, para o app."""
    idx = []
    for reg in REGIOES:
        pasta = os.path.join(DADOS_RAIZ, reg["pasta"]) if reg["pasta"] else DADOS_RAIZ
        f = os.path.join(pasta, "focos_app.json")
        if not os.path.exists(f):
            continue
        fa = json.load(open(f, encoding="utf-8"))
        idx.append({"id": reg["id"], "nome": reg["nome"], "pais": reg["pais"], "pasta": reg["pasta"],
                    "imagem": {k: fa["imagem"][k] for k in ("oeste", "leste", "norte", "sul")},
                    "antes": fa["antes"]["data"], "depois": fa["depois"]["data"], "focos": len(fa["focos"]),
                    "linha_tempo": os.path.exists(os.path.join(pasta, "linha_tempo.json")),
                    "cidades": {k: list(v) for k, v in reg["cidades"].items()}}
                   | ({"evento": reg["evento"]} if reg.get("evento") else {}) | ({"beta": True} if reg.get("beta") else {}))
    with open(os.path.join(DADOS_RAIZ, "regioes.json"), "w", encoding="utf-8") as fp:
        json.dump(idx, fp, ensure_ascii=False, indent=1)
    print("\nÍndice data/regioes.json:", ", ".join(r["id"] for r in idx))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--forcar", action="store_true")
    ap.add_argument("--regiao", help="processa só esta região (id da lista REGIOES)")
    ap.add_argument("--antes"); ap.add_argument("--depois")
    ap.add_argument("--indice", action="store_true", help="só regrava data/regioes.json")
    args = ap.parse_args()
    if args.indice:
        gravar_indice(); return
    forcar = args.forcar or os.environ.get("FORCAR", "").lower() == "true"
    login()
    novo, periodos = False, []
    for reg in REGIOES:
        if args.regiao and reg["id"] != args.regiao:
            continue
        try:
            n, per = processar_regiao(reg, args, forcar)
        except Exception as e:      # uma região com problema não impede as outras
            print(f"ERRO na região {reg['id']}: {e}"); n, per = False, ""
        novo |= n
        if per:
            periodos.append(f"{reg['id']} {per}")
    gravar_indice()
    # v6: deslizamento (NASA LHASA) e queimadas (NASA FIRMS) todo dia, mesmo sem passagem nova do NISAR
    if not args.regiao:
        try:
            from riscos import atualizar_riscos
            if atualizar_riscos(REGIOES, DADOS_RAIZ):
                novo = True
                periodos.append("riscos " + dt.date.today().isoformat())
        except Exception as e:
            print("ERRO nos riscos (LHASA/FIRMS):", e)
        # A.R.K.O Rios (v7.0): nível dos rios pelo SWOT (Hydrocron, aberto, sem senha)
        try:
            import rios_swot
            rios_swot.main()
            novo = True
            periodos.append("rios SWOT " + dt.date.today().isoformat())
        except Exception as e:
            print("ERRO no SWOT dos rios:", e)
        # A.R.K.O Rios (v7.1): monitor contínuo, imagens HLS novas (a cada 2–5 dias), incremental
        try:
            import rios_hls
            if rios_hls.main():
                periodos.append("rios HLS " + dt.date.today().isoformat())
        except Exception as e:
            print("ERRO no HLS dos rios:", e)
        # A.R.K.O Rios (v7.1): aquíferos pelo GRACE/GRACE-FO (só quando o GFZ publica um mês novo)
        try:
            import aquiferos_grace
            if aquiferos_grace.main():
                periodos.append("aquiferos GRACE " + dt.date.today().isoformat())
        except Exception as e:
            print("ERRO no GRACE dos aquíferos:", e)
    saida("novo", str(novo).lower())
    if periodos:
        saida("periodo", "; ".join(periodos))


if __name__ == "__main__":
    main()
