// A.R.K.O Rios · análise longitudinal (1985 → hoje) de cada rio, a partir de data/rios/<id>.json
// (gerado por pipeline/rios_landsat.py com Landsat 4–9 e, quando há, nível do rio do SWOT).
// Tudo aqui é medido; o que é interpretação aparece como "causa provável" e "tendência se continuar assim".

export type Metrica = 'turbidez' | 'agua_km2' | 'mata_ciliar' | 'solo_exposto' | 'gelo_km2'
export interface AnoRio { ano: number; imagens: string[]; foto?: string; agua_km2?: number; turbidez?: number; mata_ciliar?: number; solo_exposto?: number; gelo_km2?: number }
export interface SwotPonto { d: string; wse: number }
export interface RioJson {
  id: string; nome: string; pais: string; bbox: [number, number, number, number]; meses: number[]; cidade: string; pressao: string
  montanha: boolean; gerado: string; fonte: string; serie: AnoRio[]; inicio_analise?: number
  swot?: { reach_id: string; rio?: string; serie: SwotPonto[] }
}
export interface RioIndice { id: string; nome: string; nome_en: string; regiao: string | null; cidade: string; grupo: 'go' | 'br' | 'mundo' }

type Bi = [string, string]
export const RIOS: RioIndice[] = [
  { id: 'tapajos', nome: 'Rio Tapajós · Itaituba (PA)', nome_en: 'Tapajós River · Itaituba (Brazil)', regiao: 'tapajos', cidade: 'Itaituba', grupo: 'br' },
  { id: 'madeira', nome: 'Rio Madeira · Nova Olinda do Norte (AM)', nome_en: 'Madeira River · Nova Olinda do Norte (Brazil)', regiao: 'amazonia', cidade: 'Nova Olinda do Norte', grupo: 'br' },
  { id: 'guaiba', nome: 'Lago Guaíba · Porto Alegre (RS)', nome_en: 'Guaíba Lake · Porto Alegre (Brazil)', regiao: 'sul', cidade: 'Porto Alegre', grupo: 'br' },
  { id: 'daca', nome: 'Rios Buriganga e Turag · Daca', nome_en: 'Buriganga and Turag rivers · Dhaka', regiao: 'bangladesh', cidade: 'Daca', grupo: 'mundo' },
  { id: 'langtang', nome: 'Geleiras do Langtang · nascente do Trishuli (Nepal)', nome_en: 'Langtang glaciers · Trishuli headwaters (Nepal)', regiao: 'nepal', cidade: 'Katmandu', grupo: 'mundo' },
  { id: 'limpopo', nome: 'Barragem de Massingir · bacia do Limpopo (Moçambique)', nome_en: 'Massingir Dam · Limpopo basin (Mozambique)', regiao: 'mocambique', cidade: 'Chókwè', grupo: 'mundo' },
  { id: 'joaoleite', nome: 'Reservatório do João Leite · Goiânia (GO)', nome_en: 'João Leite Reservoir · Goiânia (Brazil)', regiao: null, cidade: 'Goiânia', grupo: 'go' },
  { id: 'meiaponte', nome: 'Rio Meia Ponte · Goiânia (GO)', nome_en: 'Meia Ponte River · Goiânia (Brazil)', regiao: null, cidade: 'Goiânia', grupo: 'go' },
  { id: 'araguaia', nome: 'Rio Araguaia · Aruanã (GO)', nome_en: 'Araguaia River · Aruanã (Brazil)', regiao: null, cidade: 'Aruanã', grupo: 'go' },
  { id: 'serradamesa', nome: 'Lago de Serra da Mesa · rio Tocantins (GO)', nome_en: 'Serra da Mesa Lake · Tocantins River (Brazil)', regiao: null, cidade: 'Uruaçu', grupo: 'go' },
]
export const GRUPOS: { k: RioIndice['grupo']; t: [string, string] }[] = [
  { k: 'go', t: ['Goiás', 'Goiás (Brazil)'] }, { k: 'br', t: ['Brasil', 'Brazil'] }, { k: 'mundo', t: ['Mundo', 'World'] }]

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
  joaoleite: { causa: ['O João Leite é a principal reserva de água de Goiânia, formada por uma barragem: o satélite mostra o lago aparecendo em 2010 (antes era só o ribeirão), então a análise começa aí. O que mais ameaça a reserva é a terra e o adubo que chegam da bacia (loteamentos, lavouras) e as secas do Cerrado.', 'João Leite is Goiânia’s main water reserve, formed by a dam: the satellite shows the lake appearing in 2010 (before, it was just a stream), so the analysis starts there. The main threats are soil and fertiliser washing in from the basin (housing, farms) and Cerrado droughts.'] },
  meiaponte: { causa: ['O Meia Ponte corta Goiânia e é uma das fontes de água da cidade. Recebe esgoto e escoamento urbano, e a cidade avança sobre as margens. Atenção: o rio é estreito para a resolução do satélite (30 m), então a área de água e a turbidez aqui são aproximadas; a margem é a medida mais confiável.', 'The Meia Ponte crosses Goiânia and is one of the city’s water sources. It receives sewage and urban runoff, and the city advances over its banks. Note: the river is narrow for the satellite’s 30 m resolution, so water area and turbidity here are approximate; the banks are the most reliable measure.'] },
  araguaia: { causa: ['O Araguaia em Aruanã sofre com assoreamento: o Cerrado desmatado na bacia manda areia para o rio, que fica mais raso e forma bancos de areia na seca.', 'The Araguaia at Aruanã suffers from silting: cleared Cerrado in the basin sends sand into the river, which gets shallower and forms sandbanks in the dry season.'] },
  serradamesa: { causa: ['Serra da Mesa é um dos maiores reservatórios do Brasil em volume; o satélite mostra o lago enchendo no fim dos anos 90, então a análise começa em 1999. O nível cai muito em secas longas e com o uso para energia; menos área de água no trecho medido significa menos reserva.', 'Serra da Mesa is one of Brazil’s largest reservoirs by volume; the satellite shows the lake filling in the late 1990s, so the analysis starts in 1999. Its level drops sharply in long droughts and with use for power; less water area in the measured stretch means a smaller reserve.'] },
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
  const pts = r.serie.filter(a => a[k] != null && a.ano >= (r.inicio_analise ?? 0)).map(a => [a.ano, a[k] as number] as [number, number])
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

