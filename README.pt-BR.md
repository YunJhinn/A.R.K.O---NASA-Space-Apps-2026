# A.R.K.O Rios — Advanced Reconnaissance & Knowledge Operations

**NASA Space Apps Challenge 2026 · Dancing with the SARs** · [Read in English](README.md)

O A.R.K.O Rios usa satélites da NASA para **conservar os rios que abastecem as cidades de água potável**. Para cada rio, ele conta, ano a ano desde 1985, o que aconteceu com a água (turbidez, área de água, mata ciliar, solo exposto na margem, gelo das nascentes), a causa provável, para onde vai até 2030 se nada mudar e quem pode agir. Menos de 1% da água do planeta é doce e disponível para beber, e é nos rios que estamos estragando essa fração.

## O A.R.K.O Rios em um minuto

| Camada | Satélite | Anos | O que mostra |
| --- | --- | --- | --- |
| Histórico do rio | **Landsat 4–9** (NASA/USGS) | 1985 → hoje | Turbidez, área de água, mata ciliar, solo exposto na margem, gelo das nascentes |
| Nível do rio | **SWOT** (NASA/CNES) | 2023 → hoje | Altura da água no trecho que abastece a cidade |
| Monitor contínuo | **HLS** (NASA: Landsat 8/9 + Sentinel-2) | a cada 2–5 dias (sem nuvem) | Cada imagem nova comparada com o normal do mês; o que sai do normal vira alerta |
| O rio agora | **NISAR** (NASA/ISRO) | a cada ~12 dias | Água nova, água que recuou e margem perdendo vegetação, através das nuvens |
| Aquíferos | **GRACE / GRACE-FO** (NASA/DLR/GFZ) | 2002 → hoje, mensal | Água guardada no chão e debaixo dele em 7 aquíferos; alerta mais rígido porque o dano é quase irreversível |
| Riscos na bacia | **LHASA** e **FIRMS** (NASA) | diário | Chuva extrema (sedimento) e fogo (cinza e terra) |

**10 rios (4 em Goiás: reservatório do João Leite e Meia Ponte, que abastecem Goiânia, Araguaia em Aruanã e Serra da Mesa) e 7 aquíferos (Goiás, Urucuia, Guarani, Grande Amazônia, Bengala, noroeste da Índia, Ogallala).** Também: Tapajós (garimpo), Madeira (dragas e desmatamento), Guaíba em Porto Alegre (cidade e cheias), rios de Daca (cidade crescendo sobre a água), nascentes do Trishuli no Nepal (gelo derretendo) e barragem de Massingir em Moçambique (secas).

**Validado com registros reais (4 de 4):** a corrida do ouro dos anos 80–90 e a de 2019–2022 no Tapajós (Lobo et al. 2015; MapBiomas), a vazante recorde de 2024 em Itaituba (Serviço Geológico do Brasil) e a represa de Massingir enchendo depois da reforma de 2006. Veja `docs/arko_rios_metodo.md`.

**O que ele não vê:** esgoto químico, agrotóxico e microplástico não aparecem do espaço. O satélite mostra o efeito visível e diz onde e quando coletar amostra em laboratório.

Scripts: `pipeline/rios_landsat.py` (série de 40 anos, dados abertos, sem login) e `pipeline/rios_swot.py` (nível do rio, API aberta Hydrocron). Também `pipeline/rios_hls.py` (monitor contínuo, incremental). O robô diário atualiza HLS, SWOT e NISAR.

---

*As versões anteriores do A.R.K.O eram focadas em alertas de desastres; esse trabalho continua no app ("Agora no rio", "Alertas") e no histórico abaixo.*


## O que tem neste repositório

| Pasta | O que guarda |
| --- | --- |
| `web/` | **Código do app (v2.0): React + TypeScript + Tailwind.** Rode `npm install` e `npm run dev` dentro de `web/`. Veja `web/README.md`. |
| `app/` | O app publicado (compilado a partir de `web/` pelo GitHub Actions). Abra pelo GitHub Pages. PT / EN, *Exemplo / NISAR real*, região e busca mundial no menu e no topo. |
| `pipeline/` | Scripts Python que buscam, leem e comparam dados reais do NISAR e geram os arquivos de focos e da linha do tempo. |
| `data/` | Resultados com dados reais do NISAR: `focos.json`, `focos.geojson` (abre no QGIS ou no geojson.io) e a imagem de radar. |
| `docs/` | Links para o pitch, o roadmap, os documentos de design thinking e o Figma. |

## Dado real, passo a passo

