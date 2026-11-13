// Hipóteses das causas físicas (pedido explícito do desafio "Dancing with the SARs").
// Regras para não afirmar nada falso:
//  1) toda hipótese aparece marcada como HIPÓTESE, nunca como fato;
//  2) o "apoio nos dados" é calculado dos focos reais (muda sozinho quando o robô atualiza);
//  3) o "contexto conhecido" de cada região vem de uma fonte citada, com link;
//  4) regiões novas, sem contexto escrito, recebem só as hipóteses geradas pelos padrões dos dados.
import type { FocusEvidence, RegionEvidence } from './evidence'
import { fmtDate } from './evidence'

type Lang = 'pt' | 'en'
type Bi = [string, string]
type K = 'agua' | 'solo' | 'arvore'
const L = (lang: Lang, b: Bi) => (lang === 'pt' ? b[0] : b[1])

interface RegionHypo {
  main: Bi
  byType: Partial<Record<K, Bi>>
  context: { text: Bi; src: string; url: string }[]
}

const HYPO: Record<string, RegionHypo> = {
  bangladesh: {
    main: ['O ciclo da monção: a chuva e a cheia dos rios alagam as planícies de junho a setembro, e a água começa a baixar no fim da estação.', 'The monsoon cycle: rain and river floods inundate the plains from June to September, and water starts draining at the end of the season.'],
    byType: {
      agua: ['Cheia da monção: chuva forte e rios (como o Jamuna) transbordando sobre as planícies.', 'Monsoon flooding: heavy rain and rivers (such as the Jamuna) overflowing onto the plains.'],
      solo: ['Fim da monção: a água das cheias escoa e as planícies voltam a aparecer.', 'End of the monsoon: floodwater drains and the plains reappear.'],
      arvore: ['Campos alagados e lavouras mudando de fase (plantio, crescimento, colheita) alteram o volume de plantas.', 'Flooded fields and crops changing stage (planting, growth, harvest) change the plant volume.'],
    },
    context: [
      { text: ['Cerca de 80% da chuva de Bangladesh cai na monção, de junho a outubro.', 'About 80% of Bangladesh’s rain falls in the monsoon, from June to October.'], src: 'NASA Earth Observatory', url: 'https://science.nasa.gov/earth/earth-observatory/intense-flooding-in-bangladesh-147057' },
      { text: ['Os rios Jamuna e Meghna costumam atingir o pico de cheia em julho e agosto.', 'The Jamuna and Meghna rivers usually reach their flood peak in July and August.'], src: 'JICA · Hidrologia de Bangladesh', url: 'https://openjicareport.jica.go.jp/pdf/11702909_04.pdf' },
    ],
  },
  amazonia: {
    main: ['Derrubada ou queimada da vegetação no início de setembro, em plena estação seca do sul da Amazônia.', 'Clearing or burning of vegetation in early September, in the middle of the southern Amazon dry season.'],
    byType: {
      arvore: ['Corte ou queimada na estação seca, quando o fogo é usado para limpar áreas derrubadas.', 'Cutting or burning in the dry season, when fire is used to clear felled areas.'],
      solo: ['Rio mais baixo na seca, expondo margens e bancos de areia.', 'Lower river in the dry season, exposing banks and sandbars.'],
    },
    context: [
      { text: ['No sul da Amazônia, a estação seca vai de julho a novembro; as queimadas se intensificam em agosto e têm pico em setembro e outubro.', 'In the southern Amazon, the dry season runs from July to November; fires intensify in August and peak in September and October.'], src: 'NASA Earth Observatory', url: 'https://science.nasa.gov/?p=1055593' },
    ],
  },
  sul: {
    main: ['Episódios de chuva forte alagando várzeas em julho e outubro; parte da água nova de outubro pode ser lavoura de arroz sendo inundada para o plantio.', 'Heavy-rain episodes flooding lowlands in July and October; part of the new water in October may be rice fields being flooded for planting.'],
    byType: {
      agua: ['Chuva forte enchendo rios e várzeas; a partir de outubro, também lavouras de arroz irrigado por inundação.', 'Heavy rain filling rivers and lowlands; from October, also flood-irrigated rice fields.'],
      solo: ['Água das cheias escoando nas passagens seguintes.', 'Floodwater draining in the following passes.'],
      arvore: ['Queda espalhada em muitos pontos ao mesmo tempo combina mais com o ciclo das lavouras (colheita e preparo do solo) do que com um único desmatamento.', 'A widespread drop at many spots at once fits crop cycles (harvest and soil preparation) better than a single clearing event.'],
    },
    context: [
      { text: ['No RS, o arroz irrigado é cultivado com irrigação por inundação; a semeadura normalmente começa em outubro e vai até a primeira quinzena de dezembro.', 'In Rio Grande do Sul, rice is grown with flood irrigation; sowing usually starts in October and runs to the first half of December.'], src: 'Embrapa · Pesq. Agropec. Bras.', url: 'https://apct.sede.embrapa.br/pab/article/download/14397/8292/63896' },
    ],
  },
}

