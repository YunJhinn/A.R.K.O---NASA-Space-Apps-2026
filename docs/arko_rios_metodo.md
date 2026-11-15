# A.R.K.O Rios · método e validação (v7.0)

Objetivo: **conservar os rios que abastecem cidades de água potável**, mostrando o que mudou em 40 anos, a causa provável, a tendência e quem pode agir.

## Dados (todos abertos)
- **Landsat 4–9, Collection 2 Level-2 (NASA/USGS)**, lido do Microsoft Planetary Computer, sem login. Script: `pipeline/rios_landsat.py`.
- **SWOT L2 RiverSP (NASA/CNES)**, pelo serviço aberto Hydrocron do PO.DAAC. Os trechos de rio vêm do SWORD v17. Script: `pipeline/rios_swot.py` (atualizado todo dia pelo robô).
- **NISAR GCOV (NASA/ISRO)**, **LHASA** e **FIRMS (NASA)**: o rio agora e os riscos na bacia (`pipeline/atualizar.py`, `pipeline/riscos.py`).

## Monitor contínuo (v7.1)
- **HLS v2.0 (NASA)**: Landsat 8/9 + Sentinel-2 harmonizados, 30 m, uma imagem a cada 2–5 dias quando não há nuvem. Script: `pipeline/rios_hls.py` (incremental, rodado todo dia pelo robô). Recortes do mesmo dia viram um mosaico.
- Cada imagem nova é comparada com o **normal do mês** (percentis 10 a 90 das imagens do mesmo mês nos anos anteriores). Imagem fora do normal, para o lado ruim da medida, vira alerta. Um ponto fora do normal é motivo para verificar; dois seguidos, para agir.
- No mapa, a linha do tempo mostra o trecho do rio em cada ano (Landsat, 1985 →) e a imagem HLS mais recente.

## Aquíferos (v7.1)
- **GRACE (NASA/DLR) e GRACE-FO (NASA/GFZ)**: grade mensal de armazenamento total de água (TWS, cm), GFZ GravIS RL06, aberta. Script: `pipeline/aquiferos_grace.py` (o robô baixa só quando sai mês novo).
- Média ponderada pela área sobre uma caixa aproximada de cada aquífero; tendência Theil–Sen; volume = tendência × área × anos.
- Regra mais rígida que a dos rios: perda ≤ −0,15 cm/ano ou 3 dos últimos 6 meses abaixo do percentil 10 do mês = atenção; ≤ −0,8 cm/ano (ou ≤ −0,3 com 4 meses abaixo do normal) = em risco.
- Validação: noroeste da Índia, −4,0 cm/ano no A.R.K.O; Rodell et al. (Nature, 2009) publicaram 4,0 ± 1,0 cm/ano.
- Limites: o GRACE vê regiões de ~300 km; mede a água total (solo + superfície + subterrânea); caixas aproximadas; qualidade da água não aparece do espaço.

## Como cada número é medido
Para cada rio, uma caixa de ~20 km sobre o trecho que abastece a cidade. Em cada ano, até 3 imagens Landsat sem nuvem na estação seca; o valor do ano é a mediana delas.
- **Área de água:** pixels com MNDWI > 0,1.
- **Turbidez:** reflectância no vermelho da água longe da margem (%). Método usado no Tapajós por Lobo et al. (2015): sobe com sedimento.
- **Mata ciliar / solo exposto:** faixa de ~500 m ao redor da água; NDVI > 0,6 (vegetação densa) e NDVI < 0,25 (solo nu ou construído).
- **Gelo (montanha):** NDSI > 0,4; a menor área do ano (a geleira, sem a neve que cai e derrete); só anos com 3 ou mais imagens.
- **Tendência:** Theil–Sen (robusta) nos últimos 15 anos (série inteira para o gelo). A projeção para 2030 supõe que a tendência continue: é um alerta, não uma previsão.

