# Validação com desastres reais (v6.2)

Pergunta: **o que o A.R.K.O mostrava antes de desastres que aconteceram de verdade?**

## Método
1. Escolhemos desastres de 2026 com data e lugar publicados (imprensa, polícia do Nepal, Defesa Civil do RS).
2. Lemos o arquivo diário público do **NASA LHASA** (`portal.nccs.nasa.gov/datashare/landslides/nrt/hazard/tif/`)
   e guardamos, para cada dia, o maior valor num raio de ~10 km da sede de cada distrito/cidade.
   Script: `pipeline/validar_lhasa.py` (não precisa de login).
3. Para o RS, comparamos também a água nova vista pelo **NISAR** em cada passagem (`data/regioes/sul/linha_tempo.json`).
4. Para Moçambique, o robô roda a comparação do A.R.K.O nas passagens BETA do NISAR de 24 dez, 5 jan e 17 jan
   e comparamos com o resultado publicado pela NASA (svs.gsfc.nasa.gov/5661).
5. Para medir alarme falso, contamos em quantos dias do ano cada limite teria disparado no mesmo lugar.

## Resultados
| Lugar | Desastre | LHASA 1–2 dias antes | No dia | Aviso antes? |
|---|---|---|---|---|
| Vale do Taquari (RS) | 22 jul 2026, Taquari e Caí transbordam | 27% (20/07) | 62% (21/07) | Sim |
| Baglung (Nepal) | 25 set 2026, 12 mortes | 29% | 96% | Sim |
| Myagdi (Nepal) | 25 set 2026 | 36% | 96% | Sim |
| Palpa (Nepal) | 25 set 2026 | 30% | 76% | Sim |
| Jajarkot (Nepal) | 15 ago 2026 | 31% | 31% | Sim |
| Rolpa (Nepal) | 13 ago 2026, 4 mortes | 8% | 66% | Não (só no dia) |

NISAR no RS: água nova de 0,7 km² (29/06) e 0,3 km² (11/07) para **15,4 km² em 23/07** (24 focos em Triunfo,
Santa Cruz do Sul, Estrela e Eldorado do Sul), 9,7 km² em 16/08 e 0 em 28/08 (água baixando: 17 km² de "solo").

### Limite do alerta "Alto" (5 distritos do Nepal, 2026)
| Limite | Dias com alerta | Desastres pegos |
|---|---|---|
| 10% (antigo) | 7–19% | 5 de 5 (4 antes) |
| **25% (novo)** | **2–7%** | **5 de 5 (4 antes)** |
| 50% | 1–3% | 4 de 5, só no dia |

Mudança aplicada: Baixo ≥5%, Médio ≥10%, Alto ≥25% (`pipeline/riscos.py` e `web/src/lib/riscos.ts`).

## Limites
- Poucos casos: primeira conferência, não estatística final.
- O LHASA é um modelo de deslizamento; para enchente, usamos como sinal de chuva extrema.
- O lugar do desastre é a sede do distrito/cidade, não o ponto exato.
- Maio de 2024 (RS) não pode ser testado com os mesmos dados: o NISAR foi lançado em jul 2025 e o arquivo lido começa em 2025.

## Fontes dos desastres
- Diário do Comércio, 22 jul 2026 · Agência Brasil, 27 jul 2026 · MetSul via Diário do Litoral
- Watchers, 1 out 2026 (Nepal Police, 29 set) · Kathmandu Post, 15 ago 2026
- NASA SVS 5661 (Moçambique) · AP/Africanews, 20 jan 2026