// ── v7.1 · monitor contínuo (HLS, cada imagem nova, a cada 2–5 dias) ──
export interface Cena { d: string; sat: string; ok: number; agua_km2?: number; turbidez?: number; mata_ciliar?: number; solo_exposto?: number; gelo_km2?: number }
export interface ContinuoJson { id: string; nome: string; fonte: string; atualizado: string; cenas: Cena[]; ultima?: { d: string; sat: string; foto: string } }

export async function carregarContinuo(base: string, id: string): Promise<ContinuoJson | null> {
  try { const r = await fetch(base + 'rios/' + id + '_continuo.json', { cache: 'no-store' }); return r.ok ? await r.json() : null } catch { return null }
}

const quant = (v: number[], q: number) => { const a = [...v].sort((x, y) => x - y); if (!a.length) return NaN; const i = (a.length - 1) * q, lo = Math.floor(i); return a[lo] + (a[Math.min(lo + 1, a.length - 1)] - a[lo]) * (i - lo) }

/** faixa normal de cada mês (p10–p90) com os anos ANTERIORES ao da imagem, para comparar sem se autoinfluenciar */
export function normalDoMes(c: ContinuoJson, k: Metrica, mes: number, anoAte: number) {
  const v = c.cenas.filter(x => x[k] != null && +x.d.slice(5, 7) === mes && +x.d.slice(0, 4) < anoAte).map(x => x[k] as number)
  return v.length >= 4 ? { p10: quant(v, 0.1), p50: quant(v, 0.5), p90: quant(v, 0.9), n: v.length } : null
}