const NAME: Record<K, Bi> = { agua: ['água nova', 'new water'], solo: ['água que recuou', 'receded water'], arvore: ['queda da vegetação', 'vegetation drop'] }

/** padrões objetivos encontrados nos dados (funciona para qualquer região) */
export function dataPatterns(rev: RegionEvidence, lang: Lang): string[] {
  const pt = lang === 'pt', out: string[] = []
  const P = rev.passes
  const d = (iso: string) => fmtDate(iso, lang)
  ;(['agua', 'solo', 'arvore'] as K[]).forEach(k => {
    const st = rev.stats.find(s => s.k === k)!
    if (st.n <= 2) {
      out.push(pt ? `Quase não houve ${NAME[k][0]} (${st.n} foco${st.n === 1 ? '' : 's'} em ${P.length} comparações): nesse período não aconteceu uma mudança grande desse tipo que o radar conseguisse ver.`
                  : `There was almost no ${NAME[k][1]} (${st.n} detection${st.n === 1 ? '' : 's'} in ${P.length} comparisons): no large change of this kind happened that radar could see in this period.`)
      return
    }
    const peaks = P.filter(p => p.c[k] >= 10).map(p => `${d(p.date)} (${p.c[k]})`)
    if (peaks.length && peaks.length <= 4) out.push(pt ? `Picos de ${NAME[k][0]}: ${peaks.join(', ')}.` : `Peaks of ${NAME[k][1]}: ${peaks.join(', ')}.`)
    else if (peaks.length > 4) {
      const hi = P.filter(p => p.c[k] >= 10)
      out.push(pt ? `Muita ${NAME[k][0]} (10 focos ou mais) em ${hi.length} das ${P.length} passagens, de ${d(hi[0].date)} a ${d(hi.at(-1)!.date)}.` : `Lots of ${NAME[k][1]} (10+ detections) in ${hi.length} of ${P.length} passes, from ${d(hi[0].date)} to ${d(hi.at(-1)!.date)}.`)
    }
    if (k === 'arvore') {
      const top = P.slice().sort((a, b) => b.c.arvore - a.c.arvore)[0]
      const capped = P.filter(p => p.c.arvore >= 25).length
      if (top && top.c.arvore / st.n >= 0.5) out.push(pt ? `${Math.round(100 * top.c.arvore / st.n)}% da queda da vegetação aconteceu numa única passagem (${d(top.date)}): parece um evento concentrado no tempo.` : `${Math.round(100 * top.c.arvore / st.n)}% of the vegetation drop happened in a single pass (${d(top.date)}): it looks like an event concentrated in time.`)
      else if (capped >= P.length / 2) out.push(pt ? `A queda da vegetação aparece em muitos lugares em ${capped} das ${P.length} passagens: é uma mudança contínua e espalhada, não um evento único.` : `Vegetation drop shows up in many places in ${capped} of ${P.length} passes: a continuous, widespread change, not a single event.`)
    }
  })
  // ciclo da água: no fim do período, a água que recuou supera a água nova?
  const tail = P.slice(-3)
  if (tail.length === 3 && tail.every(p => p.c.solo > p.c.agua) && P.some(p => p.c.agua >= 10)) {
    out.push(pt ? `Nas 3 últimas passagens (${tail.map(p => d(p.date)).join(', ')}), há mais água que recuou do que água nova: depois das cheias, a água está baixando.`
                : `In the last 3 passes (${tail.map(p => d(p.date)).join(', ')}), there is more receded water than new water: after the floods, water is going down.`)
  }
  return out
}

