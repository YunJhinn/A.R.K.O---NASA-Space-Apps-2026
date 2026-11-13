// Dados ilustrativos do modo "Exemplo" (Amazônia inteira).
import type { Alert, CmpEntry, Ev, EvType, Info, Level, PresetKey } from './types'

export const MAP_W = 746
export const MAP_H = 508

export interface TypeMeta { n: string; s: string; c: string; ic: string }
export const TYPES: Record<EvType, TypeMeta> = {
  agua: { n: 'Enchentes', s: 'Enchente', c: '#1C7ED6', ic: 'agua' },
  fogo: { n: 'Queimadas', s: 'Queimada', c: '#E8590C', ic: 'fogo' },
  arvore: { n: 'Desmatamento', s: 'Desmatamento', c: '#2F9E44', ic: 'arvore' },
  solo: { n: 'Solo seco', s: 'Solo seco', c: '#B8692A', ic: 'solo' },
  vento: { n: 'Ventos', s: 'Vendaval', c: '#D4A20B', ic: 'vento' },
}
/** No modo real, "agua" e "solo" significam outra coisa */
export const TYPES_REAL: Partial<Record<EvType, Pick<TypeMeta, 'n' | 's'>>> = {
  agua: { n: 'Água nova', s: 'Água nova' },
  solo: { n: 'Água que recuou', s: 'Água que recuou' },
}
export const TORNADO_C = '#5B6575'

export const PRESETS: [PresetKey, string, number][] = [
  ['7d', '7 dias', 7], ['30d', '30 dias', 30], ['3m', '3 meses', 90], ['6m', '6 meses', 180], ['1a', '1 ano', 365],
]
export const RANGE: Record<PresetKey, string> = {
  '7d': '4 – 10 nov 2026', '30d': '11 out – 10 nov 2026', '3m': '12 ago – 10 nov 2026', '6m': '17 jun – 10 nov 2026', '1a': '17 jun – 10 nov 2026',
}
export const CMPL: Record<PresetKey, string> = {
  '7d': '7 dias anteriores', '30d': '30 dias anteriores', '3m': '3 meses anteriores', '6m': 'Sem dados anteriores', '1a': 'Sem dados anteriores',
}
type KpiRow = [EvType, string, string, string]
const K6: KpiRow[] = [['fogo', 'Área queimada', '5.120 km²', '—'], ['agua', 'Área alagada', '4.480 km²', '—'], ['arvore', 'Floresta perdida', '2.960 km²', '—'], ['solo', 'Umidade média do solo', '27%', '—']]
export const KPI: Record<PresetKey, KpiRow[]> = {
  '7d': [['fogo', 'Área queimada', '312 km²', '▲ 9%'], ['agua', 'Área alagada', '3.640 km²', '▲ 6%'], ['arvore', 'Floresta perdida', '148 km²', '▲ 4%'], ['solo', 'Umidade média do solo', '18%', '▼ 2 p.p.']],
  '30d': [['fogo', 'Área queimada', '1.284 km²', '▲ 38%'], ['agua', 'Área alagada', '3.912 km²', '▲ 22%'], ['arvore', 'Floresta perdida', '642 km²', '▲ 12%'], ['solo', 'Umidade média do solo', '19%', '▼ 12 p.p.']],
  '3m': [['fogo', 'Área queimada', '3.905 km²', '▲ 61%'], ['agua', 'Área alagada', '3.210 km²', '▼ 8%'], ['arvore', 'Floresta perdida', '1.870 km²', '▲ 17%'], ['solo', 'Umidade média do solo', '24%', '▼ 15 p.p.']],
  '6m': K6,
  '1a': K6,
}

