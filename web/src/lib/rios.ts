// A.R.K.O Rios · análise longitudinal (1985 → hoje) de cada rio, a partir de data/rios/<id>.json
// (gerado por pipeline/rios_landsat.py com Landsat 4–9 e, quando há, nível do rio do SWOT).
// Tudo aqui é medido; o que é interpretação aparece como "causa provável" e "tendência se continuar assim".

export type Metrica = 'turbidez' | 'agua_km2' | 'mata_ciliar' | 'solo_exposto' | 'gelo_km2'
export interface AnoRio { ano: number; imagens: string[]; foto?: string; agua_km2?: number; turbidez?: number; mata_ciliar?: number; solo_exposto?: number; gelo_km2?: number }
export interface SwotPonto { d: string; wse: number }
export interface RioJson {
  id: string; nome: string; pais: string; bbox: [number, number, number, number]; meses: number[]; cidade: string; pressao: string
  montanha: boolean; gerado: string; fonte: string; serie: AnoRio[]
  swot?: { reach_id: string; rio?: string; serie: SwotPonto[] }
}
export interface RioIndice { id: string; nome: string; nome_en: string; regiao: string | null; cidade: string }

type Bi = [string, string]
export const RIOS: RioIndice[] = [
  { id: 'tapajos', nome: 'Rio Tapajós · Itaituba (PA)', nome_en: 'Tapajós River · Itaituba (Brazil)', regiao: 'tapajos', cidade: 'Itaituba' },
  { id: 'madeira', nome: 'Rio Madeira · Nova Olinda do Norte (AM)', nome_en: 'Madeira River · Nova Olinda do Norte (Brazil)', regiao: 'amazonia', cidade: 'Nova Olinda do Norte' },
  { id: 'guaiba', nome: 'Lago Guaíba · Porto Alegre (RS)', nome_en: 'Guaíba Lake · Porto Alegre (Brazil)', regiao: 'sul', cidade: 'Porto Alegre' },
  { id: 'daca', nome: 'Rios Buriganga e Turag · Daca', nome_en: 'Buriganga and Turag rivers · Dhaka', regiao: 'bangladesh', cidade: 'Daca' },
  { id: 'langtang', nome: 'Geleiras do Langtang · nascente do Trishuli (Nepal)', nome_en: 'Langtang glaciers · Trishuli headwaters (Nepal)', regiao: 'nepal', cidade: 'Katmandu' },
  { id: 'limpopo', nome: 'Barragem de Massingir · bacia do Limpopo (Moçambique)', nome_en: 'Massingir Dam · Limpopo basin (Mozambique)', regiao: 'mocambique', cidade: 'Chókwè' },
]

export const METRICAS: Record<Metrica, { nome: Bi; un: string; bom: 'baixo' | 'alto'; cor: string; o_que: Bi }> = {
  turbidez: { nome: ['Turbidez da água', 'Water turbidity'], un: '%', bom: 'baixo', cor: '#B45309',
    o_que: ['Quanto a água reflete no vermelho: sobe com barro e sedimento (garimpo, erosão, enxurrada). Mais alto = água mais suja e mais cara de tratar.', 'How much the water reflects red light: it rises with mud and sediment (mining, erosion, runoff). Higher = dirtier water, costlier to treat.'] },
  agua_km2: { nome: ['Área de água', 'Water area'], un: 'km²', bom: 'alto', cor: '#2563EB',
    o_que: ['Área coberta por água na estação seca, dentro do trecho analisado. Cai quando o rio seca ou é aterrado.', 'Area covered by water in the dry season within the analysed stretch. It drops when the river dries out or is filled in.'] },
  mata_ciliar: { nome: ['Mata ciliar', 'Riverside forest'], un: '%', bom: 'alto', cor: '#15803D',
    o_que: ['Parte da faixa de 500 m ao redor da água com vegetação densa. A mata ciliar segura a terra e filtra a água que chega ao rio.', 'Share of the 500 m strip around the water with dense vegetation. Riverside forest holds the soil and filters water before it reaches the river.'] },
  solo_exposto: { nome: ['Solo exposto na margem', 'Bare soil on the banks'], un: '%', bom: 'baixo', cor: '#9A3412',
    o_que: ['Parte da faixa de 500 m com terra nua ou área construída: garimpo, desmatamento, cidade.', 'Share of the 500 m strip with bare ground or built-up area: mining, clearing, city.'] },
  gelo_km2: { nome: ['Gelo e neve nas nascentes', 'Ice and snow at the headwaters'], un: 'km²', bom: 'alto', cor: '#0891B2',
    o_que: ['Área de gelo e neve no fim da monção. É a "caixa d’água" que alimenta o rio na estação seca.', 'Area of ice and snow after the monsoon. It is the "water tower" that feeds the river in the dry season.'] },
}