Comparamos duas passagens reais do NISAR sobre o rio Madeira (AM): **3 de setembro** e **21 de outubro de 2026**, mesma órbita (trilha 132, quadro 175). Resultado: **10 focos** (7 de perda de vegetação, 2 de água que sumiu na seca e 1 de água nova).

1. **Buscar** — `buscar.py` lista as passagens do NISAR (produto GCOV, banda L) para uma área e um período, no arquivo público da NASA (ASF DAAC).
2. **Comparar** — `processar.py` lê só a parte necessária de duas passagens (grade de ~80 m), compara o sinal do radar ponto a ponto e marca as mudanças:
   - água nova: HH cai mais de 4 dB e fica abaixo de −16 dB
   - água que sumiu: o contrário
   - perda de vegetação: HV cai mais de 2,5 dB onde havia floresta
3. **Gerar os arquivos do app** — `imagem_app.py` agrupa as mudanças em focos (área em km², grau de mudança de 0 a 100, cidade mais próxima) e desenha a imagem de radar de fundo.
4. **Mostrar** — o protótipo tem dois modos, *Exemplo* e *NISAR real*. O botão (menu à esquerda e mapa) troca o app inteiro: números do topo, mapa, alertas, comparação, versão celular e primeiro acesso.

### Como rodar

```bash
cd pipeline
python -m venv .venv
.venv/Scripts/activate        # Windows  (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
python login.py               # uma vez: sua conta gratuita NASA Earthdata (urs.earthdata.nasa.gov)
python buscar.py              # lista as passagens
python processar.py           # compara duas passagens -> focos.json + conferencia.png
python imagem_app.py          # imagem de radar + focos_app.json
```

Para outra região do mundo, troque `BBOX` e as datas em `buscar.py` e os nomes dos dois produtos em `processar.py`.

## Limites, com honestidade

- O radar sozinho não separa desmatamento de queimada; por isso chamamos de **perda de vegetação**.
- Os limites de detecção são simples e ainda não foram validados com dados de campo.
- Os alertas de vento e tornado do protótipo vêm de modelos do tempo, não do NISAR, e aparecem como **fonte externa**. O que está no modo *Exemplo* é ilustrativo.

## Fonte dos dados e crédito

NASA-ISRO Synthetic Aperture Radar (NISAR) — GCOV banda L, versão PROVISIONAL, distribuído pelo Alaska Satellite Facility DAAC (ASF DAAC). Os dados do NISAR são abertos e gratuitos. Mapa base: Natural Earth.

## Equipe

Equipe A.R.K.O · NASA Space Apps Challenge 2026.

## Atualização automática

O `pipeline/atualizar.py` roda todo dia no GitHub Actions (`.github/workflows/atualizar-nisar.yml`):

1. Lista as passagens do NISAR da órbita do piloto (trilha 132, quadro 175) no ASF DAAC.
2. Se houver passagem mais nova, compara com uma passagem da mesma órbita de pelo menos 45 dias antes.
3. Regrava a pasta `data/` (`focos_app.json`, `radar.jpg`, `focos.geojson`, `historico.json`) e faz o commit.
4. O app lê `data/focos_app.json` ao abrir, então o modo *NISAR real* mostra o dado mais novo. O arquivo HTML continua com os últimos dados dentro dele, para funcionar sem internet.

Configuração (uma vez): cadastre os secrets `EARTHDATA_USERNAME` e `EARTHDATA_PASSWORD` no repositório (Settings → Secrets and variables → Actions). Para rodar na hora: Actions → *Atualizar dados NISAR* → Run workflow.

## v2.0 — o que mudou

- **App refeito em React + TypeScript + Tailwind** (`web/`); o Python continua sendo o pipeline de dados (`pipeline/`).
- **Visual de telão de previsão do tempo**: mapas de radar escuros, ícones 3D ilustrados, painel de dados principais e painel *Alerta de riscos*.
- **Linha do tempo animada** embaixo do mapa: um ponto por passagem real do NISAR, atualizada sozinha a cada ~12 dias. Escolha uma data, arraste ou dê play.
- **Comparar períodos** mostra os ícones dos dois lados e quantos focos de cada tipo.
- **Busca mundial**: digite qualquer lugar (OpenStreetMap). Lugares dentro de uma região com dados abrem a região com um pino; os outros mostram quais regiões têm dados.
- **Duas regiões de exemplo**: Amazônia (piloto, também com dados reais do NISAR) e Sul do Brasil (enchentes e vendavais).

Guia completo dos arquivos do projeto: `docs/DOCUMENTACAO.pdf`.