export interface Anomalia { d: string; sat: string; k: Metrica; v: number; normal: { p10: number; p50: number; p90: number }; pior: boolean; txt: [string, string] }
const MESES: [string, string][] = [['jan', 'Jan'], ['fev', 'Feb'], ['mar', 'Mar'], ['abr', 'Apr'], ['mai', 'May'], ['jun', 'Jun'], ['jul', 'Jul'], ['ago', 'Aug'], ['set', 'Sep'], ['out', 'Oct'], ['nov', 'Nov'], ['dez', 'Dec']]
export const mesNome = (m: number, en: boolean) => MESES[m - 1][en ? 1 : 0]

/** imagens dos últimos `dias` que saíram do normal do mês, para o lado ruim de cada medida */
export function anomalias(c: ContinuoJson, dias = 120): Anomalia[] {
  const fim = Date.parse(c.cenas[c.cenas.length - 1]?.d ?? c.atualizado), out: Anomalia[] = []
  for (const x of c.cenas) {
    if (fim - Date.parse(x.d) > dias * 864e5) continue
    for (const k of Object.keys(METRICAS) as Metrica[]) {
      const v = x[k]; if (v == null) continue
      const n = normalDoMes(c, k, +x.d.slice(5, 7), +x.d.slice(0, 4)); if (!n) continue
      const M = METRICAS[k], ruimAlto = M.bom === 'baixo'
      const fora = ruimAlto ? v > n.p90 : v < n.p10
      if (!fora) continue
      const pct = Math.round(Math.abs(v / (n.p50 || 1) - 1) * 100)
      out.push({ d: x.d, sat: x.sat, k, v, normal: n, pior: true,
        txt: [`${M.nome[0]} ${ruimAlto ? 'acima' : 'abaixo'} do normal de ${mesNome(+x.d.slice(5, 7), false)} (${pct}% ${ruimAlto ? 'acima' : 'abaixo'} da mediana dos anos anteriores)`,
              `${M.nome[1]} ${ruimAlto ? 'above' : 'below'} normal for ${mesNome(+x.d.slice(5, 7), true)} (${pct}% ${ruimAlto ? 'above' : 'below'} the median of previous years)`] })
    }
  }
  return out.sort((a, b) => b.d.localeCompare(a.d))
}

// ── v7.1 · leitura para quem chega: veredito, consequência de cada mudança e meta de recuperação ──
export const AJUDA: Record<Metrica, Bi> = {
  turbidez: ['Turbidez é o quanto a água está turva (com barro, areia ou lodo). Medimos pela cor da água vista do satélite: quanto mais luz vermelha ela devolve, mais suja. Água turva é mais cara de tratar e indica erosão, garimpo ou enxurrada.', 'Turbidity is how cloudy the water is (mud, sand, silt). We measure it from the water’s colour seen by satellite: the more red light it returns, the dirtier. Cloudy water is costlier to treat and points to erosion, mining or runoff.'],
  agua_km2: ['Área de água é o tamanho da superfície coberta por água no trecho analisado, na estação seca. Se diminui ano após ano, o rio ou a represa está guardando menos água para a cidade.', 'Water area is the size of the surface covered by water in the analysed stretch, in the dry season. If it shrinks year after year, the river or reservoir is holding less water for the city.'],
  mata_ciliar: ['Mata ciliar é a floresta na beira do rio, como os cílios protegem os olhos. Ela segura a terra, filtra a água da chuva e mantém as nascentes. Medimos a parte da faixa de 500 m ao redor da água com vegetação densa.', 'Riverside forest protects the river like eyelashes protect the eyes. It holds the soil, filters rainwater and keeps springs alive. We measure the share of the 500 m strip around the water with dense vegetation.'],
  solo_exposto: ['Solo exposto é terra sem vegetação na beira da água: garimpo, desmatamento, obra ou cidade. Na chuva, essa terra vai para o rio e o deixa raso (assoreamento).', 'Bare soil is ground without vegetation by the water: mining, clearing, construction or city. When it rains, this soil goes into the river and makes it shallower (silting).'],
  gelo_km2: ['Gelo e neve nas nascentes é a "caixa d’água" das montanhas: derrete aos poucos e alimenta o rio na seca. Medimos a menor área do ano (a geleira, sem a neve passageira).', 'Ice and snow at the headwaters are the mountains’ "water tower": they melt slowly and feed the river in the dry season. We measure the smallest area of the year (the glacier, without passing snow).'],
}