// causa provável e ações por rio (hipóteses com fonte; o app mostra como hipótese)
export const CONTEXTO: Record<string, { causa: Bi; fonte?: { t: string; url: string } }> = {
  tapajos: { causa: ['Garimpo de ouro rio acima: as dragas e o desmonte das margens jogam barro (às vezes com mercúrio) na água. Estudos com Landsat mostram que o sedimento no Tapajós acompanha a atividade de garimpo.', 'Gold mining upstream: dredges and bank clearing dump mud (sometimes with mercury) into the water. Landsat studies show Tapajós sediment follows mining activity.'],
    fonte: { t: 'Lobo et al., Remote Sensing of Environment (2015)', url: 'https://doi.org/10.1016/j.rse.2014.04.030' } },
  madeira: { causa: ['O Madeira já é naturalmente barrento (vem dos Andes). Mudanças fortes na turbidez e na margem podem vir de dragas de garimpo, desmatamento e de anos de seca ou cheia extrema.', 'The Madeira is naturally muddy (it comes from the Andes). Strong changes in turbidity and banks may come from mining dredges, clearing, and extreme drought or flood years.'] },
  guaiba: { causa: ['O Guaíba é a principal fonte de água de Porto Alegre. A turbidez sobe em anos de cheia (barro dos rios Jacuí e Taquari); a margem muda com a cidade e as lavouras na bacia.', 'Guaíba is Porto Alegre’s main water source. Turbidity rises in flood years (mud from the Jacuí and Taquari rivers); the banks change with the city and farms in the basin.'] },
  daca: { causa: ['Daca cresceu sobre rios, canais e áreas alagáveis. Menos água e mais área construída na margem indicam aterro e ocupação, e com isso menos água limpa e mais esgoto direto no rio.', 'Dhaka has grown over rivers, canals and wetlands. Less water and more built-up banks point to landfill and encroachment, meaning less clean water and more sewage straight into the river.'] },
  langtang: { causa: ['O aquecimento derrete as geleiras do Himalaia. Menos gelo hoje significa menos água no rio na estação seca no futuro. A neve varia muito de ano para ano, então vale a tendência de longo prazo.', 'Warming melts Himalayan glaciers. Less ice today means less river water in future dry seasons. Snow varies a lot year to year, so the long-term trend is what matters.'] },
  limpopo: { causa: ['A barragem de Massingir guarda água para beber e irrigar em Chókwè. Até 2006 ela vazava e não podia passar de 40% da capacidade; depois da reforma, terminada em 2006, a reserva encheu, e o satélite mostra a área de água quase dobrando. Secas longas ainda podem esvaziá-la. Atenção: aqui as medidas de margem (mata e solo exposto) mudaram sobretudo porque a beira da represa mudou de lugar quando ela encheu.', 'Massingir Dam stores water for drinking and irrigation in Chókwè. Until 2006 it leaked and could not exceed 40% of capacity; after the rehabilitation finished in 2006 the reservoir filled, and the satellite shows the water area almost doubling. Long droughts can still drain it. Note: here the bank measures (forest and bare soil) changed mainly because the reservoir’s edge moved when it filled.'],
    fonte: { t: 'LNEC · Massingir dam rehabilitation (2012)', url: 'https://repositorio.lnec.pt/handle/123456789/1003957' } },
}

const med = (v: number[]) => { const a = [...v].sort((x, y) => x - y); const n = a.length; return n ? (n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2) : NaN }

/** inclinação robusta (Theil–Sen) em unidades por ano */
export function theilSen(p: [number, number][]) {
  const s: number[] = []
  for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) if (p[j][0] !== p[i][0]) s.push((p[j][1] - p[i][1]) / (p[j][0] - p[i][0]))
  const m = med(s), b = med(p.map(([x, y]) => y - m * x))
  return { m, b }
}