## Resultado (média dos 10 primeiros anos analisados → últimos 3 anos)
| Rio | Anos analisados | Imagens Landsat | Imagens HLS | Turbidez (%) | Água (km²) | Mata ciliar (%) | Solo exposto (%) | Gelo (km²) | Medições SWOT |
|---|---|---|---|---|---|---|---|---|---|
| Reservatório do João Leite (abastece Goiânia) | 2010–2026 | 57 | 377 | 2.1 → 1.5 | 11.7 → 11.6 | 50.0 → 41.9 | 2.3 → 3.1 | — | 0 |
| Rio Meia Ponte em Goiânia | 1985–2026 | 82 | 395 | 5.4 → 3.7 | 0.3 → 0.5 | 2.4 → 17.5 | 21.8 → 19.5 | — | 0 |
| Rio Araguaia em Aruanã | 1985–2025 | 96 | 393 | 9.9 → 6.2 | 9.3 → 7.1 | 57.2 → 67.0 | 5.1 → 5.0 | — | 94 |
| Lago de Serra da Mesa (rio Tocantins) | 1999–2024 | 91 | 368 | 2.5 → 1.1 | 332.4 → 347.6 | 3.5 → 14.6 | 31.1 → 14.3 | — | 0 |
| Rio Tapajós em Itaituba | 1985–2026 | 107 | 128 | 8.5 → 4.8 | 53.0 → 53.1 | 82.0 → 76.0 | 1.5 → 3.5 | — | 154 |
| Rio Madeira em Nova Olinda do Norte | 1985–2026 | 87 | 91 | 8.8 → 7.5 | 122.9 → 125.1 | 89.8 → 84.0 | 0.3 → 1.2 | — | 54 |
| Lago Guaíba em Porto Alegre | 1985–2026 | 108 | 344 | 9.9 → 8.3 | 93.2 → 92.2 | 52.3 → 56.8 | 12.8 → 14.5 | — | 134 |
| Rios Buriganga e Turag em Daca | 1988–2026 | 107 | 214 | 8.1 → 6.5 | 32.9 → 14.8 | 5.9 → 5.0 | 24.4 → 44.4 | — | 45 |
| Geleiras do Langtang (nascente do Trishuli) | 1988–2025 | 100 | 20 | — | — | — | — | 49.1 → 40.7 | 72 |
| Barragem de Massingir (rio dos Elefantes, bacia do Limpopo) | 1989–2026 | 83 | 266 | 4.2 → 1.3 | 71.0 → 121.2 | 3.9 → 14.6 | 27.4 → 5.3 | — | 91 |

Represas (João Leite, Serra da Mesa): a análise começa quando o lago encheu.

## Validação com registros independentes (4 de 4)
1. **Tapajós, corrida do ouro dos anos 80–90:** Lobo et al. (Remote Sensing of Environment, 2015) mostraram que o sedimento do Tapajós acompanha o garimpo, com pico no começo dos anos 90. O A.R.K.O achou o ano mais turvo em 1989 e a média de 1987–1991 cerca de 2,8 vezes a de 1998–2013.
2. **Tapajós, nova corrida de 2019–2022:** o MapBiomas mostrou a explosão do garimpo a partir de 2019 e a lama mudando a cor da água em Alter do Chão em 2022. O A.R.K.O viu a turbidez dobrar em 2020–2022.
3. **Tapajós, vazante recorde de 2024:** o Serviço Geológico do Brasil registrou a menor mínima em Itaituba desde 1974. O SWOT também aponta 2024 como a vazante mais baixa de 2023–2026.
4. **Massingir (Moçambique), reforma de 2006:** relatórios de engenharia (LNEC, 2012) dizem que a barragem vazava e ficava abaixo de 40% da capacidade até 2006. O A.R.K.O mediu a área de água quase dobrando depois disso.

## Limites
- A turbidez do espaço é um índice de reflectância, não amostra de laboratório. Esgoto químico, agrotóxico e microplástico não aparecem do espaço.
- Landsat 5, 7 e 8/9 têm sensores um pouco diferentes; uma imagem por ano pode pegar um dia fora do comum.
- Em represas, as medidas de margem mudam quando a beira da água muda de lugar.
- Dois rios conferidos com registros de fora; os demais precisam de conferência local.

## Fontes
- Lobo, Costa & Novo (2015), https://doi.org/10.1016/j.rse.2014.04.030
- MapBiomas, lama de garimpo em Alter do Chão (2022), https://www.oeco.org.br/wp-content/uploads/2022/01/Release-Alter_final.pdf
- Serviço Geológico do Brasil, nota técnica Itaituba (2025), https://rigeo.sgb.gov.br/jspui/bitstream/doc/25671/1/250911_nota%20tecnica_itaituba.pdf
- LNEC, Massingir dam rehabilitation (2012), https://repositorio.lnec.pt/handle/123456789/1003957
- SWORD v17, https://zenodo.org/records/14727521

