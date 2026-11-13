// Regiões com dados de exemplo. Para monitorar outra área:
// 1) gere o mapa base (ver docs/DOCUMENTACAO.pdf) e salve em src/assets/
// 2) copie o bloco de uma região abaixo e ajuste limites, cidades, focos e alertas
// Coordenadas x/y dos focos estão na grade do mapa (746 × 508); use projetar() para converter lon/lat.
import type { Alert, CmpEntry, Ev, EvType, Info, PresetKey } from './types'
import { ALERTS_DEMO, CITIES_DEMO, CMP_DEMO, EV_DEMO, HEAT_DEMO, INFO_DEMO, KPI, MAP_H, MAP_W } from './demo'
import mapAmazonia from '../assets/map-demo.jpg'
import mapSul from '../assets/map-sul.jpg'

export type RegionId = 'amazonia' | 'sul'
export interface Bounds { oeste: number; leste: number; norte: number; sul: number }
type KpiRow = [EvType, string, string, string]

export interface Region {
  id: RegionId
  /** nome curto (seletor) e título do painel */
  name: string
  title: string
  /** limites do mapa base em graus (lon/lat) */
  bounds: Bounds
  img: string
  ev: Ev[]
  cities: Record<string, [number, number]>
  info: Record<string, Info>
  alerts: Alert[]
  kpi: Record<PresetKey, KpiRow[]>
  cmp: Record<string, CmpEntry>
  heat: Partial<Record<EvType, [number, number, number]>>
  /** foco aberto ao entrar na região */
  sel: string
  /** frase extra do topo no período de 30 dias */
  answer30: string
  /** deslocamento do mapa na versão celular (px) */
  phone: { left: number; top: number }
  /** existe dado real do NISAR nesta região? */
  hasReal: boolean
}

export const projetar = (b: Bounds, lon: number, lat: number) => ({
  x: ((lon - b.oeste) / (b.leste - b.oeste)) * MAP_W,
  y: ((b.norte - lat) / (b.norte - b.sul)) * MAP_H,
})
export const dentro = (b: Bounds, lon: number, lat: number) => lon >= b.oeste && lon <= b.leste && lat <= b.norte && lat >= b.sul

// ---------- Amazônia (piloto) ----------
const amazonia: Region = {
  id: 'amazonia', name: 'Amazônia', title: 'Radar da Amazônia',
  bounds: { oeste: -74, leste: -44, norte: 5.7756, sul: -14.5756 },
  img: mapAmazonia, ev: EV_DEMO, cities: CITIES_DEMO, info: INFO_DEMO, alerts: ALERTS_DEMO, kpi: KPI, cmp: CMP_DEMO, heat: HEAT_DEMO,
  sel: 'a1', answer30: 'Queimadas cresceram 38% no último mês.', phone: { left: -118, top: -30 }, hasReal: true,
}