export interface Analise {
  k: Metrica; pts: [number, number][]; base: number; baseTxt: Bi; agora: number; agoraAnos: string
  pico?: [number, number]; var: number; tend: { m: number; b: number; de: number }; proj2030: number
  estado: 'melhor' | 'estavel' | 'atencao' | 'alerta'
  melhorJanela?: [number, number, number]
}

export function analisar(r: RioJson, k: Metrica): Analise | null {
  const pts = r.serie.filter(a => a[k] != null).map(a => [a.ano, a[k] as number] as [number, number])
  if (pts.length < 8) return null
  const M = METRICAS[k], bom = M.bom
  // linha de base: primeiros 10 anos da série (como o rio era)
  const ini = pts.filter(([a]) => a < pts[0][0] + 10)
  const base = med(ini.map(p => p[1]))
  const ult = pts.slice(-3), agora = med(ult.map(p => p[1]))
  // tendência: últimos 15 anos; na montanha, a série inteira (nevascas isoladas distorcem janelas curtas)
  const de = k === 'gelo_km2' ? pts[0][0] : Math.max(pts[0][0], pts[pts.length - 1][0] - 15)
  const tend = { ...theilSen(pts.filter(([a]) => a >= de)), de }
  const proj2030 = Math.max(0, tend.m * 2030 + tend.b)
  const pico = [...pts].sort((a, b) => (bom === 'baixo' ? b[1] - a[1] : a[1] - b[1]))[0]
  const varPct = base ? ((agora - base) / Math.abs(base)) * 100 : 0
  const pior = bom === 'baixo' ? varPct : -varPct              // > 0 = piorou
  const tendPior = (bom === 'baixo' ? tend.m : -tend.m) * 10 / (Math.abs(base) || 1) * 100   // % da base por década
  const estado = pior > 50 || (pior > 20 && tendPior > 15) ? 'alerta' : pior > 15 || tendPior > 10 ? 'atencao' : pior < -15 ? 'melhor' : 'estavel'
  // melhor janela de 10 anos (referência de como o rio pode ser)
  let melhorJanela: [number, number, number] | undefined
  for (const [a0] of pts) {
    const w = pts.filter(([a]) => a >= a0 && a < a0 + 10)
    if (w.length < 7) continue
    const v = med(w.map(p => p[1]))
    if (!melhorJanela || (bom === 'baixo' ? v < melhorJanela[2] : v > melhorJanela[2])) melhorJanela = [w[0][0], w[w.length - 1][0], v]
  }
  return { melhorJanela, k, pts, base, baseTxt: [`média ${ini[0][0]}–${ini[ini.length - 1][0]}`, `${ini[0][0]}–${ini[ini.length - 1][0]} average`], agora,
    agoraAnos: `${ult[0][0]}–${ult[ult.length - 1][0]}`, pico, var: varPct, tend, proj2030, estado }
}

export const fmt = (v: number, en: boolean, d = 1) => v.toLocaleString(en ? 'en' : 'pt-BR', { maximumFractionDigits: d, minimumFractionDigits: 0 })

/** frase simples do que mudou para uma métrica */
export function frase(a: Analise, en: boolean): string {
  const M = METRICAS[a.k], u = M.un
  const sobe = a.var > 0, abs = Math.abs(a.var)
  const quanto = abs < 5 ? (en ? 'about the same as' : 'quase igual a') : `${fmt(abs, en, 0)}% ${sobe ? (en ? 'higher than' : 'acima de') : (en ? 'lower than' : 'abaixo de')}`
  const pico = a.pico && (M.bom === 'baixo' ? a.pico[1] > a.agora * 1.3 : a.pico[1] < a.agora * 0.77)
    ? (en ? ` The worst year was ${a.pico[0]} (${fmt(a.pico[1], en)} ${u}).` : ` O pior ano foi ${a.pico[0]} (${fmt(a.pico[1], en)} ${u}).`) : ''
  const mj = a.melhorJanela
  const melhor = mj && Math.abs(mj[2] - a.agora) / (Math.abs(mj[2]) || 1) > 0.15
    ? (en ? ` Its best period was ${mj[0]}–${mj[1]} (${fmt(mj[2], en)} ${u}): today is ${fmt(Math.abs(a.agora / mj[2] - 1) * 100, en, 0)}% ${a.agora > mj[2] ? 'higher' : 'lower'}.`
          : ` O melhor período foi ${mj[0]}–${mj[1]} (${fmt(mj[2], en)} ${u}): hoje está ${fmt(Math.abs(a.agora / mj[2] - 1) * 100, en, 0)}% ${a.agora > mj[2] ? 'acima' : 'abaixo'}.`) : ''
  return en
    ? `${M.nome[1]} today (${a.agoraAnos}): ${fmt(a.agora, en)} ${u}, ${quanto} the ${a.baseTxt[1]} (${fmt(a.base, en)} ${u}).${pico}${melhor}`
    : `${M.nome[0]} hoje (${a.agoraAnos}): ${fmt(a.agora, en)} ${u}, ${quanto} a ${a.baseTxt[0]} (${fmt(a.base, en)} ${u}).${pico}${melhor}`
}