## v7.3 · Aquíferos: retrato ano a ano e o chão afundando (NISAR)

**Retrato do aquífero (GRACE / GRACE-FO).** Para cada aquífero, a média anual de cada célula de 1° (~110 km) da grade TWS do GFZ GravIS, numa caixa 2° maior que a do aquífero. É uma reconstrução a partir da gravidade, não uma foto. O ano corrente incompleto é trocado pelos últimos 12 meses (para não misturar só meses de chuva); anos com menos de 12 meses aparecem como "parciais". O quadro 2030 é a tendência Theil–Sen de cada célula nos últimos 15 anos completos: um alerta, não uma previsão.

**NISAR · o chão afundando (BETA).** Quando o aquífero é esvaziado, a argila se compacta e o chão afunda de forma permanente. O produto NISAR L2 GUNW traz pares de 12 dias (fase desdobrada, 80 m). O robô (`pipeline/nisar_afundamento.py`):
1. busca os GUNW (validado; se não houver, provisório) sobre a caixa e monta a maior corrente de pares encadeados do mesmo quadro (a passagem final de um par é a inicial do próximo), até 18 pares;
2. em cada par recorta a caixa, descarta coerência < 0,35 e componente conexa 0, subtrai a tela ionosférica do próprio arquivo e zera a fase num ponto de rocha estável;
3. soma as fases (ponto sem dado em mais de 20% dos pares sai do mapa), converte para cm (λ/4π, λ da frequência central do arquivo) e para vertical aproximado (÷ cos 37°);
4. leva para uma grade de ~500 m e calcula o afundamento máximo (percentil 1), o ritmo (cm/ano) e a área que afundou 5 cm ou mais.

Limites honestos: a especificação do GUNW não documenta o sinal da fase; o robô procura a convenção nos atributos do arquivo e, se não houver, orienta o sinal para que o centro de afundamento já publicado desça (registrado em `sinal_fonte`). A checagem independente é a magnitude, comparada com a literatura: Cidade do México até ~30–40 cm/ano (Chaussard et al. 2014; Cigna & Tapete 2021); Nova Délhi até ~11 cm/ano perto do aeroporto (Garg et al. 2022). A troposfera não é corrigida (alguns cm de ruído). Testado com arquivos sintéticos na estrutura do GUNW (cuba de 30 cm/ano recuperada: −17,6 cm medidos contra −17,7 cm esperados em 216 dias); a primeira rodada com dados reais acontece no robô, que tem o login Earthdata.

## v7.4 · Aquíferos para analistas

- **Painel comparativo:** todos os aquíferos numa tabela com os mesmos indicadores, que pode ser ordenada: tendência (cm/ano), volume (km³/ano), perda acumulada desde 2002, média dos últimos 12 meses, meses abaixo do p10 (últimos 6) e projeção para 2030.
- **Hierarquia da página:** tabela → ficha do aquífero (4 números) → série mensal → retrato anual (GRACE) → chão afundando (NISAR). Validação, limites e ações ficam recolhidos, com o resultado da validação visível no título.
- **Novo aquífero: Brandemburgo e Berlim (Alemanha).** Indústrias que usam muita água disputam a água subterrânea com os moradores (reportagem da DW, via IstoÉ Dinheiro). O GRACE mede −0,66 cm/ano; a área fica perto do limite de resolução do GRACE.

## v7.5 · NISAR no centro e foco em gestão

- **Radar NISAR é a tela inicial**, com duas medidas do radar: *Mudança na superfície* (GCOV: água fora do leito, margem exposta, perda de mata) e *Movimento do solo* (GUNW: afundamento sobre aquíferos na Cidade do México e em Nova Délhi).
- **Prioridade de gestão** (`web/src/lib/gestao.ts`): área da mesma mudança por perto (até 2 pts) + repetição em passagens anteriores (até 2) + sinal forte (1). 3+ = alta, 2 = média, 0–1 = baixa. Cada foco mostra "Por que esta prioridade".
- **Balanço da região:** estoque (Landsat, trecho de referência) + saldo das mudanças do NISAR ao longo das passagens + exportação GeoJSON e CSV para GIS.
- Tom de gestão: "Mudanças para verificar", "Ação sugerida", sem visual de emergência.