// ---------- Sul do Brasil (exemplo: enchentes e vendavais) ----------
type T = [string, EvType, number, number, number, number, Ev['st'], string]
const SUL_EV: T[] = [
  ['s_a1', 'agua', 412.3, 310.1, 16, 3, 'obs', 'Eldorado do Sul · RS'], ['s_a2', 'agua', 416.8, 305.0, 14, 2, 'obs', 'Porto Alegre · RS'], ['s_a3', 'agua', 420.2, 294.1, 12, 5, 'obs', 'São Leopoldo · RS'],
  ['s_a4', 'agua', 380.0, 274.0, 11, 8, 'obs', 'Lajeado · RS'], ['s_a5', 'agua', 384.4, 257.4, 9, 12, 'obs', 'Muçum · RS'], ['s_a6', 'agua', 361.1, 406.9, 6, 16, 'obs', 'Pelotas · RS'], ['s_a7', 'agua', 523.7, 129.2, 7, 40, 'obs', 'Blumenau · SC'],
  ['s_s1', 'solo', 124.8, 291.2, 8, 60, 'obs', 'Uruguaiana · RS'], ['s_s2', 'solo', 189.5, 292.9, 7, 72, 'obs', 'Alegrete · RS'], ['s_s3', 'solo', 273.5, 381.7, 6, 95, 'obs', 'Bagé · RS'],
  ['s_f1', 'fogo', 202.4, 356.5, 5, 104, 'obs', 'Santana do Livramento · RS'], ['s_f2', 'fogo', 347.1, 139.5, 4, 122, 'obs', 'Chapecó · SC'], ['s_f3', 'fogo', 404.8, 41.6, 6, 112, 'obs', 'Guarapuava · PR'],
  ['s_d1', 'arvore', 308.3, 122.3, 5, 52, 'obs', 'São Miguel do Oeste · SC'], ['s_d2', 'arvore', 353.1, 30.7, 4, 84, 'obs', 'Laranjeiras do Sul · PR'], ['s_d3', 'arvore', 462.5, 179.6, 3, 133, 'obs', 'Lages · SC'],
  ['s_p1', 'vento', 418.8, 258.0, 1, 0, 'prev', 'Caxias do Sul · RS'], ['s_p2', 'agua', 425.2, 319.8, 1, 0, 'prev', 'Guaíba · RS'], ['s_p3', 'vento', 542.1, 173.8, 1, 0, 'prev', 'Florianópolis · SC'],
]
const sul: Region = {
  id: 'sul', name: 'Sul do Brasil', title: 'Radar do Sul do Brasil',
  bounds: { oeste: -59.6, leste: -44.6, norte: -24.6637, sul: -33.5363 },
  img: mapSul,
  ev: SUL_EV.map(([id, k, x, y, n, d, st, pl]) => ({ id, k, x, y, n, d, st, pl })),
  cities: {
    'Porto Alegre': [416.3, 307.2], Pelotas: [361.1, 406.9], 'Santa Maria': [288.0, 287.8], 'Caxias do Sul': [418.8, 258.0], 'Florianópolis': [549.6, 167.5],
    Blumenau: [523.7, 129.2], 'Chapecó': [347.1, 139.5], Curitiba: [513.7, 43.9], Uruguaiana: [124.8, 291.2], 'Passo Fundo': [357.6, 205.9],
  },
  info: {
    s_a1: { t: 'Eldorado do Sul · RS', sub: 'Delta do Jacuí e lago Guaíba', m: '612 km²', d: '▲ 48% vs. anterior', g: 86, st: 'Em andamento', why: 'O radar mostra água parada sobre áreas urbanas e lavouras. O nível do Guaíba segue acima da cota de inundação.' },
  },
  alerts: [
    { id: 's_p2', lvl: 'Alto', p: 88, t: 'Possível enchente', l: 'Porto Alegre · RS', ty: 'agua', m: 'Guaíba acima da cota de inundação e solo saturado.', pz: '24h', src: 'NISAR' },
    { id: 's_p1', lvl: 'Alto', p: 71, t: 'Possíveis vendavais', l: 'Serra Gaúcha · RS', ty: 'vento', m: 'Rajadas acima de 80 km/h com chuva forte.', pz: '24–48h', src: 'ext' },
    { id: 's_a7', lvl: 'Médio', p: 52, t: 'Possível enchente', l: 'Vale do Itajaí · SC', ty: 'agua', m: 'Rio Itajaí-Açu subindo após chuva contínua.', pz: '48h', src: 'NISAR' },
    { id: null, lvl: 'Baixo', p: 22, t: 'Possível tornado', l: 'Oeste de Santa Catarina', ty: 'tornado', m: 'Atmosfera instável na região. Em monitoramento.', pz: '72h', src: 'ext' },
  ],
  kpi: {
    '7d': [['fogo', 'Área queimada', '18 km²', '▼ 22%'], ['agua', 'Área alagada', '2.940 km²', '▲ 64%'], ['arvore', 'Floresta perdida', '12 km²', '▲ 3%'], ['solo', 'Umidade média do solo', '47%', '▲ 9 p.p.']],
    '30d': [['fogo', 'Área queimada', '64 km²', '▼ 31%'], ['agua', 'Área alagada', '3.480 km²', '▲ 112%'], ['arvore', 'Floresta perdida', '41 km²', '▲ 6%'], ['solo', 'Umidade média do solo', '44%', '▲ 15 p.p.']],
    '3m': [['fogo', 'Área queimada', '210 km²', '▼ 12%'], ['agua', 'Área alagada', '3.910 km²', '▲ 140%'], ['arvore', 'Floresta perdida', '118 km²', '▲ 9%'], ['solo', 'Umidade média do solo', '38%', '▲ 11 p.p.']],
    '6m': [['fogo', 'Área queimada', '355 km²', '—'], ['agua', 'Área alagada', '4.120 km²', '—'], ['arvore', 'Floresta perdida', '196 km²', '—'], ['solo', 'Umidade média do solo', '35%', '—']],
    '1a': [['fogo', 'Área queimada', '355 km²', '—'], ['agua', 'Área alagada', '4.120 km²', '—'], ['arvore', 'Floresta perdida', '196 km²', '—'], ['solo', 'Umidade média do solo', '35%', '—']],
  },
  cmp: {
    agua: { A: { jul: 380, ago: 520, set: 910 }, B: { out: 2240, nov: 3480 }, why: 'Chuva acima da média na serra encheu os rios Taquari, Caí e Jacuí, que desaguam no lago Guaíba. O radar enxerga a água mesmo com o céu fechado.', heat: [[410, 302, 70], [382, 266, 45], [523, 129, 32], [361, 405, 30]] },
    fogo: { A: { jul: 120, ago: 140, set: 96 }, B: { out: 70, nov: 64 }, why: 'Com o solo encharcado e a chuva frequente, os focos de fogo caíram no Sul nos últimos meses.', heat: [[202, 356, 40], [347, 139, 34], [405, 42, 34]] },
    arvore: { A: { jul: 22, ago: 27, set: 33 }, B: { out: 38, nov: 41 }, why: 'A perda de vegetação nativa se concentra no oeste de Santa Catarina e no centro do Paraná, ligada à expansão agrícola.', heat: [[308, 122, 40], [353, 31, 34], [462, 180, 30]] },
  },
  heat: { agua: [408, 300, 70], fogo: [278, 220, 60], arvore: [338, 100, 55] },
  sel: 's_a1', answer30: 'A área alagada mais que dobrou no último mês.', phone: { left: -150, top: -60 }, hasReal: false,
}

export const REGIONS: Record<RegionId, Region> = { amazonia, sul }
export const REGION_LIST: Region[] = [amazonia, sul]