export const ESTADO: Record<Analise['estado'], { t: Bi; c: string; bg: string }> = {
  alerta: { t: ['Piorando: agir', 'Getting worse: act'], c: '#B42318', bg: '#FEF3F2' },
  atencao: { t: ['Atenção: tendência ruim', 'Watch: bad trend'], c: '#B54708', bg: '#FFFAEB' },
  estavel: { t: ['Estável', 'Stable'], c: '#475467', bg: '#F2F4F7' },
  melhor: { t: ['Melhorou', 'Improved'], c: '#067647', bg: '#ECFDF3' },
}

/** o que fazer para proteger a água, por quem pode agir (gerado a partir do que piorou) */
export function acoes(r: RioJson, an: Partial<Record<Metrica, Analise | null>>, en: boolean): { quem: string; o_que: string }[] {
  const L = (pt: string, e: string) => (en ? e : pt)
  const out: { quem: string; o_que: string }[] = []
  const ruim = (k: Metrica) => an[k] && (an[k]!.estado === 'alerta' || an[k]!.estado === 'atencao')
  if (ruim('turbidez')) {
    out.push({ quem: L('Companhia de água', 'Water utility'), o_que: L('Reforçar o tratamento e medir sedimento e mercúrio na captação; a água bruta está mais suja do que era.', 'Step up treatment and test sediment and mercury at the intake; raw water is dirtier than it used to be.') })
    out.push({ quem: L('Fiscalização (órgão ambiental, Ministério Público)', 'Enforcement (environment agency, prosecutors)'), o_que: L('Procurar a origem do barro rio acima: garimpo, dragas ou erosão nova aparecem antes nas imagens de satélite.', 'Trace the mud upstream: mining, dredges or new erosion show up first in satellite images.') })
  }
  if (ruim('mata_ciliar') || ruim('solo_exposto'))
    out.push({ quem: L('Prefeitura e estado', 'City and state'), o_que: L('Recuperar a mata ciliar nos trechos onde ela caiu e proibir novas ocupações na faixa da margem.', 'Restore riverside forest where it was lost and stop new occupation of the bank strip.') })
  if (ruim('agua_km2'))
    out.push({ quem: L('Gestão de recursos hídricos', 'Water resources management'), o_que: L('Planejar a reserva para anos secos: a área de água está menor que no passado. Proteger nascentes e áreas alagáveis.', 'Plan reserves for dry years: the water area is smaller than in the past. Protect springs and wetlands.') })
  if (ruim('gelo_km2'))
    out.push({ quem: L('Planejamento de água da cidade', 'City water planning'), o_que: L('Menos gelo hoje é menos água na seca de amanhã: guardar água da chuva e diversificar fontes.', 'Less ice today means less water in tomorrow’s dry season: store rainwater and diversify sources.') })
  out.push({ quem: L('Escolas e comunidade', 'Schools and community'), o_que: L('Usar as fotos de satélite de 40 anos para mostrar o que mudou no rio da cidade e cobrar proteção.', 'Use 40 years of satellite photos to show what changed in the city’s river and push for protection.') })
  return out
}

export async function carregarRio(base: string, id: string): Promise<RioJson | null> {
  try { const r = await fetch(base + 'rios/' + id + '.json', { cache: 'no-store' }); return r.ok ? await r.json() : null } catch { return null }
}