type EvTuple = [string, EvType, number, number, number, number, Ev['st'], string]
const EV_T: EvTuple[] = [
  ['f1', 'fogo', 212, 342, 22, 3, 'obs', 'Lábrea · AM'], ['f2', 'fogo', 246, 340, 18, 15, 'obs', 'Lábrea · AM'], ['f3', 'fogo', 272, 331, 15, 25, 'obs', 'Canutama · AM'], ['f9', 'fogo', 318, 338, 7, 35, 'obs', 'Humaitá · AM'], ['f4', 'fogo', 214, 388, 12, 48, 'obs', 'Acrelândia · AC'], ['f5', 'fogo', 300, 360, 9, 55, 'obs', 'Porto Velho · RO'], ['f7', 'fogo', 256, 312, 10, 62, 'obs', 'Tapauá · AM'], ['f6', 'fogo', 230, 300, 6, 80, 'obs', 'Tapauá · AM'], ['f8', 'fogo', 196, 322, 8, 88, 'obs', 'Pauini · AM'],
  ['c1', 'fogo', 292, 388, 24, 5, 'cl', 'Porto Velho · RO'],
  ['a1', 'agua', 348, 222, 14, 2, 'obs', 'Manaus · AM'], ['a2', 'agua', 300, 206, 10, 6, 'obs', 'Manacapuru · AM'], ['a5', 'agua', 520, 185, 5, 110, 'obs', 'Prainha · PA'], ['a3', 'agua', 396, 229, 8, 120, 'obs', 'Itacoatiara · AM'], ['a4', 'agua', 470, 200, 7, 138, 'obs', 'Óbidos · PA'], ['a6', 'agua', 322, 214, 6, 142, 'obs', 'Iranduba · AM'],
  ['d1', 'arvore', 472, 404, 9, 4, 'obs', 'Novo Progresso · PA'], ['d2', 'arvore', 512, 372, 8, 20, 'obs', 'Altamira · PA'], ['d3', 'arvore', 560, 332, 7, 50, 'obs', 'São Félix do Xingu · PA'], ['d4', 'arvore', 430, 420, 5, 75, 'obs', 'Apuí · AM'], ['d6', 'arvore', 540, 392, 6, 95, 'obs', 'Novo Progresso · PA'], ['d5', 'arvore', 600, 300, 4, 105, 'obs', 'Marabá · PA'],
  ['s1', 'solo', 426, 302, 12, 8, 'obs', 'Jacareacanga · PA'], ['s2', 'solo', 380, 330, 9, 45, 'obs', 'Humaitá · AM'], ['s3', 'solo', 360, 296, 7, 78, 'obs', 'Borba · AM'],
  ['p1', 'vento', 490, 184, 1, 0, 'prev', 'Santarém · PA'], ['p2', 'fogo', 186, 366, 1, 0, 'prev', 'Boca do Acre · AM'], ['p3', 'agua', 330, 240, 1, 0, 'prev', 'Careiro · AM'],
]
export const EV_DEMO: Ev[] = EV_T.map(([id, k, x, y, n, d, st, pl]) => ({ id, k, x, y, n, d, st, pl }))

export const CITIES_DEMO: Record<string, [number, number]> = {
  Manaus: [347.6, 221.5], 'Santarém': [479.7, 205.1], 'Belém': [634.1, 180.6], 'Porto Velho': [251.2, 362.8], 'Lábrea': [228.8, 325.4],
  Altamira: [541.8, 224.0], 'Boa Vista': [331.5, 73.8], 'Macapá': [570.2, 143.4], 'Marabá': [618.7, 278.2], 'Rio Branco': [153.9, 393.0],
}

export const INFO_DEMO: Record<string, Info> = {
  a1: { t: 'Manaus · AM', sub: 'Encontro dos rios Negro e Solimões', m: '1.240 km²', d: '▲ 22% vs. anterior', g: 68, st: 'Em andamento', why: 'O radar mostra mais área com água parada e floresta alagada. Rios acima da média para a época.' },
  f1: { t: 'Lábrea · AM', sub: 'Sul do Amazonas', m: '25 km²', d: '▲ 41% vs. anterior', g: 72, st: 'Observado', why: 'O sinal da vegetação caiu: a floresta perdeu estrutura após o fogo. São cerca de 3.500 campos de futebol.' },
  d1: { t: 'Novo Progresso · PA', sub: 'Arco do desmatamento', m: '48 km²', d: '▲ 12% vs. anterior', g: 55, st: 'Observado', why: 'Áreas de floresta viraram solo exposto, padrão típico de abertura de pasto.' },
  s1: { t: 'Jacareacanga · PA', sub: 'Bacia do Tapajós', m: '19%', d: '▼ 12 p.p. vs. anterior', g: 61, st: 'Em andamento', why: 'O solo ficou mais seco. Isso aumenta o risco de queimadas nas próximas semanas.' },
}

