# A.R.K.O · o NISAR como ferramenta de gestão da água

**NASA Space Apps Challenge 2026 · Dancing with the SARs** · [Read in English](README.md)

**Da margem do rio ao chão que afunda.** O A.R.K.O acompanha rios, nascentes e aquíferos de forma contínua, por décadas, e avisa **com anos de antecedência** quando algum deles caminha para um ponto crítico.

**App:** https://yunjhinn.github.io/A.R.K.O---NASA-Space-Apps-2026/app/index.html

## O problema

A água some devagar: margem sem mata assoreia o rio, nascente sem vegetação enfraquece, poço demais esvazia o aquífero e o chão começa a afundar. Quem gere a água costuma ver medições soltas e só reage na crise. Falta dizer: *"o padrão mudou em tal ano e, se continuar assim, o ponto crítico chega em tal ano"*.

## Como o A.R.K.O resolve

1. **Monitora sempre**: séries de até 40 anos (1985 → hoje), atualizadas por um robô diário.
2. **Acha o ponto de inflexão**: o ano em que o padrão mudou (dois trechos de tendência Theil–Sen).
3. **Projeta o cenário**: se nada mudar, quando chega ao ponto crítico, com faixa provável.
4. **Alerta cedo**: o alerta acende 10 anos antes do ponto crítico. Vermelho = crítico, amarelo = atenção, verde = dentro do padrão.
5. **Diz o que fazer**: prioridade de gestão e ação sugerida para quem pode agir.

## Onde entra o NISAR

O **NISAR** (NASA-ISRO, radar em banda L, passa a cada 12 dias) enxerga através de nuvens e fumaça e mede o chão em centímetros. É a tela inicial do app, com duas medidas:

| Produto | O que mede | Para que serve |
| --- | --- | --- |
| **GCOV** · mudança na superfície | Eco do radar (HH/HV) comparado entre duas passagens: água fora do leito, perda de mata, margem exposta | Saber onde conferir primeiro, mesmo na estação chuvosa |
| **GUNW** · movimento do solo | Interferometria: quanto o chão desceu entre passagens | Achar onde o aquífero está sendo esvaziado. Cidade do México: ~26 cm/ano, de acordo com estudos publicados |

## As telas

| Tela | O que mostra |
| --- | --- |
| **Radar NISAR** | Mudanças na superfície (GCOV) e movimento do solo (GUNW), com lista por prioridade e exportação GeoJSON/CSV |
| **Histórico do rio** | 10 rios, 1985 → hoje: estado, por quê, causa provável, o que fazer, inflexão e cenários |
| **Aquíferos** | 9 aquíferos (GRACE/GRACE-FO, 2002 → hoje): tendência, perda em km³, inflexão e cenários |
| **Cenários futuros** | Nascente do Araguaia (antes/depois Landsat, vegetação nativa, ponto crítico) e a lista de todos os lugares por urgência |
| **Validação** | Conferência com registros reais e estudos publicados |

## Fontes de dados (todas públicas)

| O quê | Fonte |
| --- | --- |
| Radar: superfície e afundamento | NISAR GCOV e GUNW (NASA/ISRO, ASF DAAC) |
| Histórico dos rios e fotos | Landsat 5/7/8/9 Collection 2 Level-2 (NASA/USGS) |
| Monitor contínuo | HLS (NASA: Landsat 8/9 + Sentinel-2) |
| Nível de rios e lagos | SWOT (NASA/CNES), serviço Hydrocron |
| Água guardada nos aquíferos | GRACE e GRACE-FO (NASA/DLR/GFZ), grade GFZ GravIS |
| Vegetação nativa nas nascentes | ESA CCI Land Cover e Impact Observatory/Esri LULC |

## Limites, com honestidade

- Os dados NISAR ainda estão em fase beta. Quando a qualidade não basta, a tela mostra "inconclusivo".
- Os pontos críticos são referências do A.R.K.O (metade da água ou mata original, o dobro da turbidez, 20% de vegetação na nascente), sempre explicadas na tela.
- Cenário não é previsão: mostra para onde vai se nada mudar.
- O satélite não vê esgoto, agrotóxico ou microplástico: ele mostra o efeito visível e diz onde coletar amostra.

## Repositório

| Pasta | O que guarda |
| --- | --- |
| `web/` | App em React + TypeScript + Tailwind. `npm install` e `npm run dev` dentro de `web/` |
| `pipeline/` | Scripts Python que buscam e processam os dados (NISAR, Landsat, HLS, SWOT, GRACE, nascentes) |
| `data/` | Resultados lidos pelo app (JSON, GeoJSON, imagens) |
| `app/` | App publicado no GitHub Pages |
| `docs/` | Documentação da equipe, glossário e método |

O robô (`.github/workflows/atualizar-nisar.yml`) roda `pipeline/atualizar.py` todo dia e atualiza `data/`. A senha do NASA Earthdata fica só nos Secrets do repositório (`EARTHDATA_USERNAME`, `EARTHDATA_PASSWORD`).

Documentação: `docs/DOCUMENTACAO.pdf` (telas, uso, como adicionar dados) e `docs/ARKO_Glossario_Taxonomia.pdf` (termos, siglas e métodos).

## Crédito

NASA-ISRO SAR (NISAR), ASF DAAC · Landsat (NASA/USGS) · HLS (NASA) · SWOT (NASA/CNES) · GRACE/GRACE-FO (NASA/DLR/GFZ) · ESA CCI Land Cover · Impact Observatory/Esri · Microsoft Planetary Computer · Natural Earth.

Equipe A.R.K.O · NASA Space Apps Challenge 2026.
