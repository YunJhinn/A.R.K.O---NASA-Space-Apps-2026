# A.R.K.O Rios · método e validação (v7.0)

Objetivo: **conservar os rios que abastecem cidades de água potável**, mostrando o que mudou em 40 anos, a causa provável, a tendência e quem pode agir.

## Dados (todos abertos)
- **Landsat 4–9, Collection 2 Level-2 (NASA/USGS)**, lido do Microsoft Planetary Computer, sem login. Script: `pipeline/rios_landsat.py`.
- **SWOT L2 RiverSP (NASA/CNES)**, pelo serviço aberto Hydrocron do PO.DAAC. Os trechos de rio vêm do SWORD v17. Script: `pipeline/rios_swot.py` (atualizado todo dia pelo robô).
- **NISAR GCOV (NASA/ISRO)**, **LHASA** e **FIRMS (NASA)**: o rio agora e os riscos na bacia (`pipeline/atualizar.py`, `pipeline/riscos.py`).

## Como cada número é medido
Para cada rio, uma caixa de ~20 km sobre o trecho que abastece a cidade. Em cada ano, até 3 imagens Landsat sem nuvem na estação seca; o valor do ano é a mediana delas.
- **Área de água:** pixels com MNDWI > 0,1.
- **Turbidez:** reflectância no vermelho da água longe da margem (%). Método usado no Tapajós por Lobo et al. (2015): sobe com sedimento.
- **Mata ciliar / solo exposto:** faixa de ~500 m ao redor da água; NDVI > 0,6 (vegetação densa) e NDVI < 0,25 (solo nu ou construído).
- **Gelo (montanha):** NDSI > 0,4; a menor área do ano (a geleira, sem a neve que cai e derrete); só anos com 3 ou mais imagens.
- **Tendência:** Theil–Sen (robusta) nos últimos 15 anos (série inteira para o gelo). A projeção para 2030 supõe que a tendência continue: é um alerta, não uma previsão.

## Resultado (média dos 10 primeiros anos → últimos 3 anos)
| Rio | Anos | Imagens Landsat | Turbidez (%) | Água (km²) | Mata ciliar (%) | Solo exposto (%) | Gelo (km²) | Medições SWOT |
|---|---|---|---|---|---|---|---|---|
| Rio Tapajós em Itaituba | 1985–2026 | 107 | 8.5 → 4.8 | 53.0 → 53.1 | 82.0 → 76.0 | 1.5 → 3.5 | — | 154 |
| Rio Madeira em Nova Olinda do Norte | 1985–2026 | 93 | 8.8 → 6.1 | 122.9 → 125.6 | 89.8 → 84.0 | 0.3 → 1.1 | — | 54 |
| Lago Guaíba em Porto Alegre | 1985–2026 | 108 | 9.9 → 8.3 | 93.2 → 92.2 | 52.3 → 56.8 | 12.8 → 14.5 | — | 134 |
| Rios Buriganga e Turag em Daca | 1988–2026 | 111 | 8.1 → 6.0 | 30.9 → 14.8 | 6.0 → 5.0 | 23.6 → 44.4 | — | 45 |
| Geleiras do Langtang (nascente do Trishuli) | 1988–2025 | 100 | — | — | — | — | 49.1 → 40.7 | 72 |
| Barragem de Massingir (rio dos Elefantes, bacia do Limpopo) | 1989–2026 | 88 | 4.2 → 1.3 | 68.0 → 121.2 | 3.9 → 14.6 | 31.2 → 5.3 | — | 91 |

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