export function regionHypo(region: string, lang: Lang) {
  const h = HYPO[region]
  if (!h) return null
  return {
    main: L(lang, h.main),
    byType: Object.fromEntries(Object.entries(h.byType).map(([k, b]) => [k, L(lang, b as Bi)])) as Partial<Record<K, string>>,
    context: h.context.map(c => ({ text: L(lang, c.text), src: c.src, url: c.url })),
  }
}

// ---------------- hipótese de CADA foco, montada a partir dos dados dele ----------------
/** meses (1-12) das estações citadas no contexto de cada região (fontes acima) */
const SEASON: Record<string, { name: Bi; months: number[]; kind: 'chuva' | 'seca' | 'arroz' }[]> = {
  bangladesh: [{ name: ['monção (jun–out)', 'monsoon (Jun–Oct)'], months: [6, 7, 8, 9, 10], kind: 'chuva' }],
  amazonia: [{ name: ['estação seca do sul da Amazônia (jul–nov)', 'southern Amazon dry season (Jul–Nov)'], months: [7, 8, 9, 10, 11], kind: 'seca' }],
  sul: [{ name: ['época de semeadura do arroz irrigado (out–dez)', 'irrigated rice sowing season (Oct–Dec)'], months: [10, 11, 12], kind: 'arroz' }],
}

export interface FocusHypo { text: string; why: string[] }