export const ALERTS_DEMO: Alert[] = [
  { id: 'p3', lvl: 'Alto', p: 82, t: 'Possível enchente', l: 'Manaus · AM', ty: 'agua', m: 'Área alagada cresceu 22% e o solo está saturado.', pz: '24–48h', src: 'NISAR' },
  { id: 'p2', lvl: 'Alto', p: 76, t: 'Possível queimada', l: 'Lábrea · AM', ty: 'fogo', m: 'Vegetação seca e umidade do solo caiu de 31% para 19%.', pz: '3–5 dias', src: 'NISAR' },
  { id: 'p1', lvl: 'Médio', p: 54, t: 'Possíveis vendavais', l: 'Santarém · PA', ty: 'vento', m: 'Rajadas acima de 60 km/h sobre área recém-desmatada.', pz: '48h', src: 'ext' },
  { id: null, lvl: 'Baixo', p: 18, t: 'Possível tornado', l: 'Sul do Pará', ty: 'tornado', m: 'Atmosfera instável na região. Em monitoramento.', pz: '72h', src: 'ext' },
]

export const RISK: Record<Level, [string, string]> = { Alto: ['#D93025', '#B3261E'], 'Médio': ['#E37400', '#B06000'], Baixo: ['#5F6670', '#5F6670'] }

/** Data de referência do protótipo (dados de exemplo terminam em 10 nov 2026) */
export const REF = new Date(2026, 10, 10)
export const MES: [string, string, number, string][] = [
  ['jun', 'Jun', 5, '#6366F1'], ['jul', 'Jul', 6, '#8B5CF6'], ['ago', 'Ago', 7, '#D946EF'], ['set', 'Set', 8, '#D93025'], ['out', 'Out', 9, '#F97316'], ['nov', 'Nov', 10, '#C99A06'],
]
export const MES_LONGO = ['Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro']
export const MN3 = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export const CMP_DEMO: Record<string, CmpEntry> = {
  agua: { A: { jul: 2410, ago: 2890, set: 3200 }, B: { out: 3650, nov: 3912 }, why: 'Chuvas acima da média nas cabeceiras do Solimões e do Negro elevaram os rios. O radar enxerga a água mesmo com nuvens.', heat: [[348, 222, 70], [300, 206, 50], [396, 229, 40], [470, 200, 36]] },
  fogo: { A: { jul: 420, ago: 690, set: 930 }, B: { out: 1284, nov: 1410 }, why: 'A estação seca reduziu a umidade do solo de 31% para 19%, deixando a vegetação mais vulnerável ao fogo, principalmente no sul do Amazonas.', heat: [[230, 345, 70], [272, 331, 50], [300, 370, 48]] },
  arvore: { A: { jul: 380, ago: 470, set: 573 }, B: { out: 642, nov: 690 }, why: 'A perda se concentra no “arco do desmatamento”, onde floresta vira pasto e lavoura ao longo das estradas.', heat: [[472, 404, 55], [512, 372, 50], [560, 332, 45]] },
}
export const MN: Record<string, string> = { jul: 'Julho', ago: 'Agosto', set: 'Setembro', out: 'Outubro', nov: 'Novembro' }

/** Barras de "focos por semana" do exemplo (24 semanas até 10 nov) */
export const HIST_DEMO = [12, 15, 14, 18, 22, 20, 26, 31, 28, 35, 42, 38, 47, 52, 49, 58, 64, 61, 70, 76, 72, 85, 92, 88]

export const HEAT_DEMO: Partial<Record<EvType, [number, number, number]>> = { fogo: [245, 355, 80], agua: [345, 220, 58], arvore: [515, 372, 72] }