/** o que uma mudança provoca agora e no futuro (por medida e por direção) */
export const CONSEQ: Record<Metrica, { pior: Bi; melhor: Bi }> = {
  turbidez: { pior: ['Mais barro na água: tratamento mais caro, menos luz para peixes e plantas, e sinal de erosão ou garimpo rio acima. Se continuar, o leito assoreia.', 'More mud in the water: costlier treatment, less light for fish and plants, and a sign of erosion or mining upstream. If it continues, the bed silts up.'],
              melhor: ['Água mais limpa: menos sedimento chegando, tratamento mais barato e vida aquática com mais luz.', 'Cleaner water: less sediment arriving, cheaper treatment and more light for aquatic life.'] },
  agua_km2: { pior: ['Menos água disponível na seca: risco de racionamento e de o rio ficar raso. Pode ser seca, assoreamento ou aterro.', 'Less water available in the dry season: risk of rationing and of the river getting shallow. It may be drought, silting or landfill.'],
              melhor: ['Mais água guardada: mais segurança para a cidade nas secas.', 'More water stored: more security for the city in droughts.'] },
  mata_ciliar: { pior: ['Margem desprotegida: nos próximos anos vem mais erosão, mais barro no rio e nascentes secando.', 'Unprotected banks: in the coming years expect more erosion, more mud in the river and springs drying up.'],
                 melhor: ['Margem se recuperando: menos erosão e água mais limpa nos próximos anos.', 'Banks recovering: less erosion and cleaner water in the coming years.'] },
  solo_exposto: { pior: ['Mais terra nua na margem: na próxima chuva forte ela vai para o rio.', 'More bare ground on the banks: the next heavy rain will wash it into the river.'],
                  melhor: ['Menos terra nua: menos sedimento indo para o rio.', 'Less bare ground: less sediment going into the river.'] },
  gelo_km2: { pior: ['Menos gelo guardado: menos água para o rio nas secas futuras.', 'Less ice stored: less water for the river in future dry seasons.'],
              melhor: ['Mais gelo guardado neste período.', 'More ice stored in this period.'] },
}

export type Veredito = 'bom' | 'atencao' | 'critico'
export const VEREDITO: Record<Veredito, { t: Bi; c: string; bg: string; ic: string }> = {
  bom: { t: ['Em boas condições', 'In good condition'], c: '#067647', bg: '#ECFDF3', ic: '✓' },
  atencao: { t: ['Atenção: piorando', 'Watch: getting worse'], c: '#B54708', bg: '#FFFAEB', ic: '!' },
  critico: { t: ['Em risco: agir', 'At risk: act'], c: '#B42318', bg: '#FEF3F2', ic: '!!' },
}
export function veredito(an: Partial<Record<Metrica, Analise | null>>): { v: Veredito; ruins: Analise[] } {
  const xs = Object.values(an).filter(Boolean) as Analise[]
  const ruins = xs.filter(a => a.estado === 'alerta' || a.estado === 'atencao').sort((a, b) => (a.estado === 'alerta' ? 0 : 1) - (b.estado === 'alerta' ? 0 : 1))
  const v: Veredito = xs.some(a => a.estado === 'alerta') ? 'critico' : ruins.length ? 'atencao' : 'bom'
  return { v, ruins }
}
/** meta de recuperação: voltar ao melhor período de 10 anos do próprio rio */
export function meta(a: Analise): number | null {
  if (!a.melhorJanela) return null
  const M = METRICAS[a.k], alvo = a.melhorJanela[2]
  return (M.bom === 'baixo' ? a.agora > alvo * 1.05 : a.agora < alvo * 0.95) ? alvo : null
}