export function focusHypothesis(k: string, ev: FocusEvidence, area: number | undefined, region: string, lang: Lang): FocusHypo | null {
  if (k !== 'agua' && k !== 'solo' && k !== 'arvore') return null
  const pt = lang === 'pt', d = (iso: string) => fmtDate(iso, lang)
  const m = Number(ev.date.slice(5, 7))
  const season = (SEASON[region] ?? []).find(x => x.months.includes(m))
  const sName = season ? L(lang, season.name) : ''
  const later = (kk: K) => ev.others.filter(o => o.k === kk && o.date > ev.date)
  const earlier = (kk: K) => ev.others.filter(o => o.k === kk && o.date < ev.date)
  const same = ev.others.filter(o => o.k === k)
  const uniq = (xs: { date: string }[]) => [...new Set(xs.map(o => o.date))].map(d)
  const why: string[] = []
  const a = area ?? 0
  let text = ''
  const dbTxt = (x: number) => (pt ? x.toFixed(1).replace('.', ',') : x.toFixed(1))

  if (k === 'agua') {
    const out = later('solo')[0]
    if (out) { text = pt ? `Alagamento temporário: a água apareceu em ${d(ev.date)} e saiu em ${d(out.date)}.` : `Temporary flooding: water appeared on ${d(ev.date)} and left on ${d(out.date)}.`; why.push(pt ? `O radar registrou água que recuou a menos de 2 km daqui em ${d(out.date)}.` : `Radar recorded receded water within 2 km on ${d(out.date)}.`) }
    else if (same.length) { text = pt ? `Área que alaga com frequência (várzea ou planície de inundação).` : `An area that floods often (floodplain).`; why.push(pt ? `Água nova neste mesmo ponto também em ${uniq(same).join(', ')}.` : `New water at this same spot also on ${uniq(same).join(', ')}.`) }
    else if (season?.kind === 'chuva') { text = pt ? `Água da monção: chuva forte ou cheia de rio cobrindo a planície.` : `Monsoon water: heavy rain or a river flood covering the plain.` }
    else if (season?.kind === 'arroz') { text = pt ? `Pode ser lavoura de arroz sendo alagada para o plantio, ou chuva forte.` : `It may be a rice field being flooded for planting, or heavy rain.` }
    else if (season?.kind === 'seca') { text = pt ? `Água nova em plena seca é incomum: pode ser chuva local isolada, represamento ou mudança no leito do rio.` : `New water in the middle of the dry season is unusual: it may be isolated local rain, damming or a shift in the riverbed.` }
    else if (a >= 5) { text = pt ? `Cheia de rio: uma área grande ficou coberta de água de uma vez.` : `River flood: a large area was covered by water at once.` }
    else { text = pt ? `Alagamento local depois de chuva forte.` : `Local flooding after heavy rain.` }
    if (season) why.push(pt ? `A data (${d(ev.date)}) cai na ${sName}.` : `The date (${d(ev.date)}) falls in the ${sName}.`)
    if (a) why.push(pt ? `Área de ${a.toFixed(2).replace('.', ',')} km²: ${a >= 5 ? 'grande, típica de cheia de rio' : 'pequena, mais típica de alagamento local'}.` : `Area of ${a.toFixed(2)} km²: ${a >= 5 ? 'large, typical of a river flood' : 'small, more typical of local flooding'}.`)
  }

  if (k === 'solo') {
    const inn = earlier('agua').at(-1)
    if (inn) { text = pt ? `Fim de um alagamento que começou em ${d(inn.date)}: a água escoou.` : `End of a flood that began on ${d(inn.date)}: the water drained.`; why.push(pt ? `O radar registrou água nova a menos de 2 km daqui em ${d(inn.date)}.` : `Radar recorded new water within 2 km on ${d(inn.date)}.`) }
    else if (season?.kind === 'chuva' && m >= 9) { text = pt ? `Vazante do fim da monção: a água das cheias está baixando.` : `End-of-monsoon recession: floodwater is going down.` }
    else if (season?.kind === 'seca') { text = pt ? `Rio mais baixo na seca, expondo margens e bancos de areia.` : `Lower river in the dry season, exposing banks and sandbars.` }
    else { text = pt ? `A água que cobria este lugar escoou ou foi drenada.` : `The water covering this place drained away or was drained.` }
    if (season) why.push(pt ? `A data (${d(ev.date)}) cai na ${sName}.` : `The date (${d(ev.date)}) falls in the ${sName}.`)
    if (same.length) why.push(pt ? `A água também recuou aqui em ${uniq(same).join(', ')}.` : `Water also receded here on ${uniq(same).join(', ')}.`)
  }

  if (k === 'arvore') {
    if (same.length && season?.kind === 'seca') { text = pt ? `Mudança que se repete no mesmo ponto: pode ser corte em etapas, fogo que voltou ou vegetação secando aos poucos na estação seca.` : `A change repeating at the same spot: it may be cutting in stages, fire returning or vegetation drying out through the dry season.`; why.push(pt ? `A vegetação também caiu neste ponto em ${uniq(same).join(', ')}.` : `Vegetation also dropped at this spot on ${uniq(same).join(', ')}.`) }
    else if (same.length) { text = pt ? `Mudança que se repete: mais típica do ciclo de lavouras (plantio e colheita) do que de um desmatamento único.` : `A repeating change: more typical of crop cycles (planting and harvest) than of a single clearing.`; why.push(pt ? `A vegetação também caiu neste ponto em ${uniq(same).join(', ')}.` : `Vegetation also dropped at this spot on ${uniq(same).join(', ')}.`) }
    else if (season?.kind === 'seca' && ev.db >= 4) { text = pt ? `Corte ou queimada na estação seca.` : `Cutting or burning in the dry season.` }
    else if (ev.db >= 5) { text = pt ? `Perda forte de vegetação: corte raso, queimada ou colheita são mais prováveis do que só seca.` : `Strong vegetation loss: clear-cutting, fire or harvest are more likely than drying alone.` }
    else if (ev.db < 3.5) { text = pt ? `Queda leve: pode ser só vegetação mais seca, não perda real.` : `A mild drop: it may be just drier vegetation, not real loss.` }
    else { text = pt ? `Corte, queimada ou colheita (o radar sozinho não separa).` : `Cutting, fire or harvest (radar alone cannot tell).` }
    why.push(pt ? `Queda de ${dbTxt(ev.db)} dB no sinal HV: ${ev.db >= 5 ? 'forte' : ev.db < 3.5 ? 'leve, perto do limite de 2,5 dB' : 'média'}.` : `${dbTxt(ev.db)} dB drop in the HV signal: ${ev.db >= 5 ? 'strong' : ev.db < 3.5 ? 'mild, close to the 2.5 dB limit' : 'moderate'}.`)
    if (season) why.push(pt ? `A data (${d(ev.date)}) cai na ${sName}.` : `The date (${d(ev.date)}) falls in the ${sName}.`)
    if (!same.length) why.push(pt ? 'Nenhuma outra queda da vegetação a menos de 2 km em outras passagens.' : 'No other vegetation drop within 2 km in other passes.')
  }
  return { text, why }
}
