# A.R.K.O — Advanced Reconnaissance & Knowledge Operations

**NASA Space Apps Challenge 2026 · Dancing with the SARs** · [Read in English](README.md)

O A.R.K.O transforma o radar do satélite NISAR (NASA-ISRO) em alertas, mapas e respostas simples sobre enchentes, queimadas e desmatamento, para quem precisa agir rápido (Defesa Civil) e para quem ensina e pesquisa (escolas e universidades). A Amazônia é o nosso piloto; o objetivo é qualquer lugar da Terra que o NISAR observa.

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
