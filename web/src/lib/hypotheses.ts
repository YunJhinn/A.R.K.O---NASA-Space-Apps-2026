// Hipóteses das causas físicas (pedido explícito do desafio "Dancing with the SARs").
// Regras para não afirmar nada falso:
//  1) toda hipótese aparece marcada como HIPÓTESE, nunca como fato;
//  2) o "apoio nos dados" é calculado dos focos reais (muda sozinho quando o robô atualiza);
//  3) o "contexto conhecido" de cada região vem de uma fonte citada, com link;
//  4) regiões novas, sem contexto escrito, recebem só as hipóteses geradas pelos padrões dos dados.
import type { RegionEvidence } from './evidence'
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
